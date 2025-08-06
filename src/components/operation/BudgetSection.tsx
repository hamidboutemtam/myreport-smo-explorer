import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Euro } from 'lucide-react';
import { PrixRevientData, PrixRevientTableRow, PrixRevientChartData, TypologyTotals } from '@/types/operation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BudgetSectionProps {
  prixRevientData: PrixRevientData[];
  totals: TypologyTotals;
  loading: boolean;
  // onChapterSelect removed since we no longer use it
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  prixRevientData,
  totals,
  loading
}) => {
  // Suppression des onglets - plus besoin d'activeTab ni selectedChapter pour les onglets
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Calculator className="w-4 h-4" />
            Prix de revient LASM de l'opération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Chargement des données budgétaires...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prixRevientData || prixRevientData.length === 0) {
    return (
      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Calculator className="w-4 h-4" />
            Budget de l'opération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune donnée budgétaire disponible pour cette simulation.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcul des données pour le tableau
  const prixRevientTable: PrixRevientTableRow[] = prixRevientData.map(item => ({
    chapter: item.Code_Programme || 'Programme principal',
    foncier: item.ChargeFonciereFisc || 0,
    travaux: item.CoutTravauxFisc || 0,
    honoraires: item.HonorairesFisc || 0,
    actualisation: item.ActuRevisFisc || 0,
    financier: item.FraisFinancierFisc || 0,
    total: item.TotalFisc || 0
  }));

  const handleRatioClick = (ratioType: string) => {
    setSelectedRatio(selectedRatio === ratioType ? null : ratioType);
  };

  // Calculer les données détaillées par nature de financement selon le ratio sélectionné
  const getDetailedData = () => {
    if (!selectedRatio) return [];
    
    const detailedData = prixRevientTable.map(row => {
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
          chargeFonciere: selectedRatio === 'total' ? row.foncier : 
                   selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.foncier / totals.total.Nb : 0) :
                   selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.foncier / totals.total.Shab : 0) : 0,
          coutTravaux: selectedRatio === 'total' ? row.travaux : 
                   selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.travaux / totals.total.Nb : 0) :
                   selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.travaux / totals.total.Shab : 0) : 0,
          honoraires: selectedRatio === 'total' ? row.honoraires : 
                      selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.honoraires / totals.total.Nb : 0) :
                      selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.honoraires / totals.total.Shab : 0) : 0,
          actualisation: selectedRatio === 'total' ? row.actualisation : 
                         selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.actualisation / totals.total.Nb : 0) :
                         selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.actualisation / totals.total.Shab : 0) : 0,
          financier: selectedRatio === 'total' ? row.financier : 
                     selectedRatio === 'logement' ? (totals.total.Nb > 0 ? row.financier / totals.total.Nb : 0) :
                     selectedRatio === 'shab' ? (totals.total.Shab > 0 ? row.financier / totals.total.Shab : 0) : 0
        }
      };
    });
    
    return detailedData;
  };

  const detailedData = getDetailedData();

  const getRatioTitle = () => {
    switch (selectedRatio) {
      case 'total': return 'Prix de revient total par nature de financement';
      case 'logement': return 'Prix de revient par logement et par nature de financement';
      case 'shab': return 'Prix de revient par m² SHAB et par nature de financement';
      case 'surface': return 'Surface moyenne par logement et par nature de financement';
      default: return '';
    }
  };

  return (
    <Card className="border-0 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <Calculator className="w-4 h-4" />
          Prix de revient LASM de l'opération
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Étiquettes de ratios du prix de revient */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Prix de revient total */}
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
                  <p className="text-sm text-blue-600 font-medium">Prix de revient total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {prixRevientTable.reduce((sum, row) => sum + row.total, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Par chapitre - Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>

            {/* Prix de revient par logement */}
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
                  <p className="text-sm text-green-600 font-medium">Prix de revient par logement</p>
                  <p className="text-2xl font-bold text-green-900">
                    {totals.total.Nb > 0 ? 
                      (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Nb).toLocaleString('fr-FR', { 
                        maximumFractionDigits: 0 
                      }) : '0'} €
                  </p>
                  <p className="text-xs text-green-600 mt-1">Par chapitre - Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>

            {/* Prix de revient par m² SHAB */}
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
                  <p className="text-sm text-orange-600 font-medium">Prix de revient par m² SHAB</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {totals.total.Shab > 0 ? 
                      (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Shab).toLocaleString('fr-FR', { 
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

        {/* Tableau détaillé par chapitre avec camembert */}
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
                      <TableHead className="font-semibold">Chapitre</TableHead>
                      {detailedData.map((row, index) => (
                        <TableHead key={index} className="text-center font-semibold">
                          <Badge variant="outline" className="text-xs">
                            {row.programme}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-blue-600">Charge foncière</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.chargeFonciere.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-green-600">Coût travaux</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.coutTravaux.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-purple-600">Honoraires</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.honoraires.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-orange-600">Actualisation</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.actualisation.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-red-600">Frais financiers</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center">
                          {row.details.financier.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                          {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                            <span className="text-xs text-muted-foreground block">
                              /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="hover:bg-muted/30 transition-colors bg-primary/10">
                      <TableCell className="font-bold">Total</TableCell>
                      {detailedData.map((row, index) => (
                        <TableCell key={index} className="text-center font-bold">
                          {row.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {row.unit}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Camembert */}
              <div className="flex flex-col">
                <h4 className="text-md font-semibold mb-4 text-center">Répartition du prix de revient total</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const totalChargeFonciere = detailedData.reduce((sum, row) => sum + row.details.chargeFonciere, 0);
                          const totalCoutTravaux = detailedData.reduce((sum, row) => sum + row.details.coutTravaux, 0);
                          const totalHonoraires = detailedData.reduce((sum, row) => sum + row.details.honoraires, 0);
                          const totalActualisation = detailedData.reduce((sum, row) => sum + row.details.actualisation, 0);
                          const totalFinancier = detailedData.reduce((sum, row) => sum + row.details.financier, 0);
                          
                          return [
                            { name: 'Charge foncière', value: totalChargeFonciere, color: '#3B82F6' },
                            { name: 'Coût travaux', value: totalCoutTravaux, color: '#10B981' },
                            { name: 'Honoraires', value: totalHonoraires, color: '#8B5CF6' },
                            { name: 'Actualisation', value: totalActualisation, color: '#F59E0B' },
                            { name: 'Frais financiers', value: totalFinancier, color: '#EF4444' }
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
                          const totalChargeFonciere = detailedData.reduce((sum, row) => sum + row.details.chargeFonciere, 0);
                          const totalCoutTravaux = detailedData.reduce((sum, row) => sum + row.details.coutTravaux, 0);
                          const totalHonoraires = detailedData.reduce((sum, row) => sum + row.details.honoraires, 0);
                          const totalActualisation = detailedData.reduce((sum, row) => sum + row.details.actualisation, 0);
                          const totalFinancier = detailedData.reduce((sum, row) => sum + row.details.financier, 0);
                          
                          return [
                            { name: 'Charge foncière', value: totalChargeFonciere, color: '#3B82F6' },
                            { name: 'Coût travaux', value: totalCoutTravaux, color: '#10B981' },
                            { name: 'Honoraires', value: totalHonoraires, color: '#8B5CF6' },
                            { name: 'Actualisation', value: totalActualisation, color: '#F59E0B' },
                            { name: 'Frais financiers', value: totalFinancier, color: '#EF4444' }
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