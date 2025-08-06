export interface TypologyData {
  Code_Projet: string;
  Code_Simulation: string;
  Code_Programme: string;
  Designation: string;
  Nb: number;
  Type: string;
  SurfHabMoy: number;
  Shab: number;
  Su: number;
  LRetModule: number;
  ProdLocLoyerRet: number;
}

export interface PrixRevientData {
  Code_Projet: string;
  Code_Simulation: string;
  Code_Programme: string;
  ChargeFonciereFisc: number;
  CoutTravauxFisc: number;
  HonorairesFisc: number;
  ActuRevisFisc: number;
  FraisFinancierFisc: number;
  TotalFisc: number;
}

export interface Simulation {
  Code_Simulation: string;
  LibelleSimulation: string;
  DateCreation: string;
  DateModif: string;
  DateValeur?: string;
  Etape?: string;
  Proprietaire?: string;
  Commentaire?: string;
}

export interface PrixRevientTableRow {
  chapter: string;
  foncier: number;
  travaux: number;
  honoraires: number;
  actualisation: number;
  financier: number;
  total: number;
}

export interface PrixRevientChartData {
  name: string;
  value: number;
}

export interface TypologyTotals {
  total: {
    Nb: number;
    Shab: number;
    Su: number;
    SurfHabMoy: number;
    ProdLocLoyerRet: number;
  };
  byType: Record<string, {
    Nb: number;
    Shab: number;
    Su: number;
    SurfHabMoy: number;
    ProdLocLoyerRet: number;
  }>;
}