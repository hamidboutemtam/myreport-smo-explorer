
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
import { Filter, X, FileJson, FileSpreadsheet } from 'lucide-react';
import { getOperations, exportOperation, downloadFile } from '@/services/api';
import { Operation, OperationFilters } from '@/types';
import Layout from '@/components/Layout';

const Dashboard = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OperationFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedSimulations, setSelectedSimulations] = useState<{ [operationId: string]: string }>({});
  
  const navigate = useNavigate();

  // Available years for the filter
  const years = [2021, 2022, 2023, 2024, 2025];

  // Fetch operations on initial load
  useEffect(() => {
    fetchOperations();
  }, []);

  // Fetch operations with optional filters
  const fetchOperations = async () => {
    setLoading(true);
    try {
      const data = await getOperations(filters);
      setOperations(data);
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error('Erreur lors du chargement des opérations');
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
  const communes = [...new Set(operations.flatMap(op => op.simulations.map(sim => sim.commune)))];

  // Handle simulation selection
  const handleSimulationChange = (operationId: string, simulationId: string) => {
    setSelectedSimulations(prev => ({ ...prev, [operationId]: simulationId }));
  };

  // Get selected simulation for an operation
  const getSelectedSimulation = (operation: Operation) => {
    const selectedId = selectedSimulations[operation.id];
    if (selectedId) {
      return operation.simulations.find(sim => sim.id === selectedId);
    }
    return operation.simulations[0]; // Default to first simulation
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
          
          <div className="text-sm text-gray-500">
            {operations.length} opération{operations.length !== 1 ? 's' : ''} trouvée{operations.length !== 1 ? 's' : ''}
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
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-smo-primary"></div>
          </div>
        ) : (
          <>
            {operations.length === 0 ? (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 mb-4">Aucune opération ne correspond aux critères de recherche</p>
                  <Button variant="outline" onClick={resetFilters}>
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            ) : (
                <div className="space-y-8">
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
                              <TableHead>Commune</TableHead>
                              <TableHead>Année</TableHead>
                              <TableHead>Département</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {operations.map((operation) => {
                              const selectedSimulation = getSelectedSimulation(operation);
                              return (
                                <TableRow key={operation.id}>
                                  <TableCell>
                                    <Select
                                      value={selectedSimulations[operation.id] || operation.simulations[0]?.id || ''}
                                      onValueChange={(value) => handleSimulationChange(operation.id, value)}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Sélectionner une simulation" />
                                      </SelectTrigger>
                                      <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                        {operation.simulations.map((simulation) => (
                                          <SelectItem key={simulation.id} value={simulation.id}>
                                            {simulation.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>{selectedSimulation?.commune || '-'}</TableCell>
                                  <TableCell>{selectedSimulation?.annee || '-'}</TableCell>
                                  <TableCell>{selectedSimulation?.departement || '-'}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        selectedSimulation?.status === 'En cours' 
                                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                          : selectedSimulation?.status === 'Terminé' 
                                          ? 'bg-green-50 text-green-700 border-green-200'
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }
                                    >
                                      {selectedSimulation?.status || 'N/A'}
                                    </Badge>
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
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
