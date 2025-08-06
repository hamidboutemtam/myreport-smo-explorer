import { useState, useEffect } from 'react';
import { TypologyData, PrixRevientData, Simulation } from '@/types/operation';
import { toast } from 'sonner';

export const useOperationData = (operationId: string | undefined) => {
  const [typologyData, setTypologyData] = useState<TypologyData[]>([]);
  const [prixRevientData, setPrixRevientData] = useState<PrixRevientData[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [operationInfo, setOperationInfo] = useState<any>(null);

  const getAuthHeader = () => {
    const credentials = btoa('ADM:ADM');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  };

  // Fonction pour récupérer toutes les pages d'une API
  const fetchAllPages = async (baseUrl: string): Promise<any[]> => {
    let allData: any[] = [];
    let currentUrl = baseUrl;
    
    while (currentUrl) {
      console.log('Fetching page:', currentUrl);
      const response = await fetch(currentUrl, { headers: getAuthHeader() });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      allData = allData.concat(data.value || []);
      
      // Vérifier s'il y a une page suivante
      currentUrl = data['@odata.nextLink'] ? 
        (data['@odata.nextLink'].startsWith('http') ? 
          data['@odata.nextLink'] : 
          `http://localhost:8000${data['@odata.nextLink']}`) : 
        null;
    }
    
    return allData;
  };

  const fetchSimulations = async () => {
    if (!operationId) return;
    
    try {
      console.log('Fetching simulations for operation:', operationId);
      const response = await fetch(
        `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRCaracOp?$filter=Code_Projet eq '${operationId}'`,
        { headers: getAuthHeader() }
      );
      
      if (!response.ok) throw new Error('Failed to fetch simulations');
      
      const data = await response.json();
      console.log('Simulations data received:', data);
      
      const uniqueSimulations = data.value.reduce((acc: any[], curr: any) => {
        if (!acc.find(sim => sim.Code_Simulation === curr.Code_Simulation)) {
          acc.push({
            Code_Simulation: curr.Code_Simulation,
            LibelleSimulation: curr.LibelleSimulation,
            DateCreation: curr.DateCreation,
            DateModif: curr.DateModif,
            DateValeur: curr.DateValeur,
            Etape: curr.Etape,
            Proprietaire: curr.Proprietaire,
            Commentaire: curr.Commentaire || curr.LibelleSimulation
          });
        }
        return acc;
      }, []);

      const sortedSimulations = uniqueSimulations.sort((a, b) => 
        new Date(b.DateModif).getTime() - new Date(a.DateModif).getTime()
      );

      setSimulations(sortedSimulations);
      if (sortedSimulations.length > 0 && !selectedSimulation) {
        setSelectedSimulation(sortedSimulations[0].Code_Simulation);
      }

      if (data.value.length > 0) {
        setOperationInfo(data.value[0]);
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast.error('Erreur lors du chargement des simulations');
    }
  };

  const fetchTypologyData = async () => {
    if (!operationId || !selectedSimulation) return;

    try {
      console.log('Fetching typology data for simulation:', selectedSimulation);
      
      // Essayer différents noms d'axes possibles
      const possibleAxes = [
        'AXE_MON_SRTypo',
        'AXE_MON_Typo', 
        'AXE_Typologie',
        'AXE_MON_Typologie',
        'Typologie'
      ];
      
      for (const axeName of possibleAxes) {
        try {
          const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`;
          const allData = await fetchAllPages(baseUrl);
          console.log(`✅ Found typology data with axis: ${axeName}`, allData);
          setTypologyData(allData || []);
          return;
        } catch (axisError) {
          console.log(`❌ Axis ${axeName} not found, trying next...`);
          continue;
        }
      }
      
      // Si aucun axe ne fonctionne, essayer sans filtre de simulation
      for (const axeName of possibleAxes) {
        try {
          const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}?$filter=Code_Projet eq '${operationId}'`;
          const allData = await fetchAllPages(baseUrl);
          const filteredData = allData.filter((item: any) => item.Code_Simulation === selectedSimulation);
          console.log(`✅ Found and filtered typology data with axis: ${axeName}`, filteredData);
          setTypologyData(filteredData || []);
          return;
        } catch (axisError) {
          continue;
        }
      }
      
      console.log('❌ No typology data found for this simulation');
      setTypologyData([]);
    } catch (error) {
      console.error('Error fetching typology data:', error);
      setTypologyData([]);
    }
  };

  const fetchPrixRevientData = async () => {
    if (!operationId || !selectedSimulation) return;

    try {
      console.log('Fetching prix de revient data for simulation:', selectedSimulation);
      
      // Essayer différents noms d'axes possibles
      const possibleAxes = [
        'AXE_MON_SRPrixRev',
        'AXE_MON_PrixRev',
        'AXE_PrixRevient', 
        'AXE_MON_PrixRevient',
        'PrixRevient'
      ];
      
      for (const axeName of possibleAxes) {
        try {
          const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`;
          const allData = await fetchAllPages(baseUrl);
          console.log(`✅ Found prix de revient data with axis: ${axeName}`, allData);
          setPrixRevientData(allData || []);
          return;
        } catch (axisError) {
          console.log(`❌ Axis ${axeName} not found, trying next...`);
          continue;
        }
      }
      
      // Si aucun axe ne fonctionne, essayer sans filtre de simulation
      for (const axeName of possibleAxes) {
        try {
          const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}?$filter=Code_Projet eq '${operationId}'`;
          const allData = await fetchAllPages(baseUrl);
          const filteredData = allData.filter((item: any) => item.Code_Simulation === selectedSimulation);
          console.log(`✅ Found and filtered prix de revient data with axis: ${axeName}`, filteredData);
          setPrixRevientData(filteredData || []);
          return;
        } catch (axisError) {
          continue;
        }
      }
      
      console.log('❌ No prix de revient data found for this simulation');
      setPrixRevientData([]);
    } catch (error) {
      console.error('Error fetching prix de revient data:', error);
      setPrixRevientData([]);
    }
  };

  const refreshData = async () => {
    if (!selectedSimulation) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all([
        fetchTypologyData(),
        fetchPrixRevientData()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (operationId) {
      setLoading(true);
      fetchSimulations();
    }
  }, [operationId]);

  useEffect(() => {
    refreshData();
  }, [selectedSimulation]);

  return {
    typologyData,
    prixRevientData,
    simulations,
    selectedSimulation,
    setSelectedSimulation,
    loading,
    operationInfo,
    refreshData
  };
};