
import { Operation, OperationFilters, ExportOptions, ApiOperationData } from '@/types';

// External API URL
const API_BASE_URL = 'http://pos0726:8000/AccessionRV/api/reporting/axes/AXE_MON_SRCaracOp';

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

// Get operations with optional filters
export const getOperations = async (filters?: OperationFilters): Promise<Operation[]> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData: ApiOperationData[] = await response.json();
    let operations = transformApiData(apiData);

    // Apply filters if provided
    if (filters) {
      operations = operations.filter(op => {
        let match = true;
        if (filters.libelleoperation) {
          match = match && op.libelleoperation.toLowerCase().includes(filters.libelleoperation.toLowerCase());
        }
        if (filters.commune) {
          match = match && op.simulations.some(sim => 
            sim.commune.toLowerCase().includes(filters.commune!.toLowerCase())
          );
        }
        if (filters.annee) {
          match = match && op.simulations.some(sim => sim.annee === filters.annee);
        }
        if (filters.departement) {
          match = match && op.simulations.some(sim => sim.departement === filters.departement);
        }
        if (filters.status) {
          match = match && op.simulations.some(sim => sim.status === filters.status);
        }
        return match;
      });
    }

    return operations;
  } catch (error) {
    console.error('Error fetching operations:', error);
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
