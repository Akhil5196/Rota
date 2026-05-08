import type { PMO, ImplementationLead, Week, Milestone, Account, AuditEntry, NoteEntry, FiredRule } from './types';

export function uid(): string { return Math.random().toString(36).slice(2, 9); }

function mkAudit(action: string, minsAgo = 0): AuditEntry {
  return { id: uid(), user: 'PMO Lead', action, ts: Date.now() - minsAgo * 60_000 };
}

function mkNote(text: string, minsAgo = 60): NoteEntry {
  return { id: uid(), text, user: 'PMO Lead', ts: Date.now() - minsAgo * 60_000 };
}

/** Map weekId → ISO date of the Monday that starts that week */
const WEEK_START: Record<string, string> = {
  w1:  '2026-04-06', w2:  '2026-04-13', w3:  '2026-04-20', w4:  '2026-04-27',
  w5:  '2026-05-04', w6:  '2026-05-11', w7:  '2026-05-18', w8:  '2026-05-25',
  w9:  '2026-06-01', w10: '2026-06-08', w11: '2026-06-15', w12: '2026-06-22',
  w13: '2026-06-29', w14: '2026-07-06',
};

/** Returns ISO date for the given weekday offset (0=Mon … 6=Sun) within a week. */
function planDay(weekId: string, offset: number): string {
  const base = new Date(WEEK_START[weekId] + 'T00:00:00');
  base.setDate(base.getDate() + (offset % 7));
  return base.toISOString().split('T')[0];
}

export const SEED_IMPL_LEADS: ImplementationLead[] = [
  { id: 'il1', name: 'Sarah Patel'     },
  { id: 'il2', name: 'James Osei'      },
  { id: 'il3', name: 'Nina Kovač'      },
  { id: 'il4', name: 'Ravi Nair'       },
  { id: 'il5', name: 'Priya Sharma'    },
  { id: 'il6', name: 'Tom Eriksson'    },
];

export const SEED_PMOS: PMO[] = [
  { id: 'p1', name: 'Alice Chen'      },
  { id: 'p2', name: 'Bob Martinez'    },
  { id: 'p3', name: 'Carol Wu'        },
  { id: 'p4', name: 'David Okafor'   },
  { id: 'p5', name: 'Emma Thompson'  },
  { id: 'p6', name: 'Frank Liu'       },
  { id: 'p7', name: 'Grace Kim'       },
];

export const SEED_WEEKS: Week[] = [
  { id: 'w1',  label: 'Apr 6–12, 2026',      startDate: '2026-04-06' },
  { id: 'w2',  label: 'Apr 13–19, 2026',     startDate: '2026-04-13' },
  { id: 'w3',  label: 'Apr 20–26, 2026',     startDate: '2026-04-20' },
  { id: 'w4',  label: 'Apr 27–May 3, 2026',  startDate: '2026-04-27' },
  { id: 'w5',  label: 'May 4–10, 2026',      startDate: '2026-05-04' },
  { id: 'w6',  label: 'May 11–17, 2026',     startDate: '2026-05-11' },
  { id: 'w7',  label: 'May 18–24, 2026',     startDate: '2026-05-18' },
  { id: 'w8',  label: 'May 25–31, 2026',     startDate: '2026-05-25' },
  { id: 'w9',  label: 'Jun 1–7, 2026',       startDate: '2026-06-01' },
  { id: 'w10', label: 'Jun 8–14, 2026',      startDate: '2026-06-08' },
  { id: 'w11', label: 'Jun 15–21, 2026',     startDate: '2026-06-15' },
  { id: 'w12', label: 'Jun 22–28, 2026',     startDate: '2026-06-22' },
  { id: 'w13', label: 'Jun 29–Jul 5, 2026',  startDate: '2026-06-29' },
  { id: 'w14', label: 'Jul 6–12, 2026',      startDate: '2026-07-06' },
];

/** All possible health rules from the rule engine. */
export const HEALTH_RULES: FiredRule[] = [
  { id:'koc-delay-needs-attention',       name:'KOC Arrangement Delay',                  severity:'needs-attention', description:'Kick-Off Call has not been arranged 13 days after deal closure, delaying onboarding initiation.' },
  { id:'koc-delay-minor',                 name:'KOC Arrangement Delay',                  severity:'minor-issue',     description:'Kick-Off Call has not been arranged 6 days after deal closure, delaying onboarding initiation.' },
  { id:'data-access-delay',               name:'Data Access Setup Delay',                severity:'needs-attention', description:'Data access was configured late. With Go Live planned within 35 days, this may impact go live timelines and overall readiness.' },
  { id:'sandbox-validation-delay',        name:'Sandbox Internal Validation Delay',      severity:'needs-attention', description:'Sandbox internal validation remains incomplete 3 days after delivery, delaying progress toward Go Live.' },
  { id:'ext-validation-critical',         name:'External Validation Pending',            severity:'critical',        description:'External Validation Call to initiate sandbox sign-off has not been completed. With Go Live planned within the next 15 days, this may limit time to address custom requirements, if any.' },
  { id:'ext-validation-needs-attention',  name:'External Validation Pending',            severity:'needs-attention', description:'External Validation Call to initiate sandbox sign-off has not been completed. With Go Live planned within the next 18 days, this may limit time to address custom requirements, if any.' },
  { id:'ext-validation-minor',            name:'External Validation Pending',            severity:'minor-issue',     description:'External Validation Call to initiate sandbox sign-off has not been completed. With Go Live planned within the next 21 days, this may limit time to address custom requirements, if any.' },
  { id:'deriviz-signoff-needs-attention', name:'Deriviz Client Portal Sign-off Pending', severity:'needs-attention', description:'Deriviz Client Portal sign-off has not been completed 3 days after External Sandbox Validation, which may limit time to address custom requirements, if any.' },
  { id:'deriviz-signoff-minor',           name:'Deriviz Client Portal Sign-off Pending', severity:'minor-issue',     description:'Deriviz Client Portal sign-off has not been completed 5 days after External Sandbox Validation, which may limit time to address custom requirements, if any.' },
  { id:'itl-date-critical',               name:'ITL Date Not Configured',                severity:'critical',        description:'Interim Live committed date is not configured. With Go Live in the next 14 days, this may delay timelines. Complete sandbox validation sign-off, if pending, to finalize the Interim Live date.' },
  { id:'itl-date-needs-attention',        name:'ITL Date Not Configured',                severity:'needs-attention', description:'Interim Live committed date is not configured. With Go Live in the next 21 days, this may delay timelines. Complete sandbox validation sign-off, if pending, to finalize the Interim Live date.' },
  { id:'itl-date-minor',                  name:'ITL Date Not Configured',                severity:'minor-issue',     description:'Interim Live committed date is not configured. With Go Live in the next 28 days, this may delay timelines. Complete sandbox validation sign-off, if pending, to finalize the Interim Live date.' },
  { id:'post-itl-setup-needs-attention',  name:'Post InterimLive Setup Delay',           severity:'needs-attention', description:'Interim Live setup has not been completed 5 days after delivery, which may impact the Go Live.' },
  { id:'post-itl-setup-minor',            name:'Post InterimLive Setup Delay',           severity:'minor-issue',     description:'Interim Live setup has not been completed 3 days after delivery, which may impact the Go Live.' },
  { id:'setup-approval-needs-attention',  name:'Setup Approval Delay',                   severity:'needs-attention', description:'Interim Live Setup is not approved yet. With Go Live approaching in 4 days, this may delay resolving setup issues.' },
  { id:'setup-approval-minor',            name:'Setup Approval Delay',                   severity:'minor-issue',     description:'Interim Live Setup is not approved yet. With Go Live approaching in 7 days, this may delay resolving setup issues.' },
];

