
import { useState } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  FileSpreadsheet, 
  FileJson, 
  CheckCheck, 
  DownloadCloud 
} from 'lucide-react';
import { downloadFile, exportOperation } from '@/services/api';

// List of export section options
const exportSections = [
  { id: 'typologielogement', name: 'Typologies de logement' },
  { id: 'typologieaccessoire', name: 'Typologies accessoires' },
  { id: 'prixrevient', name: 'Prix de revient' },
  { id: 'financement', name: 'Plan de financement' },
  { id: 'exploitation', name: 'Résultat d\'exploitation' },
  { id: 'emprunts', name: 'Emprunts' }
];

// Sample operations for select dropdown
const sampleOperations = [
  { id: '1', name: 'Résidence Les Oliviers' },
  { id: '2', name: 'Parc Saint-Michel' },
  { id: '3', name: 'Les Terrasses du Port' },
  { id: '4', name: 'Cité Universitaire' },
  { id: '5', name: 'Eco-Quartier Nord' },
];

const Exports = () => {
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'json' | 'excel'>('excel');
  const [exportLoading, setExportLoading] = useState(false);

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Select/deselect all sections
  const toggleAllSections = (select: boolean) => {
    if (select) {
      setSelectedSections(exportSections.map(section => section.id));
    } else {
      setSelectedSections([]);
    }
  };

  // Handle export action
  const handleExport = async () => {
    if (!selectedOperation) {
      toast.error('Veuillez sélectionner une opération');
      return;
    }

    if (selectedSections.length === 0) {
      toast.error('Veuillez sélectionner au moins une section à exporter');
      return;
    }

    setExportLoading(true);
    
    try {
      const blob = await exportOperation({
        format: exportFormat,
        operationId: selectedOperation,
        sections: selectedSections,
      });
      
      if (blob instanceof Blob) {
        const operation = sampleOperations.find(op => op.id === selectedOperation);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${operation?.name.replace(/\s/g, '_')}_export_${timestamp}.${exportFormat === 'json' ? 'json' : 'xlsx'}`;
        
        downloadFile(blob, filename);
        toast.success(`Export ${exportFormat.toUpperCase()} réussi`);
      }
    } catch (error) {
      console.error(`Error during export:`, error);
      toast.error(`Échec de l'export`);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Layout>
      <div className="layout-container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Exports</h1>
          <p className="text-gray-600">
            Exportez les données des opérations dans différents formats
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export configuration card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuration de l'export</CardTitle>
                <CardDescription>
                  Sélectionnez une opération et les sections à inclure dans l'export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Operation selection */}
                <div className="space-y-2">
                  <Label htmlFor="operation">Opération</Label>
                  <Select
                    value={selectedOperation}
                    onValueChange={setSelectedOperation}
                  >
                    <SelectTrigger id="operation" className="w-full">
                      <SelectValue placeholder="Sélectionnez une opération" />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleOperations.map((operation) => (
                        <SelectItem key={operation.id} value={operation.id}>
                          {operation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sections selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sections à exporter</Label>
                    <div className="flex space-x-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleAllSections(true)}
                        className="h-8 text-xs"
                      >
                        <CheckCheck className="h-3.5 w-3.5 mr-1" />
                        Tout sélectionner
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleAllSections(false)}
                        className="h-8 text-xs"
                      >
                        <CheckCheck className="h-3.5 w-3.5 mr-1 opacity-50" />
                        Tout désélectionner
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exportSections.map((section) => (
                      <div key={section.id} className="flex items-start space-x-2">
                        <Checkbox 
                          id={`section-${section.id}`}
                          checked={selectedSections.includes(section.id)}
                          onCheckedChange={() => toggleSection(section.id)}
                        />
                        <Label
                          htmlFor={`section-${section.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {section.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Export format */}
                <div className="space-y-3">
                  <Label>Format d'export</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant={exportFormat === 'excel' ? 'default' : 'outline'}
                      onClick={() => setExportFormat('excel')}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Excel</span>
                    </Button>
                    <Button
                      variant={exportFormat === 'json' ? 'default' : 'outline'}
                      onClick={() => setExportFormat('json')}
                      className="flex items-center gap-2"
                    >
                      <FileJson className="h-4 w-4" />
                      <span>JSON</span>
                    </Button>
                  </div>
                </div>
                
                {/* Export action */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleExport}
                    disabled={!selectedOperation || selectedSections.length === 0 || exportLoading}
                    className="export-btn"
                  >
                    {exportLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent mr-2"></span>
                        <span>Export en cours...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        <span>Exporter {exportFormat === 'excel' ? 'en Excel' : 'en JSON'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Export info card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Aide à l'export</CardTitle>
                <CardDescription>
                  Informations sur les formats d'export disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">Export Excel</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Format complet avec une feuille par section. Idéal pour l'analyse et le traitement des données.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileJson className="h-5 w-5 text-amber-600" />
                    <h3 className="font-medium">Export JSON</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Format structuré pour l'intégration avec d'autres systèmes informatiques.
                  </p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2 bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-800">Astuce</h3>
                  <p className="text-sm text-blue-700">
                    Pour des exports réguliers, vous pouvez enregistrer vos paramètres d'export préférés en les sélectionnant une première fois.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Exports;
