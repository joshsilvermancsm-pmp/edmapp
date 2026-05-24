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

    // ── Projects ──────────────────────────────────────────────────────────────
    projects: [
      {id:1, name:'Nexus Platform Relaunch',           owner:'Rachel Torres',   status:'On Track', progress:72, due:'2026-08-29', notes:'Core services rebuilt on microservices. Auth migration complete. Billing module in sprint 9.'},
      {id:2, name:'DataStream Analytics Engine',       owner:'Marcus Webb',     status:'On Track', progress:58, due:'2026-09-12', notes:'Real-time pipeline live in staging. ML model training underway. Dashboard MVP demoed to stakeholders.'},
      {id:3, name:'CustomerOS CRM Replacement',        owner:'Anika Patel',     status:'At Risk',  progress:41, due:'2026-07-18', notes:'Salesforce migration blocked on data mapping. 3,200 custom fields require manual review. Timeline at risk.'},
      {id:4, name:'DevSecOps Pipeline Modernization',  owner:'Jordan Kim',      status:'On Track', progress:85, due:'2026-06-06', notes:'CI/CD pipeline rebuilt. SAST/DAST tools integrated. Final pen test scheduled for June 2.'},
      {id:5, name:'Multi-Tenant SaaS Infrastructure',  owner:'Elena Vasquez',   status:'Critical', progress:29, due:'2026-07-04', notes:'Tenant isolation architecture under review after security audit finding. Engineering lead on PTO until May 28.'},
      {id:6, name:'AI-Assisted Support Automation',    owner:'Damon Clarke',    status:'At Risk',  progress:47, due:'2026-08-01', notes:'LLM fine-tuning behind schedule. Hallucination rate at 8.3% against 3% target. Vendor SLA dispute open.'},
      {id:7, name:'Self-Serve Onboarding Portal',      owner:'Priya Nair',      status:'On Track', progress:91, due:'2026-05-30', notes:'UAT complete. Go-live checklist 94% done. Hypercare plan approved.'},
      {id:8, name:'Enterprise SSO & Identity Federation', owner:'Chris Oduya',  status:'On Track', progress:64, due:'2026-07-25', notes:'Okta integration complete for 4 of 6 enterprise customers. SCIM provisioning in test.'}
    ],

    // ── Stakeholders ──────────────────────────────────────────────────────────
    stakeholders: [
      {id:1, name:'Sandra Holloway',  role:'Chief Product Officer',          influence:'High',   engagement:'Champion',   color:'blue',   notes:'Driving AI Automation and CustomerOS. Very engaged, attends all steering reviews.'},
      {id:2, name:'Derek Fontaine',   role:'VP of Engineering',              influence:'High',   engagement:'Supportive', color:'teal',   notes:'Strong technical partner. Raises capacity concerns but solution-oriented.'},
      {id:3, name:'Cassandra Yuen',   role:'Chief Financial Officer',        influence:'High',   engagement:'Neutral',    color:'amber',  notes:'Monitors budget closely. Needs clear ROI data. Monthly 1:1 recommended.'},
      {id:4, name:'Tyler Marsh',      role:'Head of Enterprise Sales',       influence:'High',   engagement:'Champion',   color:'purple', notes:'CustomerOS and SSO are direct sales enablers. Very motivated to accelerate.'},
      {id:5, name:'Natalie Osei',     role:'VP of Customer Success',         influence:'Medium', engagement:'Supportive', color:'coral',  notes:'Self-Serve Portal and AI Support are her priorities. Providing UAT resources.'},
      {id:6, name:'Brandon Whitfield',role:'Chief Information Security Officer', influence:'High', engagement:'Resistant', color:'blue',  notes:'Raised multi-tenant isolation concern. Needs weekly security briefing to stay aligned.'},
      {id:7, name:'Imani Diallo',     role:'Director of Data Engineering',   influence:'Medium', engagement:'Champion',   color:'teal',   notes:'DataStream project sponsor. Strong internal advocate.'},
      {id:8, name:'Paul Grayson',     role:'CTO',                            influence:'High',   engagement:'Supportive', color:'purple', notes:'Executive sponsor for platform relaunch. Monthly executive briefing required.'}
    ],

    // ── Escalations ───────────────────────────────────────────────────────────
    escalations: [
      {id:1, issue:'Multi-tenant isolation vulnerability — security audit finding P1',       project:'Multi-Tenant SaaS Infrastructure',  severity:'Critical', owner:'Elena Vasquez', status:'Open',       days:6,  notes:'External pen test identified tenant data bleed in edge case. CISO engaged. Architecture review in progress. Engineering lead unavailable until May 28.'},
      {id:2, issue:'AI hallucination rate 8.3% vs 3% SLA — vendor in breach',               project:'AI-Assisted Support Automation',    severity:'Critical', owner:'Damon Clarke',  status:'In Review',  days:11, notes:'Raised formal breach notice with VectorMind AI. SLA dispute letter sent May 14. Escalated to vendor VP. Backup provider evaluation started.'},
      {id:3, issue:'CustomerOS data mapping — 3,200 custom fields blocking migration',       project:'CustomerOS CRM Replacement',        severity:'High',     owner:'Anika Patel',   status:'In Review',  days:8,  notes:'Salesforce export contains undocumented custom fields. Data team engaged. Manual review estimated at 3 weeks. PM proposing phased migration.'},
      {id:4, issue:'DevSecOps pen test scheduling conflict — third-party firm overbooked',   project:'DevSecOps Pipeline Modernization',  severity:'Medium',   owner:'Jordan Kim',    status:'Monitoring', days:3,  notes:'Original firm unavailable June 2. Alternative firm identified. Contract approval pending. Risk to June 6 go-live if not resolved by May 27.'},
      {id:5, issue:'SSO SCIM provisioning failure on Workday integration',                  project:'Enterprise SSO & Identity Federation', severity:'Medium', owner:'Chris Oduya',   status:'Open',       days:2,  notes:'Workday SCIM endpoint returning 401 on token refresh. Vendor support ticket open. Workaround in place: manual provisioning for affected tenant.'}
    ],

    // ── Risks ─────────────────────────────────────────────────────────────────
    risks: [
      {id:1,  title:'Multi-tenant security isolation — architecture redesign required',          project:'Multi-Tenant SaaS Infrastructure',     probability:'High',   impact:'High',   rag:'red',   owner:'Elena Vasquez', mitigation:'Architecture review board convened. Temporary access controls applied. Redesign sprint starts May 28. External security consultant engaged.',          status:'Open',       created:'2026-05-18', notes:''},
      {id:2,  title:'AI hallucination rate exceeds acceptable threshold for production use',    project:'AI-Assisted Support Automation',       probability:'High',   impact:'High',   rag:'red',   owner:'Damon Clarke',  mitigation:'Human-in-the-loop review added for all AI responses. Backup LLM provider shortlisted. Fine-tuning dataset being augmented with 12,000 new examples.', status:'Open',       created:'2026-05-13', notes:''},
      {id:3,  title:'Key engineering lead single point of failure — Multi-Tenant project',     project:'Multi-Tenant SaaS Infrastructure',     probability:'High',   impact:'High',   rag:'red',   owner:'Derek Fontaine', mitigation:'Knowledge transfer session scheduled for May 29. Senior architect from Platform team assigned as backup lead.',                               status:'Open',       created:'2026-05-19', notes:''},
      {id:4,  title:'CustomerOS migration timeline — 3,200 field mapping underestimated',      project:'CustomerOS CRM Replacement',          probability:'High',   impact:'Medium', rag:'amber', owner:'Anika Patel',   mitigation:'Data engineering team augmented. Automated field mapping tooling being evaluated. Phased migration proposal in review.',                       status:'Open',       created:'2026-05-16', notes:''},
      {id:5,  title:'Nexus Platform billing module complexity — Q3 revenue risk',              project:'Nexus Platform Relaunch',             probability:'Medium', impact:'High',   rag:'amber', owner:'Rachel Torres',  mitigation:'Billing sprint dedicated team of 4. Daily checkpoints. Legacy billing system maintained as fallback until new system validated.',               status:'Open',       created:'2026-05-10', notes:''},
      {id:6,  title:'DataStream ML model accuracy below target on edge-case datasets',         project:'DataStream Analytics Engine',         probability:'Medium', impact:'Medium', rag:'amber', owner:'Marcus Webb',    mitigation:'Additional training data sourced from 3 enterprise customers. Model evaluation expanded to 15 test scenarios. Go/no-go gate added before launch.',    status:'Monitoring', created:'2026-05-08', notes:''},
      {id:7,  title:'Self-Serve Portal hypercare capacity — CS team stretched',                project:'Self-Serve Onboarding Portal',        probability:'Low',    impact:'Medium', rag:'green', owner:'Priya Nair',     mitigation:'Hypercare plan includes 2 dedicated CS agents for 4 weeks post go-live. Escalation runbook prepared.',                                              status:'Monitoring', created:'2026-05-20', notes:''},
      {id:8,  title:'DevSecOps pen test delay risks June 6 go-live',                           project:'DevSecOps Pipeline Modernization',    probability:'Medium', impact:'Medium', rag:'amber', owner:'Jordan Kim',     mitigation:'Alternative pen test firm engaged. Contract approval in progress. Contingency: push go-live to June 13 if alternative not confirmed by May 27.',    status:'Open',       created:'2026-05-21', notes:''},
      {id:9,  title:'SSO enterprise adoption risk — 2 of 6 customers not yet onboarded',      project:'Enterprise SSO & Identity Federation', probability:'Low',   impact:'Low',    rag:'green', owner:'Chris Oduya',    mitigation:'Customer success assigned to each remaining account. Executive sponsor outreach planned.',                                                           status:'Monitoring', created:'2026-05-05', notes:''},
      {id:10, title:'Vendor concentration risk — 3 projects depend on single cloud provider', project:'Nexus Platform Relaunch',             probability:'Low',    impact:'High',   rag:'amber', owner:'Derek Fontaine', mitigation:'Multi-cloud architecture review scheduled for Q3. Contractual SLA protections confirmed.',                                                          status:'Monitoring', created:'2026-04-28', notes:''}
    ],

    // ── Decisions ─────────────────────────────────────────────────────────────
    decisions: [
      {id:1,  title:'Adopt microservices architecture for Nexus Platform core services',      project:'Nexus Platform Relaunch',             owner:'Derek Fontaine', date:'2026-02-14', rationale:'Monolith deployment cycle was 3 weeks. Microservices reduces to 2-day cadence. Enables independent scaling of billing, auth, and API layers.',  status:'Approved', impact:'High',   notes:''},
      {id:2,  title:'Replace Salesforce with CustomerOS — phased migration approach',         project:'CustomerOS CRM Replacement',          owner:'Sandra Holloway',date:'2026-03-06', rationale:'License cost saving of $840K annually. Custom field complexity requires phased approach over 6 months rather than big-bang cutover.',           status:'Approved', impact:'High',   notes:''},
      {id:3,  title:'Pause AI Support Automation GA release pending hallucination fix',       project:'AI-Assisted Support Automation',      owner:'Sandra Holloway',date:'2026-05-15', rationale:'8.3% hallucination rate poses customer trust and compliance risk. GA paused until rate drops below 3% target. Beta continues with opt-in customers.', status:'Approved', impact:'High',  notes:''},
      {id:4,  title:'Engage external security consultant for multi-tenant architecture review',project:'Multi-Tenant SaaS Infrastructure',   owner:'Brandon Whitfield',date:'2026-05-19',rationale:'Internal team lacks isolation pattern expertise. External firm has delivered 4 similar SaaS architecture reviews. 3-week engagement.',          status:'Approved', impact:'High',   notes:''},
      {id:5,  title:'Self-Serve Portal go-live date confirmed: June 2, 2026',                project:'Self-Serve Onboarding Portal',        owner:'Natalie Osei',   date:'2026-05-12', rationale:'UAT passed with 94/100 acceptance criteria met. Remaining 6 items are cosmetic and will be addressed in first patch release.',                  status:'Approved', impact:'Medium', notes:''},
      {id:6,  title:'DataStream to use Apache Flink over Kafka Streams for real-time pipeline',project:'DataStream Analytics Engine',        owner:'Imani Diallo',   date:'2026-03-22', rationale:'Flink handles stateful processing requirements. Kafka Streams lacks native SQL support needed for analyst self-service queries.',              status:'Approved', impact:'Medium', notes:''},
      {id:7,  title:'SSO identity federation standard: SAML 2.0 + OIDC dual support',        project:'Enterprise SSO & Identity Federation',owner:'Chris Oduya',   date:'2026-04-01', rationale:'Enterprise customers split between SAML (legacy IdPs) and OIDC (modern). Dual protocol support required to avoid blocking enterprise sales.',   status:'Approved', impact:'Medium', notes:''},
      {id:8,  title:'DevSecOps pen test firm substitution — SecureProbe Ltd approved',        project:'DevSecOps Pipeline Modernization',   owner:'Jordan Kim',     date:'2026-05-22', rationale:'Original firm overbooked. SecureProbe Ltd has equivalent CREST certification. Contract value identical. Preserves June window.',             status:'Pending',  impact:'Low',    notes:''},
      {id:9,  title:'Defer Nexus Platform mobile SDK to Q4 2026',                            project:'Nexus Platform Relaunch',             owner:'Paul Grayson',   date:'2026-04-18', rationale:'Mobile SDK adds 6 weeks to critical path. Web platform delivers 85% of customer value. SDK deferred to Q4 without material revenue impact.',    status:'Approved', impact:'Medium', notes:''},
      {id:10, title:'Implement human-in-the-loop review for AI Support pending GA',           project:'AI-Assisted Support Automation',      owner:'Natalie Osei',   date:'2026-05-16', rationale:'Protects customer experience during fine-tuning period. CS agents review all AI responses with confidence score below 0.85.',                  status:'Approved', impact:'Medium', notes:''}
    ],

    // ── Action Items ──────────────────────────────────────────────────────────
    actionItems: [
      {id:1,  title:'Confirm SecureProbe pen test contract — June 2 window',         owner:'Jordan Kim',      project:'DevSecOps Pipeline Modernization',  priority:'Critical', status:'In Progress', dueDate:'2026-05-27', source:'Escalation #4',         notes:'Legal reviewing contract. Jordan chasing procurement approval.'},
      {id:2,  title:'Assign senior architect backup for multi-tenant project',        owner:'Derek Fontaine',  project:'Multi-Tenant SaaS Infrastructure',  priority:'Critical', status:'Open',        dueDate:'2026-05-28', source:'Risk #3',               notes:''},
      {id:3,  title:'Schedule VectorMind AI executive escalation call',              owner:'Damon Clarke',    project:'AI-Assisted Support Automation',    priority:'High',     status:'In Progress', dueDate:'2026-05-26', source:'Escalation #2',         notes:'Call booked for May 26, 2pm EST. Damon, Sandra, and vendor VP attending.'},
      {id:4,  title:'Complete Workday SCIM token refresh investigation',             owner:'Chris Oduya',     project:'Enterprise SSO & Identity Federation', priority:'High',  status:'Open',        dueDate:'2026-05-28', source:'Escalation #5',         notes:''},
      {id:5,  title:'Deliver phased migration proposal for CustomerOS to steering',  owner:'Anika Patel',     project:'CustomerOS CRM Replacement',        priority:'High',     status:'In Progress', dueDate:'2026-05-30', source:'Steering Committee',    notes:'Proposal 80% complete. Data team inputs needed.'},
      {id:6,  title:'Complete go-live checklist final 6 items — Self-Serve Portal',  owner:'Priya Nair',      project:'Self-Serve Onboarding Portal',       priority:'High',     status:'In Progress', dueDate:'2026-05-29', source:'Go-Live Checklist',    notes:'Tooltip copy updates, favicon fix, cookie consent banner.'},
      {id:7,  title:'Augment AI training dataset with 12,000 new examples',          owner:'Damon Clarke',    project:'AI-Assisted Support Automation',    priority:'High',     status:'Open',        dueDate:'2026-06-06', source:'Risk Mitigation',       notes:'Customer Success team providing annotated ticket data.'},
      {id:8,  title:'Weekly security briefing with Brandon Whitfield',               owner:'Elena Vasquez',   project:'Multi-Tenant SaaS Infrastructure',  priority:'Medium',   status:'In Progress', dueDate:'2026-05-28', source:'Stakeholder Management',notes:'First briefing delivered May 21. Next: May 28.'},
      {id:9,  title:'DataStream ML evaluation — expand to 15 test scenarios',        owner:'Marcus Webb',     project:'DataStream Analytics Engine',       priority:'Medium',   status:'Open',        dueDate:'2026-06-06', source:'Risk #6',               notes:''},
      {id:10, title:'Prepare monthly budget variance report for CFO',                owner:'Rachel Torres',   project:'Nexus Platform Relaunch',           priority:'Medium',   status:'Open',        dueDate:'2026-05-30', source:'Monthly Cadence',       notes:''},
      {id:11, title:'Onboard remaining 2 enterprise customers to SSO',               owner:'Chris Oduya',     project:'Enterprise SSO & Identity Federation', priority:'Medium',  status:'Open',       dueDate:'2026-06-20', source:'Stakeholder Management',notes:'Accounts: Brightfield Inc, Meridian Corp. CS assigned.'},
      {id:12, title:'Q3 billing module sprint plan — assign dedicated team of 4',    owner:'Rachel Torres',   project:'Nexus Platform Relaunch',           priority:'Medium',   status:'Done',        dueDate:'2026-05-22', source:'Risk #5',               notes:'Team assigned: 2 backend, 1 frontend, 1 QA.'}
    ],

    // ── Milestones ────────────────────────────────────────────────────────────
    milestones: [
      {id:1,  title:'Self-Serve Portal — Production Go-Live',             project:'Self-Serve Onboarding Portal',       owner:'Priya Nair',      date:'2026-06-02', status:'On Track', notes:'UAT passed. Final checklist 94% complete.'},
      {id:2,  title:'DevSecOps Pipeline — Pen Test Complete',             project:'DevSecOps Pipeline Modernization',   owner:'Jordan Kim',      date:'2026-06-02', status:'At Risk',  notes:'Pen test firm substitution pending contract approval.'},
      {id:3,  title:'DevSecOps Pipeline — Production Go-Live',            project:'DevSecOps Pipeline Modernization',   owner:'Jordan Kim',      date:'2026-06-06', status:'At Risk',  notes:'Dependent on pen test completion. Risk of 1-week slip.'},
      {id:4,  title:'CustomerOS — Phase 1 Data Migration Complete',       project:'CustomerOS CRM Replacement',         owner:'Anika Patel',     date:'2026-06-27', status:'At Risk',  notes:'Blocked on field mapping. Phased approach under review.'},
      {id:5,  title:'Multi-Tenant — Architecture Redesign Sign-Off',      project:'Multi-Tenant SaaS Infrastructure',  owner:'Elena Vasquez',   date:'2026-06-12', status:'At Risk',  notes:'External consultant engaged. Review starts May 28.'},
      {id:6,  title:'Nexus Platform — Billing Module MVP',                project:'Nexus Platform Relaunch',            owner:'Rachel Torres',   date:'2026-07-11', status:'On Track', notes:'Dedicated sprint team of 4 in place.'},
      {id:7,  title:'AI Support — Hallucination Rate Target Met (<3%)',   project:'AI-Assisted Support Automation',    owner:'Damon Clarke',    date:'2026-07-18', status:'At Risk',  notes:'Currently at 8.3%. Requires fine-tuning and dataset augmentation.'},
      {id:8,  title:'DataStream — Real-Time Pipeline Production Release', project:'DataStream Analytics Engine',        owner:'Marcus Webb',     date:'2026-07-25', status:'On Track', notes:'Staging validated. ML evaluation expanding.'},
      {id:9,  title:'SSO — All 6 Enterprise Customers Live',              project:'Enterprise SSO & Identity Federation', owner:'Chris Oduya',  date:'2026-07-25', status:'On Track', notes:'4 of 6 complete. 2 remaining in onboarding.'},
      {id:10, title:'Nexus Platform — Full Production Launch',            project:'Nexus Platform Relaunch',            owner:'Rachel Torres',   date:'2026-08-29', status:'On Track', notes:''},
      {id:11, title:'DataStream — Customer Analytics Beta Launch',        project:'DataStream Analytics Engine',        owner:'Marcus Webb',     date:'2026-09-12', status:'On Track', notes:'5 design partner customers confirmed.'},
      {id:12, title:'CustomerOS — Full CRM Cutover',                      project:'CustomerOS CRM Replacement',         owner:'Anika Patel',     date:'2026-09-18', status:'At Risk',  notes:'Timeline dependent on Phase 1 completion.'}
    ],

    // ── Capacity ──────────────────────────────────────────────────────────────
    capacity: [
      {id:1, name:'Rachel Torres',   projects:'Nexus Platform Relaunch',                          allocation:95},
      {id:2, name:'Marcus Webb',     projects:'DataStream Analytics Engine',                       allocation:85},
      {id:3, name:'Anika Patel',     projects:'CustomerOS CRM Replacement',                        allocation:100},
      {id:4, name:'Jordan Kim',      projects:'DevSecOps Pipeline Modernization',                  allocation:80},
      {id:5, name:'Elena Vasquez',   projects:'Multi-Tenant SaaS Infrastructure',                  allocation:120},
      {id:6, name:'Damon Clarke',    projects:'AI-Assisted Support Automation',                    allocation:105},
      {id:7, name:'Priya Nair',      projects:'Self-Serve Onboarding Portal',                      allocation:90},
      {id:8, name:'Chris Oduya',     projects:'Enterprise SSO & Identity Federation',              allocation:75},
      {id:9, name:'Derek Fontaine',  projects:'Multi-Tenant SaaS Infra, Nexus Platform (backup)', allocation:110}
    ],

    // ── Budgets ───────────────────────────────────────────────────────────────
    budgets: [
      {id:1, project:'Nexus Platform Relaunch',            planned:1800000, actual:1020000, startDate:'2026-01-05', endDate:'2026-08-29', notes:'On track. Billing module sprint may add $40K in contractor costs.'},
      {id:2, project:'DataStream Analytics Engine',        planned:940000,  actual:490000,  startDate:'2026-02-01', endDate:'2026-09-12', notes:'Cloud compute costs tracking 8% under forecast.'},
      {id:3, project:'CustomerOS CRM Replacement',         planned:680000,  actual:420000,  startDate:'2026-01-20', endDate:'2026-09-18', notes:'Data engineering augmentation adding $35K unplanned cost. Forecast revised.'},
      {id:4, project:'DevSecOps Pipeline Modernization',   planned:320000,  actual:285000,  startDate:'2026-02-15', endDate:'2026-06-06', notes:'Pen test firm substitution is same contract value. No budget impact.'},
      {id:5, project:'Multi-Tenant SaaS Infrastructure',   planned:750000,  actual:395000,  startDate:'2026-03-01', endDate:'2026-10-31', notes:'External security consultant: $65K unplanned. Architecture redesign sprint adds 3 weeks of team cost.'},
      {id:6, project:'AI-Assisted Support Automation',     planned:520000,  actual:380000,  startDate:'2026-02-10', endDate:'2026-08-01', notes:'GA delay reduces compute costs this quarter. Backup LLM provider evaluation: $18K additional.'},
      {id:7, project:'Self-Serve Onboarding Portal',       planned:280000,  actual:264000,  startDate:'2026-01-15', endDate:'2026-06-02', notes:'Final sprint on track. Hypercare budget of $22K reserved.'},
      {id:8, project:'Enterprise SSO & Identity Federation',planned:410000, actual:245000,  startDate:'2026-02-20', endDate:'2026-07-25', notes:'Under budget. SCIM investigation may require vendor support engagement.'}
    ],

    // ── OKRs / KPIs ───────────────────────────────────────────────────────────
    okrs: [
      {id:1,  type:'OKR', objective:'Reduce platform deployment cycle time by 60%',              keyResult:'Move from 3-week releases to 2-day CI/CD cadence',           project:'Nexus Platform Relaunch',             owner:'Derek Fontaine', progress:75,   target:100, unit:'%', status:'In Progress', dueDate:'2026-08-29', notes:''},
      {id:2,  type:'OKR', objective:'Launch self-serve customer onboarding — zero sales touch',  keyResult:'50% of new SMB customers onboard without CS intervention',    project:'Self-Serve Onboarding Portal',        owner:'Natalie Osei',   progress:90,   target:100, unit:'%', status:'In Progress', dueDate:'2026-07-31', notes:''},
      {id:3,  type:'OKR', objective:'Reduce AI support ticket escalation rate by 40%',           keyResult:'AI handles 60% of tier-1 tickets without human escalation',   project:'AI-Assisted Support Automation',      owner:'Sandra Holloway',progress:25,   target:100, unit:'%', status:'At Risk',     dueDate:'2026-09-30', notes:'Blocked on hallucination rate fix.'},
      {id:4,  type:'KPI', objective:'Platform uptime SLA',                                       keyResult:'Maintain 99.95% availability across all production services',  project:'Nexus Platform Relaunch',             owner:'Rachel Torres',  progress:99.97,target:99.95,unit:'%', status:'Achieved',    dueDate:'2026-12-31', notes:''},
      {id:5,  type:'KPI', objective:'Mean Time to Deploy (MTTD)',                                keyResult:'Average deployment cycle under 4 hours end-to-end',           project:'DevSecOps Pipeline Modernization',    owner:'Jordan Kim',     progress:3.2,  target:4,   unit:'hrs',status:'Achieved',    dueDate:'2026-06-30', notes:'Currently averaging 3.2 hours.'},
      {id:6,  type:'OKR', objective:'Migrate 100% of enterprise customers to SSO',              keyResult:'All 6 enterprise accounts live on federated identity',         project:'Enterprise SSO & Identity Federation',owner:'Chris Oduya',   progress:67,   target:100, unit:'%', status:'In Progress', dueDate:'2026-07-25', notes:'4 of 6 complete.'},
      {id:7,  type:'OKR', objective:'Increase data-driven decision making across product teams', keyResult:'8 product teams using DataStream dashboards weekly',           project:'DataStream Analytics Engine',         owner:'Imani Diallo',   progress:38,   target:100, unit:'%', status:'In Progress', dueDate:'2026-09-30', notes:'3 teams onboarded in beta.'},
      {id:8,  type:'KPI', objective:'CRM data completeness post-migration',                     keyResult:'95% of customer records migrated with no data loss',           project:'CustomerOS CRM Replacement',          owner:'Anika Patel',    progress:0,    target:100, unit:'%', status:'In Progress', dueDate:'2026-09-18', notes:'Migration not yet started — blocked on field mapping.'}
    ],

    // ── Benefits ──────────────────────────────────────────────────────────────
    benefits: [
      {id:1, title:'CI/CD cycle time reduction — engineering velocity gain',      project:'Nexus Platform Relaunch',             type:'Operational', projected:1400000, actual:620000, unit:'$', targetDate:'2027-01-01', status:'In Progress', owner:'Derek Fontaine', notes:'Estimated based on 3 FTE equivalent productivity gain. 44% realized through Q2.'},
      {id:2, title:'Salesforce license cost elimination',                         project:'CustomerOS CRM Replacement',          type:'Financial',   projected:840000,  actual:null,   unit:'$', targetDate:'2026-10-01', status:'Projected',   owner:'Cassandra Yuen',  notes:'Current Salesforce contract expires Sept 30. Savings begin Oct 1 post-migration.'},
      {id:3, title:'CS headcount avoidance — self-serve onboarding',             project:'Self-Serve Onboarding Portal',        type:'Financial',   projected:520000,  actual:null,   unit:'$', targetDate:'2027-01-01', status:'Projected',   owner:'Natalie Osei',    notes:'Eliminates need for 2 additional CS hires planned for H2. Based on 50% SMB self-serve adoption.'},
      {id:4, title:'Support ticket volume reduction via AI automation',           project:'AI-Assisted Support Automation',      type:'Operational', projected:680000,  actual:null,   unit:'$', targetDate:'2026-12-31', status:'At Risk',     owner:'Damon Clarke',    notes:'Delayed by GA pause. Reforecast to Q4 realization pending hallucination fix.'},
      {id:5, title:'Enterprise deal acceleration — SSO as sales unblocking event',project:'Enterprise SSO & Identity Federation',type:'Strategic',   projected:2200000, actual:850000, unit:'$', targetDate:'2026-09-30', status:'In Progress', owner:'Tyler Marsh',     notes:'2 enterprise deals closed that were previously blocked on SSO requirement. Pipeline impact ongoing.'},
      {id:6, title:'Real-time analytics — reduce manual reporting overhead',      project:'DataStream Analytics Engine',         type:'Operational', projected:320000,  actual:null,   unit:'$', targetDate:'2026-12-31', status:'Projected',   owner:'Imani Diallo',    notes:'Replaces 3 weekly manual reporting processes across product and finance teams.'},
      {id:7, title:'Security posture improvement — avoid breach penalty exposure',project:'Multi-Tenant SaaS Infrastructure',   type:'Financial',   projected:5000000, actual:null,   unit:'$', targetDate:'2026-12-31', status:'Projected',   owner:'Brandon Whitfield',notes:'Based on SOC 2 Type II breach penalty exposure under enterprise contracts. Architecture fix is non-negotiable.'}
    ],

    // ── Vendors ───────────────────────────────────────────────────────────────
    vendors: [
      {id:1, name:'VectorMind AI',       category:'AI / LLM Services',       project:'AI-Assisted Support Automation',     contractValue:240000, contractStart:'2026-02-01', contractEnd:'2026-07-31', performance:52, slaTerms:'3% hallucination rate, 99.9% uptime, <500ms p95 latency', contact:'enterprise@vectormind.ai',  status:'At Risk',  notes:'Formal SLA breach notice issued May 14. Performance improvement plan required within 14 days. Backup provider evaluation underway.'},
      {id:2, name:'CloudScale AWS MSP',  category:'Cloud Infrastructure',    project:'Nexus Platform Relaunch',            contractValue:580000, contractStart:'2026-01-01', contractEnd:'2026-12-31', performance:97, slaTerms:'99.99% uptime, 15-min critical response, dedicated TAM', contact:'nexus-tam@cloudscale.io',  status:'Active',   notes:'Excellent partner. TAM proactively flagged cost optimization opportunity in March. Saved $22K.'},
      {id:3, name:'SecureProbe Ltd',     category:'Security Testing',        project:'DevSecOps Pipeline Modernization',   contractValue:38000,  contractStart:'2026-05-22', contractEnd:'2026-06-15', performance:85, slaTerms:'CREST-certified, report within 5 business days of test completion', contact:'ops@secureprobe.co.uk',    status:'Active',   notes:'Substitution approved May 22. CREST certification verified. Replaces original firm.'},
      {id:4, name:'IsoGuard Consulting', category:'Security Architecture',   project:'Multi-Tenant SaaS Infrastructure',   contractValue:65000,  contractStart:'2026-05-26', contractEnd:'2026-06-20', performance:90, slaTerms:'Weekly deliverable cadence, architecture sign-off by June 12', contact:'saas-team@isoguard.com',   status:'Active',   notes:'Specialist multi-tenant SaaS security firm. 4 prior engagements in similar architecture reviews.'},
      {id:5, name:'DataBridge ETL',      category:'Data Integration',        project:'CustomerOS CRM Replacement',         contractValue:95000,  contractStart:'2026-02-15', contractEnd:'2026-09-30', performance:71, slaTerms:'Weekly migration batches, 99.5% record accuracy', contact:'support@databridge.io',     status:'At Risk',  notes:'Field mapping complexity has exceeded SOW scope. Renegotiation in progress. At risk of timeline impact.'},
      {id:6, name:'Okta (Enterprise)',   category:'Identity & Access',       project:'Enterprise SSO & Identity Federation',contractValue:185000, contractStart:'2026-01-01', contractEnd:'2026-12-31', performance:94, slaTerms:'99.99% uptime, dedicated CSM, 4hr support SLA',  contact:'enterprise@okta.com',      status:'Active',   notes:'Strong implementation support. SCIM Workday issue in their known issues list — patch expected June 1.'},
      {id:7, name:'Confluent Cloud',     category:'Data Streaming',          project:'DataStream Analytics Engine',         contractValue:145000, contractStart:'2026-02-01', contractEnd:'2026-12-31', performance:99, slaTerms:'99.99% uptime, dedicated solutions architect', contact:'saas@confluent.io',         status:'Active',   notes:'Excellent SLA performance. Solutions architect proactively optimized partition strategy saving 18% compute.'}
    ],

    // ── Dependencies ──────────────────────────────────────────────────────────
    dependencies: [
      {id:1, fromProject:'AI-Assisted Support Automation',    toProject:'Nexus Platform Relaunch',             description:'AI support widget embedded in new platform — requires Nexus Platform API v2 endpoints',          status:'At Risk', owner:'Damon Clarke',   dueDate:'2026-07-11', impact:'AI GA blocked if Nexus billing module delays API v2 release',    notes:''},
      {id:2, fromProject:'CustomerOS CRM Replacement',        toProject:'DataStream Analytics Engine',         description:'Customer analytics dashboards depend on CustomerOS as primary data source post-migration',        status:'At Risk', owner:'Anika Patel',    dueDate:'2026-07-25', impact:'DataStream customer analytics beta delayed if CRM migration slips', notes:''},
      {id:3, fromProject:'Self-Serve Onboarding Portal',      toProject:'Enterprise SSO & Identity Federation',description:'Self-serve portal uses SSO for enterprise customer authentication at sign-up',                  status:'Active',  owner:'Priya Nair',     dueDate:'2026-06-02', impact:'Enterprise self-serve blocked without SSO. SMB flow unaffected.',  notes:'SSO confirmed ready before portal go-live.'},
      {id:4, fromProject:'DataStream Analytics Engine',       toProject:'Multi-Tenant SaaS Infrastructure',   description:'DataStream tenant data partitioning depends on resolved multi-tenant isolation architecture',      status:'Blocked', owner:'Marcus Webb',    dueDate:'2026-06-12', impact:'DataStream cannot certify tenant data isolation until architecture review complete', notes:''},
      {id:5, fromProject:'Nexus Platform Relaunch',           toProject:'DevSecOps Pipeline Modernization',   description:'Nexus platform deployments move to new CI/CD pipeline — requires pipeline certification first',    status:'Active',  owner:'Rachel Torres',  dueDate:'2026-06-06', impact:'Nexus sprint 10 deployments switch to new pipeline post go-live.',notes:''}
    ],

    // ── Change Requests ───────────────────────────────────────────────────────
    changeRequests: [
      {id:1, title:'Multi-Tenant architecture redesign — 6-week scope addition',        project:'Multi-Tenant SaaS Infrastructure',   requester:'Brandon Whitfield', date:'2026-05-19', impact:'High',   status:'Approved',     scopeChange:'Full isolation architecture redesign + external audit', scheduleChange:'+6 weeks to project end date (Oct 31)', costChange:'+$65,000 (external consultant) +$85,000 (additional sprint cost)', rationale:'P1 security finding requires immediate remediation. Non-negotiable for enterprise customer retention and SOC 2 compliance.', notes:''},
      {id:2, title:'CustomerOS phased migration — redefine Phase 1 scope',              project:'CustomerOS CRM Replacement',          requester:'Anika Patel',        date:'2026-05-17', impact:'High',   status:'Under Review', scopeChange:'Phase 1 reduced to 800 priority accounts from full 12,400 record migration', scheduleChange:'Phase 1 date unchanged (June 27). Full cutover pushed to Sept 18', costChange:'+$35,000 data engineering augmentation', rationale:'3,200 undocumented custom fields make full migration in current timeline infeasible. Phased approach de-risks data integrity.', notes:'Steering committee review May 29.'},
      {id:3, title:'AI Support GA — defer to Q3 2026',                                  project:'AI-Assisted Support Automation',      requester:'Sandra Holloway',    date:'2026-05-15', impact:'High',   status:'Approved',     scopeChange:'GA release removed from Q2 plan. Beta continues with 8 opt-in customers.', scheduleChange:'GA pushed from June 30 to target August 1', costChange:'Neutral — reduces compute costs in Q2, adds vendor evaluation cost $18K', rationale:'8.3% hallucination rate unacceptable for production. Customer trust and compliance risk outweigh schedule pressure.', notes:''},
      {id:4, title:'DevSecOps pen test firm substitution',                               project:'DevSecOps Pipeline Modernization',    requester:'Jordan Kim',         date:'2026-05-21', impact:'Low',    status:'Approved',     scopeChange:'No scope change', scheduleChange:'No schedule change — same June 2 test date preserved', costChange:'No change — same contract value ($38,000)', rationale:'Original firm overbooked. SecureProbe Ltd is CREST-certified equivalent. Approved by CISO May 22.', notes:''},
      {id:5, title:'Nexus Platform — defer mobile SDK to Q4 2026',                      project:'Nexus Platform Relaunch',             requester:'Paul Grayson',       date:'2026-04-18', impact:'Medium', status:'Approved',     scopeChange:'Mobile SDK removed from launch scope. Added to Q4 backlog.', scheduleChange:'Platform launch date unchanged (Aug 29). SDK delivery Q4 2026.', costChange:'-$120,000 Q2/Q3 saving. Budget reallocated to billing module.', rationale:'Mobile SDK adds 6 weeks to critical path. Web platform delivers 85% of customer value at launch. No material revenue impact confirmed by Sales.', notes:''}
    ],

    // ── Comms Log ─────────────────────────────────────────────────────────────
    commsLog: [
      {id:1,  date:'2026-05-22', topic:'Weekly Portfolio Status Report — Week 21',            recipients:'Paul Grayson (CTO), Sandra Holloway (CPO), Cassandra Yuen (CFO)', channel:'Email',   project:'Portfolio',                        summary:'Distributed weekly status covering all 8 projects. Highlighted Multi-Tenant P1 security finding and AI GA deferral as key escalations requiring leadership awareness.',    notes:''},
      {id:2,  date:'2026-05-21', topic:'Multi-Tenant Security Finding — Executive Briefing',  recipients:'Brandon Whitfield (CISO), Paul Grayson (CTO), Derek Fontaine',       channel:'Meeting', project:'Multi-Tenant SaaS Infrastructure',  summary:'Briefed leadership on P1 pen test finding. Architecture review timeline, external consultant engagement, and customer communication plan discussed.',                        notes:'Follow-up: Brandon to approve customer notification wording.'},
      {id:3,  date:'2026-05-19', topic:'VectorMind AI — Formal SLA Breach Notice',            recipients:'VectorMind AI VP Customer Success + Enterprise Team',                  channel:'Email',   project:'AI-Assisted Support Automation',   summary:'Sent formal breach notice referencing Section 4.2 of MSA. Requested 14-day performance improvement plan. Copied legal.',                                                   notes:''},
      {id:4,  date:'2026-05-16', topic:'CustomerOS Steering Committee Update',                 recipients:'Steering Committee (5 members)',                                       channel:'Meeting', project:'CustomerOS CRM Replacement',       summary:'Presented field mapping findings. Proposed phased migration approach. Committee requested proposal document by May 30 before approving CR #2.',                             notes:''},
      {id:5,  date:'2026-05-14', topic:'Self-Serve Portal Go-Live Confirmation',               recipients:'Natalie Osei (VP CS), Product Leadership, Comms Team',               channel:'Email',   project:'Self-Serve Onboarding Portal',     summary:'Confirmed June 2 go-live date. Shared hypercare plan, escalation runbook, and press release draft for review.',                                                           notes:''},
      {id:6,  date:'2026-05-12', topic:'DataStream — Design Partner Beta Invitation',          recipients:'5 Design Partner Customers',                                           channel:'Email',   project:'DataStream Analytics Engine',      summary:'Invited 5 customers to analytics beta program starting July 25. Shared beta terms, feedback cadence, and dedicated slack channel details.',                               notes:''},
      {id:7,  date:'2026-05-08', topic:'Quarterly Portfolio Review — Q2 Board Briefing Prep', recipients:'Paul Grayson, Cassandra Yuen, Board EA',                              channel:'Meeting', project:'Portfolio',                        summary:'Reviewed Q2 portfolio performance, budget variance, and H2 risk profile ahead of board meeting. Board briefing draft approved for distribution.',                         notes:''},
      {id:8,  date:'2026-05-05', topic:'SSO Enterprise Customer Communication',               recipients:'4 Enterprise Customer IT Admins',                                      channel:'Email',   project:'Enterprise SSO & Identity Federation', summary:'Notified successfully onboarded enterprise accounts of SCIM provisioning guide and support contacts.',                                                                notes:''}
    ],

    // ── Lessons Learned ───────────────────────────────────────────────────────
    lessonsLearned: [
      {id:1, project:'DevSecOps Pipeline Modernization', category:'Process',       date:'2026-04-30', owner:'Jordan Kim',      whatWorked:'Trunk-based development with feature flags eliminated merge conflicts and reduced integration failures by 70% vs previous branching model.', whatDidnt:'Pen test not booked early enough — external firm overbooked at the critical window. Contract signed same day as original firm declined.', recommendation:'Book security testing firms minimum 6 weeks in advance. Add "book pen test" as sprint 1 action on all security-adjacent projects.', notes:''},
      {id:2, project:'Self-Serve Onboarding Portal',     category:'People',        date:'2026-05-15', owner:'Priya Nair',      whatWorked:'Embedding a CS lead in the sprint team from sprint 3 onwards caught 14 UX issues before UAT that would have been showstoppers. Saved estimated 3 weeks of rework.', whatDidnt:'Initial requirements gathering did not include SMB customer journey mapping. First 4 sprints built for enterprise workflow — major rework in sprint 5.', recommendation:'Always include at least one end-customer workflow validation session before sprint 1. Use actual customer recordings if available.', notes:''},
      {id:3, project:'Nexus Platform Relaunch',          category:'Technology',    date:'2026-05-10', owner:'Rachel Torres',   whatWorked:'Strangler fig pattern for microservices migration allowed teams to migrate one service at a time without big-bang cutover. Zero production incidents during migration.', whatDidnt:'Service mesh observability tooling was added in sprint 7 — should have been day 1. First 6 sprints had poor distributed tracing, slowing debugging significantly.', recommendation:'Treat observability as a prerequisite, not a feature. No service goes to production without traces, metrics, and alerts configured.', notes:''},
      {id:4, project:'DataStream Analytics Engine',      category:'Technology',    date:'2026-05-08', owner:'Marcus Webb',     whatWorked:'Early engagement of 3 enterprise customers as design partners shaped the schema design in a way that prevented a major rework in sprint 6. Their real data exposed edge cases synthetic test data missed.', whatDidnt:'ML model evaluation was scoped too narrowly — 5 test scenarios is insufficient for production confidence. Found at sprint 8 review.', recommendation:'Define ML acceptance criteria at project start. Minimum 15 diverse test scenarios required before any model goes to production review.', notes:''},
      {id:5, project:'CustomerOS CRM Replacement',       category:'Process',       date:'2026-05-18', owner:'Anika Patel',     whatWorked:'Nothing to report yet — project is in early stage.', whatDidnt:'Data audit was not performed before project kickoff. Custom field discovery should have been week 1 activity — it was discovered in sprint 4, causing a major replan.', recommendation:'For any CRM or data migration project, mandate a full data audit (schema, quality, custom fields) in week 1 before any architecture decisions are made.', notes:'Will add more at project close.'}
    ],

    // ── Velocity ──────────────────────────────────────────────────────────────
    velocityData: [
      {id:1, name:'Sprint 1',  committed:28, completed:22, startDate:'2026-01-06', endDate:'2026-01-17', notes:'Team onboarding and environment setup impacted velocity. Expected.'},
      {id:2, name:'Sprint 2',  committed:32, completed:30, startDate:'2026-01-20', endDate:'2026-01-31', notes:''},
      {id:3, name:'Sprint 3',  committed:34, completed:34, startDate:'2026-02-03', endDate:'2026-02-14', notes:'First clean sprint. Auth migration completed.'},
      {id:4, name:'Sprint 4',  committed:36, completed:33, startDate:'2026-02-17', endDate:'2026-02-28', notes:'2 stories carried over due to unexpected legacy API breaking change.'},
      {id:5, name:'Sprint 5',  committed:38, completed:38, startDate:'2026-03-03', endDate:'2026-03-14', notes:'Strong sprint. Microservices core complete.'},
      {id:6, name:'Sprint 6',  committed:40, completed:36, startDate:'2026-03-17', endDate:'2026-03-28', notes:'Observability tooling integration took longer than estimated. Added to tech debt backlog.'},
      {id:7, name:'Sprint 7',  committed:40, completed:40, startDate:'2026-03-31', endDate:'2026-04-11', notes:''},
      {id:8, name:'Sprint 8',  committed:42, completed:41, startDate:'2026-04-14', endDate:'2026-04-25', notes:'1 story blocked on third-party API — carried to Sprint 9.'},
      {id:9, name:'Sprint 9',  committed:42, completed:42, startDate:'2026-04-28', endDate:'2026-05-09', notes:'Billing module sprint dedicated team performing well.'},
      {id:10,name:'Sprint 10', committed:44, completed:38, startDate:'2026-05-12', endDate:'2026-05-23', notes:'P1 security finding pulled 2 engineers for 3 days. 6 stories moved to Sprint 11.'}
    ],

    // ── Assumptions (for RAID) ────────────────────────────────────────────────
    assumptions: [
      {id:1, title:'Salesforce will provide full data export including all custom field metadata',        project:'CustomerOS CRM Replacement',          owner:'Anika Patel',    status:'Invalidated', impact:'Custom field discovery required manual audit. 3,200 fields not in standard export. Added 3 weeks.',       notes:''},
      {id:2, title:'VectorMind AI will meet 3% hallucination SLA by Q2 with standard fine-tuning',      project:'AI-Assisted Support Automation',       owner:'Damon Clarke',   status:'Invalidated', impact:'Currently at 8.3%. GA deferred to Q3. Backup provider evaluation triggered.',                             notes:''},
      {id:3, title:'Multi-tenant architecture is compliant with SOC 2 Type II isolation requirements',  project:'Multi-Tenant SaaS Infrastructure',     owner:'Elena Vasquez',  status:'Invalidated', impact:'External pen test found isolation vulnerability. Architecture redesign required. 6-week delay.',          notes:''},
      {id:4, title:'Enterprise customers can complete SSO onboarding within 2 weeks with standard docs',project:'Enterprise SSO & Identity Federation',  owner:'Chris Oduya',    status:'Active',      impact:'4 of 6 customers completed on schedule. 2 remaining have non-standard IdP configurations.',                notes:''},
      {id:5, title:'Original pen test firm availability confirmed for June 2 window',                   project:'DevSecOps Pipeline Modernization',      owner:'Jordan Kim',     status:'Invalidated', impact:'Firm overbooked. Substitution required and approved. No schedule impact.',                                 notes:''},
      {id:6, title:'DataStream real-time pipeline can be validated using synthetic test data',           project:'DataStream Analytics Engine',          owner:'Marcus Webb',    status:'Invalidated', impact:'Synthetic data missed edge cases caught only by real customer data. Design partner program added.',        notes:''}
    ],

    nextId: {
      projects:9, stakeholders:9, escalations:6, capacity:10, risks:11, decisions:11,
      actionItems:13, milestones:13, dependencies:6, changeRequests:6, commsLog:9,
      lessonsLearned:6, budgets:9, velocityData:11, assumptions:7,
      okrs:9, benefits:8, vendors:8
    }
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
