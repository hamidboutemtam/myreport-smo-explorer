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
      const response = await fetch(
        `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRTypo?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`,
        { headers: getAuthHeader() }
      );
      
      if (!response.ok) throw new Error('Failed to fetch typology data');
      
      const data = await response.json();
      console.log('Typology data received:', data);
      setTypologyData(data.value || []);
    } catch (error) {
      console.error('Error fetching typology data:', error);
      toast.error('Erreur lors du chargement des données de typologie');
    }
  };

  const fetchPrixRevientData = async () => {
    if (!operationId || !selectedSimulation) return;

    try {
      console.log('Fetching prix de revient data for simulation:', selectedSimulation);
      const response = await fetch(
        `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRPrixRev?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${selectedSimulation}'`,
        { headers: getAuthHeader() }
      );
      
      if (!response.ok) throw new Error('Failed to fetch prix de revient data');
      
      const data = await response.json();
      console.log('Prix de revient data received:', data);
      setPrixRevientData(data.value || []);
    } catch (error) {
      console.error('Error fetching prix de revient data:', error);
      toast.error('Erreur lors du chargement des données de prix de revient');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTypologyData(),
      fetchPrixRevientData()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSimulations();
  }, [operationId]);

  useEffect(() => {
    if (selectedSimulation) {
      refreshData();
    }
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