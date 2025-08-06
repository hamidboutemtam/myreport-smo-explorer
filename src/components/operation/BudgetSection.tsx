import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, PieChart, Euro } from 'lucide-react';
import { PriceChart } from './PriceChart';
import { PriceTable } from './PriceTable';
import { PriceRatios } from './PriceRatios';
import { PrixRevientData, PrixRevientTableRow, PrixRevientChartData, TypologyTotals } from '@/types/operation';

interface BudgetSectionProps {
  prixRevientData: PrixRevientData[];
  totals: TypologyTotals;
  loading: boolean;
  onChapterSelect: (chapter: string) => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  prixRevientData,
  totals,
  loading,
  onChapterSelect
}) => {
  const [activeTab, setActiveTab] = useState('graphique');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Calculator className="w-4 h-4" />
            Budget de l'opération
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

  // Calcul des données pour le graphique
  const prixRevientChart: PrixRevientChartData[] = [
    { name: "Charge foncière", value: prixRevientTable.reduce((sum, row) => sum + row.foncier, 0) },
    { name: "Coût travaux", value: prixRevientTable.reduce((sum, row) => sum + row.travaux, 0) },
    { name: "Honoraires", value: prixRevientTable.reduce((sum, row) => sum + row.honoraires, 0) },
    { name: "Actualisation", value: prixRevientTable.reduce((sum, row) => sum + row.actualisation, 0) },
    { name: "Frais financiers", value: prixRevientTable.reduce((sum, row) => sum + row.financier, 0) }
  ].filter(item => item.value > 0);

  const handleChapterClick = (chapterName: string) => {
    setSelectedChapter(chapterName);
    setActiveTab('detail');
    onChapterSelect(chapterName);
  };

  return (
    <Card className="border-0 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <Calculator className="w-4 h-4" />
          Budget de l'opération
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Étiquette récapitulative */}
        <div className="mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 max-w-md">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 rounded-full p-2">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-600 font-medium mb-2">Prix de revient</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Total fiscalisé:</span>
                    <span className="font-bold text-blue-900">
                      {prixRevientTable.reduce((sum, row) => sum + row.total, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Par logement:</span>
                    <span className="font-bold text-blue-900">
                      {totals.total.Nb > 0 ? 
                        (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Nb).toLocaleString('fr-FR', { 
                          maximumFractionDigits: 0 
                        }) : '0'} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">Par m² SHAB:</span>
                    <span className="font-bold text-blue-900">
                      {totals.total.Shab > 0 ? 
                        (prixRevientTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Shab).toLocaleString('fr-FR', { 
                          maximumFractionDigits: 0 
                        }) : '0'} €/m²
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  {totals.total.Nb} logement{totals.total.Nb > 1 ? 's' : ''} • {totals.total.Shab.toFixed(0)} m² SHAB
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          <TabsContent value="graphique" className="space-y-3 mt-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <PriceChart data={prixRevientChart} onChapterClick={handleChapterClick} />
              
              {/* Résumé compact */}
              <div className="lg:w-72">
                <div className="space-y-1">
                  {prixRevientChart.map((item, index) => (
                    <div 
                      key={item.name} 
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors cursor-pointer text-sm"
                      onClick={() => handleChapterClick(item.name)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                        />
                        <span className="text-xs">{item.name}</span>
                      </div>
                      <span className="font-medium text-xs">
                        {item.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detail" className="space-y-3 mt-4">
            <PriceTable data={prixRevientTable} selectedChapter={selectedChapter} />
          </TabsContent>

          <TabsContent value="ratios" className="space-y-3 mt-4">
            <PriceRatios prixRevientTable={prixRevientTable} totals={totals} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};