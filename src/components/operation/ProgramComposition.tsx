import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Ruler, Euro, Users } from 'lucide-react';
import { TypologyData, TypologyTotals } from '@/types/operation';

interface ProgramCompositionProps {
  typologyData: TypologyData[];
  programCaracData: any[];
  totals: TypologyTotals;
  loading: boolean;
}

export const ProgramComposition: React.FC<ProgramCompositionProps> = ({
  typologyData,
  programCaracData,
  totals,
  loading
}) => {
  // État pour la nature de financement sélectionnée
  const [selectedFinancing, setSelectedFinancing] = React.useState<string | null>(null);
  // Créer un mapping des codes programmes vers leurs caractéristiques
  const programMapping = React.useMemo(() => {
    if (!programCaracData || programCaracData.length === 0) return {};
    
    return programCaracData.reduce((acc, program) => {
      acc[program.Code_Programme] = {
        NatureFinancement: program.NatureFinancement || program.Code_Programme,
        LibelleProgramme: program.LibelleProgramme || program.Code_Programme,
        ...program
      };
      return acc;
    }, {} as Record<string, any>);
  }, [programCaracData]);

  // Calculer les totaux par nature de financement
  const financingTotals = React.useMemo(() => {
    if (!typologyData || typologyData.length === 0) return {};
    
    return typologyData.reduce((acc, row) => {
      const programCode = row.Code_Programme || 'Non défini';
      const programInfo = programMapping[programCode];
      
      // Utiliser la nature de financement des données croisées ou le code programme par défaut
      const financing = programInfo?.NatureFinancement || programCode;
      
      if (!acc[financing]) {
        acc[financing] = {
          Nb: 0,
          Shab: 0,
          Su: 0,
          LRet: 0,
          ProdLocLoyerRet: 0,
          SurfAnnexes: 0,
          LibelleProgramme: programInfo?.LibelleProgramme || financing
        };
      }
      
      acc[financing].Nb += row.Nb;
      acc[financing].Shab += row.Shab;
      acc[financing].Su += row.Su;
      acc[financing].LRet = row.LRetModule || 0; // Prendre le loyer retenu modulé
      acc[financing].ProdLocLoyerRet += row.ProdLocLoyerRet;
      // Calculer les annexes comme SU - SHAB
      acc[financing].SurfAnnexes += (row.Su - row.Shab);
      
      return acc;
    }, {} as Record<string, { Nb: number; Shab: number; Su: number; LRet: number; ProdLocLoyerRet: number; SurfAnnexes: number; LibelleProgramme: string }>);
  }, [typologyData, programMapping]);

  // Filtrer les données de typologie selon la sélection
  const filteredTypologyData = React.useMemo(() => {
    if (!selectedFinancing) return [];
    
    return typologyData.filter(row => {
      const programCode = row.Code_Programme || 'Non défini';
      const programInfo = programMapping[programCode];
      const financing = programInfo?.NatureFinancement || programCode;
      return financing === selectedFinancing;
    });
  }, [typologyData, programMapping, selectedFinancing]);

  // Calculer les totaux pour les données filtrées
  const filteredTotals = React.useMemo(() => {
    return filteredTypologyData.reduce(
      (acc, item) => ({
        Nb: acc.Nb + item.Nb,
        Shab: acc.Shab + item.Shab,
        Su: acc.Su + item.Su,
        SurfHabMoy: acc.SurfHabMoy + (item.SurfHabMoy * item.Nb),
        ProdLocLoyerRet: acc.ProdLocLoyerRet + item.ProdLocLoyerRet,
      }),
      { Nb: 0, Shab: 0, Su: 0, SurfHabMoy: 0, ProdLocLoyerRet: 0 }
    );
  }, [filteredTypologyData]);

  if (loading) {
    return (
      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Home className="w-4 h-4" />
            Composition du programme locatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Chargement des données de typologie...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!typologyData || typologyData.length === 0) {
    return (
      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Home className="w-4 h-4" />
            Composition du programme locatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune donnée de typologie disponible pour cette simulation.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <Home className="w-4 h-4" />
          Composition du programme locatif
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Étiquettes récapitulatives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 rounded-full p-2">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Total logements</p>
                <p className="text-2xl font-bold text-green-900">{totals.total.Nb}</p>
                <p className="text-xs text-green-600">logement{totals.total.Nb > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 rounded-full p-2">
                <Ruler className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Surface SHAB totale</p>
                <p className="text-2xl font-bold text-orange-900">{totals.total.Shab.toFixed(0)}</p>
                <p className="text-xs text-orange-600">m² SHAB</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 rounded-full p-2">
                <Euro className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Production locative</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totals.total.ProdLocLoyerRet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </p>
                <p className="text-xs text-purple-600">par an</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau récapitulatif par nature de financement */}
        {Object.keys(financingTotals).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Euro className="w-5 h-5 text-primary" />
              Répartition par nature de financement
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Cliquez sur une ligne pour voir le détail)
              </span>
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nature de financement</TableHead>
                    <TableHead className="text-right font-semibold">Nombre</TableHead>
                    <TableHead className="text-right font-semibold">SHAB (m²)</TableHead>
                    <TableHead className="text-right font-semibold">SU (m²)</TableHead>
                    <TableHead className="text-right font-semibold">Total annexes (m²)</TableHead>
                    <TableHead className="text-right font-semibold">Loyer retenu (€/m²)</TableHead>
                    <TableHead className="text-right font-semibold">Prod. loc. (€/an)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(financingTotals).map(([financing, data]) => (
                    <TableRow 
                      key={financing} 
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                        selectedFinancing === financing ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                      onClick={() => setSelectedFinancing(financing)}
                    >
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="text-xs">
                          {financing}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div className="flex items-center justify-end gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          {data.Nb}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{data.Shab.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{data.Su.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        {data.SurfAnnexes.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {data.LRet.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {data.ProdLocLoyerRet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tableau détaillé par typologie - contextuel */}
        {selectedFinancing && filteredTypologyData.length > 0 && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              Détail des typologies - {selectedFinancing}
              <Badge variant="secondary" className="ml-2">
                {filteredTotals.Nb} logement{filteredTotals.Nb > 1 ? 's' : ''}
              </Badge>
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Typologie</TableHead>
                    <TableHead className="text-right font-semibold">Nombre</TableHead>
                    <TableHead className="text-right font-semibold">SHAB (m²)</TableHead>
                    <TableHead className="text-right font-semibold">SU (m²)</TableHead>
                    <TableHead className="text-right font-semibold">Total annexes (m²)</TableHead>
                    <TableHead className="text-right font-semibold">Loyer retenu (€/m²)</TableHead>
                    <TableHead className="text-right font-semibold">Prod. loc. (€/an)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypologyData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {row.Type}
                          </Badge>
                          {row.Designation}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div className="flex items-center justify-end gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          {row.Nb}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row.Shab.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{row.Su.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{(row.Su - row.Shab).toFixed(1)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {row.LRetModule.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.ProdLocLoyerRet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/10 font-semibold border-t-2 border-primary/30">
                    <TableCell className="font-bold">TOTAL - {selectedFinancing}</TableCell>
                    <TableCell className="text-right font-bold">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="w-3 h-3 text-primary" />
                        {filteredTotals.Nb}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{filteredTotals.Shab.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-bold">{filteredTotals.Su.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-bold">
                      {(filteredTotals.Su - filteredTotals.Shab).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {/* Calculer la moyenne pondérée des loyers retenus pour les données filtrées */}
                      {filteredTypologyData.length > 0 ? 
                        (filteredTypologyData.reduce((sum, row) => sum + (row.LRetModule * row.Su), 0) / filteredTotals.Su).toFixed(2) 
                        : '0.00'} €
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {filteredTotals.ProdLocLoyerRet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-center">
              <button 
                onClick={() => setSelectedFinancing(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Fermer le détail
              </button>
            </div>
          </div>
        )}

        {/* Message si aucune sélection */}
        {!selectedFinancing && Object.keys(financingTotals).length > 0 && (
          <div className="mt-6 p-4 border border-dashed border-muted-foreground/30 rounded-lg text-center">
            <Home className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              Sélectionnez une nature de financement ci-dessus pour voir le détail des typologies
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};