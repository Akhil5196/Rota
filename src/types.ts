export type Status       = 'on-track' | 'minor-issue' | 'needs-attention' | 'critical';
export type Confirmation = 'all' | 'confirmed' | 'tentative';
export type ViewMode     = 'pmo' | 'impl-lead';

export interface PMO {
  id: string;
  name: string;
}

export interface ImplementationLead {
  id: string;
  name: string;
}

export interface Week {
  id: string;
  label: string;
  startDate: string; // ISO date of the Monday that starts this week, e.g. '2026-04-07'
}

export interface NoteEntry {
  id: string;
  text: string;
  user: string;
  ts: number;
}

export interface Milestone {
  id: string;
  name: string;
  color: MilestoneColor;
  system?: boolean; // true = protected; cannot be edited or deleted
}

/** Named preset key (e.g. 'blue') or free hex string (e.g. '#3685BF') */
export type MilestoneColor = string;

export interface FiredRule {
  id:          string;
  name:        string;
  description: string;
  severity:    Status;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  ts: number;
}

export interface Account {
  id: string;
  name: string;          // Account name (display only — fetched from source system)
  conversion?: string;   // Conversion label, e.g. "Conversion 1"
  locations?: string[];  // Location names belonging to this account
  pms?: string;          // Practice Management System, e.g. "Dentally"
  weekId: string;
  pmoId: string;
  implementationLeadId: string;
  milestoneId: string;    // Set by system triggers — display only
  status: Status;         // Set by rule engine — highest severity of firedRules
  firedRules?: FiredRule[]; // Rules currently triggered for this account
  confirmed: boolean;
  plannedDay: string;    // ISO date string e.g. '2026-04-07', or '' if unset
  notes: NoteEntry[];    // newest-first list of saved notes
  audit: AuditEntry[];
}

export type Region = 'AU' | 'US' | 'UK';

export interface Filters {
  search: string;
  statuses: Status[];
  pmoIds: string[];
  implLeadIds: string[];
  milestoneIds: string[];
  fromWeek: string;
  toWeek: string;
  dayDate: string;             // ISO date string, '' = no filter
  dayMode: 'day' | 'week';     // how dayDate is interpreted when filtering
  region: Region;
}

/** Only the fields the user can manually edit in the side panel */
export interface AccountDraft {
  pmoId: string;
  implementationLeadId: string;
  weekId: string;
  plannedDay: string;
  confirmed: boolean;
  notes: string;         // new comment to prepend; cleared after save
}

export interface DragState {
  accountId: string;
  fromWeekId: string;
  fromColumnId: string;
  viewMode: ViewMode;
}
