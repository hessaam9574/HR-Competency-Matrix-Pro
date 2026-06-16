
export type ImpactLevel = 'Input' | 'Process' | 'Product' | 'Output' | 'Outcome' | 'Impact';
export type FunctionLevel = 'Individual' | 'Team' | 'Organizational' | 'Social';
export type ImportanceLevel = 'Very High' | 'High' | 'Low' | 'Very Low';

export interface Competency {
  id: string;
  title: string;
  description?: string;
  impactLevel: ImpactLevel;
  functionLevel: FunctionLevel;
  icon?: string; // Added icon
}

export interface KPI {
  id: string;
  title: string;
  description?: string;
  icon?: string; // Added icon
}

export interface Job {
  id: string;
  title: string;
  kpis: KPI[];
  icon?: string; // Added icon
}

// The link between a KPI and a Competency
export interface KPIMapping {
  id: string;
  kpiId: string;
  competencyId: string;
  reasoning: string; // The "Strong Argument" mentioned in prompt
  roleType: 'Enabler' | 'Enhancer' | 'Critical'; // Based on PDF "Type of Role"
  importance: ImportanceLevel; // Added based on user request
}

export interface MatrixCellData {
  impact: ImpactLevel;
  function: FunctionLevel;
  competencies: Competency[];
}
