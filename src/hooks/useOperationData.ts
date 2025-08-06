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
      console.log('🔍 Fetching typology data for simulation:', selectedSimulation);
      
      // D'abord, découvrir quels axes existent
      try {
        console.log('🔍 Discovering available axes...');
        const axesResponse = await fetch('http://localhost:8000/AccessionRV/api/reporting/axes', { 
          headers: getAuthHeader() 
        });
        
        if (axesResponse.ok) {
          const axesData = await axesResponse.json();
          console.log('📋 Available axes:', axesData);
          
          // Chercher les axes liés à la typologie
          const typologyAxes = axesData.value?.filter((axis: any) => 
            axis.name?.toLowerCase().includes('typo') || 
            axis.name?.toLowerCase().includes('typologie')
          ) || [];
          
          console.log('🎯 Found potential typology axes:', typologyAxes);
          
          // Essayer chaque axe trouvé
          for (const axis of typologyAxes) {
            try {
              const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axis.name}?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`;
              const allData = await fetchAllPages(baseUrl);
              console.log(`✅ Successfully fetched typology data from axis: ${axis.name}`, allData);
              setTypologyData(allData || []);
              return;
            } catch (axisError) {
              console.log(`❌ Failed to fetch from axis ${axis.name}:`, axisError);
              continue;
            }
          }
        }
      } catch (discoveryError) {
        console.log('❌ Could not discover axes:', discoveryError);
      }
      
      // Si la découverte échoue, essayer les URLs connues du code original
      console.log('🔄 Trying fallback approach with known axes...');
      const knownAxes = ['AXE_MON_SRTypo', 'AXE_MON_Typo', 'AXE_Typologie'];
      
      for (const axeName of knownAxes) {
        try {
          // Test si l'axe existe d'abord
          const testResponse = await fetch(`http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}`, { 
            headers: getAuthHeader() 
          });
          
          if (testResponse.ok) {
            console.log(`✅ Axis ${axeName} exists, fetching data...`);
            const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`;
            const allData = await fetchAllPages(baseUrl);
            console.log(`✅ Successfully fetched typology data from: ${axeName}`, allData);
            setTypologyData(allData || []);
            return;
          } else {
            console.log(`❌ Axis ${axeName} does not exist (${testResponse.status})`);
          }
        } catch (axisError) {
          console.log(`❌ Error testing axis ${axeName}:`, axisError);
          continue;
        }
      }
      
      console.log('❌ No working typology axes found');
      setTypologyData([]);
      
    } catch (error) {
      console.error('❌ Critical error in fetchTypologyData:', error);
      setTypologyData([]);
    }
  };

  const fetchPrixRevientData = async () => {
    if (!operationId || !selectedSimulation) return;

    try {
      console.log('💰 Fetching prix de revient data for simulation:', selectedSimulation);
      
      // D'abord, découvrir quels axes existent
      try {
        console.log('🔍 Discovering available axes for prix de revient...');
        const axesResponse = await fetch('http://localhost:8000/AccessionRV/api/reporting/axes', { 
          headers: getAuthHeader() 
        });
        
        if (axesResponse.ok) {
          const axesData = await axesResponse.json();
          console.log('📋 Available axes:', axesData);
          
          // Chercher les axes liés au prix de revient
          const prixAxes = axesData.value?.filter((axis: any) => 
            axis.name?.toLowerCase().includes('prix') || 
            axis.name?.toLowerCase().includes('revient') ||
            axis.name?.toLowerCase().includes('budget') ||
            axis.name?.toLowerCase().includes('cout')
          ) || [];
          
          console.log('🎯 Found potential prix de revient axes:', prixAxes);
          
          // Essayer chaque axe trouvé
          for (const axis of prixAxes) {
            try {
              const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axis.name}?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`;
              const allData = await fetchAllPages(baseUrl);
              console.log(`✅ Successfully fetched prix de revient data from axis: ${axis.name}`, allData);
              setPrixRevientData(allData || []);
              return;
            } catch (axisError) {
              console.log(`❌ Failed to fetch from axis ${axis.name}:`, axisError);
              continue;
            }
          }
        }
      } catch (discoveryError) {
        console.log('❌ Could not discover axes for prix de revient:', discoveryError);
      }
      
      // Si la découverte échoue, essayer les URLs connues du code original
      console.log('🔄 Trying fallback approach with known prix axes...');
      const knownAxes = ['AXE_MON_SRPrixRev', 'AXE_MON_PrixRev', 'AXE_PrixRevient'];
      
      for (const axeName of knownAxes) {
        try {
          // Test si l'axe existe d'abord
          const testResponse = await fetch(`http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}`, { 
            headers: getAuthHeader() 
          });
          
          if (testResponse.ok) {
            console.log(`✅ Axis ${axeName} exists, fetching data...`);
            const baseUrl = `http://localhost:8000/AccessionRV/api/reporting/axes/${axeName}?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`;
            const allData = await fetchAllPages(baseUrl);
            console.log(`✅ Successfully fetched prix de revient data from: ${axeName}`, allData);
            setPrixRevientData(allData || []);
            return;
          } else {
            console.log(`❌ Axis ${axeName} does not exist (${testResponse.status})`);
          }
        } catch (axisError) {
          console.log(`❌ Error testing axis ${axeName}:`, axisError);
          continue;
        }
      }
      
      console.log('❌ No working prix de revient axes found');
      setPrixRevientData([]);
      
    } catch (error) {
      console.error('❌ Critical error in fetchPrixRevientData:', error);
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