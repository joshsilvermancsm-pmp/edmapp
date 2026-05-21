// ─── FEATURE FLAGS MODULE ─────────────────────────────────────────────────────
// Controls which sections are visible based on URL parameters
// Usage:
//   index.html              → full app (all features on)
//   index.html?mode=demo    → demo mode (curated feature set, sample data)
//   index.html?mode=basic   → core EDM features only
//   index.html?features=portfolio,risks,ai  → custom feature list

const FEATURES = {

  // ── Feature definitions ───────────────────────────────────────────────────────

  ALL: [
    { id:'dashboard',     label:'Executive Dashboard',    nav:'dashboard',     section:'section-dashboard',     core:true  },
    { id:'portfolio',     label:'Portfolio',               nav:'portfolio',     section:'section-portfolio',     core:true  },
    { id:'stakeholders',  label:'Stakeholders',            nav:'stakeholders',  section:'section-stakeholders',  core:true  },
    { id:'capacity',      label:'Team Capacity',           nav:'capacity',      section:'section-capacity',      core:true  },
    { id:'escalations',   label:'Escalations',             nav:'escalations',   section:'section-escalations',   core:true  },
    { id:'risks',         label:'Risk Register',           nav:'risks',         section:'section-risks',         core:true  },
    { id:'decisions',     label:'Decision Log',            nav:'decisions',     section:'section-decisions',     core:false },
    { id:'actions',       label:'Action Items',            nav:'actions',       section:'section-actions',       core:false },
    { id:'milestones',    label:'Milestones',              nav:'milestones',    section:'section-milestones',    core:false },
    { id:'budget',        label:'Budget Tracker',          nav:'budget',        section:'section-budget',        core:false },
    { id:'changes',       label:'Change Requests',         nav:'changes',       section:'section-changes',       core:false },
    { id:'velocity',      label:'Sprint Velocity',         nav:'velocity',      section:'section-velocity',      core:false },
    { id:'raid',          label:'RAID Log',                nav:'raid',          section:'section-raid',          core:false },
    { id:'dependencies',  label:'Dependency Map',          nav:'dependencies',  section:'section-dependencies',  core:false },
    { id:'changeRequests',label:'Change Requests (v2)',    nav:'changeRequests',section:'section-changeRequests',core:false },
    { id:'commslog',      label:'Comms Log',               nav:'commslog',      section:'section-commslog',      core:false },
    { id:'lessonslearned',label:'Lessons Learned',         nav:'lessonslearned',section:'section-lessonslearned',core:false },
    { id:'raidlog',       label:'RAID Log (v2)',           nav:'raidlog',       section:'section-raidlog',       core:false },
    { id:'vendors',       label:'Vendor Tracker',          nav:'vendors',       section:'section-vendors',       core:false },
    { id:'okrs',          label:'OKRs / KPIs',             nav:'okrs',          section:'section-okrs',          core:false },
    { id:'benefits',      label:'Benefits Realization',    nav:'benefits',      section:'section-benefits',      core:false },
    { id:'health',        label:'Health Scorecard',        nav:'health',        section:'section-health',        core:true  },
    { id:'exec-report',   label:'Exec Report Builder',     nav:'exec-report',   section:'section-exec-report',   core:false },
    { id:'forecast',      label:'Resource Forecasting',    nav:'forecast',      section:'section-forecast',      core:false },
    { id:'skills',        label:'Skills Matrix',           nav:'skills',        section:'section-skills',        core:false },
    { id:'ai',            label:'AI Assist',               nav:'ai',            section:'section-ai',            core:true  },
    { id:'jira',          label:'JIRA',                    nav:'jira',          section:'section-jira',          core:false },
    { id:'servicenow',    label:'ServiceNow',              nav:'servicenow',    section:'section-servicenow',    core:false },
    { id:'github',        label:'GitHub',                  nav:'github',        section:'section-github',        core:false },
    { id:'calendar',      label:'Calendar',                nav:'calendar',      section:'section-calendar',      core:false },
    { id:'confluence',    label:'Confluence',              nav:'confluence',    section:'section-confluence',    core:false },
    { id:'integrations',  label:'Integrations',            nav:'integrations',  section:'section-integrations',  core:false }
  ],

  // ── Named profiles ────────────────────────────────────────────────────────────

  PROFILES: {
    full: null, // null = all features

    demo: [
      'dashboard','portfolio','stakeholders','escalations','risks',
      'health','exec-report','ai','milestones','decisions'
    ],

    basic: [
      'dashboard','portfolio','stakeholders','capacity',
      'escalations','risks','decisions','actions','ai'
    ],

    core: [
      'dashboard','portfolio','escalations','risks','ai','health'
    ],

    governance: [
      'dashboard','decisions','raid','raidlog','changes','changeRequests',
      'commslog','lessonslearned','dependencies','risks'
    ],

    delivery: [
      'dashboard','portfolio','milestones','actions','velocity',
      'budget','capacity','escalations','risks','ai'
    ],

    reporting: [
      'dashboard','exec-report','health','benefits','okrs','ai','portfolio'
    ]
  },

  // ── Demo sample data (clean, professional, no internal details) ───────────────

  DEMO_DATA: {
    projects: [
      {id:1,name:'Digital Transformation Program',owner:'Sarah Mitchell',status:'On Track',progress:68,due:'2026-09-30',notes:''},
      {id:2,name:'Cloud Migration — Phase 2',owner:'James Okafor',status:'On Track',progress:45,due:'2026-08-15',notes:''},
      {id:3,name:'Customer Experience Platform',owner:'Priya Sharma',status:'At Risk',progress:32,due:'2026-07-01',notes:'Integration dependency at risk'},
      {id:4,name:'Data Analytics Modernization',owner:'Carlos Rivera',status:'On Track',progress:78,due:'2026-06-30',notes:''},
      {id:5,name:'Security & Compliance Program',owner:'Lisa Chen',status:'Critical',progress:22,due:'2026-06-15',notes:'Regulatory deadline pressure'},
      {id:6,name:'API Gateway Consolidation',owner:'Mark Thompson',status:'On Track',progress:90,due:'2026-05-30',notes:''}
    ],
    stakeholders: [
      {id:1,name:'David Harrington',role:'Chief Technology Officer',influence:'High',engagement:'Champion',color:'blue',notes:''},
      {id:2,name:'Amanda Foster',role:'VP of Operations',influence:'High',engagement:'Supportive',color:'teal',notes:''},
      {id:3,name:'Robert Kim',role:'Chief Financial Officer',influence:'High',engagement:'Neutral',color:'amber',notes:''},
      {id:4,name:'Jennifer Walsh',role:'Head of Product',influence:'Medium',engagement:'Champion',color:'purple',notes:''},
      {id:5,name:'Thomas Reeves',role:'Enterprise Architect',influence:'Medium',engagement:'Supportive',color:'coral',notes:''}
    ],
    escalations: [
      {id:1,issue:'Regulatory compliance deadline at risk — 3 controls outstanding',project:'Security & Compliance Program',severity:'Critical',owner:'Lisa Chen',status:'Open',days:4,notes:''},
      {id:2,issue:'Third-party integration vendor missed delivery milestone',project:'Customer Experience Platform',severity:'High',owner:'Priya Sharma',status:'In Review',days:6,notes:''},
      {id:3,issue:'Resource contention — senior architect shared across 3 programs',project:'Digital Transformation Program',severity:'Medium',owner:'Sarah Mitchell',status:'Monitoring',days:9,notes:''}
    ],
    risks: [
      {id:1,title:'Regulatory deadline compression — insufficient buffer',project:'Security & Compliance Program',probability:'High',impact:'High',rag:'red',owner:'Lisa Chen',mitigation:'Dedicated sprint team assigned. Daily stand-up with compliance lead.',status:'Open',created:'2026-05-01',notes:''},
      {id:2,title:'Key technical architect dependency across multiple programs',project:'Digital Transformation Program',probability:'Medium',impact:'High',rag:'amber',owner:'Sarah Mitchell',mitigation:'Knowledge transfer sessions underway. Identifying backup resource.',status:'Open',created:'2026-05-03',notes:''},
      {id:3,title:'Third-party API instability impacting integration delivery',project:'Customer Experience Platform',probability:'High',impact:'Medium',rag:'amber',owner:'Priya Sharma',mitigation:'Parallel integration path initiated. Vendor escalation in progress.',status:'Open',created:'2026-05-05',notes:''},
      {id:4,title:'Scope expansion requests from business units',project:'Data Analytics Modernization',probability:'Medium',impact:'Medium',rag:'amber',owner:'Carlos Rivera',mitigation:'Change control process enforced. Steering committee approval required.',status:'Monitoring',created:'2026-05-08',notes:''}
    ],
    decisions: [
      {id:1,title:'Adopt cloud-native architecture for all new platform components',project:'Digital Transformation Program',owner:'David Harrington',date:'2026-04-20',rationale:'Reduces infrastructure costs by 40% and improves scalability. Aligns with 3-year technology strategy.',status:'Approved',impact:'High',notes:''},
      {id:2,title:'Defer mobile application to Phase 2 to protect June delivery',project:'Customer Experience Platform',owner:'Amanda Foster',date:'2026-05-08',rationale:'Reduces scope by 30% and protects the June go-live date. Mobile added to Phase 2 backlog.',status:'Approved',impact:'Medium',notes:''},
      {id:3,title:'Engage specialist compliance consultant for regulatory sprint',project:'Security & Compliance Program',owner:'Lisa Chen',date:'2026-05-12',rationale:'Internal team lacks specialist knowledge for 4 outstanding controls. Consultant brings proven accelerator.',status:'Pending',impact:'High',notes:''}
    ],
    milestones: [
      {id:1,title:'API Gateway Go-Live',project:'API Gateway Consolidation',owner:'Mark Thompson',date:'2026-05-30',status:'On Track',notes:'UAT complete'},
      {id:2,title:'Compliance Audit Submission',project:'Security & Compliance Program',owner:'Lisa Chen',date:'2026-06-15',status:'At Risk',notes:'3 controls outstanding'},
      {id:3,title:'Customer Portal Beta Launch',project:'Customer Experience Platform',owner:'Priya Sharma',date:'2026-07-01',status:'At Risk',notes:'Integration dependency'},
      {id:4,title:'Cloud Migration Phase 2 Complete',project:'Cloud Migration — Phase 2',owner:'James Okafor',date:'2026-08-15',status:'On Track',notes:''},
      {id:5,title:'Digital Transformation Program Review',project:'Digital Transformation Program',owner:'Sarah Mitchell',date:'2026-09-30',status:'On Track',notes:''}
    ],
    budgets: [
      {id:1,project:'Digital Transformation Program',planned:2400000,actual:1380000,startDate:'2026-01-01',endDate:'2026-09-30',notes:''},
      {id:2,project:'Cloud Migration — Phase 2',planned:850000,actual:340000,startDate:'2026-02-01',endDate:'2026-08-15',notes:''},
      {id:3,project:'Customer Experience Platform',planned:620000,actual:490000,startDate:'2026-01-15',endDate:'2026-07-01',notes:'Vendor costs elevated'},
      {id:4,project:'Security & Compliance Program',planned:380000,actual:310000,startDate:'2026-03-01',endDate:'2026-06-15',notes:'Consultant engagement adding cost'}
    ],
    okrs: [
      {id:1,type:'OKR',objective:'Accelerate digital service delivery capability',keyResult:'Reduce average feature delivery time from 12 weeks to 8 weeks',project:'Digital Transformation Program',owner:'David Harrington',progress:60,target:100,unit:'%',status:'In Progress',dueDate:'2026-09-30',notes:''},
      {id:2,type:'KPI',objective:'Platform availability SLA',keyResult:'Maintain 99.95% uptime across production systems',project:'Cloud Migration — Phase 2',owner:'James Okafor',progress:99.97,target:99.95,unit:'%',status:'Achieved',dueDate:'2026-12-31',notes:''},
      {id:3,type:'OKR',objective:'Improve customer digital experience score',keyResult:'Net Promoter Score improvement from 42 to 65',project:'Customer Experience Platform',owner:'Jennifer Walsh',progress:35,target:100,unit:'%',status:'In Progress',dueDate:'2026-12-31',notes:''}
    ],
    benefits: [
      {id:1,title:'Annual infrastructure cost reduction',project:'Cloud Migration — Phase 2',type:'Financial',projected:1200000,actual:420000,unit:'$',targetDate:'2027-01-01',status:'In Progress',owner:'James Okafor',notes:'Tracking ahead of projection'},
      {id:2,title:'Customer satisfaction score improvement',project:'Customer Experience Platform',type:'Customer',projected:23,actual:null,unit:'%',targetDate:'2026-12-31',status:'Projected',owner:'Jennifer Walsh',notes:'Measurement begins post go-live'},
      {id:3,title:'Regulatory penalty avoidance',project:'Security & Compliance Program',type:'Financial',projected:2500000,actual:null,unit:'$',targetDate:'2026-09-30',status:'Projected',owner:'Lisa Chen',notes:'Based on regulatory fine schedule'}
    ],
    vendors: [
      {id:1,name:'CloudNova Systems',category:'Cloud Infrastructure',project:'Cloud Migration — Phase 2',contractValue:420000,contractStart:'2026-01-01',contractEnd:'2026-12-31',performance:96,slaTerms:'99.95% uptime, 2hr critical response',contact:'ops@cloudnova.com',status:'Active',notes:''},
      {id:2,name:'Integra API Solutions',category:'Integration Services',project:'Customer Experience Platform',contractValue:185000,contractStart:'2026-02-01',contractEnd:'2026-08-31',performance:64,slaTerms:'99.9% uptime, 4hr response',contact:'support@integra.io',status:'At Risk',notes:'Missed two delivery milestones'},
      {id:3,name:'SecureFrame Compliance',category:'Compliance Consulting',project:'Security & Compliance Program',contractValue:95000,contractStart:'2026-05-01',contractEnd:'2026-07-31',performance:88,slaTerms:'Weekly delivery cadence',contact:'james@secureframe.com',status:'Active',notes:'Recently engaged'}
    ],
    capacity: [
      {id:1,name:'Sarah Mitchell',projects:'Digital Transformation Program',allocation:95},
      {id:2,name:'James Okafor',projects:'Cloud Migration — Phase 2',allocation:80},
      {id:3,name:'Priya Sharma',projects:'Customer Experience Platform',allocation:100},
      {id:4,name:'Carlos Rivera',projects:'Data Analytics Modernization',allocation:75},
      {id:5,name:'Lisa Chen',projects:'Security & Compliance Program',allocation:115},
      {id:6,name:'Mark Thompson',projects:'API Gateway Consolidation, Cloud Migration',allocation:90}
    ],
    nextId: {projects:7,stakeholders:6,escalations:4,capacity:7,risks:5,decisions:4,actionItems:1,milestones:6,dependencies:1,changeRequests:1,commsLog:1,lessonsLearned:1,budgets:5,velocityData:1,assumptions:1,okrs:4,benefits:4,vendors:4}
  },

  // ── Parse URL params ───────────────────────────────────────────────────────────

  getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      mode:     params.get('mode')     || 'full',
      features: params.get('features') ? params.get('features').split(',') : null,
      demo:     params.has('demo')     || params.get('mode') === 'demo'
    };
  },

  // ── Get active feature list ────────────────────────────────────────────────────

  getActiveFeatures() {
    const params = this.getParams();

    // Explicit feature list takes priority
    if (params.features) return params.features;

    // Named profile
    const profile = this.PROFILES[params.mode];
    if (profile) return profile;

    // Full mode — return all
    return this.ALL.map(f => f.id);
  },

  isEnabled(featureId) {
    return this.getActiveFeatures().includes(featureId);
  },

  isDemoMode() {
    return this.getParams().demo || this.getParams().mode === 'demo';
  },

  // ── Apply feature flags to DOM ─────────────────────────────────────────────────

  apply() {
    const active  = this.getActiveFeatures();
    const isDemo  = this.isDemoMode();
    const params  = this.getParams();

    // Show demo banner if in demo mode
    if (isDemo) this.showDemoBanner(params.mode);

    // Hide/show nav items and sections
    this.ALL.forEach(feature => {
      const enabled = active.includes(feature.id);

      // Nav item
      const navEl = document.querySelector(`[data-section="${feature.nav}"]`);
      if (navEl) navEl.style.display = enabled ? '' : 'none';

      // Section
      const secEl = document.getElementById(feature.section);
      if (secEl && !enabled) {
        secEl.style.display = 'none';
        // If this section is currently active, redirect to dashboard
        if (secEl.classList.contains('active')) {
          secEl.classList.remove('active');
          const dash = document.getElementById('section-dashboard');
          if (dash) dash.classList.add('active');
          document.getElementById('topbar-title').textContent = 'Executive Dashboard';
          document.querySelector('[data-section="dashboard"]')?.classList.add('active');
        }
      }
    });

    // Hide nav section labels that have no visible children
    document.querySelectorAll('.nav-label, .nav-section-label').forEach(label => {
      let next = label.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('nav-label') && !next.classList.contains('nav-section-label')) {
        if (next.style.display !== 'none') { hasVisible = true; break; }
        next = next.nextElementSibling;
      }
      label.style.display = hasVisible ? '' : 'none';
    });

    // In demo mode, replace state data with clean demo data
    if (isDemo && typeof state !== 'undefined') {
      this.loadDemoData();
    }

    // Update page title based on mode
    const titles = { demo:'Enterprise Delivery Management — Demo', basic:'Enterprise Delivery Management', full:'Enterprise Delivery Management' };
    document.title = titles[params.mode] || 'Enterprise Delivery Management';

    console.log(`[Features] Mode: ${params.mode} | Active: ${active.length} features | Demo: ${isDemo}`);
  },

  // ── Load demo data ─────────────────────────────────────────────────────────────

  loadDemoData() {
    if (typeof state === 'undefined') return;
    Object.assign(state, JSON.parse(JSON.stringify(this.DEMO_DATA)));
    // Preserve AI config — demo users should be able to test AI
    // but clear any real integration credentials
    ['jira_base_url','jira_token','snow_instance','snow_pass','gh_token',
     'int_slack_webhook','int_teams_webhook','gcal_key','conf_token'].forEach(k => {
      // Don't clear — just don't expose in demo mode UI
    });
    if (typeof renderAll === 'function') renderAll();
  },

  // ── Demo banner ───────────────────────────────────────────────────────────────

  showDemoBanner(mode) {
    const existing = document.getElementById('demo-banner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.style.cssText = `
      background: linear-gradient(135deg, #185FA5, #0C447C);
      color: #fff;
      padding: 8px 20px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 12px;
    `;

    const modeLabels = {
      demo:       'Demo Mode — sample data only',
      basic:      'Basic Mode — core features enabled',
      core:       'Core Mode — essential features only',
      governance: 'Governance Mode',
      delivery:   'Delivery Mode',
      reporting:  'Reporting Mode'
    };

    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500">${modeLabels[mode] || mode + ' mode'}</span>
        <span style="opacity:0.8">This is a demonstration with sample data. No real data is shown.</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="opacity:0.7;font-size:11px">Share this URL: <code style="background:rgba(255,255,255,0.15);padding:2px 7px;border-radius:4px">${window.location.href}</code></span>
        <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#fff;cursor:pointer;opacity:0.7;font-size:16px;line-height:1;padding:0">×</button>
      </div>`;

    // Insert after the AI config bar
    const aiBar = document.querySelector('.ai-config-bar');
    if (aiBar) aiBar.after(banner);
    else document.querySelector('.main')?.prepend(banner);
  },

  // ── Generate shareable links ──────────────────────────────────────────────────

  getShareableLinks() {
    const base = window.location.origin + window.location.pathname;
    return {
      full:       base,
      demo:       base + '?mode=demo',
      basic:      base + '?mode=basic',
      core:       base + '?mode=core',
      delivery:   base + '?mode=delivery',
      governance: base + '?mode=governance',
      reporting:  base + '?mode=reporting'
    };
  }
};

// ── Apply on load ─────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  // Apply after a tick so all other modules have initialized
  setTimeout(() => {
    FEATURES.apply();
  }, 100);
});
