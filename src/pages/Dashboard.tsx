
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Filter, X, FileJson, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { getOperations, getOperationsProgressive, exportOperation, downloadFile } from '@/services/api';
import { Operation, OperationFilters } from '@/types';
import Layout from '@/components/Layout';

const Dashboard = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Chargement des données...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [filters, setFilters] = useState<OperationFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedSimulations, setSelectedSimulations] = useState<{ [operationId: string]: string }>({});
  
  const navigate = useNavigate();

  // Available years for the filter
  const years = [2021, 2022, 2023, 2024, 2025];

  // Fetch operations on initial load
  useEffect(() => {
    fetchOperationsProgressive();
  }, []);

  // Fetch operations progressively
  const fetchOperationsProgressive = async () => {
    setLoading(true);
    setLoadingProgress(0);
    setOperations([]); // Clear existing data
    setLoadingMessage('Début du chargement...');
    
    try {
      await getOperationsProgressive(
        filters,
        (progressOperations, isComplete, loadedCount) => {
          setOperations([...progressOperations]); // Spread to force re-render
          setLoadingProgress(loadedCount);
          
          if (isComplete) {
            setLoadingMessage(`Chargement terminé - ${progressOperations.length} opérations trouvées`);
            setLoading(false);
          } else {
            setLoadingMessage(`Chargement en cours... ${loadedCount} éléments traités`);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error('Erreur lors du chargement des opérations');
      setLoadingMessage('Erreur de chargement');
      setLoading(false);
    }
  };

  // Fetch operations with cache (for filters)
  const fetchOperations = async (useCache: boolean = true) => {
    if (!useCache) {
      // Force progressive reload
      fetchOperationsProgressive();
      return;
    }
    
    setLoading(true);
    setLoadingMessage('Application des filtres...');
    
    try {
      const data = await getOperations(filters, !useCache);
      setOperations(data);
      setLoadingMessage('Filtres appliqués');
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error('Erreur lors du chargement des opérations');
      setLoadingMessage('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    fetchOperations();
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  // Update filter values
  const handleFilterChange = (key: keyof OperationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Export operation data
  const handleExport = async (operationId: string, format: 'json' | 'excel') => {
    setExportLoading(true);
    try {
      const blob = await exportOperation({
        format,
        operationId,
        includeAll: true,
      });
      
      if (blob instanceof Blob) {
        const operation = operations.find(op => op.id === operationId);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${operation?.libelleoperation.replace(/\s/g, '_')}_${timestamp}.${format === 'json' ? 'json' : 'xlsx'}`;
        
        downloadFile(blob, filename);
        toast.success(`Export ${format.toUpperCase()} réussi`);
      }
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      toast.error(`Échec de l'export ${format.toUpperCase()}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Group operations by label
  const groupedOperations: { [key: string]: Operation[] } = operations.reduce(
    (groups, operation) => {
      const label = operation.libelleoperation;
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(operation);
      return groups;
    },
    {} as { [key: string]: Operation[] }
  );

  // Get unique communes for filter
  const communes = [...new Set(operations.flatMap(op => (op.simulations || []).map(sim => sim.commune)))];

  // Handle simulation selection
  const handleSimulationChange = (operationId: string, simulationId: string) => {
    setSelectedSimulations(prev => ({ ...prev, [operationId]: simulationId }));
  };

  // Get selected simulation for an operation
  const getSelectedSimulation = (operation: Operation) => {
    const selectedId = selectedSimulations[operation.id];
    const simulations = operation.simulations || [];
    if (selectedId) {
      return simulations.find(sim => sim.id === selectedId);
    }
    return simulations[0]; // Default to first simulation
  };

  return (
    <Layout>
      <div className="layout-container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Explorateur d'opérations</h1>
          <p className="text-gray-600">
            Visualisez, filtrez et exportez les données des opérations immobilières
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </Button>
            
            {Object.keys(filters).length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                <span>Réinitialiser</span>
              </Button>
            )}
            
            {/* Display active filters */}
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Badge key={key} variant="outline" className="filter-badge">
                  {key === 'libelleoperation' ? 'Libellé' : 
                   key === 'commune' ? 'Commune' : 
                   key === 'annee' ? 'Année' : 
                   key === 'departement' ? 'Département' : 
                   key === 'status' ? 'Statut' : key}: {value}
                </Badge>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchOperations(false)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            
            <div className="text-sm text-gray-500">
              {operations.length} opération{operations.length !== 1 ? 's' : ''} trouvée{operations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Affinez votre recherche d'opérations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-libelle">Libellé opération</Label>
                  <Input
                    id="filter-libelle"
                    value={filters.libelleoperation || ''}
                    onChange={(e) => handleFilterChange('libelleoperation', e.target.value)}
                    placeholder="Rechercher par libellé"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-commune">Commune</Label>
                  <Select
                    value={filters.commune || ''}
                    onValueChange={(value) => handleFilterChange('commune', value)}
                  >
                    <SelectTrigger id="filter-commune">
                      <SelectValue placeholder="Sélectionnez une commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {communes.map((commune) => (
                        <SelectItem key={commune} value={commune}>
                          {commune}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-annee">Année</Label>
                  <Select
                    value={filters.annee?.toString() || ''}
                    onValueChange={(value) => handleFilterChange('annee', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger id="filter-annee">
                      <SelectValue placeholder="Sélectionnez une année" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowFilters(false)}>
                  Annuler
                </Button>
                <Button onClick={applyFilters}>
                  Appliquer les filtres
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Operations data */}
        <div className="space-y-8">
          {/* Loading progress indicator */}
          {loading && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-blue-700 text-center font-medium">{loadingMessage}</p>
                {loadingProgress > 0 && (
                  <p className="text-blue-600 text-sm mt-2">
                    {loadingProgress} éléments traités
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Display operations progressively */}
          {operations.length === 0 && !loading ? (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 mb-4">Aucune opération ne correspond aux critères de recherche</p>
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {Object.entries(groupedOperations).map(([label, operations]) => (
                <Card key={label} className="data-card overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <CardDescription>
                      {operations.length} opération{operations.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Simulation</TableHead>
                            <TableHead>Adresse</TableHead>
                            <TableHead>Commune</TableHead>
                            <TableHead>Département</TableHead>
                            <TableHead>Date Valeur</TableHead>
                            <TableHead>Date Modif</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {operations.map((operation) => {
                            const selectedSimulation = getSelectedSimulation(operation);
                            return (
                              <TableRow 
                                key={operation.id}
                                className="animate-in fade-in-0 duration-300"
                              >
                                <TableCell>
                                  <Select
                                    value={selectedSimulations[operation.id] || (operation.simulations || [])[0]?.id || ''}
                                    onValueChange={(value) => handleSimulationChange(operation.id, value)}
                                  >
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder="Sélectionner une simulation" />
                                    </SelectTrigger>
                                    <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                      {(operation.simulations || []).map((simulation) => (
                                        <SelectItem key={simulation.id} value={simulation.id}>
                                          {simulation.name}
                                        </SelectItem>
                                      ))}
                                     </SelectContent>
                                   </Select>
                                 </TableCell>
                                 <TableCell className="max-w-xs truncate" title={operation.adresseoperation}>
                                   {operation.adresseoperation || '-'}
                                 </TableCell>
                                 <TableCell>{operation.commune || '-'}</TableCell>
                                 <TableCell>{operation.departement || '-'}</TableCell>
                                 <TableCell>
                                   {selectedSimulation?.datevaleur ? 
                                     new Date(selectedSimulation.datevaleur).toLocaleDateString('fr-FR') : '-'}
                                 </TableCell>
                                 <TableCell>
                                   {selectedSimulation?.datemodif ? 
                                     new Date(selectedSimulation.datemodif).toLocaleDateString('fr-FR') : '-'}
                                 </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleExport(operation.id, 'json')}
                                      disabled={exportLoading}
                                      className="h-8 px-2"
                                    >
                                      <FileJson className="h-4 w-4 mr-1" />
                                      <span>JSON</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleExport(operation.id, 'excel')}
                                      disabled={exportLoading}
                                      className="h-8 px-2"
                                    >
                                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                                      <span>Excel</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
