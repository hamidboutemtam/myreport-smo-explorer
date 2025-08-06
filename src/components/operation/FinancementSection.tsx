import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Euro } from 'lucide-react';
import { TypologyTotals } from '@/types/operation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface FinancementData {
  Code_Projet: string;
  Code_Simulation: string;
  Code_Programme: string;
  FondsPropres?: number;
  Subventions?: number;
  Prets?: number;
  Total?: number;
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

  // Calcul des données pour le tableau
  const financementTable: FinancementTableRow[] = financementData.map(item => ({
    chapter: item.Code_Programme || 'Programme principal',
    fondsPropres: item.FondsPropres || 0,
    subventions: item.Subventions || 0,
    prets: item.Prets || 0,
    total: item.Total || 0
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
                  <p className="text-xs text-blue-600 mt-1">Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>

            {/* Plan de financement par logement */}
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
                  <p className="text-sm text-green-600 font-medium">Plan de financement par logement</p>
                  <p className="text-2xl font-bold text-green-900">
                    {totals.total.Nb > 0 ? 
                      (financementTable.reduce((sum, row) => sum + row.total, 0) / totals.total.Nb).toLocaleString('fr-FR', { 
                        maximumFractionDigits: 0 
                      }) : '0'} €
                  </p>
                  <p className="text-xs text-green-600 mt-1">Cliquez pour voir le détail</p>
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
                  <p className="text-xs text-orange-600 mt-1">Cliquez pour voir le détail</p>
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
                  <p className="text-xs text-purple-600 mt-1">Cliquez pour voir le détail</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau détaillé par nature de financement */}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nature de financement</TableHead>
                    <TableHead className="text-right font-semibold">Fonds propres</TableHead>
                    <TableHead className="text-right font-semibold">Subventions</TableHead>
                    <TableHead className="text-right font-semibold">Prêts</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="text-xs">
                          {row.programme}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.details.fondsPropres.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                        {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                          <span className="text-xs text-muted-foreground ml-1">
                            /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.details.subventions.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                        {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                          <span className="text-xs text-muted-foreground ml-1">
                            /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.details.prets.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {selectedRatio === 'surface' ? 'm²' : '€'}
                        {selectedRatio !== 'total' && selectedRatio !== 'surface' && (
                          <span className="text-xs text-muted-foreground ml-1">
                            /{selectedRatio === 'logement' ? 'lgt' : 'm²'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {row.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};