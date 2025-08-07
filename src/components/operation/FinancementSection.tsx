import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Euro } from 'lucide-react';
import { TypologyTotals } from '@/types/operation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FinancementData {
  Code_Projet: string;
  Code_Simulation: string;
  Code_Programme: string;
  Code: string;
  Libelle: string;
  Hierarchie: number;
  Valeur_HT: number;
  TypeSubvention: string;
  TypeEmprunt: string;
}

interface FinancementTableRow {
  chapter: string;
  fondsPropres: number;
  subventions: number;
  prets: number;
  total: number;
}

interface FinancementSectionProps {
  financementData: FinancementData[];
  totals: TypologyTotals;
  loading: boolean;
}

export const FinancementSection: React.FC<FinancementSectionProps> = ({
  financementData,
  totals,
  loading
}) => {
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Calculator className="w-4 h-4" />
            Plan de financement de l'opération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Chargement des données de financement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financementData || financementData.length === 0) {
    return (
      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Calculator className="w-4 h-4" />
            Plan de financement de l'opération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune donnée de financement disponible pour cette simulation.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Regrouper les données par programme et par type de financement
  // Ne prendre que les éléments de hiérarchie 1 (totaux consolidés)
  const topLevelItems = financementData.filter(item => item.Hierarchie === 1);
  
  const groupedData = topLevelItems.reduce((acc, item) => {
    const programme = item.Code_Programme;
    if (!acc[programme]) {
      acc[programme] = {
        fondsPropres: 0,
        subventions: 0,
        prets: 0,
        total: 0
      };
    }
    
    // Classification selon les codes spécifiques de l'API
    if (item.Code === 'BF_C_FP') {
      // Fonds propres spécifiquement identifiés par le code BF_C_FP
      acc[programme].fondsPropres += item.Valeur_HT;
    } else if (item.Code.includes('SUBV') || item.Libelle.toLowerCase().includes('subvention')) {
      acc[programme].subventions += item.Valeur_HT;
    } else if (item.Code.includes('PRET') || item.Libelle.toLowerCase().includes('prêt')) {
      acc[programme].prets += item.Valeur_HT;
    }
    
    return acc;
  }, {} as Record<string, { fondsPropres: number; subventions: number; prets: number; total: number }>);

  // Calculer le total pour chaque programme comme la somme des trois types de financement
  Object.keys(groupedData).forEach(programme => {
    groupedData[programme].total = groupedData[programme].fondsPropres + 
                                   groupedData[programme].subventions + 
                                   groupedData[programme].prets;
  });

  // Convertir en tableau pour l'affichage
  const financementTable: FinancementTableRow[] = Object.entries(groupedData).map(([programme, data]) => ({
    chapter: programme,
    fondsPropres: data.fondsPropres,
    subventions: data.subventions,
    prets: data.prets,
    total: data.total
  }));

  const handleRatioClick = (ratioType: string) => {
    setSelectedRatio(selectedRatio === ratioType ? null : ratioType);
  };

  // Calculer les données détaillées par nature de financement selon le ratio sélectionné
  const getDetailedData = () => {
    if (!selectedRatio) return [];
    
    const detailedData = financementTable.map(row => {
      let value: number;
      let unit: string;
      
      switch (selectedRatio) {
        case 'total':
          value = row.total;
          unit = '€';
          break;
        case 'logement':
          value = totals.total.Nb > 0 ? row.total / totals.total.Nb : 0;
          unit = '€/logement';
          break;
        case 'shab':
          value = totals.total.Shab > 0 ? row.total / totals.total.Shab : 0;
          unit = '€/m²';
          break;
        case 'surface':
          // Pour la surface, on affiche les surfaces par programme si disponible
          value = totals.total.Nb > 0 ? totals.total.Shab / totals.total.Nb : 0;
          unit = 'm²/logement';
          break;
        default:
          value = row.total;
          unit = '€';
      }
      
      return {
        programme: row.chapter,
        value: value,
        unit: unit,
        details: {
          fondsPropres: selectedRatio === 'total' ? row.fondsPropres : 
                       selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.fondsPropres / totals.total.Nb : 0) :
                       selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.fondsPropres / totals.total.Shab : 0) : 0,
          subventions: selectedRatio === 'total' ? row.subventions : 
                      selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.subventions / totals.total.Nb : 0) :
                      selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.subventions / totals.total.Shab : 0) : 0,
          prets: selectedRatio === 'total' ? row.prets : 
                selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.prets / totals.total.Nb : 0) :
                selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.prets / totals.total.Shab : 0) : 0
        }
      };
    });
    
    return detailedData;
  };

  const detailedData = getDetailedData();

  const getRatioTitle = () => {
    switch (selectedRatio) {
      case 'total': return 'Plan de financement total par nature de financement';
      case 'logement': return 'Plan de financement par logement et par nature de financement';
      case 'shab': return 'Plan de financement par m² SHAB et par nature de financement';
      case 'surface': return 'Surface moyenne par logement et par nature de financement';
      default: return '';
    }
  };

  return (
    <Card className="border-0 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <Calculator className="w-4 h-4" />
          Plan de financement de l'opération
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Étiquettes de ratios du plan de financement */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Plan de financement total */}
            <div 
              className={`bg-blue-50 rounded-lg p-4 border border-blue-200 cursor-pointer transition-all hover:shadow-md ${
                selectedRatio === 'total' ? 'ring-2 ring-blue-500 bg-blue-100' : ''
              }`}
              onClick={() => handleRatioClick('total')}
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <Euro className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Plan de financement total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {financementTable.reduce((sum, row) => sum + row.total, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Par chapitre - Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>

            {/* Fonds propres par m² SHAB */}
            <div 
              className={`bg-green-50 rounded-lg p-4 border border-green-200 cursor-pointer transition-all hover:shadow-md ${
                selectedRatio === 'logement' ? 'ring-2 ring-green-500 bg-green-100' : ''
              }`}
              onClick={() => handleRatioClick('logement')}
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Fonds propres par m² SHAB</p>
                  <p className="text-2xl font-bold text-green-900">
                    {totals.total.Shab > 0 ? 
                      (financementTable.reduce((sum, row) => sum + row.fondsPropres, 0) / totals.total.Shab).toLocaleString('fr-FR', { 
                        maximumFractionDigits: 0 
                      }) : '0'} €/m²
                  </p>
                  <p className="text-xs text-green-600 mt-1">Par chapitre - Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>

            {/* Plan de financement par m² SHAB */}
            <div 
              className={`bg-orange-50 rounded-lg p-4 border border-orange-200 cursor-pointer transition-all hover:shadow-md ${
                selectedRatio === 'shab' ? 'ring-2 ring-orange-500 bg-orange-100' : ''
              }`}
              onClick={() => handleRatioClick('shab')}
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 rounded-full p-2">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Plan de financement par m² SHAB</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {totals.total.Shab > 0 ? 
                      (financementTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Shab).toLocaleString('fr-FR', { 
                        maximumFractionDigits: 0 
                      }) : '0'} €/m²
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Par chapitre - Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>

            {/* Surface moyenne par logement */}
            <div 
              className={`bg-purple-50 rounded-lg p-4 border border-purple-200 cursor-pointer transition-all hover:shadow-md ${
                selectedRatio === 'surface' ? 'ring-2 ring-purple-500 bg-purple-100' : ''
              }`}
              onClick={() => handleRatioClick('surface')}
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 rounded-full p-2">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Surface moyenne par logement</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {totals.total.Nb > 0 ? 
                      (totals.total.Shab / totals.total.Nb).toFixed(1) : '0.0'} m²
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Par chapitre - Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau détaillé par nature de financement avec camembert */}
        {selectedRatio && detailedData.length > 0 && (
          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                {getRatioTitle()}
              </h3>
              <button 
                onClick={() => setSelectedRatio(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                Fermer
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tableau transposé (compact) */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Type de financement</TableHead>
                      {detailedData.map((row, index) => (
                        <TableHead key={index} className="text-center font-semibold">
                          <Badge variant="outline" className="text-xs">
                            {row.programme}
                          </Badge>
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold bg-primary/20">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-blue-600">Fonds propres</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.fondsPropres.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold bg-primary/10">
                        {detailedData.reduce((sum, row) => sum + row.details.fondsPropres, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-green-600">Subventions</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.subventions.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold bg-primary/10">
                        {detailedData.reduce((sum, row) => sum + row.details.subventions, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-purple-600">Prêts</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.prets.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold bg-primary/10">
                        {detailedData.reduce((sum, row) => sum + row.details.prets, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors bg-primary/10">
                      <TableCell className="font-bold">Total</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center font-bold">
                          {row.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {row.unit}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold bg-primary/20">
                        {detailedData.reduce((sum, row) => sum + row.value, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {detailedData[0]?.unit || '€'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Camembert */}
              <div className="flex flex-col">
                <h4 className="text-md font-semibold mb-4 text-center">Répartition du financement total</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const totalFondsPropres = detailedData.reduce((sum, row) => sum + row.details.fondsPropres, 0);
                          const totalSubventions = detailedData.reduce((sum, row) => sum + row.details.subventions, 0);
                          const totalPrets = detailedData.reduce((sum, row) => sum + row.details.prets, 0);
                          
                          return [
                            { name: 'Fonds propres', value: totalFondsPropres, color: '#3B82F6' },
                            { name: 'Subventions', value: totalSubventions, color: '#10B981' },
                            { name: 'Prêts', value: totalPrets, color: '#8B5CF6' }
                          ].filter(item => item.value > 0);
                        })()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(() => {
                          const totalFondsPropres = detailedData.reduce((sum, row) => sum + row.details.fondsPropres, 0);
                          const totalSubventions = detailedData.reduce((sum, row) => sum + row.details.subventions, 0);
                          const totalPrets = detailedData.reduce((sum, row) => sum + row.details.prets, 0);
                          
                          return [
                            { name: 'Fonds propres', value: totalFondsPropres, color: '#3B82F6' },
                            { name: 'Subventions', value: totalSubventions, color: '#10B981' },
                            { name: 'Prêts', value: totalPrets, color: '#8B5CF6' }
                          ].filter(item => item.value > 0);
                        })().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [
                          `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`,
                          'Montant'
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};