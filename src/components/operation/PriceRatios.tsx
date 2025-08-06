import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Home, Square, Euro } from 'lucide-react';
import { PrixRevientTableRow, TypologyTotals } from '@/types/operation';

interface PriceRatiosProps {
  prixRevientTable: PrixRevientTableRow[];
  totals: TypologyTotals;
}

export const PriceRatios: React.FC<PriceRatiosProps> = ({ prixRevientTable, totals }) => {
  const totalPrixRevient = prixRevientTable.reduce((sum, row) => sum + row.total, 0);
  const ratioParLogement = totals.total.Nb > 0 ? totalPrixRevient / totals.total.Nb : 0;
  const ratioParM2 = totals.total.Shab > 0 ? totalPrixRevient / totals.total.Shab : 0;

  const ratiosData = [
    {
      title: "Prix de revient total",
      value: totalPrixRevient,
      unit: "€",
      icon: Euro,
      color: "blue"
    },
    {
      title: "Prix de revient par logement",
      value: ratioParLogement,
      unit: "€",
      icon: Home,
      color: "green"
    },
    {
      title: "Prix de revient par m² SHAB",
      value: ratioParM2,
      unit: "€/m²",
      icon: Square,
      color: "orange"
    },
    {
      title: "Surface moyenne par logement",
      value: totals.total.Nb > 0 ? totals.total.Shab / totals.total.Nb : 0,
      unit: "m²",
      icon: Calculator,
      color: "purple"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ratiosData.map((ratio, index) => {
          const IconComponent = ratio.icon;
          return (
            <Card key={index} className={`bg-${ratio.color}-50 border-${ratio.color}-200`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`bg-${ratio.color}-500 rounded-full p-2`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm text-${ratio.color}-600 font-medium`}>{ratio.title}</p>
                    <p className={`text-xl font-bold text-${ratio.color}-900`}>
                      {ratio.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {ratio.unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Détails du calcul</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total des logements:</span>
            <span className="font-medium">{totals.total.Nb}</span>
          </div>
          <div className="flex justify-between">
            <span>Surface SHAB totale:</span>
            <span className="font-medium">{totals.total.Shab.toFixed(0)} m²</span>
          </div>
          <div className="flex justify-between">
            <span>Prix de revient total:</span>
            <span className="font-medium">{totalPrixRevient.toLocaleString('fr-FR')} €</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};