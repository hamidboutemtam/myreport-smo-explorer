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
      
      // D'abord tester si l'endpoint existe du tout
      console.log('Testing if AXE_MON_SRTypo endpoint exists...');
      try {
        const testResponse = await fetch(
          `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRTypo`,
          { headers: getAuthHeader() }
        );
        console.log('Endpoint test status:', testResponse.status);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Sample data from AXE_MON_SRTypo:', testData.value?.slice(0, 2));
        }
      } catch (endpointError) {
        console.error('Endpoint does not exist or is not accessible:', endpointError);
        setTypologyData([]);
        return;
      }
      
      // Essayer avec notre project d'abord (sans simulation)
      console.log('Testing with project filter only...');
      try {
        const projectResponse = await fetch(
          `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRTypo?$filter=Code_Projet eq '${operationId}'`,
          { headers: getAuthHeader() }
        );
        
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          console.log('Available simulations for this project:', projectData.value?.map(item => item.Code_Simulation));
          
          // Si on a des données pour ce projet, essayer de filtrer par simulation
          if (projectData.value && projectData.value.length > 0) {
            const matchingData = projectData.value.filter((item: any) => item.Code_Simulation === selectedSimulation);
            console.log('Matching data for simulation:', matchingData);
            setTypologyData(matchingData);
            return;
          }
        }
      } catch (projectError) {
        console.error('Project filter failed:', projectError);
      }
      
      console.warn('No typology data found - this simulation may not have typology data');
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
      
      // D'abord tester si l'endpoint existe du tout
      console.log('Testing if AXE_MON_SRPrixRev endpoint exists...');
      try {
        const testResponse = await fetch(
          `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRPrixRev`,
          { headers: getAuthHeader() }
        );
        console.log('Prix de revient endpoint test status:', testResponse.status);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Sample data from AXE_MON_SRPrixRev:', testData.value?.slice(0, 2));
        }
      } catch (endpointError) {
        console.error('Prix de revient endpoint does not exist or is not accessible:', endpointError);
        setPrixRevientData([]);
        return;
      }
      
      // Essayer avec notre project d'abord (sans simulation)
      console.log('Testing prix de revient with project filter only...');
      try {
        const projectResponse = await fetch(
          `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRPrixRev?$filter=Code_Projet eq '${operationId}'`,
          { headers: getAuthHeader() }
        );
        
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          console.log('Available simulations in prix de revient for this project:', projectData.value?.map(item => item.Code_Simulation));
          
          // Si on a des données pour ce projet, essayer de filtrer par simulation
          if (projectData.value && projectData.value.length > 0) {
            const matchingData = projectData.value.filter((item: any) => item.Code_Simulation === selectedSimulation);
            console.log('Matching prix de revient data for simulation:', matchingData);
            setPrixRevientData(matchingData);
            return;
          }
        }
      } catch (projectError) {
        console.error('Prix de revient project filter failed:', projectError);
      }
      
      console.warn('No prix de revient data found - this simulation may not have budget data');
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