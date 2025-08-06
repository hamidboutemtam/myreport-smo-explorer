
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Filter, X, FileJson, FileSpreadsheet, RefreshCw, Building, Users, Wrench, Building2, Search, MapPin, Calendar, User, Hash } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
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
    resetToFirstPage();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setShowFilters(false);
    setSearchTerm('');
    resetToFirstPage();
  };

  // Update filter values
  const handleFilterChange = (key: keyof OperationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    resetToFirstPage();
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

  // Sort operations by most recent modification date
  const sortedOperations = [...operations].sort((a, b) => {
    const getLatestModifDate = (op: Operation) => {
      if (!op.simulations || op.simulations.length === 0) return new Date(0);
      const dates = op.simulations
        .map(sim => sim.datemodif ? new Date(sim.datemodif) : new Date(0))
        .sort((d1, d2) => d2.getTime() - d1.getTime());
      return dates[0];
    };
    
    const dateA = getLatestModifDate(a);
    const dateB = getLatestModifDate(b);
    return dateB.getTime() - dateA.getTime();
  });

  // Group operations by label
  const groupedOperations: { [key: string]: Operation[] } = sortedOperations.reduce(
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

  // Filter operations by search term
  const filteredGroupedOperations: { [key: string]: Operation[] } = Object.fromEntries(
    Object.entries(groupedOperations).filter(([label, operations]) => {
      if (!searchTerm) return true;
      return label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             operations.some(op => 
               op.adresseoperation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               op.commune?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               op.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
             );
    })
  );

  // Flatten operations for pagination
  const allFilteredOperations = Object.values(filteredGroupedOperations).flat();
  const totalOperations = allFilteredOperations.length;
  const totalPages = Math.ceil(totalOperations / itemsPerPage);

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOperations = allFilteredOperations.slice(startIndex, endIndex);

  // Group paginated operations back by label
  const paginatedGroupedOperations: { [key: string]: Operation[] } = paginatedOperations.reduce(
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

  // Reset to first page when search or filters change
  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  // Get unique communes and other filter values
  const communes = [...new Set(operations.flatMap(op => (op.simulations || []).map(sim => sim.commune)))];
  const natureConstructions = [...new Set(operations.map(op => op.natureconstruction).filter(Boolean))];
  const responsables = [...new Set(operations.map(op => op.responsable).filter(Boolean))];

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

  // Determine operation type based on label keywords
  const getOperationType = (libelle: string): { type: string; icon: any; color: string; borderColor: string } => {
    const libelleLower = libelle.toLowerCase();
    
    if (libelleLower.includes('résidence sociale') || libelleLower.includes('social') || libelleLower.includes('hlm')) {
      return { 
        type: 'Résidence sociale', 
        icon: Users, 
        color: 'text-orange-600 bg-orange-50',
        borderColor: 'border-l-4 border-l-orange-500'
      };
    }
    
    if (libelleLower.includes('réhabilitation') || libelleLower.includes('renovation') || libelleLower.includes('rénovation')) {
      return { 
        type: 'Réhabilitation', 
        icon: Wrench, 
        color: 'text-green-600 bg-green-50',
        borderColor: 'border-l-4 border-l-green-500'
      };
    }
    
    // Default to construction neuve (includes explicit matches and fallback)
    if (libelleLower.includes('construction') || libelleLower.includes('neuve') || libelleLower.includes('neuf')) {
      return { 
        type: 'Construction neuve', 
        icon: Building, 
        color: 'text-blue-600 bg-blue-50',
        borderColor: 'border-l-4 border-l-blue-500'
      };
    }
    
    // Fallback is now construction neuve
    return { 
      type: 'Construction neuve', 
      icon: Building2, 
      color: 'text-blue-600 bg-blue-50',
      borderColor: 'border-l-4 border-l-blue-500'
    };
  };

  // Get the most recent modification date for an operation
  const getMostRecentDate = (operation: Operation) => {
    if (!operation.simulations || operation.simulations.length === 0) return null;
    const dates = operation.simulations
      .map(sim => sim.datemodif ? new Date(sim.datemodif) : null)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime());
    return dates[0] || null;
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
          <div className="flex items-center space-x-3">
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
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une opération..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetToFirstPage();
                }}
                className="pl-10 w-64"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    resetToFirstPage();
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Display active filters */}
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Badge key={key} variant="outline" className="filter-badge">
                  {key === 'commune' ? 'Commune' : 
                   key === 'natureconstruction' ? 'Nature' : 
                   key === 'responsable' ? 'Responsable' : key}: {value}
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
              Page {currentPage} sur {totalPages} • {totalOperations} opération{totalOperations !== 1 ? 's' : ''} au total
              {totalOperations > itemsPerPage && (
                <span className="ml-2">
                  (affichage de {startIndex + 1}-{Math.min(endIndex, totalOperations)})
                </span>
              )}
              {searchTerm && (
                <span className="ml-2 text-blue-600">
                  (recherche: "{searchTerm}")
                </span>
              )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-commune">Commune</Label>
                  <Select
                    value={filters.commune || ''}
                    onValueChange={(value) => handleFilterChange('commune', value)}
                  >
                    <SelectTrigger id="filter-commune">
                      <SelectValue placeholder="Sélectionnez une commune" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover border border-border shadow-md">
                      {communes.map((commune) => (
                        <SelectItem key={commune} value={commune}>
                          {commune}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-nature">Nature de construction</Label>
                  <Select
                    value={filters.natureconstruction || ''}
                    onValueChange={(value) => handleFilterChange('natureconstruction', value)}
                  >
                    <SelectTrigger id="filter-nature">
                      <SelectValue placeholder="Sélectionnez une nature" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover border border-border shadow-md">
                      {['Construction neuve', 'Réhabilitation', 'Résidence sociale'].map((nature) => (
                        <SelectItem key={nature} value={nature}>
                          {nature}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-responsable">Responsable</Label>
                  <Input
                    id="filter-responsable"
                    value={filters.responsable || ''}
                    onChange={(e) => handleFilterChange('responsable', e.target.value)}
                    placeholder="Nom du responsable"
                    className="w-full"
                  />
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

          {/* Display operations progressively */}
          {Object.keys(paginatedGroupedOperations).length === 0 && !loading ? (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 
                    `Aucune opération ne correspond à la recherche "${searchTerm}"` : 
                    'Aucune opération ne correspond aux critères de recherche'
                  }
                </p>
                <div className="flex gap-2">
                  {searchTerm && (
                    <Button variant="outline" onClick={() => {
                      setSearchTerm('');
                      resetToFirstPage();
                    }}>
                      Effacer la recherche
                    </Button>
                  )}
                  <Button variant="outline" onClick={resetFilters}>
                    Réinitialiser les filtres
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {Object.entries(paginatedGroupedOperations).map(([label, operations]) => {
                const operationType = getOperationType(label);
                const firstOperation = operations[0];
                const totalSimulations = operations.reduce((total, op) => total + (op.simulations?.length || 0), 0);
                const mostRecentDate = getMostRecentDate(firstOperation);
                
                return (
                  <Card 
                    key={label} 
                    className={`data-card overflow-hidden ${operationType.borderColor} shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer`}
                    onClick={() => navigate(`/operation/${firstOperation.id}`)}
                  >
                    <CardHeader className="bg-gray-50 space-y-4">
                      {/* Titre et badge type */}
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{label}</CardTitle>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${operationType.color}`}>
                          <operationType.icon className="h-4 w-4" />
                          <span>{operationType.type}</span>
                        </div>
                      </div>
                      
                      {/* Informations détaillées */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {/* Adresse et localisation */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {firstOperation.adresseoperation || 'Adresse non renseignée'}
                            </div>
                            <div className="text-gray-600">
                              {firstOperation.commune || 'Commune non renseignée'}
                              {firstOperation.departement && ` (${firstOperation.departement})`}
                            </div>
                          </div>
                        </div>
                        
                        {/* Date de modification */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="text-gray-600">Dernière modification</div>
                            <div className="font-medium text-gray-900">
                              {mostRecentDate ? 
                                mostRecentDate.toLocaleDateString('fr-FR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                }) : 
                                'Non renseignée'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Responsable budgétaire */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="text-gray-600">Responsable</div>
                            <div className="font-medium text-gray-900">
                              {firstOperation.responsable || 'Non renseigné'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Nombre de simulations */}
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <div>
                            <div className="text-gray-600">Simulations</div>
                            <div className="font-medium text-gray-900">
                              {totalSimulations} simulation{totalSimulations !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = page === 1 || 
                                        page === totalPages || 
                                        Math.abs(page - currentPage) <= 1;
                        
                        if (!showPage && page === 2 && currentPage > 4) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        
                        if (!showPage && page === totalPages - 1 && currentPage < totalPages - 3) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        
                        if (!showPage) return null;
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
