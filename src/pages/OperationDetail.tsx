import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, MapPin, Clock, User, MessageCircle, CheckCircle } from 'lucide-react';
import { OperationHeader } from '@/components/operation/OperationHeader';
import { ProgramComposition } from '@/components/operation/ProgramComposition';
import { BudgetSection } from '@/components/operation/BudgetSection';
import { useOperationData } from '@/hooks/useOperationData';
import { TypologyTotals } from '@/types/operation';

const OperationDetail = () => {
  const { operationId } = useParams<{ operationId: string }>();
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('logements');

  const {
    typologyData,
    prixRevientData,
    programCaracData,
    simulations,
    selectedSimulation,
    setSelectedSimulation,
    loading,
    operationInfo,
    refreshData
  } = useOperationData(operationId);

  // Calcul des totaux pour la typologie
  const totals: TypologyTotals = React.useMemo(() => {
    const total = typologyData.reduce(
      (acc, item) => ({
        Nb: acc.Nb + item.Nb,
        Shab: acc.Shab + item.Shab,
        Su: acc.Su + item.Su,
        SurfHabMoy: acc.SurfHabMoy + (item.SurfHabMoy * item.Nb),
        ProdLocLoyerRet: acc.ProdLocLoyerRet + item.ProdLocLoyerRet,
      }),
      { Nb: 0, Shab: 0, Su: 0, SurfHabMoy: 0, ProdLocLoyerRet: 0 }
    );

    // Calcul de la surface habitale moyenne pondérée
    total.SurfHabMoy = total.Nb > 0 ? total.SurfHabMoy / total.Nb : 0;

    const byType = typologyData.reduce((acc, item) => {
      if (!acc[item.Type]) {
        acc[item.Type] = { Nb: 0, Shab: 0, Su: 0, SurfHabMoy: 0, ProdLocLoyerRet: 0 };
      }
      acc[item.Type].Nb += item.Nb;
      acc[item.Type].Shab += item.Shab;
      acc[item.Type].Su += item.Su;
      acc[item.Type].SurfHabMoy += item.SurfHabMoy * item.Nb;
      acc[item.Type].ProdLocLoyerRet += item.ProdLocLoyerRet;
      return acc;
    }, {} as Record<string, any>);

    // Calcul des moyennes pondérées par type
    Object.keys(byType).forEach(type => {
      if (byType[type].Nb > 0) {
        byType[type].SurfHabMoy = byType[type].SurfHabMoy / byType[type].Nb;
      }
    });

    return { total, byType };
  }, [typologyData]);

  const handleChapterSelect = (chapter: string) => {
    // Logique pour gérer la sélection des chapitres si nécessaire
    console.log('Chapter selected:', chapter);
  };

  if (!operationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Opération non trouvée</h1>
          <p className="text-muted-foreground mt-2">L'identifiant de l'opération est manquant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <OperationHeader
          operationId={operationId}
          operationInfo={operationInfo}
          simulations={simulations}
          selectedSimulation={selectedSimulation}
          onSimulationChange={setSelectedSimulation}
          onRefresh={refreshData}
          loading={loading}
        />

        {selectedSimulation && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="logements" className="text-sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Logements
              </TabsTrigger>
              <TabsTrigger value="budget" className="text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                Budget
              </TabsTrigger>
              <TabsTrigger value="suivi" className="text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                Suivi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logements" className="space-y-6 mt-6">
              <ProgramComposition
                typologyData={typologyData}
                programCaracData={programCaracData}
                totals={totals}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="budget" className="space-y-6 mt-6">
              <BudgetSection
                prixRevientData={prixRevientData}
                totals={totals}
                loading={loading}
                onChapterSelect={handleChapterSelect}
              />
            </TabsContent>

            <TabsContent value="suivi" className="space-y-6 mt-6">
              <div className="text-center p-8 bg-card/60 backdrop-blur-sm rounded-lg border">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Suivi en développement</h3>
                <p className="text-muted-foreground">
                  Cette section permettra de suivre l'avancement de l'opération et les étapes clés.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <User className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Équipe projet</p>
                    <p className="text-xs text-muted-foreground">À venir</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <MessageCircle className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Commentaires</p>
                    <p className="text-xs text-muted-foreground">À venir</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Jalons</p>
                    <p className="text-xs text-muted-foreground">À venir</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default OperationDetail;