// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────

const DEFAULT_PROJECTS = [
  {id:1,name:'Platform Migration',owner:'J. Torres',status:'On Track',progress:72,due:'2026-07-15',notes:''},
  {id:2,name:'API Gateway v2',owner:'R. Patel',status:'On Track',progress:55,due:'2026-08-01',notes:''},
  {id:3,name:'Data Warehouse Modernization',owner:'S. Kim',status:'At Risk',progress:38,due:'2026-06-30',notes:'Blocked on vendor contract'},
  {id:4,name:'Customer Portal Redesign',owner:'M. Chen',status:'On Track',progress:91,due:'2026-05-28',notes:''},
  {id:5,name:'Mobile SDK Release',owner:'A. Johnson',status:'Critical',progress:20,due:'2026-06-10',notes:'Vendor SLA breach open'},
  {id:6,name:'IAM Overhaul',owner:'T. Brooks',status:'At Risk',progress:47,due:'2026-07-22',notes:''},
  {id:7,name:'Reporting Engine',owner:'J. Torres',status:'On Track',progress:65,due:'2026-08-15',notes:''},
  {id:8,name:'Compliance Audit Prep',owner:'R. Patel',status:'On Track',progress:80,due:'2026-06-01',notes:''}
];
const DEFAULT_STAKEHOLDERS = [
  {id:1,name:'Diana Weston',role:'VP of Engineering',influence:'High',engagement:'Champion',color:'blue',notes:''},
  {id:2,name:'Marcus Hill',role:'PMO Director',influence:'High',engagement:'Supportive',color:'teal',notes:''},
  {id:3,name:'Priya Nair',role:'Chief Product Officer',influence:'High',engagement:'Champion',color:'purple',notes:''},
  {id:4,name:'Tom Rafferty',role:'VP Operations',influence:'Medium',engagement:'Neutral',color:'amber',notes:''},
  {id:5,name:'Carla Ruiz',role:'Enterprise Architect',influence:'Medium',engagement:'Supportive',color:'coral',notes:''}
];
const DEFAULT_ESCALATIONS = [
  {id:1,issue:'Vendor API SLA breach',project:'Mobile SDK Release',severity:'Critical',owner:'A. Johnson',status:'Open',days:5,notes:''},
  {id:2,issue:'Scope creep — 3 unplanned features added',project:'Data Warehouse Modernization',severity:'High',owner:'S. Kim',status:'In Review',days:3,notes:''},
  {id:3,issue:'Resource conflict — shared QA team',project:'IAM Overhaul',severity:'Medium',owner:'T. Brooks',status:'Monitoring',days:8,notes:''}
];
const DEFAULT_CAPACITY = [
  {id:1,name:'J. Torres',projects:'Platform Migration, Reporting Engine',allocation:90},
  {id:2,name:'R. Patel',projects:'API Gateway v2, Compliance Audit Prep',allocation:75},
  {id:3,name:'S. Kim',projects:'Data Warehouse Modernization',allocation:110},
  {id:4,name:'M. Chen',projects:'Customer Portal Redesign',allocation:60},
  {id:5,name:'A. Johnson',projects:'Mobile SDK Release',allocation:105},
  {id:6,name:'T. Brooks',projects:'IAM Overhaul',allocation:70}
];
const DEFAULT_RISKS = [
  {id:1,title:'Vendor delivery delay on API integration',project:'Mobile SDK Release',probability:'High',impact:'High',rag:'red',owner:'A. Johnson',mitigation:'Parallel build started. Daily vendor syncs.',status:'Open',created:'2026-05-01'},
  {id:2,title:'Key resource departure mid-project',project:'Data Warehouse Modernization',probability:'Medium',impact:'High',rag:'amber',owner:'S. Kim',mitigation:'Knowledge transfer sessions scheduled.',status:'Open',created:'2026-05-05'},
  {id:3,title:'Scope increase without budget adjustment',project:'Customer Portal Redesign',probability:'Medium',impact:'Medium',rag:'amber',owner:'M. Chen',mitigation:'Change request process enforced.',status:'Monitoring',created:'2026-05-08'},
  {id:4,title:'Compliance deadline moved up by regulator',project:'Compliance Audit Prep',probability:'Low',impact:'High',rag:'amber',owner:'R. Patel',mitigation:'Accelerated review schedule prepared.',status:'Open',created:'2026-05-10'}
];
const DEFAULT_DECISIONS = [
  {id:1,title:'Adopt microservices architecture for API Gateway',project:'API Gateway v2',owner:'R. Patel',date:'2026-04-15',rationale:'Reduces coupling and enables independent deployment of services.',status:'Approved',impact:'High'},
  {id:2,title:'Defer mobile offline mode to v2',project:'Mobile SDK Release',owner:'A. Johnson',date:'2026-05-02',rationale:'Reduces scope to meet June deadline. Offline mode added to backlog.',status:'Approved',impact:'Medium'},
  {id:3,title:'Use managed cloud data warehouse over on-prem',project:'Data Warehouse Modernization',owner:'S. Kim',date:'2026-04-20',rationale:'Lower TCO, faster provisioning, better scalability.',status:'Approved',impact:'High'},
  {id:4,title:'Extend IAM vendor contract 6 months',project:'IAM Overhaul',owner:'T. Brooks',date:'2026-05-12',rationale:'New vendor evaluation needs more time. Extension prevents gap in coverage.',status:'Pending',impact:'Medium'}
];

// ─── STATE ────────────────────────────────────────────────────────────────────

let state = {
  projects:[], stakeholders:[], escalations:[], capacity:[], risks:[], decisions:[],
  nextId:{projects:9,stakeholders:6,escalations:4,capacity:7,risks:5,decisions:5}
};

function loadState() {
  try {
    const s = localStorage.getItem('edm_web_v1');
    if (s) {
      state = JSON.parse(s);
      if (!state.risks)     { state.risks = DEFAULT_RISKS; state.nextId.risks = 5; }
      if (!state.decisions) { state.decisions = DEFAULT_DECISIONS; state.nextId.decisions = 5; }
    } else {
      state.projects     = DEFAULT_PROJECTS;
      state.stakeholders = DEFAULT_STAKEHOLDERS;
      state.escalations  = DEFAULT_ESCALATIONS;
      state.capacity     = DEFAULT_CAPACITY;
      state.risks        = DEFAULT_RISKS;
      state.decisions    = DEFAULT_DECISIONS;
    }
  } catch(e) {
    state.projects=DEFAULT_PROJECTS; state.stakeholders=DEFAULT_STAKEHOLDERS;
    state.escalations=DEFAULT_ESCALATIONS; state.capacity=DEFAULT_CAPACITY;
    state.risks=DEFAULT_RISKS; state.decisions=DEFAULT_DECISIONS;
  }
}
function saveState() { localStorage.setItem('edm_web_v1', JSON.stringify(state)); }

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
        if(d.projects)     state.projects=d.projects;
        if(d.stakeholders) state.stakeholders=d.stakeholders;
        if(d.escalations)  state.escalations=d.escalations;
        if(d.capacity)     state.capacity=d.capacity;
        if(d.risks)        state.risks=d.risks;
        if(d.decisions)    state.decisions=d.decisions;
        if(d.nextId)       state.nextId=d.nextId;
        saveState(); renderAll(); showToast('Data imported');
      } catch(e){ showToast('Import failed','error'); }
    }; r.readAsText(f);
  }; input.click();
}
function resetData() {
  if(!confirm('Reset all data to defaults?')) return;
  localStorage.removeItem('edm_web_v1'); loadState(); renderAll(); showToast('Reset to defaults');
}