/** Helper to look up rules by ID */
export function getRules(...ids: string[]): FiredRule[] {
  return ids.map(id => HEALTH_RULES.find(r => r.id === id)!).filter(Boolean);
}

export const SEED_MILESTONES: Milestone[] = [
  { id: 'ms1',  name: 'Pre Kick-Off Call',                  color: '#78716C', system: true },  // warm gray
  { id: 'ms2',  name: 'Kick-Off Call/Discovery Completed',  color: '#06B6D4', system: true },  // cyan
  { id: 'ms3',  name: 'Waiting for Sandbox',                color: '#9333EA', system: true },  // purple
  { id: 'ms4',  name: 'Sandbox Completed',                  color: '#0F766E', system: true },  // dark teal
  { id: 'ms5',  name: 'Internal SB Validation Completed',   color: '#D946EF', system: true },  // fuchsia
  { id: 'ms6',  name: 'Sandbox Signoff Received',           color: '#EC4899', system: true },  // pink
  { id: 'ms7',  name: 'Interim Live Completed',             color: '#4338CA', system: true },  // indigo
  { id: 'ms8',  name: 'Interim Live Setup Completed',       color: '#0E7490', system: true },  // dark cyan
  { id: 'ms9',  name: 'Interim Live Setup Approved',        color: '#A855F8', system: true },  // violet
  { id: 'ms10', name: 'Go-Live Completed',                  color: '#7E22CE', system: true },  // deep purple
] as Milestone[];

