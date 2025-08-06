import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrixRevientTableRow } from '@/types/operation';

interface PriceTableProps {
  data: PrixRevientTableRow[];
  selectedChapter: string | null;
}

export const PriceTable: React.FC<PriceTableProps> = ({ data, selectedChapter }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Chapitre</TableHead>
            <TableHead className="text-right font-semibold">Charge foncière</TableHead>
            <TableHead className="text-right font-semibold">Coût travaux</TableHead>
            <TableHead className="text-right font-semibold">Honoraires</TableHead>
            <TableHead className="text-right font-semibold">Actualisation</TableHead>
            <TableHead className="text-right font-semibold">Frais financiers</TableHead>
            <TableHead className="text-right font-semibold">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index} 
              className={`hover:bg-muted/30 transition-colors ${
                selectedChapter === row.chapter ? 'bg-primary/10 border-l-4 border-l-primary' : ''
              }`}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                  />
                  {row.chapter}
                  {selectedChapter === row.chapter && (
                    <Badge variant="secondary" className="text-xs ml-2">Sélectionné</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {row.foncier.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </TableCell>
              <TableCell className="text-right">
                {row.travaux.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </TableCell>
              <TableCell className="text-right">
                {row.honoraires.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </TableCell>
              <TableCell className="text-right">
                {row.actualisation.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </TableCell>
              <TableCell className="text-right">
                {row.financier.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </TableCell>
              <TableCell className="text-right font-semibold">
                {row.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};