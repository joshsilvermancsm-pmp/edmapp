// ─── UTILS ────────────────────────────────────────────────────────────────────

function showToast(msg,type='info'){
  const t=document.getElementById('toast');
  t.textContent=msg; t.style.background=type==='error'?'#A32D2D':'#185FA5';
  t.style.opacity='1'; t.style.transform='translateY(0)';
  clearTimeout(t._t); t._t=setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(8px)'; },2800);
}
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('click',e=>{ if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });

function navigate(section,el){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(el) el.classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('section-'+section).classList.add('active');
  const titles={dashboard:'Executive Dashboard',portfolio:'Portfolio',stakeholders:'Stakeholders',capacity:'Team Capacity',escalations:'Escalations',risks:'Risk Register',decisions:'Decision Log',ai:'AI Assist',integrations:'Integrations',jira:'JIRA'};
  document.getElementById('topbar-title').textContent=titles[section]||section;
  if(section==='dashboard') renderDashboard();
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_COLOR={'On Track':'green','At Risk':'amber','Critical':'red','Completed':'blue'};
const STATUS_FILL={'On Track':'#1D9E75','At Risk':'#EF9F27','Critical':'#E24B4A','Completed':'#378ADD'};
const SEV_COLOR={Critical:'red',High:'amber',Medium:'blue',Low:'gray'};
const STAT_COLOR={Open:'red','In Review':'amber',Monitoring:'blue',Resolved:'green'};
const ENG_COLOR={Champion:'green',Supportive:'blue',Neutral:'gray',Resistant:'red'};
const AVATAR_COLORS=['blue','teal','amber','purple','coral'];
const PROB_SCORE={High:3,Medium:2,Low:1};
const IMP_SCORE={High:3,Medium:2,Low:1};
const RAG_FROM_SCORE={9:'red',6:'red',4:'amber',3:'amber',2:'green',1:'green'};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function ragClass(status){
  if(status==='On Track'||status==='Resolved'||status==='Approved') return 'green';
  if(status==='At Risk'||status==='Monitoring'||status==='In Review'||status==='Pending') return 'amber';
  if(status==='Critical'||status==='Open') return 'red';
  return 'gray';
}

function renderDashboard(){
  // Summary stats
  const p=state.projects; const e=state.escalations; const r=state.risks;
  document.getElementById('ds-projects').textContent  = p.length;
  document.getElementById('ds-ontrack').textContent   = p.filter(x=>x.status==='On Track').length;
  document.getElementById('ds-atrisk').textContent    = p.filter(x=>x.status==='At Risk').length;
  document.getElementById('ds-critical').textContent  = p.filter(x=>x.status==='Critical').length;
  document.getElementById('ds-escalations').textContent=e.filter(x=>x.status==='Open').length;
  document.getElementById('ds-risks').textContent     = r.filter(x=>x.rag==='red').length;

  // RAG cards
  const rag=document.getElementById('dash-rag-grid');
  rag.innerHTML=p.map(proj=>{
    const rc=ragClass(proj.status);
    return `<div class="dash-rag-card rag-${rc}">
      <div class="rag ${rc}"></div>
      <div class="dash-rag-info">
        <div class="dash-rag-name">${proj.name}</div>
        <div class="dash-rag-meta">${proj.owner} &bull; Due ${proj.due}</div>
        <div class="dash-rag-progress">
          <div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${proj.progress}%;background:${STATUS_FILL[proj.status]||'#888'}"></div></div><span class="progress-label">${proj.progress}%</span></div>
        </div>
      </div>
      <span class="badge ${STATUS_COLOR[proj.status]||'gray'}" style="font-size:10px">${proj.status}</span>
    </div>`;
  }).join('');

  // Open escalations
  const etbody=document.getElementById('dash-esc-tbody');
  const openEsc=e.filter(x=>x.status!=='Resolved').slice(0,5);
  etbody.innerHTML=openEsc.length?openEsc.map(esc=>`
    <tr><td style="font-weight:500">${esc.issue}</td><td style="color:var(--tx2)">${esc.project}</td>
    <td><span class="badge ${SEV_COLOR[esc.severity]||'gray'}">${esc.severity}</span></td>
    <td><span class="badge ${STAT_COLOR[esc.status]||'gray'}">${esc.status}</span></td>
    <td style="color:var(--tx2)">${esc.days}d</td></tr>`).join(''):
    '<tr><td colspan="5" style="text-align:center;color:var(--tx3);padding:16px">No open escalations</td></tr>';

  // Top risks
  const rtbody=document.getElementById('dash-risk-tbody');
  const topRisks=r.filter(x=>x.status!=='Closed').sort((a,b)=>(PROB_SCORE[b.probability]||0)*(IMP_SCORE[b.impact]||0)-(PROB_SCORE[a.probability]||0)*(IMP_SCORE[a.impact]||0)).slice(0,4);
  rtbody.innerHTML=topRisks.length?topRisks.map(rk=>`
    <tr><td style="font-weight:500">${rk.title}</td><td style="color:var(--tx2)">${rk.project}</td>
    <td><span class="badge ${SEV_COLOR[rk.probability]||'gray'}">${rk.probability}</span></td>
    <td><span class="badge ${SEV_COLOR[rk.impact]||'gray'}">${rk.impact}</span></td>
    <td><span class="rag ${rk.rag||'gray'}" style="display:inline-flex"></span></td></tr>`).join(''):
    '<tr><td colspan="5" style="text-align:center;color:var(--tx3);padding:16px">No open risks</td></tr>';

  // Recent decisions
  const dtbody=document.getElementById('dash-dec-tbody');
  const recent=state.decisions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  dtbody.innerHTML=recent.length?recent.map(d=>`
    <tr><td style="font-weight:500">${d.title}</td><td style="color:var(--tx2)">${d.project}</td>
    <td style="color:var(--tx2)">${d.date}</td>
    <td><span class="badge ${d.status==='Approved'?'green':d.status==='Pending'?'amber':'gray'}">${d.status}</span></td></tr>`).join(''):
    '<tr><td colspan="4" style="text-align:center;color:var(--tx3);padding:16px">No decisions logged</td></tr>';
}

async function generateWeeklyDigest(){
  setAILoading('digest-panel','digest-text','Generating weekly digest...');
  const proj=state.projects.map(p=>`${p.name}: ${p.status}, ${p.progress}%`).join('\n');
  const escs=state.escalations.filter(e=>e.status!=='Resolved').map(e=>`${e.issue} (${e.severity})`).join('\n');
  const risks=state.risks.filter(r=>r.rag==='red'||r.rag==='amber').map(r=>`${r.title} (${r.rag})`).join('\n');
  const decs=state.decisions.filter(d=>d.status==='Pending').map(d=>d.title).join('\n');
  const jiraCtx=typeof JIRA!=='undefined'?JIRA.buildAIContext():'';
  const result=await callAI(
    `Generate a weekly executive digest for an Enterprise Delivery Manager.\n\nProjects:\n${proj}\n\nOpen escalations:\n${escs||'None'}\n\nActive risks:\n${risks||'None'}\n\nPending decisions:\n${decs||'None'}${jiraCtx}\n\nWrite a crisp weekly summary covering: portfolio health, top risks, open escalations, pending decisions, and 3 recommended actions this week. Suitable for senior leadership.`
  );
  if(result) showAIOutput('digest-panel','digest-text',result,'Weekly Executive Digest','Portfolio','Executive Leadership');
}

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────

function renderPortfolio(filter='all'){
  const list=filter==='all'?state.projects:state.projects.filter(p=>p.status===filter);
  const tbody=document.getElementById('projects-tbody');
  tbody.innerHTML=list.length?list.map(p=>`
    <tr>
      <td style="font-weight:500">${p.name}</td>
      <td style="color:var(--tx2)">${p.owner}</td>
      <td><span class="badge ${STATUS_COLOR[p.status]||'gray'}">${p.status}</span></td>
      <td><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%;background:${STATUS_FILL[p.status]||'#888'}"></div></div><span class="progress-label">${p.progress}%</span></div></td>
      <td style="color:var(--tx2);white-space:nowrap">${p.due}</td>
      <td><div style="display:flex;gap:4px">
        <button class="icon-btn" onclick="editProject(${p.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteProject(${p.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`).join(''):
    `<tr><td colspan="6"><div class="empty-state"><i class="ti ti-clipboard-list"></i><p>No projects.</p></div></td></tr>`;
  updatePortfolioMetrics(); refreshProjectSelect();
}
function updatePortfolioMetrics(){
  const p=state.projects;
  document.getElementById('m-total').textContent=p.length;
  document.getElementById('m-ontrack').textContent=p.filter(x=>x.status==='On Track').length;
  document.getElementById('m-atrisk').textContent=p.filter(x=>x.status==='At Risk').length;
  document.getElementById('m-critical').textContent=p.filter(x=>x.status==='Critical').length;
}
function filterProjects(val){ renderPortfolio(val); }
let _editProjId=null;
function openAddProject(){ _editProjId=null; document.getElementById('project-modal-title').textContent='Add Project'; ['pf-name','pf-owner','pf-notes'].forEach(id=>document.getElementById(id).value=''); document.getElementById('pf-status').value='On Track'; document.getElementById('pf-progress').value='0'; document.getElementById('pf-due').value=''; openModal('project-modal'); }
function editProject(id){ const p=state.projects.find(x=>x.id===id); if(!p) return; _editProjId=id; document.getElementById('project-modal-title').textContent='Edit Project'; document.getElementById('pf-name').value=p.name; document.getElementById('pf-owner').value=p.owner; document.getElementById('pf-status').value=p.status; document.getElementById('pf-progress').value=p.progress; document.getElementById('pf-due').value=p.due; document.getElementById('pf-notes').value=p.notes||''; openModal('project-modal'); }
function saveProject(){ const name=document.getElementById('pf-name').value.trim(); if(!name){ showToast('Name required','error'); return; } const d={name,owner:document.getElementById('pf-owner').value.trim()||'Unassigned',status:document.getElementById('pf-status').value,progress:Math.min(100,Math.max(0,parseInt(document.getElementById('pf-progress').value)||0)),due:document.getElementById('pf-due').value||'TBD',notes:document.getElementById('pf-notes').value.trim()}; if(_editProjId){ const i=state.projects.findIndex(x=>x.id===_editProjId); state.projects[i]={...state.projects[i],...d}; showToast('Updated'); } else { d.id=state.nextId.projects++; state.projects.push(d); showToast('Added'); } saveState(); closeModal('project-modal'); renderPortfolio(); }
function deleteProject(id){ if(!confirm('Delete project?')) return; state.projects=state.projects.filter(x=>x.id!==id); saveState(); renderPortfolio(); }

// ─── STAKEHOLDERS ─────────────────────────────────────────────────────────────

function renderStakeholders(){
  const list=document.getElementById('stakeholders-list');
  list.innerHTML=state.stakeholders.length?state.stakeholders.map(s=>`
    <div class="stk-row">
      <div class="avatar ${s.color}">${s.name.split(' ').map(n=>n[0]).join('')}</div>
      <div class="stk-info"><div class="stk-name">${s.name}</div><div class="stk-role">${s.role}</div></div>
      <div class="stk-badges"><span class="badge gray">${s.influence} influence</span><span class="badge ${ENG_COLOR[s.engagement]||'gray'}">${s.engagement}</span></div>
      <div class="stk-actions">
        <button class="icon-btn" onclick="draftForStakeholder('${s.name}','${s.role}')"><i class="ti ti-send"></i></button>
        <button class="icon-btn" onclick="editStakeholder(${s.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteStakeholder(${s.id})"><i class="ti ti-trash"></i></button>
      </div>
    </div>`).join(''):
    '<div class="empty-state"><i class="ti ti-users"></i><p>No stakeholders added.</p></div>';
}
let _editStkId=null;
function openAddStakeholder(){ _editStkId=null; document.getElementById('stk-modal-title').textContent='Add Stakeholder'; ['sf-name','sf-role','sf-notes'].forEach(id=>document.getElementById(id).value=''); document.getElementById('sf-influence').value='High'; document.getElementById('sf-engagement').value='Supportive'; openModal('stakeholder-modal'); }
function editStakeholder(id){ const s=state.stakeholders.find(x=>x.id===id); if(!s) return; _editStkId=id; document.getElementById('stk-modal-title').textContent='Edit Stakeholder'; document.getElementById('sf-name').value=s.name; document.getElementById('sf-role').value=s.role; document.getElementById('sf-influence').value=s.influence; document.getElementById('sf-engagement').value=s.engagement; document.getElementById('sf-notes').value=s.notes||''; openModal('stakeholder-modal'); }
function saveStakeholder(){ const name=document.getElementById('sf-name').value.trim(); if(!name){ showToast('Name required','error'); return; } const d={name,role:document.getElementById('sf-role').value.trim(),influence:document.getElementById('sf-influence').value,engagement:document.getElementById('sf-engagement').value,notes:document.getElementById('sf-notes').value.trim()}; if(_editStkId){ const i=state.stakeholders.findIndex(x=>x.id===_editStkId); d.color=state.stakeholders[i].color; state.stakeholders[i]={...state.stakeholders[i],...d}; } else { d.id=state.nextId.stakeholders++; d.color=AVATAR_COLORS[state.stakeholders.length%AVATAR_COLORS.length]; state.stakeholders.push(d); } saveState(); closeModal('stakeholder-modal'); renderStakeholders(); showToast('Saved'); }
function deleteStakeholder(id){ if(!confirm('Remove?')) return; state.stakeholders=state.stakeholders.filter(x=>x.id!==id); saveState(); renderStakeholders(); }
function draftForStakeholder(name,role){ navigate('ai',document.querySelector('[data-section="ai"]')); document.getElementById('comms-to').value=name+' ('+role+')'; switchAITab('comms-tab',document.getElementById('tab-comms')); }

// ─── CAPACITY ─────────────────────────────────────────────────────────────────

function renderCapacity(){
  const list=document.getElementById('capacity-list');
  list.innerHTML=state.capacity.length?state.capacity.map(m=>{
    const pct=Math.min(m.allocation,100); const color=m.allocation>100?'#E24B4A':m.allocation>85?'#EF9F27':'#1D9E75';
    return `<div class="cap-row"><div class="cap-row-header"><div><span class="cap-name">${m.name}</span><span class="cap-projects">${m.projects}</span></div><div style="display:flex;align-items:center;gap:8px"><span class="cap-pct" style="color:${color}">${m.allocation}%${m.allocation>100?' — over':''}</span><div style="display:flex;gap:4px"><button class="icon-btn" onclick="editCapacity(${m.id})"><i class="ti ti-edit"></i></button><button class="icon-btn danger" onclick="deleteCapacity(${m.id})"><i class="ti ti-trash"></i></button></div></div></div><div class="cap-bar"><div class="cap-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
  }).join(''):
  '<div class="empty-state"><i class="ti ti-chart-bar"></i><p>No team members.</p></div>';
  const c=state.capacity; const avg=c.length?Math.round(c.reduce((s,m)=>s+m.allocation,0)/c.length):0;
  document.getElementById('cm-members').textContent=c.length; document.getElementById('cm-avg').textContent=avg+'%';
  document.getElementById('cm-over').textContent=c.filter(m=>m.allocation>100).length; document.getElementById('cm-avail').textContent=Math.max(0,100-avg)+'%';
}
let _editCapId=null;
function openAddCapacity(){ _editCapId=null; document.getElementById('cap-modal-title').textContent='Add Member'; ['cf-name','cf-projects'].forEach(id=>document.getElementById(id).value=''); document.getElementById('cf-allocation').value='100'; openModal('capacity-modal'); }
function editCapacity(id){ const m=state.capacity.find(x=>x.id===id); if(!m) return; _editCapId=id; document.getElementById('cap-modal-title').textContent='Edit Member'; document.getElementById('cf-name').value=m.name; document.getElementById('cf-projects').value=m.projects; document.getElementById('cf-allocation').value=m.allocation; openModal('capacity-modal'); }
function saveCapacity(){ const name=document.getElementById('cf-name').value.trim(); if(!name){ showToast('Name required','error'); return; } const d={name,projects:document.getElementById('cf-projects').value.trim(),allocation:parseInt(document.getElementById('cf-allocation').value)||100}; if(_editCapId){ const i=state.capacity.findIndex(x=>x.id===_editCapId); state.capacity[i]={...state.capacity[i],...d}; } else { d.id=state.nextId.capacity++; state.capacity.push(d); } saveState(); closeModal('capacity-modal'); renderCapacity(); showToast('Saved'); }
function deleteCapacity(id){ if(!confirm('Remove?')) return; state.capacity=state.capacity.filter(x=>x.id!==id); saveState(); renderCapacity(); }

// ─── ESCALATIONS ──────────────────────────────────────────────────────────────

function renderEscalations(){
  const tbody=document.getElementById('escalations-tbody');
  tbody.innerHTML=state.escalations.length?state.escalations.map(e=>`
    <tr>
      <td style="font-weight:500">${e.issue}</td>
      <td style="color:var(--tx2)">${e.project}</td>
      <td><span class="badge ${SEV_COLOR[e.severity]||'gray'}">${e.severity}</span></td>
      <td style="color:var(--tx2)">${e.owner}</td>
      <td><span class="badge ${STAT_COLOR[e.status]||'gray'}">${e.status}</span></td>
      <td style="color:var(--tx2)">${e.days}d</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editEscalation(${e.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn" title="Push to JIRA" onclick="typeof JIRA!=='undefined'&&JIRA.createIssueFromEscalation(${e.id})" style="color:#0052CC"><i class="ti ti-brand-jira"></i></button>
        <button class="icon-btn danger" onclick="deleteEscalation(${e.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`).join(''):
    `<tr><td colspan="7"><div class="empty-state"><i class="ti ti-alert-triangle"></i><p>No escalations.</p></div></td></tr>`;
  const e=state.escalations;
  document.getElementById('em-open').textContent=e.filter(x=>x.status==='Open').length;
  document.getElementById('em-critical').textContent=e.filter(x=>x.severity==='Critical').length;
  document.getElementById('em-review').textContent=e.filter(x=>x.status==='In Review').length;
  document.getElementById('em-resolved').textContent=e.filter(x=>x.status==='Resolved').length;
}
let _editEscId=null;
function openAddEscalation(){ _editEscId=null; document.getElementById('esc-modal-title').textContent='Log Escalation'; ['ef-issue','ef-project','ef-owner','ef-notes'].forEach(id=>document.getElementById(id).value=''); document.getElementById('ef-severity').value='High'; document.getElementById('ef-status').value='Open'; document.getElementById('ef-days').value='0'; openModal('escalation-modal'); }
function editEscalation(id){ const e=state.escalations.find(x=>x.id===id); if(!e) return; _editEscId=id; document.getElementById('esc-modal-title').textContent='Edit Escalation'; document.getElementById('ef-issue').value=e.issue; document.getElementById('ef-project').value=e.project; document.getElementById('ef-severity').value=e.severity; document.getElementById('ef-owner').value=e.owner; document.getElementById('ef-status').value=e.status; document.getElementById('ef-days').value=e.days; document.getElementById('ef-notes').value=e.notes||''; openModal('escalation-modal'); }
function saveEscalation(){ const issue=document.getElementById('ef-issue').value.trim(); if(!issue){ showToast('Issue required','error'); return; } const d={issue,project:document.getElementById('ef-project').value.trim()||'General',severity:document.getElementById('ef-severity').value,owner:document.getElementById('ef-owner').value.trim()||'TBD',status:document.getElementById('ef-status').value,days:parseInt(document.getElementById('ef-days').value)||0,notes:document.getElementById('ef-notes').value.trim()}; if(_editEscId){ const i=state.escalations.findIndex(x=>x.id===_editEscId); state.escalations[i]={...state.escalations[i],...d}; } else { d.id=state.nextId.escalations++; state.escalations.push(d); } saveState(); closeModal('escalation-modal'); renderEscalations(); showToast('Saved'); }
function deleteEscalation(id){ if(!confirm('Delete?')) return; state.escalations=state.escalations.filter(x=>x.id!==id); saveState(); renderEscalations(); }

// ─── RISK REGISTER ────────────────────────────────────────────────────────────

function calcRag(prob,impact){
  const score=(PROB_SCORE[prob]||1)*(IMP_SCORE[impact]||1);
  return score>=6?'red':score>=3?'amber':'green';
}

function renderRisks(filter='all'){
  const list=filter==='all'?state.risks:state.risks.filter(r=>r.rag===filter||r.status===filter);
  const tbody=document.getElementById('risks-tbody');
  tbody.innerHTML=list.length?list.map(r=>`
    <tr>
      <td style="font-weight:500">${r.title}</td>
      <td style="color:var(--tx2)">${r.project}</td>
      <td><span class="badge ${SEV_COLOR[r.probability]||'gray'}">${r.probability}</span></td>
      <td><span class="badge ${SEV_COLOR[r.impact]||'gray'}">${r.impact}</span></td>
      <td><span class="rag ${r.rag||'gray'}" style="display:inline-flex;margin:auto"></span></td>
      <td style="color:var(--tx2)">${r.owner}</td>
      <td style="color:var(--tx2);max-width:180px;font-size:12px">${r.mitigation||'—'}</td>
      <td><span class="badge ${r.status==='Closed'?'green':r.status==='Monitoring'?'blue':'amber'}">${r.status}</span></td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editRisk(${r.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn" onclick="aiAnalyzeRisk(${r.id})"><i class="ti ti-sparkles"></i></button>
        <button class="icon-btn danger" onclick="deleteRisk(${r.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`).join(''):
    `<tr><td colspan="9"><div class="empty-state"><i class="ti ti-shield-exclamation"></i><p>No risks logged.</p></div></td></tr>`;
  const rv=state.risks;
  document.getElementById('rm-total').textContent=rv.length;
  document.getElementById('rm-red').textContent=rv.filter(x=>x.rag==='red').length;
  document.getElementById('rm-amber').textContent=rv.filter(x=>x.rag==='amber').length;
  document.getElementById('rm-open').textContent=rv.filter(x=>x.status==='Open').length;
}

let _editRiskId=null;
function openAddRisk(){ _editRiskId=null; document.getElementById('risk-modal-title').textContent='Add Risk'; ['rf-title','rf-project','rf-owner','rf-mitigation','rf-notes'].forEach(id=>document.getElementById(id).value=''); document.getElementById('rf-probability').value='Medium'; document.getElementById('rf-impact').value='Medium'; document.getElementById('rf-status').value='Open'; document.getElementById('rf-created').value=new Date().toISOString().slice(0,10); openModal('risk-modal'); }
function editRisk(id){ const r=state.risks.find(x=>x.id===id); if(!r) return; _editRiskId=id; document.getElementById('risk-modal-title').textContent='Edit Risk'; document.getElementById('rf-title').value=r.title; document.getElementById('rf-project').value=r.project; document.getElementById('rf-probability').value=r.probability; document.getElementById('rf-impact').value=r.impact; document.getElementById('rf-owner').value=r.owner; document.getElementById('rf-mitigation').value=r.mitigation||''; document.getElementById('rf-status').value=r.status; document.getElementById('rf-created').value=r.created||''; document.getElementById('rf-notes').value=r.notes||''; openModal('risk-modal'); }
function saveRisk(){ const title=document.getElementById('rf-title').value.trim(); if(!title){ showToast('Title required','error'); return; } const prob=document.getElementById('rf-probability').value; const imp=document.getElementById('rf-impact').value; const d={title,project:document.getElementById('rf-project').value.trim(),probability:prob,impact:imp,rag:calcRag(prob,imp),owner:document.getElementById('rf-owner').value.trim()||'TBD',mitigation:document.getElementById('rf-mitigation').value.trim(),status:document.getElementById('rf-status').value,created:document.getElementById('rf-created').value,notes:document.getElementById('rf-notes').value.trim()}; if(_editRiskId){ const i=state.risks.findIndex(x=>x.id===_editRiskId); state.risks[i]={...state.risks[i],...d}; } else { d.id=state.nextId.risks++; state.risks.push(d); } saveState(); closeModal('risk-modal'); renderRisks(); showToast('Saved'); }
function deleteRisk(id){ if(!confirm('Delete risk?')) return; state.risks=state.risks.filter(x=>x.id!==id); saveState(); renderRisks(); }

async function aiAnalyzeRisk(id){
  const r=state.risks.find(x=>x.id===id); if(!r) return;
  setAILoading('risk-ai-panel','risk-ai-text','Analyzing risk...');
  const result=await callAI(`Analyze this project risk and provide actionable recommendations.\nRisk: ${r.title}\nProject: ${r.project}\nProbability: ${r.probability}\nImpact: ${r.impact}\nCurrent mitigation: ${r.mitigation||'None'}\nStatus: ${r.status}\n\nProvide: risk assessment, gaps in current mitigation, 3 specific recommended actions, and suggested escalation threshold.`);
  if(result) showAIOutput('risk-ai-panel','risk-ai-text',result,'Risk Analysis',r.project,'Risk Management');
}

async function aiRiskSummary(){
  setAILoading('risk-ai-panel','risk-ai-text','Generating risk summary...');
  const redRisks=state.risks.filter(r=>r.rag==='red');
  const amberRisks=state.risks.filter(r=>r.rag==='amber');
  const result=await callAI(`Summarize the portfolio risk profile for an Enterprise Delivery Manager.\n\nCritical risks (red):\n${redRisks.map(r=>`${r.title} — ${r.project} — Mitigation: ${r.mitigation||'None'}`).join('\n')||'None'}\n\nHigh risks (amber):\n${amberRisks.map(r=>`${r.title} — ${r.project}`).join('\n')||'None'}\n\nProvide: overall risk posture, top 3 priorities, recommended actions for leadership.`);
  if(result) showAIOutput('risk-ai-panel','risk-ai-text',result,'Risk Summary Report','Portfolio','Leadership');
}

// ─── DECISION LOG ─────────────────────────────────────────────────────────────

function renderDecisions(filter='all'){
  const list=filter==='all'?state.decisions:state.decisions.filter(d=>d.status===filter||d.project===filter);
  const tbody=document.getElementById('decisions-tbody');
  tbody.innerHTML=list.length?list.map(d=>`
    <tr>
      <td style="font-weight:500">${d.title}</td>
      <td style="color:var(--tx2)">${d.project}</td>
      <td style="color:var(--tx2)">${d.owner}</td>
      <td style="color:var(--tx2);white-space:nowrap">${d.date}</td>
      <td style="color:var(--tx2);max-width:200px;font-size:12px">${d.rationale}</td>
      <td><span class="badge ${d.impact==='High'?'red':d.impact==='Medium'?'amber':'gray'}">${d.impact}</span></td>
      <td><span class="badge ${d.status==='Approved'?'green':d.status==='Pending'?'amber':d.status==='Superseded'?'gray':'blue'}">${d.status}</span></td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editDecision(${d.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteDecision(${d.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`).join(''):
    `<tr><td colspan="8"><div class="empty-state"><i class="ti ti-note"></i><p>No decisions logged.</p></div></td></tr>`;
  const dv=state.decisions;
  document.getElementById('dm-total').textContent=dv.length;
  document.getElementById('dm-approved').textContent=dv.filter(x=>x.status==='Approved').length;
  document.getElementById('dm-pending').textContent=dv.filter(x=>x.status==='Pending').length;
  document.getElementById('dm-high').textContent=dv.filter(x=>x.impact==='High').length;
}

let _editDecId=null;
function openAddDecision(){ _editDecId=null; document.getElementById('dec-modal-title').textContent='Log Decision'; ['df-title','df-project','df-owner','df-rationale','df-notes'].forEach(id=>document.getElementById(id).value=''); document.getElementById('df-date').value=new Date().toISOString().slice(0,10); document.getElementById('df-impact').value='Medium'; document.getElementById('df-status').value='Pending'; openModal('decision-modal'); }
function editDecision(id){ const d=state.decisions.find(x=>x.id===id); if(!d) return; _editDecId=id; document.getElementById('dec-modal-title').textContent='Edit Decision'; document.getElementById('df-title').value=d.title; document.getElementById('df-project').value=d.project; document.getElementById('df-owner').value=d.owner; document.getElementById('df-date').value=d.date; document.getElementById('df-rationale').value=d.rationale; document.getElementById('df-impact').value=d.impact; document.getElementById('df-status').value=d.status; document.getElementById('df-notes').value=d.notes||''; openModal('decision-modal'); }
function saveDecision(){ const title=document.getElementById('df-title').value.trim(); if(!title){ showToast('Title required','error'); return; } const d={title,project:document.getElementById('df-project').value.trim(),owner:document.getElementById('df-owner').value.trim()||'TBD',date:document.getElementById('df-date').value||new Date().toISOString().slice(0,10),rationale:document.getElementById('df-rationale').value.trim(),impact:document.getElementById('df-impact').value,status:document.getElementById('df-status').value,notes:document.getElementById('df-notes').value.trim()}; if(_editDecId){ const i=state.decisions.findIndex(x=>x.id===_editDecId); state.decisions[i]={...state.decisions[i],...d}; } else { d.id=state.nextId.decisions++; state.decisions.push(d); } saveState(); closeModal('decision-modal'); renderDecisions(); showToast('Saved'); }
function deleteDecision(id){ if(!confirm('Delete decision?')) return; state.decisions=state.decisions.filter(x=>x.id!==id); saveState(); renderDecisions(); }

// ─── AI ASSIST ────────────────────────────────────────────────────────────────

function refreshProjectSelect(){ const sel=document.getElementById('ai-project-select'); if(!sel) return; sel.innerHTML=state.projects.map(p=>`<option value="${p.id}">${p.name} (${p.status})</option>`).join(''); }

function switchAITab(tabId,el){ document.querySelectorAll('.ai-tab').forEach(t=>t.classList.remove('active')); if(el) el.classList.add('active'); document.getElementById('status-tab').style.display=tabId==='status-tab'?'block':'none'; document.getElementById('comms-tab').style.display=tabId==='comms-tab'?'block':'none'; }

async function generateStatusReport(){
  const projId=parseInt(document.getElementById('ai-project-select').value);
  const project=state.projects.find(p=>p.id===projId);
  const audience=document.getElementById('ai-audience').value;
  const context=document.getElementById('ai-updates').value;
  const jiraCtx=typeof JIRA!=='undefined'?JIRA.buildAIContext():'';
  const risks=state.risks.filter(r=>r.project===project?.name).map(r=>`${r.title} (${r.rag}, ${r.status})`).join('\n');
  setAILoading('status-ai-panel','status-ai-text','Generating status report'+(jiraCtx?' with live JIRA data':'')+' ...');
  const result=await callAI(`Write a project status report.\nProject: ${project?project.name:'Unknown'}\nStatus: ${project?project.status:'Unknown'}\nProgress: ${project?project.progress:'?'}%\nDue: ${project?project.due:'TBD'}\nNotes: ${project?.notes||'None'}\nAudience: ${audience}\nContext: ${context||'None'}\nActive risks: ${risks||'None'}${jiraCtx}\n\nInclude: overall health, accomplishments, upcoming milestones, risks and blockers with ticket references where available, next steps.`);
  if(result) showAIOutput('status-ai-panel','status-ai-text',result,'Status Report',project?project.name:'Project',audience);
}

async function generateComms(){
  const type=document.getElementById('comms-type').value; const to=document.getElementById('comms-to').value;
  const context=document.getElementById('comms-context').value; const tone=document.getElementById('comms-tone').value;
  const jiraCtx=typeof JIRA!=='undefined'?JIRA.buildAIContext():'';
  setAILoading('comms-ai-panel','comms-ai-text','Drafting...');
  const result=await callAI(`Draft a ${type} communication.\nRecipients: ${to||'Stakeholders'}\nContext: ${context||'None'}\nTone: ${tone}${jiraCtx}\nInclude a subject line. Reference JIRA tickets where relevant. Be specific and concise.`);
  if(result) showAIOutput('comms-ai-panel','comms-ai-text',result,type,'','');
}

// ─── INTEGRATIONS ─────────────────────────────────────────────────────────────

function saveIntegrations(){
  const slack=document.getElementById('slack-webhook').value.trim();
  const teams=document.getElementById('teams-webhook').value.trim();
  if(slack) localStorage.setItem('int_slack_webhook',slack);
  if(teams) localStorage.setItem('int_teams_webhook',teams);
  updateIntStatus(); showToast('Integrations saved');
}
function updateIntStatus(){
  const slack=!!localStorage.getItem('int_slack_webhook');
  const teams=!!localStorage.getItem('int_teams_webhook');
  const setS=(id,ok,l)=>{ const el=document.getElementById(id); if(!el) return; el.className='int-status '+(ok?'ok':'off'); el.textContent=l; };
  setS('slack-status',slack,slack?'Webhook saved':'Not configured');
  setS('teams-status',teams,teams?'Webhook saved':'Not configured');
}

// ─── RENDER ALL + INIT ────────────────────────────────────────────────────────

function renderAll(){
  renderPortfolio(); renderStakeholders(); renderCapacity();
  renderEscalations(); renderRisks(); renderDecisions();
  refreshProjectSelect();
}

window.addEventListener('DOMContentLoaded',()=>{
  loadState(); renderAll(); updateAIStatus(); updateIntStatus();
  const cfg=getAIConfig();
  if(cfg.url)   document.getElementById('ai-url').value=cfg.url;
  if(cfg.model) document.getElementById('ai-model').value=cfg.model;
  const sw=localStorage.getItem('int_slack_webhook'); if(sw) document.getElementById('slack-webhook').value=sw;
  const tw=localStorage.getItem('int_teams_webhook'); if(tw) document.getElementById('teams-webhook').value=tw;
});
