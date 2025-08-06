import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PrixRevientChartData } from '@/types/operation';

interface PriceChartProps {
  data: PrixRevientChartData[];
  onChapterClick: (chapterName: string) => void;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, onChapterClick }) => {
  return (
    <div className="flex-1">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={120}
              dataKey="value"
              onClick={(data) => onChapterClick(data.name)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                  stroke="white"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toLocaleString()} €`]}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};