export const SEED_ACCOUNTS: Account[] = [
  // ── Week 1 ────────────────────────────────────────────────────────────────
  { id:'a1',  name:'Sunrise Health',        conversion:'Conversion 1', locations:['Sunrise Main [NHS]', 'Sunrise North', 'Sunrise West [NHS]'],  pms:'Dentally',  weekId:'w1',  pmoId:'p1', implementationLeadId:'il1', milestoneId:'ms5',  status:'on-track',        confirmed:true,  plannedDay:planDay('w1',0), notes:[mkNote('Key flagship account. Exec sponsor aligned.',        120)], audit:[mkAudit('Created', 120)] },
  { id:'a2',  name:'Valley Medical',        conversion:'Conversion 2', locations:['Valley Central', 'Valley East'],                          pms:'SoftDent',  weekId:'w1',  pmoId:'p1', implementationLeadId:'il2', milestoneId:'ms3',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w1',1), firedRules:getRules('koc-delay-minor','ext-validation-minor'),                                    notes:[mkNote('Training delayed due to staff availability.',          200)], audit:[mkAudit('Status changed', 25), mkAudit('Created', 200)] },
  { id:'a3',  name:'Cedar Clinic',          conversion:'Conversion 1', locations:['Cedar Loc 1 [NHS]', 'Cedar Loc 2 [NHS]', 'Cedar Loc 3', 'Cedar Loc 4'],pms:'Exact',    weekId:'w1',  pmoId:'p2', implementationLeadId:'il3', milestoneId:'ms5',  status:'critical',         confirmed:false, plannedDay:planDay('w1',2), firedRules:getRules('ext-validation-critical','itl-date-needs-attention'),                        notes:[mkNote('Integration sign-off pending from IT team.',            300)], audit:[mkAudit('Created', 300)] },
  { id:'a26', name:'Heritage Heart Ctr',    conversion:'Conversion 3', locations:['Heritage Main'],                                          pms:'Dentally',  weekId:'w1',  pmoId:'p5', implementationLeadId:'il4', milestoneId:'ms3',  status:'on-track',         confirmed:true,  plannedDay:planDay('w1',3), notes:[],                                                                    audit:[mkAudit('Created', 95)]  },
  { id:'a27', name:'Oakdale Women Health',  conversion:'Conversion 2', locations:['Oakdale North [NHS]', 'Oakdale South [NHS]', 'Oakdale Central'],pms:'CS R4',     weekId:'w1',  pmoId:'p6', implementationLeadId:'il5', milestoneId:'ms5',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w1',4), firedRules:getRules('sandbox-validation-delay','koc-delay-needs-attention'),                      notes:[mkNote('Waiting for data migration approval.',                 110)], audit:[mkAudit('Created', 110)] },
  // ── Week 2 ─────────────────────────────────────────────────────────────────
  { id:'a4',  name:'Northside Hospital',    conversion:'Conversion 1', locations:['Northside Main [NHS]', 'Northside Annex [NHS]'],          pms:'Dentally',  weekId:'w2',  pmoId:'p1', implementationLeadId:'il1', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w2',1), notes:[],                                                                    audit:[mkAudit('Created', 90)]  },
  { id:'a5',  name:'Lakeview Dental',       conversion:'Conversion 4', locations:['Lakeview Clinic'],                                        pms:'SoftDent',  weekId:'w2',  pmoId:'p2', implementationLeadId:'il2', milestoneId:'ms4',  status:'on-track',         confirmed:true,  plannedDay:planDay('w2',2), notes:[mkNote('Sandbox validation passed by UAT team.',                 150)], audit:[mkAudit('Created', 150)] },
  { id:'a6',  name:'Pinecrest Surgery',     conversion:'Conversion 2', locations:['Pinecrest Main', 'Pinecrest Day Surgery'],                pms:'Exact',     weekId:'w2',  pmoId:'p3', implementationLeadId:'il3', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w2',0), notes:[mkNote('Discovery calls completed.',                               60)], audit:[mkAudit('Created', 60)]  },
  { id:'a28', name:'Maplewood Pathology',   conversion:'Conversion 1', locations:['Maplewood Lab'],                                          pms:'Dentally',  weekId:'w2',  pmoId:'p7', implementationLeadId:'il6', milestoneId:'ms7',  status:'on-track',         confirmed:true,  plannedDay:planDay('w2',3), notes:[mkNote('Interim live sign-off received.',                          75)], audit:[mkAudit('Created', 75)]  },
  // ── Week 3 ─────────────────────────────────────────────────────────────────
  { id:'a7',  name:'Mountain View Med',     conversion:'Conversion 3', locations:['Mountain View Main [NHS]', 'Mountain View Satellite'],    pms:'CS R4',     weekId:'w3',  pmoId:'p1', implementationLeadId:'il4', milestoneId:'ms2',  status:'on-track',         confirmed:true,  plannedDay:planDay('w3',2), notes:[mkNote('Design phase on schedule.',                               45)], audit:[mkAudit('Created', 45)]  },
  { id:'a8',  name:'Riverdale Ortho',       conversion:'Conversion 2', locations:['Riverdale Ortho Loc 1', 'Riverdale Ortho Loc 2'],        pms:'SoftDent',  weekId:'w3',  pmoId:'p2', implementationLeadId:'il5', milestoneId:'ms5',  status:'critical',         confirmed:false, plannedDay:planDay('w3',4), firedRules:getRules('itl-date-critical','deriviz-signoff-needs-attention','ext-validation-needs-attention'), notes:[mkNote('Blocked on legacy system access.',                       500)], audit:[mkAudit('Moved from Week 1', 80), mkAudit('Created', 500)] },
  { id:'a9',  name:'Westside Pediatrics',   conversion:'Conversion 1', locations:['Westside Main', 'Westside Suburb', 'Westside East'],     pms:'Dentally',  weekId:'w3',  pmoId:'p4', implementationLeadId:'il1', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w3',0), notes:[],                                                                    audit:[mkAudit('Created', 70)]  },
  { id:'a29', name:'Elmgrove Neurology',    conversion:'Conversion 2', locations:['Elmgrove Neuro'],                                         pms:'Exact',     weekId:'w3',  pmoId:'p6', implementationLeadId:'il2', milestoneId:'ms3',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w3',1), firedRules:getRules('data-access-delay','deriviz-signoff-needs-attention'),                        notes:[mkNote('Resource constraint flagged.',                            130)], audit:[mkAudit('Created', 130)] },
  // ── Week 4 ──────────────────────────────────────────────────────────────────
  { id:'a10', name:'Harbor Cardiology',     conversion:'Conversion 2', locations:['Harbor Main', 'Harbor East'],                            pms:'SoftDent',  weekId:'w4',  pmoId:'p2', implementationLeadId:'il3', milestoneId:'ms3',  status:'minor-issue',      firedRules:getRules('ext-validation-minor','setup-approval-minor'),      confirmed:false, plannedDay:planDay('w4',3), notes:[mkNote('Vendor dependency slowing progress.',                    240)], audit:[mkAudit('Created', 240)] },
  { id:'a11', name:'Summit Radiology',      conversion:'Conversion 1', locations:['Summit Central'],                                        pms:'Dentally',  weekId:'w4',  pmoId:'p3', implementationLeadId:'il6', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w4',2), notes:[],                                                                    audit:[mkAudit('Created', 85)]  },
  { id:'a12', name:'Bayshore ENT',          conversion:'Conversion 3', locations:['Bayshore Clinic', 'Bayshore North', 'Bayshore West'],    pms:'Exact',     weekId:'w4',  pmoId:'p4', implementationLeadId:'il4', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w4',1), notes:[mkNote('Discovery kickoff scheduled.',                             55)], audit:[mkAudit('Created', 55)]  },
  { id:'a30', name:'Crestview Endocrine',   conversion:'Conversion 4', locations:['Crestview Main'],                                        pms:'CS R4',     weekId:'w4',  pmoId:'p5', implementationLeadId:'il5', milestoneId:'ms5',  status:'critical',         firedRules:getRules('ext-validation-critical','itl-date-critical'),         confirmed:false, plannedDay:planDay('w4',4), notes:[mkNote('Clinical lead unavailable until next month.',             160)], audit:[mkAudit('Created', 160)] },
  // ── Week 5 ──────────────────────────────────────────────────────────────────
  { id:'a13', name:'Pacific Urology',       conversion:'Conversion 1', locations:['Pacific Main', 'Pacific Day Procedure'],                 pms:'SOE',       weekId:'w5',  pmoId:'p1', implementationLeadId:'il1', milestoneId:'ms5',  status:'needs-attention',  firedRules:getRules('post-itl-setup-needs-attention','itl-date-needs-attention'),  confirmed:true,  plannedDay:planDay('w5',0), notes:[mkNote('Go-live date firm, resource risk remains.',              180)], audit:[mkAudit('Created', 180)] },
  { id:'a14', name:'Coastal Dermatology',   conversion:'Conversion 2', locations:['Coastal Clinic'],                                        pms:'Dentally',  weekId:'w5',  pmoId:'p3', implementationLeadId:'il3', milestoneId:'ms10', status:'on-track',         confirmed:true,  plannedDay:planDay('w5',2), notes:[mkNote('Go-live completed successfully.',                          22)], audit:[mkAudit('Created', 22)]  },
  { id:'a31', name:'Fairview Sports Med',   conversion:'Conversion 3', locations:['Fairview Sports', 'Fairview Physio'],                    pms:'SoftDent',  weekId:'w5',  pmoId:'p7', implementationLeadId:'il6', milestoneId:'ms2',  status:'on-track',         confirmed:true,  plannedDay:planDay('w5',3), notes:[mkNote('Design phase progressing well.',                          40)], audit:[mkAudit('Created', 40)]  },
  // ── Week 6 ─────────────────────────────────────────────────────────────────
  { id:'a15', name:'Foothills Family Med',  conversion:'Conversion 1', locations:['Foothills Main', 'Foothills Annex'],                     pms:'Exact',     weekId:'w6',  pmoId:'p4', implementationLeadId:'il2', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w6',1), notes:[],                                                                    audit:[mkAudit('Created', 10)]  },
  { id:'a32', name:'Brookside Hematology',  conversion:'Conversion 2', locations:['Brookside Lab'],                                         pms:'CS R4',     weekId:'w6',  pmoId:'p6', implementationLeadId:'il4', milestoneId:'ms5',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w6',4), firedRules:getRules('deriviz-signoff-minor','koc-delay-minor'),                                                                           notes:[mkNote('Contract amendment required.',                              50)], audit:[mkAudit('Created', 50)]  },
  { id:'a33', name:'Clearwater Rehab',      conversion:'Conversion 4', locations:['Clearwater Rehab Centre', 'Clearwater Outpatient'],      pms:'Dentally',  weekId:'w6',  pmoId:'p5', implementationLeadId:'il5', milestoneId:'ms8',  status:'on-track',         confirmed:true,  plannedDay:planDay('w6',0), notes:[mkNote('System setup and config completed.',                       30)], audit:[mkAudit('Created', 30)]  },
  // ── Week 7 ─────────────────────────────────────────────────────────────────
  { id:'a16', name:'Greenfield Neurology',  conversion:'Conversion 1', locations:['Greenfield Neuro', 'Greenfield Memory Clinic'],          pms:'SOE',       weekId:'w7',  pmoId:'p5', implementationLeadId:'il1', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w7',2), notes:[],                                                                    audit:[mkAudit('Created', 20)]  },
  { id:'a17', name:'Elmwood Oncology',      conversion:'Conversion 3', locations:['Elmwood Cancer Centre'],                                 pms:'SoftDent',  weekId:'w7',  pmoId:'p6', implementationLeadId:'il3', milestoneId:'ms3',  status:'needs-attention',  firedRules:getRules('itl-date-needs-attention','setup-approval-needs-attention'),  confirmed:false, plannedDay:planDay('w7',3), notes:[mkNote('Training cohort size reduced.',                             35)], audit:[mkAudit('Created', 35)]  },
  { id:'a18', name:'Highpoint Psychiatry',  conversion:'Conversion 2', locations:['Highpoint Mental Health'],                               pms:'Exact',     weekId:'w7',  pmoId:'p7', implementationLeadId:'il6', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w7',1), notes:[],                                                                    audit:[mkAudit('Created', 15)]  },
  { id:'a34', name:'Ridgemont Rheumatology',conversion:'Conversion 1', locations:['Ridgemont Rheum', 'Ridgemont Joint Clinic'],             pms:'CS R4',     weekId:'w7',  pmoId:'p2', implementationLeadId:'il2', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w7',4), notes:[mkNote('Discovery phase starting.',                                 60)], audit:[mkAudit('Created', 60)]  },
  // ── Week 8 ──────────────────────────────────────────────────────────────────
  { id:'a19', name:'Brentwood Urgent Care', conversion:'Conversion 4', locations:['Brentwood UC Main'],                                     pms:'Dentally',  weekId:'w8',  pmoId:'p5', implementationLeadId:'il5', milestoneId:'ms5',  status:'critical',         firedRules:getRules('itl-date-critical','ext-validation-critical'),         confirmed:false, plannedDay:planDay('w8',0), notes:[mkNote('Awaiting network infrastructure upgrade.',                  25)], audit:[mkAudit('Created', 25)]  },
  { id:'a20', name:'Lakeland Nephrology',   conversion:'Conversion 2', locations:['Lakeland Renal Unit', 'Lakeland Dialysis'],              pms:'SOE',       weekId:'w8',  pmoId:'p7', implementationLeadId:'il4', milestoneId:'ms2',  status:'on-track',         confirmed:true,  plannedDay:planDay('w8',2), notes:[],                                                                    audit:[mkAudit('Created', 18)]  },
  { id:'a35', name:'Sycamore Ophthalmology',conversion:'Conversion 1', locations:['Sycamore Eye Clinic'],                                   pms:'SoftDent',  weekId:'w8',  pmoId:'p3', implementationLeadId:'il1', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w8',3), notes:[],                                                                    audit:[mkAudit('Created', 45)]  },
  // ── Week 9 ───────────────────────────────────────────────────────────────────
  { id:'a21', name:'Ridgemont Surgery',     conversion:'Conversion 3', locations:['Ridgemont Day Surgery', 'Ridgemont Surgical Hub'],       pms:'Exact',     weekId:'w9',  pmoId:'p2', implementationLeadId:'il2', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w9',1), notes:[],                                                                    audit:[mkAudit('Created', 12)]  },
  { id:'a22', name:'Valleyview Pulmonology',conversion:'Conversion 2', locations:['Valleyview Resp Clinic'],                                pms:'CS R4',     weekId:'w9',  pmoId:'p6', implementationLeadId:'il3', milestoneId:'ms3',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w9',4), firedRules:getRules('ext-validation-minor'),                                                                                          notes:[mkNote('Pending sign-off from clinical governance.',                  8)], audit:[mkAudit('Created', 8)]   },
  { id:'a36', name:'Pinehurst Geriatrics',  conversion:'Conversion 1', locations:['Pinehurst Aged Care', 'Pinehurst Memory Unit'],          pms:'Dentally',  weekId:'w9',  pmoId:'p4', implementationLeadId:'il6', milestoneId:'ms8',  status:'on-track',         confirmed:true,  plannedDay:planDay('w9',2), notes:[],                                                                    audit:[mkAudit('Created', 5)]   },
  // ── Week 10 ─────────────────────────────────────────────────────────────────
  { id:'a23', name:'Sunridge Gastro',        conversion:'Conversion 4', locations:['Sunridge GI Clinic'],                                   pms:'SOE',       weekId:'w10', pmoId:'p3', implementationLeadId:'il4', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w10',0), notes:[mkNote('Early discovery stage.',                                      3)], audit:[mkAudit('Created', 3)]   },
  { id:'a24', name:'Thornton Allergy',       conversion:'Conversion 2', locations:['Thornton Allergy Centre', 'Thornton Immunology'],       pms:'SoftDent',  weekId:'w10', pmoId:'p5', implementationLeadId:'il5', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w10',3), notes:[],                                                                     audit:[mkAudit('Created', 2)]   },
  { id:'a37', name:'Westbrook Cardiology',   conversion:'Conversion 3', locations:['Westbrook Heart Clinic'],                               pms:'Exact',     weekId:'w10', pmoId:'p1', implementationLeadId:'il1', milestoneId:'ms2',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w10',1), firedRules:getRules('data-access-delay','itl-date-needs-attention'),                                                                      notes:[mkNote('Risk: cardiologist champion leaving organisation.',             1)], audit:[mkAudit('Created', 1)]   },
  // ── Extra – Week 1 ─────────────────────────────────────────────────────────
  { id:'a38', name:'Riverbank Womens Clinic',conversion:'Conversion 1', locations:['Riverbank Women', 'Riverbank Maternity'],               pms:'CS R4',     weekId:'w1',  pmoId:'p3', implementationLeadId:'il6', milestoneId:'ms2',  status:'on-track',         confirmed:true,  plannedDay:planDay('w1',1), notes:[],                                                                     audit:[mkAudit('Created', 88)]  },
  { id:'a39', name:'Metro Urgent Care',      conversion:'Conversion 2', locations:['Metro UC City', 'Metro UC North', 'Metro UC West'],     pms:'Dentally',  weekId:'w1',  pmoId:'p4', implementationLeadId:'il2', milestoneId:'ms5',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w1',3), firedRules:getRules('koc-delay-minor'),                                                                                                   notes:[mkNote('Funding approval delayed.',                                    72)], audit:[mkAudit('Created', 240)] },
  // ── Extra – Week 2 ─────────────────────────────────────────────────────────
  { id:'a40', name:'Harbour View Hospital',  conversion:'Conversion 3', locations:['Harbour View Main [NHS]', 'Harbour View Specialist [NHS]'],pms:'SOE',       weekId:'w2',  pmoId:'p4', implementationLeadId:'il5', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w2',4), notes:[],                                                                     audit:[mkAudit('Created', 50)]  },
  { id:'a41', name:'Sunrise Maternity',      conversion:'Conversion 1', locations:['Sunrise Birth Centre'],                                 pms:'SoftDent',  weekId:'w2',  pmoId:'p5', implementationLeadId:'il3', milestoneId:'ms3',  status:'critical',         confirmed:false, plannedDay:planDay('w2',1), firedRules:getRules('ext-validation-critical','itl-date-critical'),                                                                        notes:[mkNote('IT firewall blocking test environments.',                      100)], audit:[mkAudit('Created', 180)] },
  // ── Extra – Week 3 ─────────────────────────────────────────────────────────
  { id:'a42', name:'Cypress Health Network', conversion:'Conversion 4', locations:['Cypress Loc 1', 'Cypress Loc 2', 'Cypress Loc 3'],     pms:'Exact',     weekId:'w3',  pmoId:'p3', implementationLeadId:'il6', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w3',3), notes:[],                                                                     audit:[mkAudit('Created', 30)]  },
  { id:'a43', name:'Lakeside Urgent Care',   conversion:'Conversion 2', locations:['Lakeside UC'],                                          pms:'CS R4',     weekId:'w3',  pmoId:'p5', implementationLeadId:'il4', milestoneId:'ms6',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w3',0), firedRules:getRules('sandbox-validation-delay','koc-delay-needs-attention'),                                                               notes:[mkNote('Staffing gap identified.',                                     55)], audit:[mkAudit('Created', 90)]  },
  { id:'a44', name:'Northgate Eye Centre',   conversion:'Conversion 1', locations:['Northgate Eye', 'Northgate Optical'],                   pms:'Dentally',  weekId:'w3',  pmoId:'p7', implementationLeadId:'il2', milestoneId:'ms3',  status:'on-track',         confirmed:true,  plannedDay:planDay('w3',2), notes:[],                                                                     audit:[mkAudit('Created', 15)]  },
  // ── Extra – Week 4 ─────────────────────────────────────────────────────────
  { id:'a45', name:'Cedarwood Dialysis',     conversion:'Conversion 3', locations:['Cedarwood Renal'],                                      pms:'SOE',       weekId:'w4',  pmoId:'p1', implementationLeadId:'il5', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w4',0), notes:[],                                                                     audit:[mkAudit('Created', 65)]  },
  { id:'a46', name:'Valley Spine Clinic',    conversion:'Conversion 2', locations:['Valley Spine', 'Valley Pain Management'],               pms:'SoftDent',  weekId:'w4',  pmoId:'p6', implementationLeadId:'il1', milestoneId:'ms2',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w4',2), firedRules:getRules('deriviz-signoff-minor'),                                                                                              notes:[mkNote('Consultant availability uncertain.',                           40)], audit:[mkAudit('Created', 120)] },
  // ── Extra – Week 5 ─────────────────────────────────────────────────────────
  { id:'a47', name:'Willowbrook Paediatrics',conversion:'Conversion 1', locations:['Will Loc 1 [NHS]', 'Will Loc 2 [NHS]', 'Will Loc 3'],   pms:'Dentally',  weekId:'w5',  pmoId:'p2', implementationLeadId:'il4', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w5',1), notes:[],                                                                     audit:[mkAudit('Created', 20)]  },
  { id:'a48', name:'Westfield Cancer Centre',conversion:'Conversion 4', locations:['Westfield Oncology', 'Westfield Radiation'],            pms:'Exact',     weekId:'w5',  pmoId:'p4', implementationLeadId:'il6', milestoneId:'ms3',  status:'critical',         confirmed:false, plannedDay:planDay('w5',4), firedRules:getRules('itl-date-critical','ext-validation-critical'),                                                                         notes:[mkNote('Data governance review pending.',                              90)], audit:[mkAudit('Created', 150)] },
  { id:'a49', name:'Maple Grove Pharmacy',   conversion:'Conversion 2', locations:['Maple Grove Dispensary'],                               pms:'CS R4',     weekId:'w5',  pmoId:'p6', implementationLeadId:'il2', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w5',2), notes:[],                                                                     audit:[mkAudit('Created', 35)]  },
  // ── Extra – Week 6 ─────────────────────────────────────────────────────────
  { id:'a50', name:'Birchwood Oncology',     conversion:'Conversion 3', locations:['Birchwood Cancer Ctr'],                                 pms:'Dentally',  weekId:'w6',  pmoId:'p1', implementationLeadId:'il3', milestoneId:'ms3',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w6',3), firedRules:getRules('data-access-delay'),                                                                                                   notes:[mkNote('Key sponsor on leave.',                                        25)], audit:[mkAudit('Created', 80)]  },
  { id:'a51', name:'Silverstone Mental Hlth',conversion:'Conversion 1', locations:['Silverstone MH', 'Silverstone Crisis Unit'],            pms:'SOE',       weekId:'w6',  pmoId:'p3', implementationLeadId:'il1', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w6',2), notes:[],                                                                     audit:[mkAudit('Created', 45)]  },
  { id:'a52', name:'Pebble Creek Day Surgery',conversion:'Conversion 2',locations:['Pebble Creek DS'],                                      pms:'SoftDent',  weekId:'w6',  pmoId:'p7', implementationLeadId:'il5', milestoneId:'ms6',  status:'on-track',         confirmed:true,  plannedDay:planDay('w6',4), notes:[],                                                                     audit:[mkAudit('Created', 18)]  },
  // ── Extra – Week 7 ─────────────────────────────────────────────────────────
  { id:'a53', name:'Sunset Rehabilitation',  conversion:'Conversion 4', locations:['Sunset Rehab', 'Sunset Physio', 'Sunset OT'],          pms:'Exact',     weekId:'w7',  pmoId:'p1', implementationLeadId:'il4', milestoneId:'ms6',  status:'on-track',         confirmed:true,  plannedDay:planDay('w7',0), notes:[],                                                                     audit:[mkAudit('Created', 55)]  },
  { id:'a54', name:'Clifton Vascular Centre',conversion:'Conversion 1', locations:['Clifton Vascular'],                                     pms:'CS R4',     weekId:'w7',  pmoId:'p4', implementationLeadId:'il6', milestoneId:'ms5',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w7',3), firedRules:getRules('koc-delay-minor','itl-date-minor'),                                                                                   notes:[mkNote('Legacy billing system conflict.',                              30)], audit:[mkAudit('Created', 100)] },
  // ── Extra – Week 8 ─────────────────────────────────────────────────────────
  { id:'a55', name:'Harbour Maternity Unit', conversion:'Conversion 2', locations:['Harbour Birth Unit', 'Harbour NICU'],                   pms:'Dentally',  weekId:'w8',  pmoId:'p1', implementationLeadId:'il2', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w8',1), notes:[],                                                                     audit:[mkAudit('Created', 22)]  },
  { id:'a56', name:'Highland Physiotherapy', conversion:'Conversion 3', locations:['Highland Physio Main'],                                 pms:'SOE',       weekId:'w8',  pmoId:'p4', implementationLeadId:'il3', milestoneId:'ms3',  status:'critical',         confirmed:false, plannedDay:planDay('w8',4), firedRules:getRules('itl-date-critical','ext-validation-critical'),                                                                        notes:[mkNote('Budget freeze announced.',                                     65)], audit:[mkAudit('Created', 110)] },
  { id:'a57', name:'Greenway Diagnostics',   conversion:'Conversion 1', locations:['Greenway Imaging', 'Greenway Pathology'],               pms:'SoftDent',  weekId:'w8',  pmoId:'p6', implementationLeadId:'il6', milestoneId:'ms2',  status:'on-track',         confirmed:false, plannedDay:planDay('w8',2), notes:[],                                                                     audit:[mkAudit('Created', 14)]  },
  // ── Extra – Week 9 ─────────────────────────────────────────────────────────
  { id:'a58', name:'Stonegate Sleep Clinic', conversion:'Conversion 4', locations:['Stonegate Sleep'],                                      pms:'Exact',     weekId:'w9',  pmoId:'p3', implementationLeadId:'il5', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w9',0), notes:[],                                                                     audit:[mkAudit('Created', 9)]   },
  { id:'a59', name:'Clearview Urology',      conversion:'Conversion 2', locations:['Clearview Urology', 'Clearview Stone Clinic'],          pms:'CS R4',     weekId:'w9',  pmoId:'p5', implementationLeadId:'il4', milestoneId:'ms6',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w9',3), firedRules:getRules('post-itl-setup-needs-attention'),                                                                                      notes:[mkNote('Third-party integration delayed.',                             6)], audit:[mkAudit('Created', 7)]   },
  { id:'a60', name:'Willow Springs Hospice', conversion:'Conversion 1', locations:['Willow Springs'],                                       pms:'Dentally',  weekId:'w9',  pmoId:'p7', implementationLeadId:'il1', milestoneId:'ms3',  status:'on-track',         confirmed:true,  plannedDay:planDay('w9',1), notes:[],                                                                     audit:[mkAudit('Created', 4)]   },
  // ── Extra – Week 10 ────────────────────────────────────────────────────────
  { id:'a61', name:'Oceanview Fertility',    conversion:'Conversion 3', locations:['Oceanview IVF', 'Oceanview Endocrine'],                 pms:'SOE',       weekId:'w10', pmoId:'p2', implementationLeadId:'il3', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w10',2), notes:[],                                                                      audit:[mkAudit('Created', 2)]   },
  { id:'a62', name:'Crescent Immunology',    conversion:'Conversion 2', locations:['Crescent Allergy Clinic'],                              pms:'SoftDent',  weekId:'w10', pmoId:'p4', implementationLeadId:'il6', milestoneId:'ms5',  status:'critical',         confirmed:false, plannedDay:planDay('w10',4), firedRules:getRules('ext-validation-critical','itl-date-needs-attention'),                                                                  notes:[mkNote('Regulatory approval pending.',                                  1)], audit:[mkAudit('Created', 1)]   },
  { id:'a63', name:'Pineview Paediatric ICU',conversion:'Conversion 4', locations:['Pineview PICU', 'Pineview Neonatal'],                   pms:'Exact',     weekId:'w10', pmoId:'p6', implementationLeadId:'il2', milestoneId:'ms6',  status:'on-track',         confirmed:true,  plannedDay:planDay('w10',3), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  // ── Week 11 ─────────────────────────────────────────────────────────────────
  { id:'a64', name:'Northbrook Haematology', conversion:'Conversion 1', locations:['Northbrook Haem [NHS]', 'Northbrook Infusion [NHS]'],    pms:'CS R4',     weekId:'w11', pmoId:'p1', implementationLeadId:'il4', milestoneId:'ms2',  status:'on-track',         confirmed:true,  plannedDay:planDay('w11',0), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a65', name:'Southgate Renal Unit',   conversion:'Conversion 2', locations:['Southgate Renal'],                                      pms:'Dentally',  weekId:'w11', pmoId:'p3', implementationLeadId:'il2', milestoneId:'ms3',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w11',2), firedRules:getRules('itl-date-minor'),                                                                                                     notes:[mkNote('Dependency on network upgrade unresolved.',                     1)], audit:[mkAudit('Created', 1)]   },
  { id:'a66', name:'Whitehaven Orthopedics', conversion:'Conversion 3', locations:['Whitehaven Ortho', 'Whitehaven Sports Med'],            pms:'SOE',       weekId:'w11', pmoId:'p5', implementationLeadId:'il5', milestoneId:'ms9',  status:'on-track',         confirmed:true,  plannedDay:planDay('w11',4), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a67', name:'Redwood Oncology Hub',   conversion:'Conversion 1', locations:['Redwood Cancer Ctr'],                                   pms:'SoftDent',  weekId:'w11', pmoId:'p7', implementationLeadId:'il6', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w11',1), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  // ── w11 over-allocation test data (Mon ×5 exceeds 4; Tue ×2 exceeds 1) ──
  { id:'a80', name:'Briarwood Surgical',     conversion:'Conversion 2', locations:['Briarwood Main'],                                        pms:'Dentally',  weekId:'w11', pmoId:'p2', implementationLeadId:'il1', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w11',0), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a81', name:'Elmfield Cardiology',    conversion:'Conversion 3', locations:['Elmfield Heart'],                                        pms:'Exact',     weekId:'w11', pmoId:'p3', implementationLeadId:'il3', milestoneId:'ms3',  status:'on-track',         confirmed:true,  plannedDay:planDay('w11',0), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a82', name:'Stoneleigh Respiratory', conversion:'Conversion 1', locations:['Stoneleigh Resp [NHS]'],                                 pms:'CS R4',     weekId:'w11', pmoId:'p4', implementationLeadId:'il4', milestoneId:'ms7',  status:'on-track',         confirmed:false, plannedDay:planDay('w11',0), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a83', name:'Gardenview Oncology',    conversion:'Conversion 4', locations:['Gardenview Cancer Ctr', 'Gardenview Satellite'],         pms:'SOE',       weekId:'w11', pmoId:'p6', implementationLeadId:'il2', milestoneId:'ms2',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w11',0), firedRules:getRules('koc-delay-minor'),                                    notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a84', name:'Peakside ENT Centre',    conversion:'Conversion 2', locations:['Peakside ENT'],                                         pms:'SoftDent',  weekId:'w11', pmoId:'p5', implementationLeadId:'il5', milestoneId:'ms4',  status:'on-track',         confirmed:true,  plannedDay:planDay('w11',1), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  // ── Week 12 ─────────────────────────────────────────────────────────────────
  { id:'a68', name:'Lakefront Cardiothoracic',conversion:'Conversion 4',locations:['Lakefront Heart', 'Lakefront Thoracic'],                pms:'Exact',     weekId:'w12', pmoId:'p2', implementationLeadId:'il1', milestoneId:'ms3',  status:'on-track',         confirmed:true,  plannedDay:planDay('w12',1), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a69', name:'Meadow Ridge Endoscopy', conversion:'Conversion 2', locations:['Meadow Ridge GI'],                                      pms:'CS R4',     weekId:'w12', pmoId:'p4', implementationLeadId:'il3', milestoneId:'ms2',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w12',3), firedRules:getRules('setup-approval-needs-attention'),                                                                                      notes:[mkNote('Lead consultant on extended leave.',                            1)], audit:[mkAudit('Created', 1)]   },
  { id:'a70', name:'Clearfield Dermatology', conversion:'Conversion 1', locations:['Clearfield Derm', 'Clearfield Laser Clinic'],           pms:'Dentally',  weekId:'w12', pmoId:'p6', implementationLeadId:'il4', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w12',0), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a71', name:'Stonebridge Women\'s Hlth',conversion:'Conversion 3',locations:['Stonebridge Women'],                                   pms:'SOE',       weekId:'w12', pmoId:'p1', implementationLeadId:'il6', milestoneId:'ms6',  status:'critical',         confirmed:false, plannedDay:planDay('w12',4), firedRules:getRules('itl-date-critical','ext-validation-critical'),                                                                        notes:[mkNote('IT infrastructure not ready.',                                 1)], audit:[mkAudit('Created', 1)]   },
  // ── Week 13 ─────────────────────────────────────────────────────────────────
  { id:'a72', name:'Ashford Neurovascular',   conversion:'Conversion 2', locations:['Ashford Neuro', 'Ashford Stroke Unit'],                pms:'SoftDent',  weekId:'w13', pmoId:'p2', implementationLeadId:'il2', milestoneId:'ms1',  status:'on-track',         confirmed:false, plannedDay:planDay('w13',0), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a73', name:'Ferndale Breast Clinic',  conversion:'Conversion 4', locations:['Ferndale Breast Screening'],                           pms:'Exact',     weekId:'w13', pmoId:'p4', implementationLeadId:'il5', milestoneId:'ms3',  status:'on-track',         confirmed:true,  plannedDay:planDay('w13',2), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a74', name:'Glenwood Spine Centre',   conversion:'Conversion 1', locations:['Glenwood Spine', 'Glenwood Pain Clinic'],              pms:'CS R4',     weekId:'w13', pmoId:'p6', implementationLeadId:'il1', milestoneId:'ms5',  status:'minor-issue',      confirmed:false, plannedDay:planDay('w13',3), firedRules:getRules('ext-validation-minor','deriviz-signoff-minor'),                                                                        notes:[mkNote('Surgeon sign-off still outstanding.',                           1)], audit:[mkAudit('Created', 1)]   },
  { id:'a75', name:'Harborside Geriatrics',   conversion:'Conversion 2', locations:['Harborside Aged Care'],                                pms:'Dentally',  weekId:'w13', pmoId:'p7', implementationLeadId:'il3', milestoneId:'ms2',  status:'on-track',         confirmed:true,  plannedDay:planDay('w13',1), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  // ── Week 14 ─────────────────────────────────────────────────────────────────
  { id:'a76', name:'Ivywood Respiratory',     conversion:'Conversion 3', locations:['Ivywood Resp', 'Ivywood Sleep Unit'],                  pms:'SOE',       weekId:'w14', pmoId:'p1', implementationLeadId:'il4', milestoneId:'ms2',  status:'on-track',         confirmed:true,  plannedDay:planDay('w14',0), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a77', name:'Juniper Falls Urology',   conversion:'Conversion 1', locations:['Juniper Falls UC'],                                    pms:'SoftDent',  weekId:'w14', pmoId:'p3', implementationLeadId:'il6', milestoneId:'ms3',  status:'critical',         confirmed:false, plannedDay:planDay('w14',2), firedRules:getRules('ext-validation-critical','itl-date-critical'),                                                                        notes:[mkNote('Awaiting vendor access credentials.',                           1)], audit:[mkAudit('Created', 1)]   },
  { id:'a78', name:'Kingsway Endocrinology',  conversion:'Conversion 2', locations:['Kingsway Endocrine', 'Kingsway Diabetes Centre'],      pms:'Exact',     weekId:'w14', pmoId:'p5', implementationLeadId:'il2', milestoneId:'ms5',  status:'on-track',         confirmed:true,  plannedDay:planDay('w14',4), notes:[],                                                                      audit:[mkAudit('Created', 1)]   },
  { id:'a79', name:'Larchmont Wound Care',    conversion:'Conversion 4', locations:['Larchmont Wound Clinic'],                              pms:'CS R4',     weekId:'w14', pmoId:'p7', implementationLeadId:'il5', milestoneId:'ms1',  status:'needs-attention',  confirmed:false, plannedDay:planDay('w14',1), firedRules:getRules('post-itl-setup-needs-attention','itl-date-needs-attention'),                                                             notes:[mkNote('Staffing shortfall in training cohort.',                        1)], audit:[mkAudit('Created', 1)]   },
];

export const STATUS_OPTS = [
  { value: 'on-track'        as const, label: 'On Track'        },
  { value: 'minor-issue'     as const, label: 'Minor Issue'     },
  { value: 'needs-attention' as const, label: 'Needs Attention' },
  { value: 'critical'        as const, label: 'Critical'        },
];

export const MILESTONE_COLORS: Record<string, { bg: string; dot: string; border: string }> = {
  // 12 visually distinct options
  blue:    { bg: 'rgba(54,133,191,0.12)',  dot: '#3685BF', border: 'rgba(54,133,191,0.28)'   },
  indigo:  { bg: 'rgba(79,70,229,0.10)',   dot: '#4338CA', border: 'rgba(79,70,229,0.25)'    },
  violet:  { bg: 'rgba(139,92,246,0.10)',  dot: '#7C3AED', border: 'rgba(139,92,246,0.25)'   },
  pink:    { bg: 'rgba(219,39,119,0.10)',  dot: '#DB2777', border: 'rgba(219,39,119,0.25)'   },
  red:     { bg: 'rgba(220,38,38,0.10)',   dot: '#DC2626', border: 'rgba(220,38,38,0.25)'    },
  orange:  { bg: 'rgba(234,88,12,0.10)',   dot: '#EA580C', border: 'rgba(234,88,12,0.25)'    },
  amber:   { bg: 'rgba(217,119,6,0.10)',   dot: '#D97706', border: 'rgba(217,119,6,0.25)'    },
  yellow:  { bg: 'rgba(202,138,4,0.10)',   dot: '#CA8A04', border: 'rgba(202,138,4,0.25)'    },
  lime:    { bg: 'rgba(101,163,13,0.10)',  dot: '#65A30D', border: 'rgba(101,163,13,0.25)'   },
  green:   { bg: 'rgba(22,163,74,0.10)',   dot: '#16A34A', border: 'rgba(22,163,74,0.25)'    },
  teal:    { bg: 'rgba(13,148,136,0.10)',  dot: '#0D9488', border: 'rgba(13,148,136,0.25)'   },
  slate:   { bg: 'rgba(71,85,105,0.10)',   dot: '#475569', border: 'rgba(71,85,105,0.25)'    },
};

export const STATUS_COLORS: Record<string, string> = {
  'on-track':        '#00772E',
  'minor-issue':     '#3B82F6',
  'needs-attention': '#F59E0B', 
  'critical':        '#CD1C18',
};

/** Returns bg / dot / border for any milestone color.
 *  Accepts a named preset key ('blue', 'teal' …) or a free hex string ('#A3E635'). */
export function getMilestonePalette(color: string): { bg: string; dot: string; border: string } {
  if (MILESTONE_COLORS[color]) return MILESTONE_COLORS[color];
  if (color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return {
      dot:    color,
      bg:     `rgba(${r},${g},${b},0.10)`,
      border: `rgba(${r},${g},${b},0.25)`,
    };
  }
  return MILESTONE_COLORS.blue;
}

export function relTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000)     return 'just now';
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}
