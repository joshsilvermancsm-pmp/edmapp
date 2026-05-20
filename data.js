// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────

const DEFAULTS = {
  projects: [
    {id:1,name:'Platform Migration',owner:'J. Torres',status:'On Track',progress:72,due:'2026-07-15',budget:250000,spent:180000,notes:''},
    {id:2,name:'API Gateway v2',owner:'R. Patel',status:'On Track',progress:55,due:'2026-08-01',budget:120000,spent:66000,notes:''},
    {id:3,name:'Data Warehouse Modernization',owner:'S. Kim',status:'At Risk',progress:38,due:'2026-06-30',budget:300000,spent:180000,notes:'Blocked on vendor contract'},
    {id:4,name:'Customer Portal Redesign',owner:'M. Chen',status:'On Track',progress:91,due:'2026-05-28',budget:80000,spent:73000,notes:''},
    {id:5,name:'Mobile SDK Release',owner:'A. Johnson',status:'Critical',progress:20,due:'2026-06-10',budget:150000,spent:60000,notes:'Vendor SLA breach open'},
    {id:6,name:'IAM Overhaul',owner:'T. Brooks',status:'At Risk',progress:47,due:'2026-07-22',budget:200000,spent:94000,notes:''},
    {id:7,name:'Reporting Engine',owner:'J. Torres',status:'On Track',progress:65,due:'2026-08-15',budget:90000,spent:58500,notes:''},
    {id:8,name:'Compliance Audit Prep',owner:'R. Patel',status:'On Track',progress:80,due:'2026-06-01',budget:60000,spent:48000,notes:''}
  ],
  stakeholders: [
    {id:1,name:'Diana Weston',role:'VP of Engineering',influence:'High',engagement:'Champion',color:'blue',notes:''},
    {id:2,name:'Marcus Hill',role:'PMO Director',influence:'High',engagement:'Supportive',color:'teal',notes:''},
    {id:3,name:'Priya Nair',role:'Chief Product Officer',influence:'High',engagement:'Champion',color:'purple',notes:''},
    {id:4,name:'Tom Rafferty',role:'VP Operations',influence:'Medium',engagement:'Neutral',color:'amber',notes:''},
    {id:5,name:'Carla Ruiz',role:'Enterprise Architect',influence:'Medium',engagement:'Supportive',color:'coral',notes:''}
  ],
  escalations: [
    {id:1,issue:'Vendor API SLA breach',project:'Mobile SDK Release',severity:'Critical',owner:'A. Johnson',status:'Open',days:5,notes:''},
    {id:2,issue:'Scope creep — 3 unplanned features added',project:'Data Warehouse Modernization',severity:'High',owner:'S. Kim',status:'In Review',days:3,notes:''},
    {id:3,issue:'Resource conflict — shared QA team',project:'IAM Overhaul',severity:'Medium',owner:'T. Brooks',status:'Monitoring',days:8,notes:''}
  ],
  capacity: [
    {id:1,name:'J. Torres',projects:'Platform Migration, Reporting Engine',allocation:90},
    {id:2,name:'R. Patel',projects:'API Gateway v2, Compliance Audit Prep',allocation:75},
    {id:3,name:'S. Kim',projects:'Data Warehouse Modernization',allocation:110},
    {id:4,name:'M. Chen',projects:'Customer Portal Redesign',allocation:60},
    {id:5,name:'A. Johnson',projects:'Mobile SDK Release',allocation:105},
    {id:6,name:'T. Brooks',projects:'IAM Overhaul',allocation:70}
  ],
  risks: [
    {id:1,title:'Vendor delivery delay on API integration',project:'Mobile SDK Release',probability:'High',impact:'High',rag:'red',owner:'A. Johnson',mitigation:'Parallel build started. Daily vendor syncs.',status:'Open',created:'2026-05-01'},
    {id:2,title:'Key resource departure mid-project',project:'Data Warehouse Modernization',probability:'Medium',impact:'High',rag:'amber',owner:'S. Kim',mitigation:'Knowledge transfer sessions scheduled.',status:'Open',created:'2026-05-05'},
    {id:3,title:'Scope increase without budget adjustment',project:'Customer Portal Redesign',probability:'Medium',impact:'Medium',rag:'amber',owner:'M. Chen',mitigation:'Change request process enforced.',status:'Monitoring',created:'2026-05-08'}
  ],
  decisions: [
    {id:1,title:'Adopt microservices for API Gateway',project:'API Gateway v2',owner:'R. Patel',date:'2026-04-15',rationale:'Reduces coupling, enables independent deployment.',status:'Approved',impact:'High'},
    {id:2,title:'Defer mobile offline mode to v2',project:'Mobile SDK Release',owner:'A. Johnson',date:'2026-05-02',rationale:'Reduces scope to meet June deadline.',status:'Approved',impact:'Medium'},
    {id:3,title:'Use managed cloud data warehouse',project:'Data Warehouse Modernization',owner:'S. Kim',date:'2026-04-20',rationale:'Lower TCO, faster provisioning.',status:'Approved',impact:'High'},
    {id:4,title:'Extend IAM vendor contract 6 months',project:'IAM Overhaul',owner:'T. Brooks',date:'2026-05-12',rationale:'New vendor evaluation needs more time.',status:'Pending',impact:'Medium'}
  ],
  actions: [
    {id:1,title:'Resolve vendor API contract terms',project:'Mobile SDK Release',owner:'A. Johnson',due:'2026-05-25',priority:'High',status:'In Progress',notes:'Legal reviewing SLA draft'},
    {id:2,title:'Complete data migration script testing',project:'Data Warehouse Modernization',owner:'S. Kim',due:'2026-05-28',priority:'High',status:'Open',notes:''},
    {id:3,title:'Finalize IAM vendor shortlist',project:'IAM Overhaul',owner:'T. Brooks',due:'2026-06-01',priority:'Medium',status:'Open',notes:''},
    {id:4,title:'Conduct portal UAT sign-off with stakeholders',project:'Customer Portal Redesign',owner:'M. Chen',due:'2026-05-22',priority:'High',status:'Completed',notes:''}
  ],
  milestones: [
    {id:1,title:'Portal UAT Complete',project:'Customer Portal Redesign',date:'2026-05-22',status:'On Track',owner:'M. Chen',notes:''},
    {id:2,title:'Compliance Audit Submission',project:'Compliance Audit Prep',date:'2026-06-01',status:'On Track',owner:'R. Patel',notes:''},
    {id:3,title:'Mobile SDK Beta Release',project:'Mobile SDK Release',date:'2026-06-10',status:'At Risk',owner:'A. Johnson',notes:'Blocked by vendor issue'},
    {id:4,title:'Data Warehouse Go-Live',project:'Data Warehouse Modernization',date:'2026-06-30',status:'At Risk',owner:'S. Kim',notes:''},
    {id:5,title:'Platform Migration Phase 2',project:'Platform Migration',date:'2026-07-15',status:'On Track',owner:'J. Torres',notes:''},
    {id:6,title:'IAM System Cutover',project:'IAM Overhaul',date:'2026-07-22',status:'On Track',owner:'T. Brooks',notes:''}
  ],
  changes: [
    {id:1,title:'Add real-time analytics dashboard to portal',project:'Customer Portal Redesign',requestor:'Diana Weston',date:'2026-05-10',impact:'Medium',effort:'High',status:'Approved',budget_impact:15000,notes:'Approved with 2 week extension'},
    {id:2,title:'Expand data warehouse to include marketing data',project:'Data Warehouse Modernization',requestor:'Priya Nair',date:'2026-05-08',impact:'High',effort:'High',status:'Pending',budget_impact:40000,notes:'Under review'},
    {id:3,title:'Add SSO to mobile SDK',project:'Mobile SDK Release',requestor:'Tom Rafferty',date:'2026-05-15',impact:'High',effort:'Medium',status:'Rejected',budget_impact:20000,notes:'Deferred to v2'}
  ],
  meetings: [
    {id:1,name:'Weekly Steering Committee',cadence:'Weekly',day:'Monday',time:'10:00',attendees:'Diana Weston, Marcus Hill, Priya Nair',lastRun:'2026-05-12',nextRun:'2026-05-19',notes:''},
    {id:2,name:'Mobile SDK Daily Standup',cadence:'Daily',day:'Daily',time:'09:00',attendees:'A. Johnson, Dev Team',lastRun:'2026-05-18',nextRun:'2026-05-19',notes:'Escalation active'},
    {id:3,name:'PMO Governance Review',cadence:'Bi-weekly',day:'Wednesday',time:'14:00',attendees:'Marcus Hill, All PMs',lastRun:'2026-05-07',nextRun:'2026-05-21',notes:''}
  ],
  commsLog: [
    {id:1,subject:'Mobile SDK Escalation Notice',recipient:'Diana Weston, Marcus Hill',channel:'Email',date:'2026-05-13',type:'Escalation notice',summary:'Notified of vendor SLA breach. Awaiting response.',project:'Mobile SDK Release'},
    {id:2,subject:'Weekly Portfolio Update — W19',recipient:'Steering Committee',channel:'Email',date:'2026-05-12',type:'Weekly update',summary:'Portfolio health briefing. 5 green, 2 amber, 1 red.',project:'All'},
    {id:3,subject:'Data Warehouse Risk Alert',recipient:'Priya Nair, S. Kim',channel:'Slack',date:'2026-05-10',type:'Risk alert',summary:'Flagged vendor contract delay as high risk.',project:'Data Warehouse Modernization'}
  ],
  lessons: [
    {id:1,title:'Early vendor contract review prevents delays',project:'Mobile SDK Release',category:'Vendor Management',type:'Improvement',date:'2026-05-15',description:'SLA terms should be reviewed by legal at contract signature, not during delivery.',owner:'A. Johnson'},
    {id:2,title:'Stakeholder alignment workshops accelerate decisions',project:'Customer Portal Redesign',category:'Stakeholder Management',type:'Success',date:'2026-05-10',description:'Running a 2-hour alignment workshop upfront eliminated 3 weeks of back-and-forth.',owner:'M. Chen'}
  ],
  raid: [
    {id:1,type:'Risk',title:'Vendor API delivery delay',project:'Mobile SDK Release',owner:'A. Johnson',status:'Open',impact:'High',action:'Parallel build in progress',due:'2026-05-25'},
    {id:2,type:'Assumption',title:'Cloud environment provisioned by week 3',project:'Data Warehouse Modernization',owner:'S. Kim',status:'Open',impact:'Medium',action:'Confirm with infra team',due:'2026-05-22'},
    {id:3,type:'Issue',title:'QA team shared across 3 projects',project:'IAM Overhaul',owner:'T. Brooks',status:'In Progress',impact:'Medium',action:'Request dedicated QA resource',due:'2026-05-28'},
    {id:4,type:'Dependency',title:'Portal launch depends on IAM completion',project:'Customer Portal Redesign',owner:'M. Chen',status:'Monitoring',impact:'High',action:'Weekly sync with IAM team',due:'2026-06-15'}
  ],
  velocity: [
    {id:1,project:'Mobile SDK Release',sprint:'Sprint 1',planned:21,completed:18,date:'2026-04-04'},
    {id:2,project:'Mobile SDK Release',sprint:'Sprint 2',planned:21,completed:15,date:'2026-04-18'},
    {id:3,project:'Mobile SDK Release',sprint:'Sprint 3',planned:18,completed:12,date:'2026-05-02'},
    {id:4,project:'Mobile SDK Release',sprint:'Sprint 4',planned:18,completed:10,date:'2026-05-16'},
    {id:5,project:'Data Warehouse Modernization',sprint:'Sprint 1',planned:24,completed:22,date:'2026-04-04'},
    {id:6,project:'Data Warehouse Modernization',sprint:'Sprint 2',planned:24,completed:20,date:'2026-04-18'},
    {id:7,project:'Data Warehouse Modernization',sprint:'Sprint 3',planned:24,completed:16,date:'2026-05-02'},
    {id:8,project:'Data Warehouse Modernization',sprint:'Sprint 4',planned:20,completed:14,date:'2026-05-16'}
  ]
};

