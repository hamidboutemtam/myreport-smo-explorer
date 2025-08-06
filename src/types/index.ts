
// User-related types
export interface User {
  id: string;
  username: string;
  token: string;
}

// Operation-related types
export interface Operation {
  id: string;
  libelleoperation: string;
  simulations: Simulation[];
  details?: OperationDetails;
}

export interface Simulation {
  id: string;
  name: string;
  commune: string;
  annee: number;
  departement?: string;
  status?: string;
}

export interface OperationDetails {
  typologielogement?: TypeLogement[];
  typologieaccessoire?: TypeAccessoire[];
  prixrevient?: PrixRevient;
  financement?: Financement;
  exploitation?: Exploitation;
  emprunts?: Emprunt[];
}

export interface TypeLogement {
  id: string;
  type: string;
  surface: number;
  quantite: number;
  prixunitaire: number;
}

export interface TypeAccessoire {
  id: string;
  type: string;
  quantite: number;
  prixunitaire: number;
}

export interface PrixRevient {
  charge_fonciere: number;
  travaux: number;
  honoraires: number;
  frais_annexes: number;
  total: number;
}

export interface Financement {
  fonds_propres: number;
  subventions: number;
  prets: number;
  total: number;
}

export interface Exploitation {
  loyers_annuels: number;
  charges_annuelles: number;
  resultat_brut: number;
}

export interface Emprunt {
  id: string;
  preteur: string;
  montant: number;
  taux: number;
  duree: number;
}

// Filter-related types
export interface OperationFilters {
  libelleoperation?: string;
  commune?: string;
  annee?: number;
  departement?: string;
  status?: string;
}

// Export-related types
export interface ExportOptions {
  format: 'json' | 'excel';
  operationId?: string;
  includeAll?: boolean;
  sections?: string[];
}
