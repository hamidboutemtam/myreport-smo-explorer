import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, RefreshCw, BarChart3, Home, Ruler, Calendar, MapPin, Euro, Users, Square, Clock, User, MessageCircle, CheckCircle, PieChart, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

interface PrixRevientData {
  Code_Projet: string;
  Code_Simulation: string;
  Code_Programme: string;
  ChargeFonciereFisc: number;
  CoutTravauxFisc: number;
  HonorairesFisc: number;
  ActuRevisFisc: number;
  FraisFinancierFisc: number;
  TotalFisc: number;
}

interface Simulation {
  Code_Simulation: string;
  LibelleSimulation: string;
  DateCreation: string;
  DateModif: string;
  DateValeur?: string;
  Etape?: string;
  Proprietaire?: string;
  Commentaire?: string;
}

const OperationDetail = () => {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const [typologyData, setTypologyData] = useState<TypologyData[]>([]);
  const [prixRevientData, setPrixRevientData] = useState<PrixRevientData[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [operationInfo, setOperationInfo] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('logements');
  const [prixRevientTab, setPrixRevientTab] = useState('graphique');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

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

  const fetchPrixRevientData = async (simulationCode: string) => {
    if (!operationId || !simulationCode) return;
    
    try {
      console.log('Fetching prix de revient for:', { operationId, simulationCode });
      const url = `http://localhost:8000/AccessionRV/api/reporting/axes/AXE_MON_SRPrixRevientPrg?$filter=Code_Projet eq '${operationId}' and Code_Simulation eq '${simulationCode}'`;
      console.log('Prix de revient API URL:', url);
      
      const response = await fetch(url, { headers: getAuthHeader() });
      
      if (!response.ok) throw new Error('Failed to fetch prix de revient data');
      
      const data = await response.json();
      console.log('Prix de revient data received:', data);
      setPrixRevientData(data.value || []);
    } catch (error) {
      console.error('Error fetching prix de revient data:', error);
      toast.error('Erreur lors du chargement du prix de revient');
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [operationId]);

  useEffect(() => {
    if (selectedSimulation) {
      fetchTypologyData(selectedSimulation);
      fetchPrixRevientData(selectedSimulation);
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

  const handleCardClick = (tabName: string) => {
    if (showDetails && activeTab === tabName) {
      // Si on clique sur l'étiquette active, on masque les détails
      setShowDetails(false);
    } else {
      // Sinon on affiche les détails avec le bon onglet
      setActiveTab(tabName);
      setShowDetails(true);
    }
  };

  const getSelectedSimulationDetails = () => {
    return simulations.find(sim => sim.Code_Simulation === selectedSimulation);
  };

  const getEtapeColor = (etape?: string) => {
    if (!etape) return 'bg-gray-100 text-gray-600';
    const etapeLower = etape.toLowerCase();
    if (etapeLower.includes('engagement définitif') || etapeLower.includes('definitif')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (etapeLower.includes('engagement conditionnel') || etapeLower.includes('conditionnel')) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (etapeLower.includes('dce') || etapeLower.includes('appel')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (etapeLower.includes('aps') || etapeLower.includes('apd')) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // Prix de revient calculations
  const calculatePrixRevientChart = () => {
    if (!prixRevientData || prixRevientData.length === 0) return [];
    
    // Grouper les montants par chapitre
    const chapitres = {
      'Charges foncières': 0,
      'Bâtiments': 0, 
      'Honoraires': 0,
      'Frais annexes': 0
    };

    prixRevientData.forEach(item => {
      chapitres['Charges foncières'] += item.ChargeFonciereFisc || 0;
      chapitres['Bâtiments'] += item.CoutTravauxFisc || 0;
      chapitres['Honoraires'] += item.HonorairesFisc || 0;
      chapitres['Frais annexes'] += (item.ActuRevisFisc || 0) + (item.FraisFinancierFisc || 0);
    });

    const total = Object.values(chapitres).reduce((a, b) => a + b, 0);

    return Object.entries(chapitres)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0'
      }));
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  const getPrixRevientTableData = () => {
    if (!prixRevientData || prixRevientData.length === 0) return [];
    
    const programmes = [...new Set(prixRevientData.map(item => getFinancingNature(item.Code_Programme)))];
    
    const chapitres = [
      { nom: 'Charges foncières', key: 'ChargeFonciereFisc' },
      { nom: 'Bâtiments', key: 'CoutTravauxFisc' },
      { nom: 'Honoraires', key: 'HonorairesFisc' },
      { nom: 'Frais annexes', key: 'ActuRevisFisc' }
    ];

    return chapitres.map(chapitre => {
      const row: any = { chapitre: chapitre.nom };
      programmes.forEach(programme => {
        const item = prixRevientData.find(d => getFinancingNature(d.Code_Programme) === programme);
        let montant = 0;
        if (item) {
          if (chapitre.key === 'ActuRevisFisc') {
            // Pour frais annexes, additionner ActuRevisFisc et FraisFinancierFisc
            montant = (item.ActuRevisFisc || 0) + (item.FraisFinancierFisc || 0);
          } else {
            montant = item[chapitre.key as keyof PrixRevientData] as number || 0;
          }
        }
        row[programme] = montant;
      });
      
      // Calculate total for the row
      row.total = programmes.reduce((sum, prog) => sum + (row[prog] || 0), 0);
      
      return row;
    }).filter(row => row.total > 0); // Ne garder que les lignes avec des montants
  };

  const totals = calculateTotals();
  const prixRevientChart = calculatePrixRevientChart();
  const prixRevientTable = getPrixRevientTableData();

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

        {/* Sélecteur de simulation avec détails */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Sélection de simulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedSimulation} onValueChange={setSelectedSimulation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une simulation" />
                  </SelectTrigger>
                  <SelectContent>
                    {simulations.map((simulation) => (
                      <SelectItem key={simulation.Code_Simulation} value={simulation.Code_Simulation}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium">{simulation.LibelleSimulation}</span>
                          <span className="text-xs text-gray-500">
                            Modifié le {new Date(simulation.DateModif).toLocaleDateString('fr-FR')}
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

            {/* Détails de la simulation sélectionnée */}
            {selectedSimulation && getSelectedSimulationDetails() && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 animate-fade-in">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {/* Date de valeur */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-600">Valeur:</span>
                    <span className="font-medium text-slate-800">
                      {getSelectedSimulationDetails()?.DateValeur ? 
                        new Date(getSelectedSimulationDetails()!.DateValeur!).toLocaleDateString('fr-FR') : 
                        'N/A'
                      }
                    </span>
                  </div>

                  <div className="h-4 w-px bg-slate-300"></div>

                  {/* Étape */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-slate-600">Étape:</span>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getEtapeColor(getSelectedSimulationDetails()?.Etape)}`}>
                      {getSelectedSimulationDetails()?.Etape || 'Non définie'}
                    </div>
                  </div>

                  <div className="h-4 w-px bg-slate-300"></div>

                  {/* Propriétaire */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">Par:</span>
                    <span className="font-medium text-slate-800">
                      {getSelectedSimulationDetails()?.Proprietaire || 'N/A'}
                    </span>
                  </div>

                  {getSelectedSimulationDetails()?.Commentaire && getSelectedSimulationDetails()?.Commentaire !== getSelectedSimulationDetails()?.LibelleSimulation && (
                    <>
                      <div className="h-4 w-px bg-slate-300"></div>
                      
                      {/* Commentaire */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-slate-600 flex-shrink-0">Note:</span>
                        <span className="text-slate-700 truncate">
                          {getSelectedSimulationDetails()?.Commentaire}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
                <div 
                  className="bg-blue-50 rounded-lg p-4 border border-blue-200 cursor-pointer hover:shadow-md hover:bg-blue-100 transition-all duration-200"
                  onClick={() => handleCardClick('logements')}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 rounded-full p-2">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Logements</p>
                      <p className="text-2xl font-bold text-blue-900">{totals.total.Nb}</p>
                      <p className="text-xs text-blue-500">Cliquez pour voir le détail</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-green-50 rounded-lg p-4 border border-green-200 cursor-pointer hover:shadow-md hover:bg-green-100 transition-all duration-200"
                  onClick={() => handleCardClick('surfaces')}
                >
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
                        SU: {totals.total.Su.toFixed(0)} m² • Cliquez pour voir le détail
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-purple-50 rounded-lg p-4 border border-purple-200 cursor-pointer hover:shadow-md hover:bg-purple-100 transition-all duration-200"
                  onClick={() => handleCardClick('loyers')}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 rounded-full p-2">
                      <Euro className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Loyers Totaux</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {totals.total.LoyerMensuel.toFixed(0)} €
                      </p>
                      <p className="text-xs text-purple-600">par mois • Cliquez pour voir le détail</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Onglets - Affichés seulement si showDetails est true */}
              {showDetails && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="overflow-x-auto">
                      <Table className="table-compact">
                        <TableHeader>
                          <TableRow className="bg-blue-100/50 h-8">
                            <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3">Type</TableHead>
                            {financingTypes.map(financing => (
                              <TableHead key={financing} className="font-semibold text-center text-gray-700 min-w-[100px] text-xs py-2 px-2">
                                {financing}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(groupedData).map((row: any, index) => (
                            <TableRow key={index} className={`h-8 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <TableCell className="font-medium text-gray-900 text-sm py-1 px-3">{row.Type}</TableCell>
                              {financingTypes.map(financing => (
                                <TableCell key={financing} className="text-center text-sm py-1 px-2">
                                  {row.byFinancement[financing]?.Nb || 0}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                          <TableRow className="bg-blue-100 font-semibold border-t-2 border-blue-200 h-8">
                            <TableCell className="text-gray-900 text-sm py-1 px-3">Total</TableCell>
                            {financingTypes.map(financing => (
                              <TableCell key={financing} className="text-center text-blue-700 text-sm py-1 px-2">
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
                <TabsContent value="surfaces" className="space-y-4 animate-fade-in">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="overflow-x-auto">
                      <Table className="table-compact">
                        <TableHeader>
                          <TableRow className="bg-green-100/50 h-8">
                            <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3 border-r border-green-200">Type de logement</TableHead>
                            {financingTypes.map(financing => (
                              <TableHead key={financing} className="border-l border-green-200">
                                <div className="text-center">
                                  <div className="font-semibold text-gray-700 text-xs py-1">{financing}</div>
                                  <div className="grid grid-cols-3 gap-1 mt-2">
                                    <div className="text-[10px] text-orange-700 font-medium bg-orange-100 px-1 py-0.5 rounded">SHAB</div>
                                    <div className="text-[10px] text-gray-600 font-medium bg-gray-100 px-1 py-0.5 rounded">Annexes</div>
                                    <div className="text-[10px] text-green-700 font-medium bg-green-100 px-1 py-0.5 rounded">SU</div>
                                  </div>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(groupedData).map((row: any, index) => (
                            <TableRow key={index} className={`h-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <TableCell className="font-medium text-gray-900 text-sm py-1 px-3 border-r border-green-200">{row.Type}</TableCell>
                              {financingTypes.map(financing => {
                                const shab = row.byFinancement[financing]?.Shab || 0;
                                const su = row.byFinancement[financing]?.Su || 0;
                                const annexes = su - shab;
                                
                                return (
                                  <TableCell key={financing} className="border-l border-green-200 py-1 px-2">
                                    <div className="grid grid-cols-3 gap-1 text-center">
                                      <div className="text-xs text-orange-700 font-medium">{shab.toFixed(1)}</div>
                                      <div className="text-xs text-gray-600">{annexes.toFixed(1)}</div>
                                      <div className="text-xs text-green-700 font-medium">{su.toFixed(1)}</div>
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                          <TableRow className="bg-green-100 font-semibold border-t-2 border-green-200 h-10">
                            <TableCell className="text-gray-900 text-sm py-1 px-3 border-r border-green-200">Total</TableCell>
                            {financingTypes.map(financing => {
                              const totalShab = totals.byFinancement[financing]?.Shab || 0;
                              const totalSu = totals.byFinancement[financing]?.Su || 0;
                              const totalAnnexes = totalSu - totalShab;
                              
                              return (
                                <TableCell key={financing} className="border-l border-green-200 py-1 px-2">
                                  <div className="grid grid-cols-3 gap-1 text-center">
                                    <div className="text-xs text-orange-700 font-semibold">{totalShab.toFixed(1)}</div>
                                    <div className="text-xs text-gray-700 font-semibold">{totalAnnexes.toFixed(1)}</div>
                                    <div className="text-xs text-green-700 font-semibold">{totalSu.toFixed(1)}</div>
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Loyers */}
                <TabsContent value="loyers" className="space-y-4 animate-fade-in">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="overflow-x-auto">
                      <Table className="table-compact">
                        <TableHeader>
                          <TableRow className="bg-purple-100/50 h-8">
                            <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3">Type</TableHead>
                            {financingTypes.map(financing => (
                              <TableHead key={financing} className="font-semibold text-center text-gray-700 min-w-[100px] text-xs py-2 px-2">
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
                              <TableRow key={index} className={`h-8 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <TableCell className="font-medium text-gray-900 text-sm py-1 px-3">{row.Type}</TableCell>
                                {financingTypes.map(financing => {
                                  const nb = row.byFinancement[financing]?.Nb || 0;
                                  const loyer = row.byFinancement[financing]?.LoyerMensuel || 0;
                                  const moyenne = nb > 0 ? loyer / nb : 0;
                                  
                                  return (
                                    <TableCell key={financing} className="text-center text-sm py-1 px-2">
                                      {moyenne > 0 ? `${moyenne.toFixed(0)} €` : '-'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-purple-100 font-semibold border-t-2 border-purple-200 h-8">
                            <TableCell className="text-gray-900 text-sm py-1 px-3">Loyer moyen par financement</TableCell>
                            {financingTypes.map(financing => {
                              const nb = totals.byFinancement[financing]?.Nb || 0;
                              const loyer = totals.byFinancement[financing]?.LoyerMensuel || 0;
                              const moyenne = nb > 0 ? loyer / nb : 0;
                              
                              return (
                                <TableCell key={financing} className="text-center text-purple-700 text-sm py-1 px-2">
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
              )}
            </CardContent>
          </Card>
        )}

        {/* Budget de l'opération - Prix de revient */}
        {selectedSimulation && !loading && prixRevientData.length > 0 && (
          <Card className="border-0 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <Calculator className="w-4 h-4" />
                Budget de l'opération
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={prixRevientTab} onValueChange={setPrixRevientTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="graphique" className="text-xs">
                    <PieChart className="w-3 h-3 mr-1" />
                    Vue synthèse
                  </TabsTrigger>
                  <TabsTrigger value="detail" className="text-xs">
                    <Calculator className="w-3 h-3 mr-1" />
                    Détail
                  </TabsTrigger>
                  <TabsTrigger value="ratios" className="text-xs">
                    <Euro className="w-3 h-3 mr-1" />
                    Ratios
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Graphique */}
                <TabsContent value="graphique" className="space-y-3 mt-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Graphique compact */}
                    <div className="flex-1">
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={prixRevientChart}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={70}
                              dataKey="value"
                              onClick={(data) => {
                                setSelectedChapter(data.name);
                                setPrixRevientTab('detail');
                              }}
                              className="cursor-pointer"
                            >
                              {prixRevientChart.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${value.toLocaleString()} €`]}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Résumé compact */}
                    <div className="lg:w-72">
                      <div className="space-y-1">
                        {prixRevientChart.map((item, index) => (
                          <div 
                            key={item.name} 
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedChapter(item.name);
                              setPrixRevientTab('detail');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                              />
                              <span className="text-foreground">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{item.value.toLocaleString()} €</div>
                              <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    Cliquez sur un segment pour voir le détail
                  </div>
                </TabsContent>

                {/* Onglet Détail */}
                <TabsContent value="detail" className="space-y-3 mt-4">
                  {selectedChapter && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <span>
                        Focus: <span className="font-medium">{selectedChapter}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedChapter(null)}
                        className="h-6 text-xs"
                      >
                        Tout voir
                      </Button>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-8">
                          <TableHead className="text-xs py-1 px-2">Chapitre</TableHead>
                          {[...new Set(prixRevientData.map(item => getFinancingNature(item.Code_Programme)))].map(financing => (
                            <TableHead key={financing} className="text-center text-xs py-1 px-2 min-w-[100px]">
                              {financing}
                            </TableHead>
                          ))}
                          <TableHead className="text-center text-xs py-1 px-2 min-w-[80px]">
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prixRevientTable
                          .filter(row => !selectedChapter || row.chapitre === selectedChapter)
                          .map((row, index) => (
                          <TableRow key={index} className="h-7">
                            <TableCell className="text-xs py-1 px-2 font-medium">
                              {row.chapitre}
                            </TableCell>
                            {[...new Set(prixRevientData.map(item => getFinancingNature(item.Code_Programme)))].map(financing => (
                              <TableCell key={financing} className="text-center text-xs py-1 px-2">
                                {row[financing] ? `${row[financing].toLocaleString()} €` : '-'}
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-medium text-xs py-1 px-2">
                              {row.total.toLocaleString()} €
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Ligne total */}
                        <TableRow className="bg-muted/50 border-t h-7">
                          <TableCell className="text-xs py-1 px-2 font-semibold">Total</TableCell>
                          {[...new Set(prixRevientData.map(item => getFinancingNature(item.Code_Programme)))].map(financing => {
                            const total = prixRevientTable
                              .filter(row => !selectedChapter || row.chapitre === selectedChapter)
                              .reduce((sum, row) => sum + (row[financing] || 0), 0);
                            return (
                              <TableCell key={financing} className="text-center text-xs py-1 px-2 font-medium">
                                {total.toLocaleString()} €
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-semibold text-xs py-1 px-2">
                            {prixRevientTable
                              .filter(row => !selectedChapter || row.chapitre === selectedChapter)
                              .reduce((sum, row) => sum + row.total, 0)
                              .toLocaleString()} €
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Onglet Ratios */}
                <TabsContent value="ratios" className="space-y-3 mt-4">
                  <div className="space-y-4">
                    {/* Totaux de référence */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Total logements</div>
                        <div className="text-lg font-semibold">{totals.total.Nb}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Total SHAB</div>
                        <div className="text-lg font-semibold">{totals.total.Shab.toFixed(0)} m²</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Budget total</div>
                        <div className="text-lg font-semibold">
                          {prixRevientTable.reduce((sum, row) => sum + row.total, 0).toLocaleString()} €
                        </div>
                      </div>
                    </div>

                    {/* Tableau des ratios */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-8">
                            <TableHead className="text-xs py-1 px-2">Chapitre</TableHead>
                            <TableHead className="text-center text-xs py-1 px-2 min-w-[100px]">
                              Montant total
                            </TableHead>
                            <TableHead className="text-center text-xs py-1 px-2 min-w-[100px]">
                              Coût / logement
                            </TableHead>
                            <TableHead className="text-center text-xs py-1 px-2 min-w-[100px]">
                              Coût / m² SHAB
                            </TableHead>
                            <TableHead className="text-center text-xs py-1 px-2 min-w-[80px]">
                              % du total
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {prixRevientTable.map((row, index) => {
                            const totalBudget = prixRevientTable.reduce((sum, r) => sum + r.total, 0);
                            const coutParLogement = totals.total.Nb > 0 ? row.total / totals.total.Nb : 0;
                            const coutParShab = totals.total.Shab > 0 ? row.total / totals.total.Shab : 0;
                            const pourcentageTotal = totalBudget > 0 ? (row.total / totalBudget) * 100 : 0;
                            
                            return (
                              <TableRow key={index} className="h-7">
                                <TableCell className="text-xs py-1 px-2 font-medium">
                                  {row.chapitre}
                                </TableCell>
                                <TableCell className="text-center text-xs py-1 px-2 font-medium">
                                  {row.total.toLocaleString()} €
                                </TableCell>
                                <TableCell className="text-center text-xs py-1 px-2">
                                  {coutParLogement.toLocaleString('fr-FR', { 
                                    maximumFractionDigits: 0 
                                  })} €
                                </TableCell>
                                <TableCell className="text-center text-xs py-1 px-2">
                                  {coutParShab.toLocaleString('fr-FR', { 
                                    maximumFractionDigits: 0 
                                  })} €/m²
                                </TableCell>
                                <TableCell className="text-center text-xs py-1 px-2">
                                  {pourcentageTotal.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Ligne total */}
                          <TableRow className="bg-muted/50 border-t h-7">
                            <TableCell className="text-xs py-1 px-2 font-semibold">Total</TableCell>
                            <TableCell className="text-center font-semibold text-xs py-1 px-2">
                              {prixRevientTable.reduce((sum, row) => sum + row.total, 0).toLocaleString()} €
                            </TableCell>
                            <TableCell className="text-center font-semibold text-xs py-1 px-2">
                              {totals.total.Nb > 0 ? 
                                (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Nb).toLocaleString('fr-FR', { 
                                  maximumFractionDigits: 0 
                                }) : '0'} €
                            </TableCell>
                            <TableCell className="text-center font-semibold text-xs py-1 px-2">
                              {totals.total.Shab > 0 ? 
                                (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Shab).toLocaleString('fr-FR', { 
                                  maximumFractionDigits: 0 
                                }) : '0'} €/m²
                            </TableCell>
                            <TableCell className="text-center font-semibold text-xs py-1 px-2">
                              100%
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Indicateurs clés */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Prix de revient par logement</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {totals.total.Nb > 0 ? 
                            (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Nb).toLocaleString('fr-FR', { 
                              maximumFractionDigits: 0 
                            }) : '0'} €
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          pour {totals.total.Nb} logement{totals.total.Nb > 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Square className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Prix de revient par m² SHAB</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {totals.total.Shab > 0 ? 
                            (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Shab).toLocaleString('fr-FR', { 
                              maximumFractionDigits: 0 
                            }) : '0'} €/m²
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          pour {totals.total.Shab.toFixed(0)} m² SHAB
                        </div>
                      </div>
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