// ─── STATE ────────────────────────────────────────────────────────────────────

let state = {};
const NEXT_ID_KEYS = ['projects','stakeholders','escalations','capacity','risks','decisions','actions','milestones','changes','meetings','commsLog','lessons','raid','velocity','dependencies','changeRequests','budgets','velocityData','assumptions','actionItems','lessonsLearned'];

function loadState() {
  try {
    const s = localStorage.getItem('edm_web_v2');
    if (s) {
      state = JSON.parse(s);
      // Patch any missing collections from new version
      NEXT_ID_KEYS.forEach(k => {
        if (!state[k]) { state[k] = DEFAULTS[k] || []; }
        if (!state.nextId) state.nextId = {};
        if (!state.nextId[k]) state.nextId[k] = (DEFAULTS[k]||[]).length + 1;
      });
    } else {
      resetToDefaults();
    }
  } catch(e) { resetToDefaults(); }
}

function resetToDefaults() {
  NEXT_ID_KEYS.forEach(k => state[k] = JSON.parse(JSON.stringify(DEFAULTS[k]||[])));
  state.nextId = {};
  NEXT_ID_KEYS.forEach(k => state.nextId[k] = (DEFAULTS[k]||[]).length + 1);
}

function saveState() { localStorage.setItem('edm_web_v2', JSON.stringify(state)); }

function exportData() {
  const blob = new Blob([JSON.stringify({...state,exported:new Date().toISOString()},null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='edm-export-'+new Date().toISOString().slice(0,10)+'.json'; a.click();
  showToast('Data exported');
}
function importData() {
  const input = document.createElement('input'); input.type='file'; input.accept='.json';
  input.onchange = e => {
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>{
      try {
        const d=JSON.parse(ev.target.result);
        NEXT_ID_KEYS.forEach(k => { if(d[k]) state[k]=d[k]; });
        if(d.nextId) state.nextId=d.nextId;
        saveState(); renderAll(); showToast('Data imported');
      } catch(e){ showToast('Import failed','error'); }
    }; r.readAsText(f);
  }; input.click();
}
function resetData() {
  if(!confirm('Reset all data to defaults? Cannot be undone.')) return;
  localStorage.removeItem('edm_web_v2'); resetToDefaults(); saveState(); renderAll(); showToast('Reset to defaults');
}
