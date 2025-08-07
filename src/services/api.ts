
import { Operation, OperationFilters, ExportOptions, ApiOperationData } from '@/types';

// Cache pour les données
let operationsCache: Operation[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// External API URL
const API_BASE_URL = 'http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRCaracOp';

// Helper function to get basic auth header
const getAuthHeader = () => {
  const credentials = btoa('ADM:ADM'); // Base64 encode username:password
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText
    }));
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

// Helper function to extract département from commune
const getDepartementFromCommune = (commune: string): string => {
  // Simple mapping based on common patterns
  // In practice, you'd want a more comprehensive mapping
  const departementMapping: { [key: string]: string } = {
    'lyon': '69',
    'marseille': '13',
    'paris': '75',
    'toulouse': '31',
    'nice': '06',
    'nantes': '44',
    'montpellier': '34',
    'strasbourg': '67',
    'bordeaux': '33',
    'lille': '59'
  };
  
  const communeLower = commune.toLowerCase();
  for (const [city, dept] of Object.entries(departementMapping)) {
    if (communeLower.includes(city)) {
      return dept;
    }
  }
  
  // Default fallback - you might want to use a more sophisticated approach
  return '00';
};

// Transform API data to application format
const transformApiData = (apiData: ApiOperationData[]): Operation[] => {
  // Group by operation (LibelleOperation)
  const groupedData = apiData.reduce((acc, item) => {
    const operationKey = item.LibelleOperation;
    if (!acc[operationKey]) {
      acc[operationKey] = [];
    }
    acc[operationKey].push(item);
    return acc;
  }, {} as { [key: string]: ApiOperationData[] });

  // Transform to Operation objects
  return Object.entries(groupedData).map(([libelle, simulations]) => {
    const firstSim = simulations[0];
    const departement = getDepartementFromCommune(firstSim.Commune);
    
    return {
      id: firstSim.Code_Projet,
      libelleoperation: libelle,
      adresseoperation: firstSim.AdresseOperation,
      commune: firstSim.Commune,
      departement,
      natureconstruction: firstSim.NatureConstruction,
      responsable: firstSim.RespBudget,
      simulations: simulations.map(sim => ({
        id: sim.Code_Simulation,
        name: sim.LibelleSimulation,
        datevaleur: sim.DateValeur,
        datemodif: sim.DateModif,
        commune: sim.Commune,
        annee: sim.AnneeDeFinancement,
        departement: getDepartementFromCommune(sim.Commune),
        status: sim.SimulDefaut ? 'Défaut' : 'Actif'
      }))
    };
  });
};

