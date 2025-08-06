import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, RefreshCw, BarChart3, Home, Ruler, Calendar, MapPin, Euro, Users, Square } from 'lucide-react';
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
  LRetModule: number;
  ProdLocLoyerRet: number;
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

  // Mapping des codes programme vers nature de financement
  const getFinancingNature = (codeProgram: string): string => {
    const mapping: { [key: string]: string } = {
      'PLAI': 'PLAI (Prêt Locatif Aidé d\'Intégration)',
      'PLUS': 'PLUS (Prêt Locatif à Usage Social)',
      'PLS': 'PLS (Prêt Locatif Social)',
      'PLI': 'PLI (Prêt Locatif Intermédiaire)',
      'COM': 'Commercialisation',
      'LLI': 'LLI (Logement Locatif Intermédiaire)',
      'ACC': 'Accession',
      'PSLA': 'PSLA (Prêt Social Location-Accession)'
    };
    return mapping[codeProgram] || codeProgram;
  };

  // Group data by type and program
  const groupedData = typologyData.reduce((acc, item) => {
    const key = `${item.Type}_${item.Code_Programme}`;
    const financingNature = getFinancingNature(item.Code_Programme);
    if (!acc[key]) {
      acc[key] = {
        Type: item.Type,
        Programme: item.Code_Programme,
        NatureFinancement: financingNature,
        byFinancement: {}
      };
    }
    acc[key].byFinancement[financingNature] = {
      Nb: item.Nb,
      Su: item.Su,
      Shab: item.Shab,
      LoyerMensuel: item.ProdLocLoyerRet || 0
    };
    return acc;
  }, {} as any);

  // Get unique financing types (programmes)
  const financingTypes = [...new Set(typologyData.map(item => getFinancingNature(item.Code_Programme)))];

  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      byFinancement: {} as any,
      total: { Nb: 0, Su: 0, Shab: 0, LoyerMensuel: 0 }
    };

    financingTypes.forEach(financing => {
      totals.byFinancement[financing] = { Nb: 0, Su: 0, Shab: 0, LoyerMensuel: 0 };
    });

    typologyData.forEach(item => {
      const financingNature = getFinancingNature(item.Code_Programme);
      totals.byFinancement[financingNature].Nb += item.Nb;
      totals.byFinancement[financingNature].Su += item.Su;
      totals.byFinancement[financingNature].Shab += item.Shab;
      if (item.ProdLocLoyerRet && item.Nb > 0) {
        totals.byFinancement[financingNature].LoyerMensuel += item.ProdLocLoyerRet;
      }
      totals.total.Nb += item.Nb;
      totals.total.Su += item.Su;
      totals.total.Shab += item.Shab;
      if (item.ProdLocLoyerRet) {
        totals.total.LoyerMensuel += item.ProdLocLoyerRet;
      }
    });

    return totals;
  };

  const totals = calculateTotals();

  if (!operationId) {
    return <div>Operation ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Button>
          
          {selectedSimulation && (
            <Badge variant="secondary" className="text-sm">
              Simulation active
            </Badge>
          )}
        </div>

        {/* Informations de l'opération */}
        {operationInfo && (
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900 mb-2 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    {operationInfo.LibelleOperation}
                  </CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <div>
                        <span className="font-medium">{operationInfo.Commune}</span>
                        {operationInfo.AdresseOperation && (
                          <div className="text-xs text-gray-500">{operationInfo.AdresseOperation}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>{operationInfo.NatureConstruction}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Créé le {new Date(operationInfo.DateCreation).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Sélecteur de simulation */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Sélection de simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedSimulation} onValueChange={setSelectedSimulation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une simulation" />
                  </SelectTrigger>
                  <SelectContent>
                    {simulations.map((simulation) => (
                      <SelectItem key={simulation.Code_Simulation} value={simulation.Code_Simulation}>
                        <div className="flex flex-col">
                          <span>{simulation.LibelleSimulation}</span>
                          <span className="text-xs text-gray-500">
                            Modifié le {new Date(simulation.DateModif).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => selectedSimulation && fetchTypologyData(selectedSimulation)}
                disabled={loading}
                className="hover:shadow-md transition-shadow"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Données de typologie avec onglets */}
        {selectedSimulation && !loading && typologyData.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Composition du programme locatif
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Étiquettes récapitulatives */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 rounded-full p-2">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Logements</p>
                      <p className="text-2xl font-bold text-blue-900">{totals.total.Nb}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-2">
                      <Square className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Surfaces Totales</p>
                      <p className="text-2xl font-bold text-green-900">
                        {totals.total.Shab.toFixed(0)} m²
                      </p>
                      <p className="text-xs text-green-600">
                        SU: {totals.total.Su.toFixed(0)} m²
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 rounded-full p-2">
                      <Euro className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Loyers Totaux</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {totals.total.LoyerMensuel.toFixed(0)} €
                      </p>
                      <p className="text-xs text-purple-600">par mois</p>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="logements" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="logements" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Nombre de logements
                  </TabsTrigger>
                  <TabsTrigger value="surfaces" className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Surfaces
                  </TabsTrigger>
                  <TabsTrigger value="loyers" className="flex items-center gap-2">
                    <Euro className="w-4 h-4" />
                    Loyers
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Nombre de logements */}
                <TabsContent value="logements" className="space-y-4 animate-fade-in">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-4 text-center">
                      NOMBRE DE LOTS PAR TYPOLOGIE ET FINANCEMENT
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-100/50">
                            <TableHead className="font-semibold text-gray-700">Type</TableHead>
                            <TableHead className="font-semibold text-center text-gray-700">Total</TableHead>
                            {financingTypes.map(financing => (
                              <TableHead key={financing} className="font-semibold text-center text-gray-700 min-w-[120px]">
                                {financing}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(groupedData).map((row: any, index) => (
                            <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <TableCell className="font-medium text-gray-900">{row.Type}</TableCell>
                              <TableCell className="text-center font-semibold text-blue-600">
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
                          <TableRow className="bg-blue-100 font-semibold border-t-2 border-blue-200">
                            <TableCell className="text-gray-900">Total</TableCell>
                            <TableCell className="text-center text-blue-700">{totals.total.Nb}</TableCell>
                            {financingTypes.map(financing => (
                              <TableCell key={financing} className="text-center text-blue-700">
                                {totals.byFinancement[financing]?.Nb || 0}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Surfaces */}
                <TabsContent value="surfaces" className="space-y-6 animate-fade-in">
                  {/* Surface Utile */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-4 text-center">
                      SURFACE UTILE (m²) PAR TYPOLOGIE ET FINANCEMENT
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-100/50">
                            <TableHead className="font-semibold text-gray-700">Type</TableHead>
                            <TableHead className="font-semibold text-center text-gray-700">Total</TableHead>
                            {financingTypes.map(financing => (
                              <TableHead key={financing} className="font-semibold text-center text-gray-700 min-w-[120px]">
                                {financing}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(groupedData).map((row: any, index) => (
                            <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <TableCell className="font-medium text-gray-900">{row.Type}</TableCell>
                              <TableCell className="text-center font-semibold text-green-600">
                                {financingTypes.reduce((sum, financing) => 
                                  sum + (row.byFinancement[financing]?.Su || 0), 0
                                ).toFixed(1)}
                              </TableCell>
                              {financingTypes.map(financing => (
                                <TableCell key={financing} className="text-center">
                                  {(row.byFinancement[financing]?.Su || 0).toFixed(1)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          <TableRow className="bg-green-100 font-semibold border-t-2 border-green-200">
                            <TableCell className="text-gray-900">Surface totale</TableCell>
                            <TableCell className="text-center text-green-700">{totals.total.Su.toFixed(1)}</TableCell>
                            {financingTypes.map(financing => (
                              <TableCell key={financing} className="text-center text-green-700">
                                {(totals.byFinancement[financing]?.Su || 0).toFixed(1)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Surface Habitable */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-4 text-center">
                      SURFACE HABITABLE (m²) PAR TYPOLOGIE ET FINANCEMENT
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-orange-100/50">
                            <TableHead className="font-semibold text-gray-700">Type</TableHead>
                            <TableHead className="font-semibold text-center text-gray-700">Total</TableHead>
                            {financingTypes.map(financing => (
                              <TableHead key={financing} className="font-semibold text-center text-gray-700 min-w-[120px]">
                                {financing}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(groupedData).map((row: any, index) => (
                            <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <TableCell className="font-medium text-gray-900">{row.Type}</TableCell>
                              <TableCell className="text-center font-semibold text-orange-600">
                                {financingTypes.reduce((sum, financing) => 
                                  sum + (row.byFinancement[financing]?.Shab || 0), 0
                                ).toFixed(1)}
                              </TableCell>
                              {financingTypes.map(financing => (
                                <TableCell key={financing} className="text-center">
                                  {(row.byFinancement[financing]?.Shab || 0).toFixed(1)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          <TableRow className="bg-orange-100 font-semibold border-t-2 border-orange-200">
                            <TableCell className="text-gray-900">Surface totale</TableCell>
                            <TableCell className="text-center text-orange-700">{totals.total.Shab.toFixed(1)}</TableCell>
                            {financingTypes.map(financing => (
                              <TableCell key={financing} className="text-center text-orange-700">
                                {(totals.byFinancement[financing]?.Shab || 0).toFixed(1)}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Loyers */}
                <TabsContent value="loyers" className="space-y-4 animate-fade-in">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-4 text-center">
                      LOYERS MOYENS MENSUELS (€) PAR TYPOLOGIE ET FINANCEMENT
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-purple-100/50">
                            <TableHead className="font-semibold text-gray-700">Type</TableHead>
                            <TableHead className="font-semibold text-center text-gray-700">Total</TableHead>
                            {financingTypes.map(financing => (
                              <TableHead key={financing} className="font-semibold text-center text-gray-700 min-w-[120px]">
                                {financing}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(groupedData).map((row: any, index) => {
                            // Calcul du loyer moyen total pour ce type
                            const totalLoyer = financingTypes.reduce((sum, financing) => 
                              sum + (row.byFinancement[financing]?.LoyerMensuel || 0), 0
                            );
                            const totalNb = financingTypes.reduce((sum, financing) => 
                              sum + (row.byFinancement[financing]?.Nb || 0), 0
                            );
                            const moyenneLoyer = totalNb > 0 ? totalLoyer / totalNb : 0;

                            return (
                              <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                <TableCell className="font-medium text-gray-900">{row.Type}</TableCell>
                                <TableCell className="text-center font-semibold text-purple-600">
                                  {moyenneLoyer.toFixed(0)} €
                                </TableCell>
                                {financingTypes.map(financing => {
                                  const nb = row.byFinancement[financing]?.Nb || 0;
                                  const loyer = row.byFinancement[financing]?.LoyerMensuel || 0;
                                  const moyenne = nb > 0 ? loyer / nb : 0;
                                  
                                  return (
                                    <TableCell key={financing} className="text-center">
                                      {moyenne > 0 ? `${moyenne.toFixed(0)} €` : '-'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-purple-100 font-semibold border-t-2 border-purple-200">
                            <TableCell className="text-gray-900">Loyer moyen par financement</TableCell>
                            <TableCell className="text-center text-purple-700">
                              {totals.total.Nb > 0 ? `${(totals.total.LoyerMensuel / totals.total.Nb).toFixed(0)} €` : '-'}
                            </TableCell>
                            {financingTypes.map(financing => {
                              const nb = totals.byFinancement[financing]?.Nb || 0;
                              const loyer = totals.byFinancement[financing]?.LoyerMensuel || 0;
                              const moyenne = nb > 0 ? loyer / nb : 0;
                              
                              return (
                                <TableCell key={financing} className="text-center text-purple-700">
                                  {moyenne > 0 ? `${moyenne.toFixed(0)} €` : '-'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* États de chargement et vide */}
        {loading && (
          <Card className="shadow-sm">
            <CardContent className="flex justify-center items-center h-32">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-gray-600">Chargement des données...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedSimulation && !loading && typologyData.length === 0 && (
          <Card className="shadow-sm border-dashed">
            <CardContent className="flex justify-center items-center h-32">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune donnée de typologie disponible pour cette simulation</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OperationDetail;