import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Building, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TypologyData {
  Code_Projet: string;
  Code_Simulation: string;
  Code_Programme: string;
  Designation: string;
  Nb: number;
  Type: string;
  SurfHabMoy: number;
  Shab: number;
  Su: number;
}

interface Simulation {
  Code_Simulation: string;
  LibelleSimulation: string;
  DateCreation: string;
  DateModif: string;
}

const OperationDetail = () => {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const [typologyData, setTypologyData] = useState<TypologyData[]>([]);
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
            DateModif: curr.DateModif
          });
        }
        return acc;
      }, []);
      
      console.log('Unique simulations:', uniqueSimulations);
      setSimulations(uniqueSimulations);
      setOperationInfo(data.value[0]);
      
      if (uniqueSimulations.length > 0) {
        setSelectedSimulation(uniqueSimulations[0].Code_Simulation);
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast.error('Erreur lors du chargement des simulations');
    }
  };

  const fetchTypologyData = async (simulationCode: string) => {
    if (!operationId || !simulationCode) return;
    
    setLoading(true);
    try {
      console.log('Fetching typology for:', { operationId, simulationCode });
      const url = `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRTypoLgtPrgDetailLgtTotal?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${simulationCode}'`;
      console.log('API URL:', url);
      
      const response = await fetch(url, { headers: getAuthHeader() });
      
      if (!response.ok) throw new Error('Failed to fetch typology data');
      
      const data = await response.json();
      console.log('Typology data received:', data);
      setTypologyData(data.value || []);
    } catch (error) {
      console.error('Error fetching typology data:', error);
      toast.error('Erreur lors du chargement de la typologie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [operationId]);

  useEffect(() => {
    if (selectedSimulation) {
      fetchTypologyData(selectedSimulation);
    }
  }, [selectedSimulation]);

  // Group data by type and program
  const groupedData = typologyData.reduce((acc, item) => {
    const key = `${item.Type}_${item.Code_Programme}`;
    if (!acc[key]) {
      acc[key] = {
        Type: item.Type,
        Programme: item.Code_Programme,
        byFinancement: {}
      };
    }
    acc[key].byFinancement[item.Code_Programme] = {
      Nb: item.Nb,
      Su: item.Su,
      Shab: item.Shab
    };
    return acc;
  }, {} as any);

  // Get unique financing types (programmes)
  const financingTypes = [...new Set(typologyData.map(item => item.Code_Programme))];

  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      byFinancement: {} as any,
      total: { Nb: 0, Su: 0, Shab: 0 }
    };

    financingTypes.forEach(financing => {
      totals.byFinancement[financing] = { Nb: 0, Su: 0, Shab: 0 };
    });

    typologyData.forEach(item => {
      totals.byFinancement[item.Code_Programme].Nb += item.Nb;
      totals.byFinancement[item.Code_Programme].Su += item.Su;
      totals.byFinancement[item.Code_Programme].Shab += item.Shab;
      totals.total.Nb += item.Nb;
      totals.total.Su += item.Su;
      totals.total.Shab += item.Shab;
    });

    return totals;
  };

  const totals = calculateTotals();

  if (!operationId) {
    return <div>Operation ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Button>
        </div>

        {/* Operation Info */}
        {operationInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {operationInfo.LibelleOperation}
              </CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Commune: {operationInfo.Commune}</span>
                <span>Adresse: {operationInfo.AdresseOperation}</span>
                <span>Nature: {operationInfo.NatureConstruction}</span>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Simulation Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedSimulation} onValueChange={setSelectedSimulation}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Sélectionnez une simulation" />
                </SelectTrigger>
                <SelectContent>
                  {simulations.map((simulation) => (
                    <SelectItem key={simulation.Code_Simulation} value={simulation.Code_Simulation}>
                      {simulation.LibelleSimulation} ({new Date(simulation.DateModif).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => selectedSimulation && fetchTypologyData(selectedSimulation)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Typology Tables */}
        {selectedSimulation && (
          <div className="space-y-6">
            {/* Number of Units Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700 bg-blue-100 p-2 rounded">
                  NOMBRE DE LOTS PAR TYPOLOGIE ET FINANCEMENT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold text-center">Total</TableHead>
                      {financingTypes.map(financing => (
                        <TableHead key={financing} className="font-semibold text-center">{financing}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(groupedData).map((row: any, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <TableCell className="font-medium">{row.Type}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {financingTypes.reduce((sum, financing) => 
                            sum + (row.byFinancement[financing]?.Nb || 0), 0
                          )}
                        </TableCell>
                        {financingTypes.map(financing => (
                          <TableCell key={financing} className="text-center">
                            {row.byFinancement[financing]?.Nb || 0}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-100 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-center">{totals.total.Nb}</TableCell>
                      {financingTypes.map(financing => (
                        <TableCell key={financing} className="text-center">
                          {totals.byFinancement[financing]?.Nb || 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Surface Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700 bg-blue-100 p-2 rounded">
                  SURFACES PAR TYPOLOGIE ET FINANCEMENT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Useful Surface */}
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">Surface Utile (m²)</h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold text-center">Total</TableHead>
                          {financingTypes.map(financing => (
                            <TableHead key={financing} className="font-semibold text-center">{financing}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(groupedData).map((row: any, index) => (
                          <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <TableCell className="font-medium">{row.Type}</TableCell>
                            <TableCell className="text-center font-semibold">
                              {financingTypes.reduce((sum, financing) => 
                                sum + (row.byFinancement[financing]?.Su || 0), 0
                              )}
                            </TableCell>
                            {financingTypes.map(financing => (
                              <TableCell key={financing} className="text-center">
                                {row.byFinancement[financing]?.Su || 0}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-100 font-semibold">
                          <TableCell>Surface totale</TableCell>
                          <TableCell className="text-center">{totals.total.Su}</TableCell>
                          {financingTypes.map(financing => (
                            <TableCell key={financing} className="text-center">
                              {totals.byFinancement[financing]?.Su || 0}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Habitable Surface */}
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">Surface Habitable (m²)</h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold text-center">Total</TableHead>
                          {financingTypes.map(financing => (
                            <TableHead key={financing} className="font-semibold text-center">{financing}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(groupedData).map((row: any, index) => (
                          <TableRow key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <TableCell className="font-medium">{row.Type}</TableCell>
                            <TableCell className="text-center font-semibold">
                              {financingTypes.reduce((sum, financing) => 
                                sum + (row.byFinancement[financing]?.Shab || 0), 0
                              )}
                            </TableCell>
                            {financingTypes.map(financing => (
                              <TableCell key={financing} className="text-center">
                                {row.byFinancement[financing]?.Shab || 0}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-100 font-semibold">
                          <TableCell>Surface totale</TableCell>
                          <TableCell className="text-center">{totals.total.Shab}</TableCell>
                          {financingTypes.map(financing => (
                            <TableCell key={financing} className="text-center">
                              {totals.byFinancement[financing]?.Shab || 0}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationDetail;