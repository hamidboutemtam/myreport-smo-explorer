
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
import { Filter, X, FileJson, FileSpreadsheet, RefreshCw, Building, Users, Wrench, Building2, Search, MapPin, Calendar, User, Hash, BarChart3 } from 'lucide-react';
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
          // ✅ AFFICHER IMMÉDIATEMENT les opérations au fur et à mesure
          setOperations([...progressOperations]); // Spread to force re-render
          setLoadingProgress(loadedCount);
          
          // Mettre à jour le message sans attendre la completion
          setLoadingMessage(`${loadedCount} éléments chargés...`);
          
          // Stopper le loading seulement quand c'est vraiment terminé
          if (isComplete) {
            setLoadingMessage(`Chargement terminé - ${progressOperations.length} opérations trouvées`);
            setLoading(false);
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
        <div className="space-y-6">
          {/* Loading state - mais afficher les données même pendant le chargement */}
          {loading && operations.length === 0 && (
            <Card className="p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 mb-4">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chargement des données
                </h3>
                <p className="text-gray-600 mb-4">{loadingMessage}</p>
                {loadingProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (loadingProgress / 1000) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Afficher les opérations même pendant le chargement */}
          {operations.length > 0 && (
            <>
              {/* Message de chargement en cours si applicable */}
              {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">{loadingMessage}</span>
                  </div>
                </div>
              )}

              {/* Liste des opérations */}
              {Object.keys(paginatedGroupedOperations).length === 0 ? (
                <Card className="border-0 bg-card/50 backdrop-blur-sm">
                  <CardContent className="py-16">
                    <div className="text-center space-y-4">
                      <Building className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                      <div>
                        <p className="text-muted-foreground text-lg">
                          {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucune opération'}
                        </p>
                        <p className="text-muted-foreground/60 text-sm mt-1">
                          {searchTerm ? 'Essayez avec d\'autres termes' : 'Les opérations apparaîtront ici'}
                        </p>
                      </div>
                      {searchTerm && (
                        <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); resetToFirstPage(); }}>
                          Effacer la recherche
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {Object.entries(paginatedGroupedOperations).map(([label, operations]) => {
                    const operationType = getOperationType(label);
                    const firstOperation = operations[0];
                    const totalSimulations = operations.reduce((total, op) => total + (op.simulations?.length || 0), 0);
                    const mostRecentDate = getMostRecentDate(firstOperation);
                    
                    return (
                      <Card 
                        key={label} 
                        className="border-0 bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 cursor-pointer group"
                        onClick={() => navigate(`/operation/${firstOperation.id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            {/* Left: Main content */}
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${operationType.color} group-hover:scale-105 transition-transform`}>
                                <operationType.icon className="h-5 w-5" />
                              </div>
                              
                              <div className="space-y-1">
                                <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                                  {label}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    <operationType.icon className="h-3.5 w-3.5" />
                                    <span>{operationType.type}</span>
                                  </span>
                                  {firstOperation.commune && (
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="h-3.5 w-3.5" />
                                      <span>{firstOperation.commune}</span>
                                    </span>
                                  )}
                                  {firstOperation.responsable && (
                                    <span className="flex items-center space-x-1">
                                      <User className="h-3.5 w-3.5" />
                                      <span>{firstOperation.responsable}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Meta info */}
                            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Hash className="h-3.5 w-3.5" />
                                <span>{totalSimulations} simulation{totalSimulations !== 1 ? 's' : ''}</span>
                              </div>
                              
                              {mostRecentDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{mostRecentDate.toLocaleDateString('fr-FR')}</span>
                                </div>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/operation/${firstOperation.id}`);
                                }}
                              >
                                <BarChart3 className="h-4 w-4 mr-1" />
                                Analyser
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center pt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                            
                            if (!showPage && page === 2 && currentPage > 4) {
                              return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                            }
                            if (!showPage && page === totalPages - 1 && currentPage < totalPages - 3) {
                              return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
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
                </div>
              )}
            </>
          )}

          {/* Message si aucune opération trouvée */}
          {!loading && operations.length === 0 && (
            <Card className="p-8">
              <div className="text-center">
                <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune opération trouvée</h3>
                <p className="text-gray-600">
                  {Object.keys(filters).length > 0 || searchTerm
                    ? 'Essayez de modifier vos critères de recherche.'
                    : 'Aucune donnée disponible pour le moment.'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