// Helper function to fetch all paginated data with progressive callback
const fetchAllPages = async (
  url: string, 
  onProgressUpdate?: (data: ApiOperationData[], isComplete: boolean) => void
): Promise<ApiOperationData[]> => {
  let allData: ApiOperationData[] = [];
  let currentUrl = url;
  let pageCount = 1;
  
  console.log('📡 Starting paginated fetch...');
  
  while (currentUrl) {
    console.log(`📄 Fetching page ${pageCount}...`);
    
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      console.error('❌ API Response not OK:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();
    const pageData: ApiOperationData[] = apiResponse.value || [];
    
    allData = allData.concat(pageData);
    
    // Call progress callback with current data
    if (onProgressUpdate) {
      const isComplete = !apiResponse['@odata.nextLink'];
      onProgressUpdate(allData, isComplete);
    }
    
    // Check for next page
    if (apiResponse['@odata.nextLink']) {
      // Handle relative URLs - extract base URL and construct properly
      const baseUrl = new URL(API_BASE_URL).origin; // http://localhost:8000
      const nextLink = apiResponse['@odata.nextLink'];
      currentUrl = nextLink.startsWith('http') 
        ? nextLink
        : `${baseUrl}${nextLink}`;
      pageCount++;
    } else {
      currentUrl = null;
    }
  }
  
  console.log(`✅ Successfully fetched ${allData.length} items across ${pageCount} pages`);
  return allData;
};

// Check if cache is valid
const isCacheValid = (): boolean => {
  if (!operationsCache || !cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < CACHE_DURATION;
};

// Get operations with optional filters
export const getOperations = async (filters?: OperationFilters, forceRefresh: boolean = false): Promise<Operation[]> => {
  console.log('🔍 Getting operations with filters:', filters);
  
  // Return cached data if valid and no force refresh
  if (!forceRefresh && isCacheValid()) {
    console.log('💾 Using cached data');
    let operations = operationsCache!;
    
    // Apply filters to cached data
    if (filters && Object.keys(filters).length > 0) {
      operations = operations.filter(op => {
        let match = true;
        if (filters.commune) {
          match = match && op.simulations.some(sim => 
            sim.commune.toLowerCase().includes(filters.commune!.toLowerCase())
          );
        }
        if (filters.natureconstruction) {
          match = match && op.natureconstruction?.toLowerCase().includes(filters.natureconstruction.toLowerCase());
        }
        if (filters.responsable) {
          match = match && op.responsable?.toLowerCase().includes(filters.responsable.toLowerCase());
        }
        return match;
      });
    }
    
    console.log('🎯 Returning filtered cached operations:', operations.length);
    return operations;
  }
  
  // Fetch fresh data
  console.log('🔍 Starting fresh API call to:', API_BASE_URL);
  
  try {
    console.log('📡 Fetching all paginated data...');
    const allApiData = await fetchAllPages(API_BASE_URL);
    
    console.log('🔄 Transforming API data...');
    const allOperations = transformApiData(allApiData);
    
    // Update cache
    operationsCache = allOperations;
    cacheTimestamp = Date.now();
    console.log('💾 Data cached successfully');
    
    let operations = allOperations;
    
    // Apply filters if provided
    if (filters && Object.keys(filters).length > 0) {
      operations = operations.filter(op => {
        let match = true;
        if (filters.commune) {
          match = match && op.simulations.some(sim => 
            sim.commune.toLowerCase().includes(filters.commune!.toLowerCase())
          );
        }
        if (filters.natureconstruction) {
          match = match && op.natureconstruction?.toLowerCase().includes(filters.natureconstruction.toLowerCase());
        }
        if (filters.responsable) {
          match = match && op.responsable?.toLowerCase().includes(filters.responsable.toLowerCase());
        }
        return match;
      });
    }

    console.log('🎯 Returning filtered operations:', operations.length);
    return operations;
  } catch (error) {
    console.error('💥 Error fetching operations:', error);
    console.error('📋 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Erreur lors de la récupération des données');
  }
};

// Get operations progressively (for real-time updates)
export const getOperationsProgressive = async (
  filters?: OperationFilters,
  onProgressUpdate?: (operations: Operation[], isComplete: boolean, loadedCount: number, totalEstimate?: number) => void
): Promise<Operation[]> => {
  console.log('🔍 Getting operations progressively with filters:', filters);
  
  try {
    console.log('📡 Starting progressive data fetch...');
    
    const allApiData = await fetchAllPages(API_BASE_URL, (apiData, isComplete) => {
      // Transform current data
      const currentOperations = transformApiData(apiData);
      
      // Apply filters if provided
      let filteredOperations = currentOperations;
      if (filters && Object.keys(filters).length > 0) {
        filteredOperations = currentOperations.filter(op => {
          let match = true;
          if (filters.commune) {
            match = match && op.simulations.some(sim => 
              sim.commune.toLowerCase().includes(filters.commune!.toLowerCase())
            );
          }
          if (filters.natureconstruction) {
            match = match && op.natureconstruction?.toLowerCase().includes(filters.natureconstruction.toLowerCase());
          }
          if (filters.responsable) {
            match = match && op.responsable?.toLowerCase().includes(filters.responsable.toLowerCase());
          }
          return match;
        });
      }
      
      // Call progress callback
      if (onProgressUpdate) {
        onProgressUpdate(filteredOperations, isComplete, apiData.length);
      }
    });
    
    // Final transformation
    const finalOperations = transformApiData(allApiData);
    
    // Update cache
    operationsCache = finalOperations;
    cacheTimestamp = Date.now();
    console.log('💾 Data cached successfully');
    
    // Apply final filters
    let operations = finalOperations;
    if (filters && Object.keys(filters).length > 0) {
      operations = finalOperations.filter(op => {
        let match = true;
        if (filters.commune) {
          match = match && op.simulations.some(sim => 
            sim.commune.toLowerCase().includes(filters.commune!.toLowerCase())
          );
        }
        if (filters.natureconstruction) {
          match = match && op.natureconstruction?.toLowerCase().includes(filters.natureconstruction.toLowerCase());
        }
        if (filters.responsable) {
          match = match && op.responsable?.toLowerCase().includes(filters.responsable.toLowerCase());
        }
        return match;
      });
    }

    console.log('🎯 Returning final filtered operations:', operations.length);
    return operations;
  } catch (error) {
    console.error('💥 Error fetching operations progressively:', error);
    throw new Error('Erreur lors de la récupération des données');
  }
};

// Get details for a specific operation
export const getOperationDetails = async (operationId: string): Promise<Operation> => {
  // Mock API for demonstration
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Sample detailed data
  const mockDetails: Operation = {
    id: operationId,
    libelleoperation: 'Résidence Les Oliviers',
    adresseoperation: '123 Avenue des Oliviers',
    commune: 'Marseille',
    departement: '13',
    simulations: [
      {
        id: 'sim-detail-1',
        name: 'Simulation Détaillée',
        datevaleur: '2023-01-15',
        datemodif: '2023-06-20',
        commune: 'Marseille',
        annee: 2023,
        departement: '13',
        status: 'En cours'
      }
    ],
    details: {
      typologielogement: [
        { id: 't1', type: 'T2', surface: 45, quantite: 10, prixunitaire: 120000 },
        { id: 't2', type: 'T3', surface: 65, quantite: 8, prixunitaire: 180000 },
        { id: 't3', type: 'T4', surface: 85, quantite: 5, prixunitaire: 240000 }
      ],
      typologieaccessoire: [
        { id: 'a1', type: 'Parking', quantite: 15, prixunitaire: 10000 },
        { id: 'a2', type: 'Cave', quantite: 8, prixunitaire: 5000 }
      ],
      prixrevient: {
        charge_fonciere: 1500000,
        travaux: 2800000,
        honoraires: 350000,
        frais_annexes: 150000,
        total: 4800000
      },
      financement: {
        fonds_propres: 1000000,
        subventions: 800000,
        prets: 3000000,
        total: 4800000
      },
      exploitation: {
        loyers_annuels: 240000,
        charges_annuelles: 80000,
        resultat_brut: 160000
      },
      emprunts: [
        { id: 'e1', preteur: 'Banque A', montant: 2000000, taux: 1.5, duree: 20 },
        { id: 'e2', preteur: 'Banque B', montant: 1000000, taux: 1.8, duree: 15 }
      ]
    }
  };
  
  return mockDetails;
};

// Export operation data
export const exportOperation = async (options: ExportOptions): Promise<Blob | object> => {
  // In a real application, this would call the API endpoint for exports
  // For this demo, we'll simulate the API call and generate a mock file
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (options.format === 'json') {
    // Return sample JSON data
    const jsonData = {
      operation: await getOperationDetails(options.operationId || '1'),
      exportedAt: new Date().toISOString(),
      user: JSON.parse(localStorage.getItem('smo_user') || '{}').username
    };
    
    return new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json' 
    });
  } else {
    // In reality, this would return an Excel file from the server
    // For demo, we'll just return a placeholder object
    return new Blob(['Excel file content would be here'], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
};

// Helper to download exported files
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};
