
import { Operation, OperationFilters, ExportOptions } from '@/types';

// Base API URL - This would be your actual API endpoint in production
const API_BASE_URL = '/api';

// Helper function to get the auth header
const getAuthHeader = () => {
  const user = localStorage.getItem('smo_user');
  if (!user) return {};
  
  const { token } = JSON.parse(user);
  return {
    Authorization: `Bearer ${token}`
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

// Get operations with optional filters
export const getOperations = async (filters?: OperationFilters): Promise<Operation[]> => {
  // Mock API for demonstration - will return dummy data
  // In a real app, this would make an actual API call
  
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Sample data with multiple simulations
  const mockOperations: Operation[] = [
    {
      id: '1',
      libelleoperation: 'Résidence Les Oliviers',
      simulations: [
        {
          id: 'sim-1-1',
          name: 'Simulation Base',
          commune: 'Marseille',
          annee: 2023,
          departement: '13',
          status: 'En cours'
        },
        {
          id: 'sim-1-2',
          name: 'Simulation Optimisée',
          commune: 'Aix-en-Provence',
          annee: 2024,
          departement: '13',
          status: 'Planifié'
        }
      ]
    },
    {
      id: '2',
      libelleoperation: 'Parc Saint-Michel',
      simulations: [
        {
          id: 'sim-2-1',
          name: 'Scenario Standard',
          commune: 'Lyon',
          annee: 2022,
          departement: '69',
          status: 'Terminé'
        },
        {
          id: 'sim-2-2',
          name: 'Scenario Alternatif',
          commune: 'Villeurbanne',
          annee: 2023,
          departement: '69',
          status: 'En cours'
        }
      ]
    },
    {
      id: '3',
      libelleoperation: 'Les Terrasses du Port',
      simulations: [
        {
          id: 'sim-3-1',
          name: 'Version 1',
          commune: 'Marseille',
          annee: 2023,
          departement: '13',
          status: 'Planifié'
        }
      ]
    }
  ];

  // Apply filters if provided
  if (filters) {
    return mockOperations.filter(op => {
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

  return mockOperations;
};

// Get details for a specific operation
export const getOperationDetails = async (operationId: string): Promise<Operation> => {
  // Mock API for demonstration
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Sample detailed data
  const mockDetails: Operation = {
    id: operationId,
    libelleoperation: 'Résidence Les Oliviers',
    simulations: [
      {
        id: 'sim-detail-1',
        name: 'Simulation Détaillée',
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
