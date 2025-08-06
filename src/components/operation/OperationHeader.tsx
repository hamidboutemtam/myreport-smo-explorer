import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building, RefreshCw } from 'lucide-react';
import { Simulation } from '@/types/operation';

interface OperationHeaderProps {
  operationId: string;
  operationInfo: any;
  simulations: Simulation[];
  selectedSimulation: string;
  onSimulationChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const OperationHeader: React.FC<OperationHeaderProps> = ({
  operationId,
  operationInfo,
  simulations,
  selectedSimulation,
  onSimulationChange,
  onRefresh,
  loading
}) => {
  const navigate = useNavigate();

  const selectedSimulationData = simulations.find(sim => sim.Code_Simulation === selectedSimulation);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Building className="w-6 h-6 text-primary" />
              {operationInfo?.LibelleOperation || `Opération ${operationId}`}
            </h1>
            <p className="text-muted-foreground mt-1">
              Code : {operationId}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Card className="border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Sélection de la simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedSimulation} onValueChange={onSimulationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une simulation" />
                </SelectTrigger>
                <SelectContent>
                  {simulations.map((simulation) => (
                    <SelectItem key={simulation.Code_Simulation} value={simulation.Code_Simulation}>
                      <div className="flex flex-col">
                        <span className="font-medium">{simulation.LibelleSimulation}</span>
                        <span className="text-xs text-muted-foreground">
                          Modifiée le {new Date(simulation.DateModif).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSimulationData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Étape</p>
                <Badge variant="secondary" className="text-xs">
                  {selectedSimulationData.Etape || 'Non définie'}
                </Badge>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Date de valeur</p>
                <p className="text-sm font-medium">
                  {selectedSimulationData.DateValeur ? 
                    new Date(selectedSimulationData.DateValeur).toLocaleDateString('fr-FR') : 
                    'Non définie'
                  }
                </p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Dernière modification</p>
                <p className="text-sm font-medium">
                  {new Date(selectedSimulationData.DateModif).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Propriétaire</p>
                <p className="text-sm font-medium">
                  {selectedSimulationData.Proprietaire || 'Non défini'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};