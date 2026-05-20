// ─── UTILS ────────────────────────────────────────────────────────────────────

function showToast(msg,type='info'){const t=document.getElementById('toast');t.textContent=msg;t.style.background=type==='error'?'#A32D2D':'#185FA5';t.style.opacity='1';t.style.transform='translateY(0)';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(8px)';},2800);}
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay'))e.target.classList.remove('open');});

const SECTION_TITLES={dashboard:'Executive Dashboard',portfolio:'Portfolio',stakeholders:'Stakeholders',capacity:'Team Capacity',escalations:'Escalations',risks:'Risk Register',decisions:'Decision Log',actions:'Action Items',milestones:'Milestone Tracker',budget:'Budget Tracker',changes:'Change Requests',meetings:'Meeting Cadence',comms:'Comms Log',lessons:'Lessons Learned',raid:'RAID Log',velocity:'Sprint Velocity',ai:'AI Assist',jira:'JIRA',integrations:'Integrations',dependencies:'Dependency Map',changeRequests:'Change Requests',commslog:'Comms Log',lessonslearned:'Lessons Learned',github:'GitHub & CI/CD',calendar:'Calendar & Meetings',confluence:'Confluence'};

function navigate(section,el){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(el) el.classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById('section-'+section);
  if(sec) sec.classList.add('active');
  document.getElementById('topbar-title').textContent=SECTION_TITLES[section]||section;
  if(section==='dashboard') renderDashboard();
  if(section==='velocity')  renderVelocityCharts();
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_COLOR={'On Track':'green','At Risk':'amber','Critical':'red','Completed':'blue'};
const STATUS_FILL={'On Track':'#1D9E75','At Risk':'#EF9F27','Critical':'#E24B4A','Completed':'#378ADD'};
const SEV_COLOR={Critical:'red',High:'amber',Medium:'blue',Low:'gray'};
const STAT_COLOR={Open:'red','In Review':'amber',Monitoring:'blue',Resolved:'green',Completed:'green','In Progress':'blue'};
const ENG_COLOR={Champion:'green',Supportive:'blue',Neutral:'gray',Resistant:'red'};
const AVATAR_COLORS=['blue','teal','amber','purple','coral'];
const RAID_COLORS={Risk:'red',Assumption:'blue',Issue:'amber',Dependency:'purple'};

function ragClass(s){if(s==='On Track'||s==='Resolved'||s==='Approved'||s==='green')return 'green';if(s==='At Risk'||s==='Monitoring'||s==='amber'||s==='Pending'||s==='In Progress')return 'amber';if(s==='Critical'||s==='Open'||s==='red')return 'red';return 'blue';}
function fmt$(n){return '$'+Number(n||0).toLocaleString();}
function pct(a,b){return b?Math.round(a/b*100):0;}

// ─── SHARED AI HELPERS ────────────────────────────────────────────────────────

function setAILoading(panelId,textId,msg){document.getElementById(panelId).style.display='block';const el=document.getElementById(textId);el.className='ai-output-text loading';el.textContent=msg;}
function showAIOutput(panelId,textId,text,title,project,audience){const panel=document.getElementById(panelId);panel.style.display='block';const el=document.getElementById(textId);el.className='ai-output-text';el.textContent=text;if(title)panel.setAttribute('data-title',title);if(project)panel.setAttribute('data-project',project);if(audience)panel.setAttribute('data-audience',audience);panel.setAttribute('data-report',text);}
function copyOutput(textId){navigator.clipboard.writeText(document.getElementById(textId).textContent).then(()=>showToast('Copied'));}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function renderDashboard(){
  const p=state.projects,e=state.escalations,r=state.risks,a=state.actions;
  document.getElementById('ds-projects').textContent=p.length;
  document.getElementById('ds-ontrack').textContent=p.filter(x=>x.status==='On Track').length;
  document.getElementById('ds-atrisk').textContent=p.filter(x=>x.status==='At Risk').length;
  document.getElementById('ds-critical').textContent=p.filter(x=>x.status==='Critical').length;
  document.getElementById('ds-escalations').textContent=e.filter(x=>x.status==='Open').length;
  document.getElementById('ds-risks').textContent=r.filter(x=>x.rag==='red').length;
  document.getElementById('ds-actions').textContent=a.filter(x=>x.status!=='Completed').length;
  document.getElementById('ds-milestones').textContent=state.milestones.filter(x=>x.status==='At Risk'||x.status==='Critical').length;

  document.getElementById('dash-rag-grid').innerHTML=p.map(proj=>`
    <div class="dash-rag-card rag-${ragClass(proj.status)}">
      <div class="rag ${ragClass(proj.status)}" style="margin-top:3px;flex-shrink:0"></div>
      <div class="dash-rag-info">
        <div class="dash-rag-name">${proj.name}</div>
        <div class="dash-rag-meta">${proj.owner} &bull; Due ${proj.due}</div>
        <div class="dash-rag-progress"><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${proj.progress}%;background:${STATUS_FILL[proj.status]||'#888'}"></div></div><span class="progress-label">${proj.progress}%</span></div></div>
      </div>
      <span class="badge ${STATUS_COLOR[proj.status]||'gray'}" style="font-size:10px;flex-shrink:0">${proj.status}</span>
    </div>`).join('');

  const dashTables=[
    {id:'dash-esc-tbody',items:e.filter(x=>x.status!=='Resolved').slice(0,4),cols:5,empty:'No open escalations',render:i=>`<td style="font-weight:500">${i.issue}</td><td style="color:var(--tx2)">${i.project}</td><td><span class="badge ${SEV_COLOR[i.severity]||'gray'}">${i.severity}</span></td><td><span class="badge ${STAT_COLOR[i.status]||'gray'}">${i.status}</span></td><td style="color:var(--tx2)">${i.days}d</td>`},
    {id:'dash-risk-tbody',items:r.filter(x=>x.status!=='Closed').sort((a,b)=>(['High','Medium','Low'].indexOf(a.probability))-(['High','Medium','Low'].indexOf(b.probability))).slice(0,4),cols:5,empty:'No open risks',render:i=>`<td style="font-weight:500">${i.title}</td><td style="color:var(--tx2)">${i.project}</td><td><span class="badge ${SEV_COLOR[i.probability]||'gray'}">${i.probability}</span></td><td><span class="badge ${SEV_COLOR[i.impact]||'gray'}">${i.impact}</span></td><td><span class="rag ${i.rag||'gray'}" style="display:inline-flex"></span></td>`},
    {id:'dash-action-tbody',items:a.filter(x=>x.status!=='Completed').slice(0,4),cols:4,empty:'No open actions',render:i=>`<td style="font-weight:500">${i.title}</td><td style="color:var(--tx2)">${i.owner}</td><td style="color:var(--tx2)">${i.due}</td><td><span class="badge ${i.priority==='High'?'red':i.priority==='Medium'?'amber':'gray'}">${i.priority}</span></td>`},
    {id:'dash-dec-tbody',items:state.decisions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4),cols:4,empty:'No decisions',render:i=>`<td style="font-weight:500">${i.title}</td><td style="color:var(--tx2)">${i.project}</td><td style="color:var(--tx2)">${i.date}</td><td><span class="badge ${i.status==='Approved'?'green':i.status==='Pending'?'amber':'gray'}">${i.status}</span></td>`}
  ];
  dashTables.forEach(({id,items,cols,empty,render})=>{const tb=document.getElementById(id);if(!tb)return;tb.innerHTML=items.length?items.map(i=>`<tr>${render(i)}</tr>`).join(''):`<tr><td colspan="${cols}" style="text-align:center;color:var(--tx3);padding:14px">${empty}</td></tr>`;});
}

async function generateWeeklyDigest(){
  setAILoading('digest-panel','digest-text','Generating weekly digest...');
  const proj=state.projects.map(p=>`${p.name}: ${p.status}, ${p.progress}%`).join('\n');
  const escs=state.escalations.filter(e=>e.status!=='Resolved').map(e=>`${e.issue} (${e.severity})`).join('\n');
  const risks=state.risks.filter(r=>r.rag==='red'||r.rag==='amber').map(r=>`${r.title} (${r.rag})`).join('\n');
  const actions=state.actions.filter(a=>a.status!=='Completed').map(a=>`${a.title} — ${a.owner} due ${a.due}`).join('\n');
  const decs=state.decisions.filter(d=>d.status==='Pending').map(d=>d.title).join('\n');
  const jiraCtx=typeof JIRA!=='undefined'?JIRA.buildAIContext():'';
  const result=await callAI(`Generate a weekly executive digest.\n\nProjects:\n${proj}\n\nEscalations:\n${escs||'None'}\n\nRisks:\n${risks||'None'}\n\nOpen actions:\n${actions||'None'}\n\nPending decisions:\n${decs||'None'}${jiraCtx}\n\nWrite a crisp weekly summary: portfolio health, top risks, open escalations, open actions, pending decisions, 3 recommended actions this week.`);
  if(result) showAIOutput('digest-panel','digest-text',result,'Weekly Executive Digest','Portfolio','Executive Leadership');
}

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────

function renderPortfolio(filter='all'){
  const list=filter==='all'?state.projects:state.projects.filter(p=>p.status===filter);
  const tbody=document.getElementById('projects-tbody');
  tbody.innerHTML=list.length?list.map(p=>`<tr><td style="font-weight:500">${p.name}</td><td style="color:var(--tx2)">${p.owner}</td><td><span class="badge ${STATUS_COLOR[p.status]||'gray'}">${p.status}</span></td><td><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%;background:${STATUS_FILL[p.status]||'#888'}"></div></div><span class="progress-label">${p.progress}%</span></div></td><td style="color:var(--tx2);white-space:nowrap">${p.due}</td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editProject(${p.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteProject(${p.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="6"><div class="empty-state"><i class="ti ti-clipboard-list"></i><p>No projects.</p></div></td></tr>`;
  document.getElementById('m-total').textContent=state.projects.length;
  document.getElementById('m-ontrack').textContent=state.projects.filter(x=>x.status==='On Track').length;
  document.getElementById('m-atrisk').textContent=state.projects.filter(x=>x.status==='At Risk').length;
  document.getElementById('m-critical').textContent=state.projects.filter(x=>x.status==='Critical').length;
  refreshProjectSelect();
}
let _eProjId=null;
function openAddProject(){_eProjId=null;document.getElementById('project-modal-title').textContent='Add Project';['pf-name','pf-owner','pf-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('pf-status').value='On Track';document.getElementById('pf-progress').value='0';document.getElementById('pf-due').value='';document.getElementById('pf-budget').value='0';document.getElementById('pf-spent').value='0';openModal('project-modal');}
function editProject(id){const p=state.projects.find(x=>x.id===id);if(!p)return;_eProjId=id;document.getElementById('project-modal-title').textContent='Edit Project';document.getElementById('pf-name').value=p.name;document.getElementById('pf-owner').value=p.owner;document.getElementById('pf-status').value=p.status;document.getElementById('pf-progress').value=p.progress;document.getElementById('pf-due').value=p.due;document.getElementById('pf-budget').value=p.budget||0;document.getElementById('pf-spent').value=p.spent||0;document.getElementById('pf-notes').value=p.notes||'';openModal('project-modal');}
function saveProject(){const name=document.getElementById('pf-name').value.trim();if(!name){showToast('Name required','error');return;}const d={name,owner:document.getElementById('pf-owner').value.trim()||'Unassigned',status:document.getElementById('pf-status').value,progress:Math.min(100,Math.max(0,parseInt(document.getElementById('pf-progress').value)||0)),due:document.getElementById('pf-due').value||'TBD',budget:parseInt(document.getElementById('pf-budget').value)||0,spent:parseInt(document.getElementById('pf-spent').value)||0,notes:document.getElementById('pf-notes').value.trim()};if(_eProjId){const i=state.projects.findIndex(x=>x.id===_eProjId);state.projects[i]={...state.projects[i],...d};showToast('Updated');}else{d.id=state.nextId.projects++;state.projects.push(d);showToast('Added');}saveState();closeModal('project-modal');renderPortfolio();}
function deleteProject(id){if(!confirm('Delete project?'))return;state.projects=state.projects.filter(x=>x.id!==id);saveState();renderPortfolio();}
function filterProjects(val){renderPortfolio(val);}

// ─── STAKEHOLDERS ─────────────────────────────────────────────────────────────

function renderStakeholders(){const list=document.getElementById('stakeholders-list');list.innerHTML=state.stakeholders.length?state.stakeholders.map(s=>`<div class="stk-row"><div class="avatar ${s.color}">${s.name.split(' ').map(n=>n[0]).join('')}</div><div class="stk-info"><div class="stk-name">${s.name}</div><div class="stk-role">${s.role}</div></div><div class="stk-badges"><span class="badge gray">${s.influence} influence</span><span class="badge ${ENG_COLOR[s.engagement]||'gray'}">${s.engagement}</span></div><div class="stk-actions"><button class="icon-btn" onclick="draftForStakeholder('${s.name}','${s.role}')"><i class="ti ti-send"></i></button><button class="icon-btn" onclick="editStakeholder(${s.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteStakeholder(${s.id})"><i class="ti ti-trash"></i></button></div></div>`).join(''):`<div class="empty-state"><i class="ti ti-users"></i><p>No stakeholders.</p></div>`;}
let _eStkId=null;
function openAddStakeholder(){_eStkId=null;document.getElementById('stk-modal-title').textContent='Add Stakeholder';['sf-name','sf-role','sf-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('sf-influence').value='High';document.getElementById('sf-engagement').value='Supportive';openModal('stakeholder-modal');}
function editStakeholder(id){const s=state.stakeholders.find(x=>x.id===id);if(!s)return;_eStkId=id;document.getElementById('stk-modal-title').textContent='Edit Stakeholder';document.getElementById('sf-name').value=s.name;document.getElementById('sf-role').value=s.role;document.getElementById('sf-influence').value=s.influence;document.getElementById('sf-engagement').value=s.engagement;document.getElementById('sf-notes').value=s.notes||'';openModal('stakeholder-modal');}
function saveStakeholder(){const name=document.getElementById('sf-name').value.trim();if(!name){showToast('Name required','error');return;}const d={name,role:document.getElementById('sf-role').value.trim(),influence:document.getElementById('sf-influence').value,engagement:document.getElementById('sf-engagement').value,notes:document.getElementById('sf-notes').value.trim()};if(_eStkId){const i=state.stakeholders.findIndex(x=>x.id===_eStkId);d.color=state.stakeholders[i].color;state.stakeholders[i]={...state.stakeholders[i],...d};}else{d.id=state.nextId.stakeholders++;d.color=AVATAR_COLORS[state.stakeholders.length%AVATAR_COLORS.length];state.stakeholders.push(d);}saveState();closeModal('stakeholder-modal');renderStakeholders();showToast('Saved');}
function deleteStakeholder(id){if(!confirm('Remove?'))return;state.stakeholders=state.stakeholders.filter(x=>x.id!==id);saveState();renderStakeholders();}
function draftForStakeholder(name,role){navigate('ai',document.querySelector('[data-section="ai"]'));document.getElementById('comms-to').value=name+' ('+role+')';switchAITab('comms-tab',document.getElementById('tab-comms'));}

// ─── CAPACITY ─────────────────────────────────────────────────────────────────

function renderCapacity(){const list=document.getElementById('capacity-list');list.innerHTML=state.capacity.length?state.capacity.map(m=>{const pct=Math.min(m.allocation,100);const color=m.allocation>100?'#E24B4A':m.allocation>85?'#EF9F27':'#1D9E75';return `<div class="cap-row"><div class="cap-row-header"><div><span class="cap-name">${m.name}</span><span class="cap-projects">${m.projects}</span></div><div style="display:flex;align-items:center;gap:7px"><span class="cap-pct" style="color:${color}">${m.allocation}%${m.allocation>100?' — over':''}</span><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editCapacity(${m.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteCapacity(${m.id})"><i class="ti ti-trash"></i></button></div></div></div><div class="cap-bar"><div class="cap-fill" style="width:${pct}%;background:${color}"></div></div></div>`;}).join(''):`<div class="empty-state"><i class="ti ti-chart-bar"></i><p>No team members.</p></div>`;const c=state.capacity;const avg=c.length?Math.round(c.reduce((s,m)=>s+m.allocation,0)/c.length):0;document.getElementById('cm-members').textContent=c.length;document.getElementById('cm-avg').textContent=avg+'%';document.getElementById('cm-over').textContent=c.filter(m=>m.allocation>100).length;document.getElementById('cm-avail').textContent=Math.max(0,100-avg)+'%';}
let _eCapId=null;
function openAddCapacity(){_eCapId=null;document.getElementById('cap-modal-title').textContent='Add Member';['cf-name','cf-projects'].forEach(id=>document.getElementById(id).value='');document.getElementById('cf-allocation').value='100';openModal('capacity-modal');}
function editCapacity(id){const m=state.capacity.find(x=>x.id===id);if(!m)return;_eCapId=id;document.getElementById('cap-modal-title').textContent='Edit Member';document.getElementById('cf-name').value=m.name;document.getElementById('cf-projects').value=m.projects;document.getElementById('cf-allocation').value=m.allocation;openModal('capacity-modal');}
function saveCapacity(){const name=document.getElementById('cf-name').value.trim();if(!name){showToast('Name required','error');return;}const d={name,projects:document.getElementById('cf-projects').value.trim(),allocation:parseInt(document.getElementById('cf-allocation').value)||100};if(_eCapId){const i=state.capacity.findIndex(x=>x.id===_eCapId);state.capacity[i]={...state.capacity[i],...d};}else{d.id=state.nextId.capacity++;state.capacity.push(d);}saveState();closeModal('capacity-modal');renderCapacity();showToast('Saved');}
function deleteCapacity(id){if(!confirm('Remove?'))return;state.capacity=state.capacity.filter(x=>x.id!==id);saveState();renderCapacity();}

// ─── ESCALATIONS ──────────────────────────────────────────────────────────────

function renderEscalations(){const tbody=document.getElementById('escalations-tbody');tbody.innerHTML=state.escalations.length?state.escalations.map(e=>`<tr><td style="font-weight:500">${e.issue}</td><td style="color:var(--tx2)">${e.project}</td><td><span class="badge ${SEV_COLOR[e.severity]||'gray'}">${e.severity}</span></td><td style="color:var(--tx2)">${e.owner}</td><td><span class="badge ${STAT_COLOR[e.status]||'gray'}">${e.status}</span></td><td style="color:var(--tx2)">${e.days}d</td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editEscalation(${e.id})"><i class="ti ti-edit"></i></button><button class="icon-btn" style="color:#0052CC" title="Push to JIRA" onclick="typeof JIRA!=='undefined'&&JIRA.createIssueFromEscalation(${e.id})"><i class="ti ti-brand-jira"></i></button><button class="icon-btn danger" onclick="deleteEscalation(${e.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="7"><div class="empty-state"><i class="ti ti-alert-triangle"></i><p>No escalations.</p></div></td></tr>`;const e2=state.escalations;document.getElementById('em-open').textContent=e2.filter(x=>x.status==='Open').length;document.getElementById('em-critical').textContent=e2.filter(x=>x.severity==='Critical').length;document.getElementById('em-review').textContent=e2.filter(x=>x.status==='In Review').length;document.getElementById('em-resolved').textContent=e2.filter(x=>x.status==='Resolved').length;}
let _eEscId=null;
function openAddEscalation(){_eEscId=null;document.getElementById('esc-modal-title').textContent='Log Escalation';['ef-issue','ef-project','ef-owner','ef-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('ef-severity').value='High';document.getElementById('ef-status').value='Open';document.getElementById('ef-days').value='0';openModal('escalation-modal');}
function editEscalation(id){const e=state.escalations.find(x=>x.id===id);if(!e)return;_eEscId=id;document.getElementById('esc-modal-title').textContent='Edit Escalation';document.getElementById('ef-issue').value=e.issue;document.getElementById('ef-project').value=e.project;document.getElementById('ef-severity').value=e.severity;document.getElementById('ef-owner').value=e.owner;document.getElementById('ef-status').value=e.status;document.getElementById('ef-days').value=e.days;document.getElementById('ef-notes').value=e.notes||'';openModal('escalation-modal');}
function saveEscalation(){const issue=document.getElementById('ef-issue').value.trim();if(!issue){showToast('Issue required','error');return;}const d={issue,project:document.getElementById('ef-project').value.trim()||'General',severity:document.getElementById('ef-severity').value,owner:document.getElementById('ef-owner').value.trim()||'TBD',status:document.getElementById('ef-status').value,days:parseInt(document.getElementById('ef-days').value)||0,notes:document.getElementById('ef-notes').value.trim()};if(_eEscId){const i=state.escalations.findIndex(x=>x.id===_eEscId);state.escalations[i]={...state.escalations[i],...d};}else{d.id=state.nextId.escalations++;state.escalations.push(d);}saveState();closeModal('escalation-modal');renderEscalations();showToast('Saved');}
function deleteEscalation(id){if(!confirm('Delete?'))return;state.escalations=state.escalations.filter(x=>x.id!==id);saveState();renderEscalations();}

// ─── RISKS ────────────────────────────────────────────────────────────────────

const PROB_SCORE={High:3,Medium:2,Low:1};
function calcRag(prob,impact){const s=(PROB_SCORE[prob]||1)*(PROB_SCORE[impact]||1);return s>=6?'red':s>=3?'amber':'green';}
function renderRisks(filter='all'){const list=filter==='all'?state.risks:state.risks.filter(r=>r.rag===filter||r.status===filter);const tbody=document.getElementById('risks-tbody');tbody.innerHTML=list.length?list.map(r=>`<tr><td style="font-weight:500">${r.title}</td><td style="color:var(--tx2)">${r.project}</td><td><span class="badge ${SEV_COLOR[r.probability]||'gray'}">${r.probability}</span></td><td><span class="badge ${SEV_COLOR[r.impact]||'gray'}">${r.impact}</span></td><td><span class="rag ${r.rag||'gray'}" style="display:inline-flex;margin:auto"></span></td><td style="color:var(--tx2)">${r.owner}</td><td style="color:var(--tx2);max-width:160px;font-size:11px">${r.mitigation||'—'}</td><td><span class="badge ${r.status==='Closed'?'green':r.status==='Monitoring'?'blue':'amber'}">${r.status}</span></td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editRisk(${r.id})"><i class="ti ti-edit"></i></button><button class="icon-btn" onclick="aiAnalyzeRisk(${r.id})"><i class="ti ti-sparkles"></i></button><button class="icon-btn danger" onclick="deleteRisk(${r.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="9"><div class="empty-state"><i class="ti ti-shield-exclamation"></i><p>No risks.</p></div></td></tr>`;const rv=state.risks;document.getElementById('rm-total').textContent=rv.length;document.getElementById('rm-red').textContent=rv.filter(x=>x.rag==='red').length;document.getElementById('rm-amber').textContent=rv.filter(x=>x.rag==='amber').length;document.getElementById('rm-open').textContent=rv.filter(x=>x.status==='Open').length;}
let _eRiskId=null;
function openAddRisk(){_eRiskId=null;document.getElementById('risk-modal-title').textContent='Add Risk';['rf-title','rf-project','rf-owner','rf-mitigation','rf-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('rf-probability').value='Medium';document.getElementById('rf-impact').value='Medium';document.getElementById('rf-status').value='Open';document.getElementById('rf-created').value=new Date().toISOString().slice(0,10);openModal('risk-modal');}
function editRisk(id){const r=state.risks.find(x=>x.id===id);if(!r)return;_eRiskId=id;document.getElementById('risk-modal-title').textContent='Edit Risk';document.getElementById('rf-title').value=r.title;document.getElementById('rf-project').value=r.project;document.getElementById('rf-probability').value=r.probability;document.getElementById('rf-impact').value=r.impact;document.getElementById('rf-owner').value=r.owner;document.getElementById('rf-mitigation').value=r.mitigation||'';document.getElementById('rf-status').value=r.status;document.getElementById('rf-created').value=r.created||'';document.getElementById('rf-notes').value=r.notes||'';openModal('risk-modal');}
function saveRisk(){const title=document.getElementById('rf-title').value.trim();if(!title){showToast('Title required','error');return;}const prob=document.getElementById('rf-probability').value;const imp=document.getElementById('rf-impact').value;const d={title,project:document.getElementById('rf-project').value.trim(),probability:prob,impact:imp,rag:calcRag(prob,imp),owner:document.getElementById('rf-owner').value.trim()||'TBD',mitigation:document.getElementById('rf-mitigation').value.trim(),status:document.getElementById('rf-status').value,created:document.getElementById('rf-created').value,notes:document.getElementById('rf-notes').value.trim()};if(_eRiskId){const i=state.risks.findIndex(x=>x.id===_eRiskId);state.risks[i]={...state.risks[i],...d};}else{d.id=state.nextId.risks++;state.risks.push(d);}saveState();closeModal('risk-modal');renderRisks();showToast('Saved');}
function deleteRisk(id){if(!confirm('Delete?'))return;state.risks=state.risks.filter(x=>x.id!==id);saveState();renderRisks();}
async function aiAnalyzeRisk(id){const r=state.risks.find(x=>x.id===id);if(!r)return;setAILoading('risk-ai-panel','risk-ai-text','Analyzing risk...');const result=await callAI(`Analyze this project risk.\nRisk: ${r.title}\nProject: ${r.project}\nProbability: ${r.probability}\nImpact: ${r.impact}\nMitigation: ${r.mitigation||'None'}\nStatus: ${r.status}\n\nProvide: risk assessment, mitigation gaps, 3 recommended actions, escalation threshold.`);if(result)showAIOutput('risk-ai-panel','risk-ai-text',result,'Risk Analysis',r.project,'Risk Management');}
async function aiRiskSummary(){setAILoading('risk-ai-panel','risk-ai-text','Generating risk summary...');const reds=state.risks.filter(r=>r.rag==='red');const ambers=state.risks.filter(r=>r.rag==='amber');const result=await callAI(`Summarize portfolio risk profile.\n\nCritical risks:\n${reds.map(r=>r.title+' — '+r.project+' — Mitigation: '+(r.mitigation||'None')).join('\n')||'None'}\n\nHigh risks:\n${ambers.map(r=>r.title+' — '+r.project).join('\n')||'None'}\n\nProvide: overall risk posture, top 3 priorities, recommended actions for leadership.`);if(result)showAIOutput('risk-ai-panel','risk-ai-text',result,'Risk Summary Report','Portfolio','Leadership');}

// ─── DECISIONS ────────────────────────────────────────────────────────────────

function renderDecisions(filter='all'){const list=filter==='all'?state.decisions:state.decisions.filter(d=>d.status===filter);const tbody=document.getElementById('decisions-tbody');tbody.innerHTML=list.length?list.map(d=>`<tr><td style="font-weight:500">${d.title}</td><td style="color:var(--tx2)">${d.project}</td><td style="color:var(--tx2)">${d.owner}</td><td style="color:var(--tx2);white-space:nowrap">${d.date}</td><td style="color:var(--tx2);max-width:180px;font-size:11px">${d.rationale}</td><td><span class="badge ${d.impact==='High'?'red':d.impact==='Medium'?'amber':'gray'}">${d.impact}</span></td><td><span class="badge ${d.status==='Approved'?'green':d.status==='Pending'?'amber':'gray'}">${d.status}</span></td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editDecision(${d.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteDecision(${d.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="8"><div class="empty-state"><i class="ti ti-note"></i><p>No decisions.</p></div></td></tr>`;const dv=state.decisions;document.getElementById('dm-total').textContent=dv.length;document.getElementById('dm-approved').textContent=dv.filter(x=>x.status==='Approved').length;document.getElementById('dm-pending').textContent=dv.filter(x=>x.status==='Pending').length;document.getElementById('dm-high').textContent=dv.filter(x=>x.impact==='High').length;}
let _eDecId=null;
function openAddDecision(){_eDecId=null;document.getElementById('dec-modal-title').textContent='Log Decision';['df-title','df-project','df-owner','df-rationale','df-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('df-date').value=new Date().toISOString().slice(0,10);document.getElementById('df-impact').value='Medium';document.getElementById('df-status').value='Pending';openModal('decision-modal');}
function editDecision(id){const d=state.decisions.find(x=>x.id===id);if(!d)return;_eDecId=id;document.getElementById('dec-modal-title').textContent='Edit Decision';document.getElementById('df-title').value=d.title;document.getElementById('df-project').value=d.project;document.getElementById('df-owner').value=d.owner;document.getElementById('df-date').value=d.date;document.getElementById('df-rationale').value=d.rationale;document.getElementById('df-impact').value=d.impact;document.getElementById('df-status').value=d.status;document.getElementById('df-notes').value=d.notes||'';openModal('decision-modal');}
function saveDecision(){const title=document.getElementById('df-title').value.trim();if(!title){showToast('Title required','error');return;}const d={title,project:document.getElementById('df-project').value.trim(),owner:document.getElementById('df-owner').value.trim()||'TBD',date:document.getElementById('df-date').value||new Date().toISOString().slice(0,10),rationale:document.getElementById('df-rationale').value.trim(),impact:document.getElementById('df-impact').value,status:document.getElementById('df-status').value,notes:document.getElementById('df-notes').value.trim()};if(_eDecId){const i=state.decisions.findIndex(x=>x.id===_eDecId);state.decisions[i]={...state.decisions[i],...d};}else{d.id=state.nextId.decisions++;state.decisions.push(d);}saveState();closeModal('decision-modal');renderDecisions();showToast('Saved');}
function deleteDecision(id){if(!confirm('Delete?'))return;state.decisions=state.decisions.filter(x=>x.id!==id);saveState();renderDecisions();}

// ─── ACTION ITEMS ─────────────────────────────────────────────────────────────

function renderActions(filter='all'){
  const list=filter==='all'?state.actions:state.actions.filter(a=>a.status===filter||a.priority===filter);
  const tbody=document.getElementById('actions-tbody');
  const today=new Date(); today.setHours(0,0,0,0);
  tbody.innerHTML=list.length?list.map(a=>{const due=new Date(a.due);const overdue=due<today&&a.status!=='Completed';return `<tr${overdue?' style="background:var(--red-bg)"':''}>
    <td style="font-weight:500">${a.title}</td><td style="color:var(--tx2)">${a.project}</td>
    <td style="color:var(--tx2)">${a.owner}</td>
    <td style="color:var(--tx2);white-space:nowrap${overdue?';color:var(--red)':''}">${a.due}${overdue?' ⚠':''}</td>
    <td><span class="badge ${a.priority==='High'?'red':a.priority==='Medium'?'amber':'gray'}">${a.priority}</span></td>
    <td><span class="badge ${STAT_COLOR[a.status]||'gray'}">${a.status}</span></td>
    <td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editAction(${a.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteAction(${a.id})"><i class="ti ti-trash"></i></button></div></td>
  </tr>`;}).join(''):`<tr><td colspan="7"><div class="empty-state"><i class="ti ti-checklist"></i><p>No action items.</p></div></td></tr>`;
  document.getElementById('ac-open').textContent=state.actions.filter(x=>x.status==='Open').length;
  document.getElementById('ac-inprog').textContent=state.actions.filter(x=>x.status==='In Progress').length;
  document.getElementById('ac-done').textContent=state.actions.filter(x=>x.status==='Completed').length;
  document.getElementById('ac-overdue').textContent=state.actions.filter(a=>{const d=new Date(a.due);d.setHours(0,0,0,0);return d<today&&a.status!=='Completed';}).length;
}
let _eActId=null;
function openAddAction(){_eActId=null;document.getElementById('act-modal-title').textContent='Add Action Item';['af-title','af-project','af-owner','af-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('af-priority').value='Medium';document.getElementById('af-status').value='Open';document.getElementById('af-due').value='';openModal('action-modal');}
function editAction(id){const a=state.actions.find(x=>x.id===id);if(!a)return;_eActId=id;document.getElementById('act-modal-title').textContent='Edit Action';document.getElementById('af-title').value=a.title;document.getElementById('af-project').value=a.project;document.getElementById('af-owner').value=a.owner;document.getElementById('af-due').value=a.due;document.getElementById('af-priority').value=a.priority;document.getElementById('af-status').value=a.status;document.getElementById('af-notes').value=a.notes||'';openModal('action-modal');}
function saveAction(){const title=document.getElementById('af-title').value.trim();if(!title){showToast('Title required','error');return;}const d={title,project:document.getElementById('af-project').value.trim(),owner:document.getElementById('af-owner').value.trim()||'TBD',due:document.getElementById('af-due').value||'TBD',priority:document.getElementById('af-priority').value,status:document.getElementById('af-status').value,notes:document.getElementById('af-notes').value.trim()};if(_eActId){const i=state.actions.findIndex(x=>x.id===_eActId);state.actions[i]={...state.actions[i],...d};}else{d.id=state.nextId.actions++;state.actions.push(d);}saveState();closeModal('action-modal');renderActions();showToast('Saved');}
function deleteAction(id){if(!confirm('Delete?'))return;state.actions=state.actions.filter(x=>x.id!==id);saveState();renderActions();}
async function aiExtractActions(){const notes=document.getElementById('action-notes-input').value.trim();if(!notes){showToast('Paste meeting notes first','error');return;}setAILoading('action-ai-panel','action-ai-text','Extracting action items...');const result=await callAI(`Extract action items from these meeting notes.\nFormat each action item as: TITLE | OWNER | DUE DATE | PRIORITY\nNotes:\n${notes}\n\nList only clear, specific action items with an owner. If due date is not mentioned, write TBD. Priority: High/Medium/Low.`);if(result){showAIOutput('action-ai-panel','action-ai-text',result,'Extracted Actions','','');}}

// ─── MILESTONES ───────────────────────────────────────────────────────────────

function renderMilestones(filter='all'){
  const list=filter==='all'?state.milestones:state.milestones.filter(m=>m.status===filter||m.project===filter);
  const sorted=list.slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  const container=document.getElementById('milestones-list');
  const today=new Date(); today.setHours(0,0,0,0);
  container.innerHTML=sorted.length?sorted.map(m=>{const d=new Date(m.date);const days=Math.ceil((d-today)/86400000);const overdue=days<0&&m.status!=='Completed';return `<div class="milestone-item">
    <div class="milestone-date">${m.date}<div style="font-size:10px;color:${overdue?'var(--red)':days<=7?'var(--amber)':'var(--tx3)'}">${overdue?'Overdue':days===0?'Today':days+'d away'}</div></div>
    <div class="rag ${ragClass(m.status)}" style="flex-shrink:0;margin-top:4px"></div>
    <div class="milestone-info"><div class="milestone-title">${m.title}</div><div class="milestone-project">${m.project} &bull; ${m.owner}</div></div>
    <span class="badge ${STATUS_COLOR[m.status]||'gray'}">${m.status}</span>
    <div style="display:flex;gap:3px"><button class="icon-btn" onclick="editMilestone(${m.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteMilestone(${m.id})"><i class="ti ti-trash"></i></button></div>
  </div>`;}).join(''):`<div class="empty-state"><i class="ti ti-calendar-event"></i><p>No milestones.</p></div>`;
  document.getElementById('ms-total').textContent=state.milestones.length;
  document.getElementById('ms-upcoming').textContent=state.milestones.filter(m=>{const d=new Date(m.date);return d>=today&&d<=new Date(today.getTime()+7*86400000);}).length;
  document.getElementById('ms-atrisk').textContent=state.milestones.filter(m=>m.status==='At Risk'||m.status==='Critical').length;
  document.getElementById('ms-done').textContent=state.milestones.filter(m=>m.status==='Completed').length;
}
let _eMsId=null;
function openAddMilestone(){_eMsId=null;document.getElementById('ms-modal-title').textContent='Add Milestone';['mf-title','mf-project','mf-owner','mf-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('mf-status').value='On Track';document.getElementById('mf-date').value='';openModal('milestone-modal');}
function editMilestone(id){const m=state.milestones.find(x=>x.id===id);if(!m)return;_eMsId=id;document.getElementById('ms-modal-title').textContent='Edit Milestone';document.getElementById('mf-title').value=m.title;document.getElementById('mf-project').value=m.project;document.getElementById('mf-owner').value=m.owner;document.getElementById('mf-date').value=m.date;document.getElementById('mf-status').value=m.status;document.getElementById('mf-notes').value=m.notes||'';openModal('milestone-modal');}
function saveMilestone(){const title=document.getElementById('mf-title').value.trim();if(!title){showToast('Title required','error');return;}const d={title,project:document.getElementById('mf-project').value.trim(),owner:document.getElementById('mf-owner').value.trim(),date:document.getElementById('mf-date').value||'TBD',status:document.getElementById('mf-status').value,notes:document.getElementById('mf-notes').value.trim()};if(_eMsId){const i=state.milestones.findIndex(x=>x.id===_eMsId);state.milestones[i]={...state.milestones[i],...d};}else{d.id=state.nextId.milestones++;state.milestones.push(d);}saveState();closeModal('milestone-modal');renderMilestones();showToast('Saved');}
function deleteMilestone(id){if(!confirm('Delete?'))return;state.milestones=state.milestones.filter(x=>x.id!==id);saveState();renderMilestones();}

// ─── BUDGET ───────────────────────────────────────────────────────────────────

function renderBudget(){
  const container=document.getElementById('budget-list');
  const totalBudget=state.projects.reduce((s,p)=>s+(p.budget||0),0);
  const totalSpent=state.projects.reduce((s,p)=>s+(p.spent||0),0);
  const totalRemaining=totalBudget-totalSpent;
  document.getElementById('bm-total').textContent=fmt$(totalBudget);
  document.getElementById('bm-spent').textContent=fmt$(totalSpent);
  document.getElementById('bm-remaining').textContent=fmt$(totalRemaining);
  document.getElementById('bm-pct').textContent=pct(totalSpent,totalBudget)+'%';
  container.innerHTML=state.projects.map(p=>{
    const b=p.budget||0;const s=p.spent||0;const r=b-s;const pp=pct(s,b);const over=s>b;
    const color=over?'#E24B4A':pp>85?'#EF9F27':'#1D9E75';
    return `<div class="budget-row">
      <div class="budget-label"><div style="font-size:12px;font-weight:500">${p.name}</div><div style="font-size:10px;color:var(--tx2)">${p.owner}</div></div>
      <div style="flex:1"><div class="budget-track"><div class="budget-fill" style="width:${Math.min(pp,100)}%;background:${color}"></div></div><div style="font-size:10px;color:var(--tx3);margin-top:2px">${pp}% spent${over?' — OVER BUDGET':''}</div></div>
      <div class="budget-nums"><div style="font-size:12px;color:var(--tx2)">${fmt$(s)} / ${fmt$(b)}</div><div style="font-size:10px;color:${r<0?'var(--red)':'var(--green)'}">${r<0?'Over: '+fmt$(-r):'Left: '+fmt$(r)}</div></div>
      <div style="display:flex;gap:3px;margin-left:8px"><button class="icon-btn" onclick="editProject(${p.id})"><i class="ti ti-edit"></i></button></div>
    </div>`;
  }).join('') || '<div class="empty-state"><i class="ti ti-coin"></i><p>No budget data. Edit projects to add budgets.</p></div>';
}

// ─── CHANGES ──────────────────────────────────────────────────────────────────

function renderChanges(filter='all'){const list=filter==='all'?state.changes:state.changes.filter(c=>c.status===filter);const tbody=document.getElementById('changes-tbody');tbody.innerHTML=list.length?list.map(c=>`<tr><td style="font-weight:500">${c.title}</td><td style="color:var(--tx2)">${c.project}</td><td style="color:var(--tx2)">${c.requestor}</td><td style="color:var(--tx2);white-space:nowrap">${c.date}</td><td><span class="badge ${c.impact==='High'?'red':c.impact==='Medium'?'amber':'gray'}">${c.impact}</span></td><td><span class="badge ${c.effort==='High'?'red':c.effort==='Medium'?'amber':'gray'}">${c.effort}</span></td><td style="color:var(--tx2)">${fmt$(c.budget_impact)}</td><td><span class="badge ${c.status==='Approved'?'green':c.status==='Pending'?'amber':c.status==='Rejected'?'red':'gray'}">${c.status}</span></td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editChange(${c.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteChange(${c.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="9"><div class="empty-state"><i class="ti ti-arrows-exchange"></i><p>No change requests.</p></div></td></tr>`;document.getElementById('ch-total').textContent=state.changes.length;document.getElementById('ch-pending').textContent=state.changes.filter(x=>x.status==='Pending').length;document.getElementById('ch-approved').textContent=state.changes.filter(x=>x.status==='Approved').length;document.getElementById('ch-budget').textContent=fmt$(state.changes.filter(x=>x.status==='Approved').reduce((s,c)=>s+(c.budget_impact||0),0));}
let _eChId=null;
function openAddChange(){_eChId=null;document.getElementById('ch-modal-title').textContent='Log Change Request';['cf2-title','cf2-project','cf2-requestor','cf2-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('cf2-date').value=new Date().toISOString().slice(0,10);document.getElementById('cf2-impact').value='Medium';document.getElementById('cf2-effort').value='Medium';document.getElementById('cf2-status').value='Pending';document.getElementById('cf2-budget').value='0';openModal('change-modal');}
function editChange(id){const c=state.changes.find(x=>x.id===id);if(!c)return;_eChId=id;document.getElementById('ch-modal-title').textContent='Edit Change Request';document.getElementById('cf2-title').value=c.title;document.getElementById('cf2-project').value=c.project;document.getElementById('cf2-requestor').value=c.requestor;document.getElementById('cf2-date').value=c.date;document.getElementById('cf2-impact').value=c.impact;document.getElementById('cf2-effort').value=c.effort;document.getElementById('cf2-status').value=c.status;document.getElementById('cf2-budget').value=c.budget_impact||0;document.getElementById('cf2-notes').value=c.notes||'';openModal('change-modal');}
function saveChange(){const title=document.getElementById('cf2-title').value.trim();if(!title){showToast('Title required','error');return;}const d={title,project:document.getElementById('cf2-project').value.trim(),requestor:document.getElementById('cf2-requestor').value.trim(),date:document.getElementById('cf2-date').value,impact:document.getElementById('cf2-impact').value,effort:document.getElementById('cf2-effort').value,status:document.getElementById('cf2-status').value,budget_impact:parseInt(document.getElementById('cf2-budget').value)||0,notes:document.getElementById('cf2-notes').value.trim()};if(_eChId){const i=state.changes.findIndex(x=>x.id===_eChId);state.changes[i]={...state.changes[i],...d};}else{d.id=state.nextId.changes++;state.changes.push(d);}saveState();closeModal('change-modal');renderChanges();showToast('Saved');}
function deleteChange(id){if(!confirm('Delete?'))return;state.changes=state.changes.filter(x=>x.id!==id);saveState();renderChanges();}

// ─── MEETINGS ─────────────────────────────────────────────────────────────────

function renderMeetings(){const tbody=document.getElementById('meetings-tbody');tbody.innerHTML=state.meetings.length?state.meetings.map(m=>`<tr><td style="font-weight:500">${m.name}</td><td><span class="badge blue">${m.cadence}</span></td><td style="color:var(--tx2)">${m.day} ${m.time}</td><td style="color:var(--tx2);font-size:11px">${m.attendees}</td><td style="color:var(--tx2)">${m.lastRun}</td><td style="color:var(--tx2)">${m.nextRun}</td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editMeeting(${m.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteMeeting(${m.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="7"><div class="empty-state"><i class="ti ti-calendar"></i><p>No meetings logged.</p></div></td></tr>`;}
let _eMtgId=null;
function openAddMeeting(){_eMtgId=null;document.getElementById('mtg-modal-title').textContent='Add Meeting';['mf2-name','mf2-attendees','mf2-notes'].forEach(id=>document.getElementById(id).value='');document.getElementById('mf2-cadence').value='Weekly';document.getElementById('mf2-day').value='Monday';document.getElementById('mf2-time').value='10:00';document.getElementById('mf2-last').value='';document.getElementById('mf2-next').value='';openModal('meeting-modal');}
function editMeeting(id){const m=state.meetings.find(x=>x.id===id);if(!m)return;_eMtgId=id;document.getElementById('mtg-modal-title').textContent='Edit Meeting';document.getElementById('mf2-name').value=m.name;document.getElementById('mf2-cadence').value=m.cadence;document.getElementById('mf2-day').value=m.day;document.getElementById('mf2-time').value=m.time;document.getElementById('mf2-attendees').value=m.attendees;document.getElementById('mf2-last').value=m.lastRun;document.getElementById('mf2-next').value=m.nextRun;document.getElementById('mf2-notes').value=m.notes||'';openModal('meeting-modal');}
function saveMeeting(){const name=document.getElementById('mf2-name').value.trim();if(!name){showToast('Name required','error');return;}const d={name,cadence:document.getElementById('mf2-cadence').value,day:document.getElementById('mf2-day').value,time:document.getElementById('mf2-time').value,attendees:document.getElementById('mf2-attendees').value.trim(),lastRun:document.getElementById('mf2-last').value,nextRun:document.getElementById('mf2-next').value,notes:document.getElementById('mf2-notes').value.trim()};if(_eMtgId){const i=state.meetings.findIndex(x=>x.id===_eMtgId);state.meetings[i]={...state.meetings[i],...d};}else{d.id=state.nextId.meetings++;state.meetings.push(d);}saveState();closeModal('meeting-modal');renderMeetings();showToast('Saved');}
function deleteMeeting(id){if(!confirm('Delete?'))return;state.meetings=state.meetings.filter(x=>x.id!==id);saveState();renderMeetings();}

// ─── COMMS LOG ────────────────────────────────────────────────────────────────

function renderCommsLog(){const tbody=document.getElementById('comms-tbody');tbody.innerHTML=state.commsLog.length?state.commsLog.map(c=>`<tr><td style="font-weight:500">${c.subject}</td><td style="color:var(--tx2);max-width:140px">${c.recipient}</td><td><span class="badge blue">${c.channel}</span></td><td style="color:var(--tx2);white-space:nowrap">${c.date}</td><td style="color:var(--tx2)">${c.project}</td><td><span class="badge gray">${c.type}</span></td><td style="color:var(--tx2);font-size:11px;max-width:160px">${c.summary}</td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editComms(${c.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteComms(${c.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="8"><div class="empty-state"><i class="ti ti-mail"></i><p>No communications logged.</p></div></td></tr>`;}
let _eCmId=null;
function openAddComms(){_eCmId=null;document.getElementById('cm-modal-title').textContent='Log Communication';['cmf-subject','cmf-recipient','cmf-project','cmf-summary'].forEach(id=>document.getElementById(id).value='');document.getElementById('cmf-channel').value='Email';document.getElementById('cmf-type').value='Weekly update';document.getElementById('cmf-date').value=new Date().toISOString().slice(0,10);openModal('comms-modal');}
function editComms(id){const c=state.commsLog.find(x=>x.id===id);if(!c)return;_eCmId=id;document.getElementById('cm-modal-title').textContent='Edit Communication';document.getElementById('cmf-subject').value=c.subject;document.getElementById('cmf-recipient').value=c.recipient;document.getElementById('cmf-channel').value=c.channel;document.getElementById('cmf-date').value=c.date;document.getElementById('cmf-type').value=c.type;document.getElementById('cmf-project').value=c.project;document.getElementById('cmf-summary').value=c.summary;openModal('comms-modal');}
function saveComms(){const subject=document.getElementById('cmf-subject').value.trim();if(!subject){showToast('Subject required','error');return;}const d={subject,recipient:document.getElementById('cmf-recipient').value.trim(),channel:document.getElementById('cmf-channel').value,date:document.getElementById('cmf-date').value,type:document.getElementById('cmf-type').value,project:document.getElementById('cmf-project').value.trim(),summary:document.getElementById('cmf-summary').value.trim()};if(_eCmId){const i=state.commsLog.findIndex(x=>x.id===_eCmId);state.commsLog[i]={...state.commsLog[i],...d};}else{d.id=state.nextId.commsLog++;state.commsLog.push(d);}saveState();closeModal('comms-modal');renderCommsLog();showToast('Saved');}
function deleteComms(id){if(!confirm('Delete?'))return;state.commsLog=state.commsLog.filter(x=>x.id!==id);saveState();renderCommsLog();}

// ─── LESSONS LEARNED ──────────────────────────────────────────────────────────

function renderLessons(filter='all'){const list=filter==='all'?state.lessons:state.lessons.filter(l=>l.category===filter||l.type===filter);const tbody=document.getElementById('lessons-tbody');tbody.innerHTML=list.length?list.map(l=>`<tr><td style="font-weight:500">${l.title}</td><td style="color:var(--tx2)">${l.project}</td><td><span class="badge ${l.type==='Success'?'green':'blue'}">${l.type}</span></td><td style="color:var(--tx2)">${l.category}</td><td style="color:var(--tx2)">${l.owner}</td><td style="color:var(--tx2);white-space:nowrap">${l.date}</td><td style="color:var(--tx2);font-size:11px;max-width:180px">${l.description}</td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editLesson(${l.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteLesson(${l.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="8"><div class="empty-state"><i class="ti ti-bulb"></i><p>No lessons recorded.</p></div></td></tr>`;}
let _eLsnId=null;
function openAddLesson(){_eLsnId=null;document.getElementById('lsn-modal-title').textContent='Add Lesson';['lf-title','lf-project','lf-owner','lf-description'].forEach(id=>document.getElementById(id).value='');document.getElementById('lf-category').value='Delivery';document.getElementById('lf-type').value='Improvement';document.getElementById('lf-date').value=new Date().toISOString().slice(0,10);openModal('lesson-modal');}
function editLesson(id){const l=state.lessons.find(x=>x.id===id);if(!l)return;_eLsnId=id;document.getElementById('lsn-modal-title').textContent='Edit Lesson';document.getElementById('lf-title').value=l.title;document.getElementById('lf-project').value=l.project;document.getElementById('lf-category').value=l.category;document.getElementById('lf-type').value=l.type;document.getElementById('lf-owner').value=l.owner;document.getElementById('lf-date').value=l.date;document.getElementById('lf-description').value=l.description;openModal('lesson-modal');}
function saveLesson(){const title=document.getElementById('lf-title').value.trim();if(!title){showToast('Title required','error');return;}const d={title,project:document.getElementById('lf-project').value.trim(),category:document.getElementById('lf-category').value,type:document.getElementById('lf-type').value,owner:document.getElementById('lf-owner').value.trim(),date:document.getElementById('lf-date').value,description:document.getElementById('lf-description').value.trim()};if(_eLsnId){const i=state.lessons.findIndex(x=>x.id===_eLsnId);state.lessons[i]={...state.lessons[i],...d};}else{d.id=state.nextId.lessons++;state.lessons.push(d);}saveState();closeModal('lesson-modal');renderLessons();showToast('Saved');}
function deleteLesson(id){if(!confirm('Delete?'))return;state.lessons=state.lessons.filter(x=>x.id!==id);saveState();renderLessons();}

// ─── RAID LOG ─────────────────────────────────────────────────────────────────

function renderRaid(filter='all'){const list=filter==='all'?state.raid:state.raid.filter(r=>r.type===filter||r.status===filter);const tbody=document.getElementById('raid-tbody');tbody.innerHTML=list.length?list.map(r=>`<tr><td><span class="badge ${RAID_COLORS[r.type]?'':'gray'}" style="background:var(--${RAID_COLORS[r.type]||'gray'}-bg,var(--gray-bg));color:var(--${RAID_COLORS[r.type]||'gray'},var(--gray-tx))">${r.type}</span></td><td style="font-weight:500">${r.title}</td><td style="color:var(--tx2)">${r.project}</td><td><span class="badge ${SEV_COLOR[r.impact]||'gray'}">${r.impact}</span></td><td style="color:var(--tx2)">${r.owner}</td><td style="color:var(--tx2);font-size:11px">${r.action}</td><td style="color:var(--tx2);white-space:nowrap">${r.due}</td><td><span class="badge ${STAT_COLOR[r.status]||'gray'}">${r.status}</span></td><td><div style="display:flex;gap:3px"><button class="icon-btn" onclick="editRaid(${r.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteRaid(${r.id})"><i class="ti ti-trash"></i></button></div></td></tr>`).join(''):`<tr><td colspan="9"><div class="empty-state"><i class="ti ti-table"></i><p>No RAID items.</p></div></td></tr>`;document.getElementById('raid-r').textContent=state.raid.filter(x=>x.type==='Risk').length;document.getElementById('raid-a').textContent=state.raid.filter(x=>x.type==='Assumption').length;document.getElementById('raid-i').textContent=state.raid.filter(x=>x.type==='Issue').length;document.getElementById('raid-d').textContent=state.raid.filter(x=>x.type==='Dependency').length;}
let _eRaidId=null;
function openAddRaid(){_eRaidId=null;document.getElementById('raid-modal-title').textContent='Add RAID Item';['rdf-title','rdf-project','rdf-owner','rdf-action'].forEach(id=>document.getElementById(id).value='');document.getElementById('rdf-type').value='Risk';document.getElementById('rdf-impact').value='Medium';document.getElementById('rdf-status').value='Open';document.getElementById('rdf-due').value='';openModal('raid-modal');}
function editRaid(id){const r=state.raid.find(x=>x.id===id);if(!r)return;_eRaidId=id;document.getElementById('raid-modal-title').textContent='Edit RAID Item';document.getElementById('rdf-type').value=r.type;document.getElementById('rdf-title').value=r.title;document.getElementById('rdf-project').value=r.project;document.getElementById('rdf-impact').value=r.impact;document.getElementById('rdf-owner').value=r.owner;document.getElementById('rdf-action').value=r.action;document.getElementById('rdf-due').value=r.due;document.getElementById('rdf-status').value=r.status;openModal('raid-modal');}
function saveRaid(){const title=document.getElementById('rdf-title').value.trim();if(!title){showToast('Title required','error');return;}const d={type:document.getElementById('rdf-type').value,title,project:document.getElementById('rdf-project').value.trim(),impact:document.getElementById('rdf-impact').value,owner:document.getElementById('rdf-owner').value.trim()||'TBD',action:document.getElementById('rdf-action').value.trim(),due:document.getElementById('rdf-due').value||'TBD',status:document.getElementById('rdf-status').value};if(_eRaidId){const i=state.raid.findIndex(x=>x.id===_eRaidId);state.raid[i]={...state.raid[i],...d};}else{d.id=state.nextId.raid++;state.raid.push(d);}saveState();closeModal('raid-modal');renderRaid();showToast('Saved');}
function deleteRaid(id){if(!confirm('Delete?'))return;state.raid=state.raid.filter(x=>x.id!==id);saveState();renderRaid();}

// ─── SPRINT VELOCITY ──────────────────────────────────────────────────────────

function renderVelocityCharts(){
  const projects=[...new Set(state.velocity.map(v=>v.project))];
  const container=document.getElementById('velocity-charts');
  if(!projects.length){container.innerHTML='<div class="empty-state"><i class="ti ti-chart-line"></i><p>No velocity data. Add sprint records below.</p></div>';return;}
  container.innerHTML=projects.map(proj=>{
    const sprints=state.velocity.filter(v=>v.project===proj).sort((a,b)=>new Date(a.date)-new Date(b.date));
    const avgComp=Math.round(sprints.reduce((s,v)=>s+v.completed,0)/sprints.length);
    const trend=sprints.length>1?sprints[sprints.length-1].completed-sprints[sprints.length-2].completed:0;
    const maxVal=Math.max(...sprints.map(v=>v.planned),1);
    return `<div class="card"><div class="card-header"><span class="card-title">${proj}</span><div style="font-size:11px;color:var(--tx2)">Avg: ${avgComp} pts &bull; Trend: <span style="color:${trend>=0?'var(--green)':'var(--red)'}">${trend>=0?'+':''}${trend}</span></div></div>
    ${sprints.map(s=>{const pp=Math.round(s.planned/maxVal*100);const cp=Math.round(s.completed/maxVal*100);const eff=Math.round(s.completed/s.planned*100);return `<div class="velocity-bar"><span class="velocity-label">${s.sprint}</span><div class="velocity-track"><div class="velocity-planned" style="width:${pp}%"></div><div class="velocity-completed" style="width:${cp}%;background:${eff>=90?'#1D9E75':eff>=70?'#EF9F27':'#E24B4A'}"></div></div><span class="velocity-pct">${s.completed}/${s.planned}</span></div>`;}).join('')}</div>`;
  }).join('');
}
let _eVelId=null;
function openAddVelocity(){_eVelId=null;['vf-project','vf-sprint'].forEach(id=>document.getElementById(id).value='');document.getElementById('vf-planned').value='21';document.getElementById('vf-completed').value='0';document.getElementById('vf-date').value=new Date().toISOString().slice(0,10);openModal('velocity-modal');}
function saveVelocity(){const project=document.getElementById('vf-project').value.trim();const sprint=document.getElementById('vf-sprint').value.trim();if(!project||!sprint){showToast('Project and sprint required','error');return;}const d={project,sprint,planned:parseInt(document.getElementById('vf-planned').value)||0,completed:parseInt(document.getElementById('vf-completed').value)||0,date:document.getElementById('vf-date').value};if(_eVelId){const i=state.velocity.findIndex(x=>x.id===_eVelId);state.velocity[i]={...state.velocity[i],...d};}else{d.id=state.nextId.velocity++;state.velocity.push(d);}saveState();closeModal('velocity-modal');renderVelocityCharts();showToast('Saved');}

async function aiVelocityInsight(){
  setAILoading('velocity-ai-panel','velocity-ai-text','Analyzing velocity trends...');
  const projects=[...new Set(state.velocity.map(v=>v.project))];
  const summary=projects.map(proj=>{const sprints=state.velocity.filter(v=>v.project===proj).sort((a,b)=>new Date(a.date)-new Date(b.date));return `${proj}: ${sprints.map(s=>`${s.sprint} ${s.completed}/${s.planned}`).join(', ')}`;}).join('\n');
  const result=await callAI(`Analyze sprint velocity trends for an Enterprise Delivery Manager.\n\nVelocity data (completed/planned per sprint):\n${summary}\n\nProvide: velocity trend analysis per project, teams showing improvement or decline, capacity risks, recommended actions.`);
  if(result) showAIOutput('velocity-ai-panel','velocity-ai-text',result,'Velocity Analysis','Portfolio','Delivery Team');
}

// ─── AI ASSIST ────────────────────────────────────────────────────────────────

function refreshProjectSelect(){const sel=document.getElementById('ai-project-select');if(!sel)return;sel.innerHTML=state.projects.map(p=>`<option value="${p.id}">${p.name} (${p.status})</option>`).join('');}
function switchAITab(tabId,el){document.querySelectorAll('.ai-tab').forEach(t=>t.classList.remove('active'));if(el)el.classList.add('active');document.getElementById('status-tab').style.display=tabId==='status-tab'?'block':'none';document.getElementById('comms-tab').style.display=tabId==='comms-tab'?'block':'none';}

async function generateStatusReport(){
  const projId=parseInt(document.getElementById('ai-project-select').value);
  const project=state.projects.find(p=>p.id===projId);
  const audience=document.getElementById('ai-audience').value;
  const context=document.getElementById('ai-updates').value;
  const jiraCtx=typeof JIRA!=='undefined'?JIRA.buildAIContext():'';
  const projRisks=state.risks.filter(r=>r.project===project?.name).map(r=>`${r.title} (${r.rag})`).join('\n');
  const projActions=state.actions.filter(a=>a.project===project?.name&&a.status!=='Completed').map(a=>`${a.title} — ${a.owner} due ${a.due}`).join('\n');
  const projMilestones=state.milestones.filter(m=>m.project===project?.name).map(m=>`${m.title}: ${m.date} (${m.status})`).join('\n');
  setAILoading('status-ai-panel','status-ai-text','Generating status report...');
  const result=await callAI(`Write a project status report.\nProject: ${project?project.name:'Unknown'}\nStatus: ${project?project.status:'Unknown'}\nProgress: ${project?project.progress:'?'}%\nDue: ${project?project.due:'TBD'}\nBudget: ${project?fmt$(project.budget):'N/A'} | Spent: ${project?fmt$(project.spent):'N/A'}\nNotes: ${project?.notes||'None'}\nAudience: ${audience}\nContext: ${context||'None'}\nRisks: ${projRisks||'None'}\nOpen actions: ${projActions||'None'}\nMilestones: ${projMilestones||'None'}${jiraCtx}\n\nInclude: overall health, accomplishments, upcoming milestones, risks and blockers with ticket references where available, next steps.`);
  if(result) showAIOutput('status-ai-panel','status-ai-text',result,'Status Report',project?project.name:'Project',audience);
}

async function generateComms(){
  const type=document.getElementById('comms-type').value,to=document.getElementById('comms-to').value;
  const context=document.getElementById('comms-context').value,tone=document.getElementById('comms-tone').value;
  const jiraCtx=typeof JIRA!=='undefined'?JIRA.buildAIContext():'';
  setAILoading('comms-ai-panel','comms-ai-text','Drafting...');
  const result=await callAI(`Draft a ${type} communication.\nRecipients: ${to||'Stakeholders'}\nContext: ${context||'None'}\nTone: ${tone}${jiraCtx}\nInclude a subject line. Reference JIRA tickets where relevant. Be specific and concise.`);
  if(result) showAIOutput('comms-ai-panel','comms-ai-text',result,type,'','');
}

// ─── INTEGRATIONS ─────────────────────────────────────────────────────────────

function saveIntegrations(){const slack=document.getElementById('slack-webhook').value.trim();const teams=document.getElementById('teams-webhook').value.trim();if(slack)localStorage.setItem('int_slack_webhook',slack);if(teams)localStorage.setItem('int_teams_webhook',teams);updateIntStatus();showToast('Saved');}
function updateIntStatus(){const setS=(id,ok,l)=>{const el=document.getElementById(id);if(!el)return;el.className='int-status '+(ok?'ok':'off');el.textContent=l;};setS('slack-status',!!localStorage.getItem('int_slack_webhook'),localStorage.getItem('int_slack_webhook')?'Configured':'Not configured');setS('teams-status',!!localStorage.getItem('int_teams_webhook'),localStorage.getItem('int_teams_webhook')?'Configured':'Not configured');}

// ─── RENDER ALL + INIT ────────────────────────────────────────────────────────

function renderAll(){
  renderPortfolio(); renderStakeholders(); renderCapacity(); renderEscalations();
  renderRisks(); renderDecisions(); renderActions(); renderMilestones();
  renderBudget(); renderChanges(); renderMeetings(); renderCommsLog();
  renderLessons(); renderRaid();
  // New modules (graceful — only run if functions exist)
  if(typeof renderActionItems==='function')   renderActionItems();
  if(typeof renderDependencies==='function')  renderDependencies();
  if(typeof renderChangeRequests==='function') renderChangeRequests();
  if(typeof renderLessonsLearned==='function') renderLessonsLearned();
  if(typeof renderRAID==='function')          renderRAID();
  if(typeof renderVelocity==='function')      renderVelocity();
  refreshProjectSelect();
}

window.addEventListener('DOMContentLoaded',()=>{
  loadState(); renderAll(); updateAIStatus(); updateIntStatus(); renderDashboard();
  const cfg=getAIConfig();
  if(cfg.url) document.getElementById('ai-url').value=cfg.url;
  if(cfg.model) document.getElementById('ai-model').value=cfg.model;
  const sw=localStorage.getItem('int_slack_webhook');if(sw) document.getElementById('slack-webhook').value=sw;
  const tw=localStorage.getItem('int_teams_webhook');if(tw) document.getElementById('teams-webhook').value=tw;
});
