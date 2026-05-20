// ─── GOVERNANCE MODULE ────────────────────────────────────────────────────────
// Action Items, Change Requests, Lessons Learned, Comms Log, RAID Log

// ─── ACTION ITEMS ─────────────────────────────────────────────────────────────

const PRIORITY_COLOR = { Critical:'red', High:'amber', Medium:'blue', Low:'gray' };
const AI_STAT_COLOR  = { Open:'red', 'In Progress':'blue', Done:'green', Blocked:'amber', Deferred:'gray' };

function renderActionItems(filter = 'all') {
  const items = filter === 'all' ? state.actionItems
    : state.actionItems.filter(a => a.status === filter || a.project === filter);
  const tbody = document.getElementById('ai-tbody');
  if (!tbody) return;

  tbody.innerHTML = items.length ? items.map(a => {
    const overdue = a.dueDate && a.status !== 'Done' && new Date(a.dueDate) < new Date();
    return `<tr${overdue ? ' style="background:var(--red-bg)"' : ''}>
      <td style="font-weight:500;max-width:220px">${a.title}</td>
      <td style="color:var(--tx2)">${a.owner}</td>
      <td style="color:var(--tx2)">${a.project}</td>
      <td><span class="badge ${PRIORITY_COLOR[a.priority]||'gray'}">${a.priority}</span></td>
      <td style="color:${overdue?'var(--red)':'var(--tx2)'};white-space:nowrap">${a.dueDate||'—'}${overdue?' ⚠':''}</td>
      <td><span class="badge ${AI_STAT_COLOR[a.status]||'gray'}">${a.status}</span></td>
      <td style="color:var(--tx2);font-size:12px;max-width:160px">${a.source||'—'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editActionItem(${a.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteActionItem(${a.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8"><div class="empty-state"><i class="ti ti-checkbox"></i><p>No action items.</p></div></td></tr>`;

  const all = state.actionItems;
  document.getElementById('aim-open').textContent   = all.filter(a=>a.status==='Open').length;
  document.getElementById('aim-progress').textContent = all.filter(a=>a.status==='In Progress').length;
  document.getElementById('aim-blocked').textContent = all.filter(a=>a.status==='Blocked').length;
  document.getElementById('aim-done').textContent   = all.filter(a=>a.status==='Done').length;
}

let _editAIId = null;
function openAddActionItem() {
  _editAIId = null;
  document.getElementById('aim-modal-title').textContent = 'Add Action Item';
  ['aim-title','aim-owner','aim-source','aim-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('aim-project').value  = state.projects[0]?.name || '';
  document.getElementById('aim-priority').value = 'High';
  document.getElementById('aim-status').value   = 'Open';
  document.getElementById('aim-due').value      = '';
  openModal('actionitem-modal');
}
function editActionItem(id) {
  const a = state.actionItems.find(x => x.id === id); if (!a) return;
  _editAIId = id;
  document.getElementById('aim-modal-title').textContent = 'Edit Action Item';
  document.getElementById('aim-title').value   = a.title;
  document.getElementById('aim-owner').value   = a.owner;
  document.getElementById('aim-project').value = a.project;
  document.getElementById('aim-priority').value= a.priority;
  document.getElementById('aim-status').value  = a.status;
  document.getElementById('aim-due').value     = a.dueDate || '';
  document.getElementById('aim-source').value  = a.source || '';
  document.getElementById('aim-notes').value   = a.notes  || '';
  openModal('actionitem-modal');
}
function saveActionItem() {
  const title = document.getElementById('aim-title').value.trim();
  if (!title) { showToast('Title required','error'); return; }
  const d = {
    title, owner: document.getElementById('aim-owner').value.trim()||'TBD',
    project: document.getElementById('aim-project').value.trim(),
    priority: document.getElementById('aim-priority').value,
    status:   document.getElementById('aim-status').value,
    dueDate:  document.getElementById('aim-due').value,
    source:   document.getElementById('aim-source').value.trim(),
    notes:    document.getElementById('aim-notes').value.trim()
  };
  if (_editAIId) {
    const i = state.actionItems.findIndex(x=>x.id===_editAIId);
    state.actionItems[i] = {...state.actionItems[i],...d};
  } else {
    d.id = state.nextId.actionItems++;
    state.actionItems.push(d);
  }
  saveState(); closeModal('actionitem-modal'); renderActionItems(); showToast('Saved');
}
function deleteActionItem(id) {
  if (!confirm('Delete?')) return;
  state.actionItems = state.actionItems.filter(x=>x.id!==id);
  saveState(); renderActionItems();
}

async function aiFollowUpActionItems() {
  const overdue = state.actionItems.filter(a => a.dueDate && a.status !== 'Done' && new Date(a.dueDate) < new Date());
  const blocked = state.actionItems.filter(a => a.status === 'Blocked');
  const open    = state.actionItems.filter(a => a.status === 'Open' || a.status === 'In Progress');
  setAILoading('aim-ai-panel','aim-ai-text','Drafting follow-up...');
  const result = await callAI(
    `Draft a concise follow-up message for outstanding action items.\n\nOverdue (${overdue.length}):\n${overdue.map(a=>`- ${a.title} | Owner: ${a.owner} | Due: ${a.dueDate}`).join('\n')||'None'}\n\nBlocked (${blocked.length}):\n${blocked.map(a=>`- ${a.title} | Owner: ${a.owner} | Notes: ${a.notes||'None'}`).join('\n')||'None'}\n\nIn progress (${open.length}):\n${open.slice(0,5).map(a=>`- ${a.title} | Owner: ${a.owner} | Due: ${a.dueDate||'No date'}`).join('\n')||'None'}\n\nWrite a direct, professional follow-up message suitable for a team standup or email. Call out overdue items and blockers specifically.`
  );
  if (result) showAIOutput('aim-ai-panel','aim-ai-text', result, 'Action Item Follow-Up','Portfolio','Team');
}

// ─── MILESTONE TRACKER ────────────────────────────────────────────────────────

function milestoneRag(dateStr, status) {
  if (status === 'Completed') return 'green';
  if (!dateStr) return 'gray';
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (days < 0)  return 'red';
  if (days <= 7) return 'red';
  if (days <= 21) return 'amber';
  return 'green';
}

function renderMilestones(filter = 'all') {
  const items = filter === 'all' ? state.milestones
    : state.milestones.filter(m => m.project === filter || m.status === filter);
  const sorted = [...items].sort((a,b) => new Date(a.date||'9999') - new Date(b.date||'9999'));
  const tbody = document.getElementById('milestones-tbody');
  if (!tbody) return;

  tbody.innerHTML = sorted.length ? sorted.map(m => {
    const rag = milestoneRag(m.date, m.status);
    const days = m.date ? Math.ceil((new Date(m.date)-new Date())/86400000) : null;
    const daysLabel = m.status==='Completed' ? 'Done' : days===null ? '—' : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`;
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><span class="rag ${rag}"></span><span style="font-weight:500">${m.title}</span></div></td>
      <td style="color:var(--tx2)">${m.project}</td>
      <td style="color:var(--tx2)">${m.owner}</td>
      <td style="color:var(--tx2);white-space:nowrap">${m.date||'—'}</td>
      <td style="color:${rag==='red'?'var(--red)':rag==='amber'?'var(--amber)':'var(--tx2)'};font-size:12px">${daysLabel}</td>
      <td><span class="badge ${m.status==='Completed'?'green':m.status==='At Risk'?'amber':m.status==='Missed'?'red':'blue'}">${m.status}</span></td>
      <td style="color:var(--tx2);font-size:12px">${m.notes||'—'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editMilestone(${m.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteMilestone(${m.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8"><div class="empty-state"><i class="ti ti-flag"></i><p>No milestones.</p></div></td></tr>`;

  renderMilestoneTimeline(sorted);
  const all = state.milestones;
  document.getElementById('mm-total').textContent    = all.length;
  document.getElementById('mm-upcoming').textContent = all.filter(m=>{ const d=m.date?Math.ceil((new Date(m.date)-new Date())/86400000):999; return d>=0&&d<=14&&m.status!=='Completed'; }).length;
  document.getElementById('mm-atrisk').textContent   = all.filter(m=>milestoneRag(m.date,m.status)==='amber'||milestoneRag(m.date,m.status)==='red').length;
  document.getElementById('mm-done').textContent     = all.filter(m=>m.status==='Completed').length;
}

function renderMilestoneTimeline(milestones) {
  const container = document.getElementById('milestone-timeline');
  if (!container) return;
  const upcoming = milestones.filter(m => m.status !== 'Completed' && m.date).slice(0, 12);
  if (!upcoming.length) { container.innerHTML = '<p style="color:var(--tx3);font-size:12px;padding:8px 0">No upcoming milestones.</p>'; return; }
  const minD = new Date(); const maxD = new Date(upcoming[upcoming.length-1].date);
  const range = Math.max(1, maxD - minD);
  container.innerHTML = `<div style="position:relative;height:60px;margin:8px 0">
    <div style="position:absolute;top:28px;left:0;right:0;height:2px;background:var(--bd2)"></div>
    ${upcoming.map(m => {
      const pct = Math.min(100, Math.max(0, ((new Date(m.date)-minD)/range)*100));
      const rag = milestoneRag(m.date, m.status);
      const colors = {red:'var(--red)',amber:'var(--amber)',green:'var(--green)',gray:'var(--tx3)'};
      return `<div style="position:absolute;left:${pct}%;transform:translateX(-50%);top:0;text-align:center;width:80px;cursor:default" title="${m.title} — ${m.date}">
        <div style="font-size:9px;color:var(--tx2);margin-bottom:3px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${m.title.slice(0,10)}</div>
        <div style="width:10px;height:10px;border-radius:50%;background:${colors[rag]||'#888'};margin:0 auto;border:2px solid var(--bg1)"></div>
        <div style="font-size:8px;color:var(--tx3);margin-top:3px">${m.date.slice(5)}</div>
      </div>`;
    }).join('')}
  </div>`;
}

let _editMilestoneId = null;
function openAddMilestone() {
  _editMilestoneId = null;
  document.getElementById('mil-modal-title').textContent = 'Add Milestone';
  ['mil-title','mil-owner','mil-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('mil-project').value = state.projects[0]?.name||'';
  document.getElementById('mil-status').value  = 'On Track';
  document.getElementById('mil-date').value    = '';
  openModal('milestone-modal');
}
function editMilestone(id) {
  const m = state.milestones.find(x=>x.id===id); if(!m) return;
  _editMilestoneId = id;
  document.getElementById('mil-modal-title').textContent = 'Edit Milestone';
  document.getElementById('mil-title').value   = m.title;
  document.getElementById('mil-project').value = m.project;
  document.getElementById('mil-owner').value   = m.owner;
  document.getElementById('mil-date').value    = m.date||'';
  document.getElementById('mil-status').value  = m.status;
  document.getElementById('mil-notes').value   = m.notes||'';
  openModal('milestone-modal');
}
function saveMilestone() {
  const title = document.getElementById('mil-title').value.trim();
  if (!title) { showToast('Title required','error'); return; }
  const d = { title, project:document.getElementById('mil-project').value.trim(), owner:document.getElementById('mil-owner').value.trim()||'TBD', date:document.getElementById('mil-date').value, status:document.getElementById('mil-status').value, notes:document.getElementById('mil-notes').value.trim() };
  if (_editMilestoneId) { const i=state.milestones.findIndex(x=>x.id===_editMilestoneId); state.milestones[i]={...state.milestones[i],...d}; }
  else { d.id=state.nextId.milestones++; state.milestones.push(d); }
  saveState(); closeModal('milestone-modal'); renderMilestones(); showToast('Saved');
}
function deleteMilestone(id) { if(!confirm('Delete?')) return; state.milestones=state.milestones.filter(x=>x.id!==id); saveState(); renderMilestones(); }

// ─── DEPENDENCY MAP ───────────────────────────────────────────────────────────

const DEP_STAT_COLOR = { Active:'blue', 'At Risk':'amber', Blocked:'red', Resolved:'green' };

function renderDependencies() {
  const tbody = document.getElementById('deps-tbody');
  if (!tbody) return;
  tbody.innerHTML = state.dependencies.length ? state.dependencies.map(d => `
    <tr>
      <td style="font-weight:500">${d.fromProject}</td>
      <td style="text-align:center;color:var(--tx3)"><i class="ti ti-arrow-right" style="font-size:14px"></i></td>
      <td style="font-weight:500">${d.toProject}</td>
      <td style="color:var(--tx2);max-width:180px">${d.description}</td>
      <td><span class="badge ${DEP_STAT_COLOR[d.status]||'gray'}">${d.status}</span></td>
      <td style="color:var(--tx2)">${d.owner}</td>
      <td style="color:var(--tx2);white-space:nowrap">${d.dueDate||'—'}</td>
      <td style="color:var(--tx2);font-size:12px;max-width:140px">${d.impact||'—'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editDependency(${d.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteDependency(${d.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`) .join('') :
    `<tr><td colspan="9"><div class="empty-state"><i class="ti ti-sitemap"></i><p>No dependencies mapped.</p></div></td></tr>`;

  const all = state.dependencies;
  document.getElementById('dep-total').textContent   = all.length;
  document.getElementById('dep-atrisk').textContent  = all.filter(d=>d.status==='At Risk').length;
  document.getElementById('dep-blocked').textContent = all.filter(d=>d.status==='Blocked').length;
  document.getElementById('dep-resolved').textContent= all.filter(d=>d.status==='Resolved').length;
}

let _editDepId = null;
function openAddDependency() {
  _editDepId = null;
  document.getElementById('dep-modal-title').textContent = 'Add Dependency';
  ['dep-from','dep-to','dep-desc','dep-owner','dep-impact','dep-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('dep-status').value = 'Active';
  document.getElementById('dep-due').value    = '';
  openModal('dependency-modal');
}
function editDependency(id) {
  const d = state.dependencies.find(x=>x.id===id); if(!d) return;
  _editDepId = id;
  document.getElementById('dep-modal-title').textContent = 'Edit Dependency';
  document.getElementById('dep-from').value   = d.fromProject;
  document.getElementById('dep-to').value     = d.toProject;
  document.getElementById('dep-desc').value   = d.description;
  document.getElementById('dep-status').value = d.status;
  document.getElementById('dep-owner').value  = d.owner;
  document.getElementById('dep-due').value    = d.dueDate||'';
  document.getElementById('dep-impact').value = d.impact||'';
  document.getElementById('dep-notes').value  = d.notes||'';
  openModal('dependency-modal');
}
function saveDependency() {
  const from = document.getElementById('dep-from').value.trim();
  const to   = document.getElementById('dep-to').value.trim();
  if (!from||!to) { showToast('Both projects required','error'); return; }
  const d = { fromProject:from, toProject:to, description:document.getElementById('dep-desc').value.trim(), status:document.getElementById('dep-status').value, owner:document.getElementById('dep-owner').value.trim()||'TBD', dueDate:document.getElementById('dep-due').value, impact:document.getElementById('dep-impact').value.trim(), notes:document.getElementById('dep-notes').value.trim() };
  if (_editDepId) { const i=state.dependencies.findIndex(x=>x.id===_editDepId); state.dependencies[i]={...state.dependencies[i],...d}; }
  else { d.id=state.nextId.dependencies++; state.dependencies.push(d); }
  saveState(); closeModal('dependency-modal'); renderDependencies(); showToast('Saved');
}
function deleteDependency(id) { if(!confirm('Delete?')) return; state.dependencies=state.dependencies.filter(x=>x.id!==id); saveState(); renderDependencies(); }

// ─── CHANGE REQUEST LOG ───────────────────────────────────────────────────────

const CR_STAT_COLOR = { Pending:'amber', Approved:'green', Rejected:'red', 'Under Review':'blue', Deferred:'gray' };
const CR_IMP_COLOR  = { High:'red', Medium:'amber', Low:'green' };

function renderChangeRequests(filter = 'all') {
  const items = filter==='all' ? state.changeRequests : state.changeRequests.filter(c=>c.status===filter||c.project===filter);
  const tbody = document.getElementById('cr-tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map(c => `
    <tr>
      <td style="font-weight:500;max-width:180px">${c.title}</td>
      <td style="color:var(--tx2)">${c.project}</td>
      <td style="color:var(--tx2)">${c.requester}</td>
      <td style="color:var(--tx2);white-space:nowrap">${c.date}</td>
      <td><span class="badge ${CR_IMP_COLOR[c.impact]||'gray'}">${c.impact}</span></td>
      <td style="color:var(--tx2);font-size:12px">${c.scopeChange||'—'}</td>
      <td style="color:var(--tx2);font-size:12px">${c.scheduleChange||'—'}</td>
      <td><span class="badge ${CR_STAT_COLOR[c.status]||'gray'}">${c.status}</span></td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editChangeRequest(${c.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteChangeRequest(${c.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`) .join('') :
    `<tr><td colspan="9"><div class="empty-state"><i class="ti ti-git-pull-request"></i><p>No change requests.</p></div></td></tr>`;

  const all = state.changeRequests;
  document.getElementById('crm-total').textContent    = all.length;
  document.getElementById('crm-pending').textContent  = all.filter(c=>c.status==='Pending'||c.status==='Under Review').length;
  document.getElementById('crm-approved').textContent = all.filter(c=>c.status==='Approved').length;
  document.getElementById('crm-high').textContent     = all.filter(c=>c.impact==='High').length;
}

let _editCRId = null;
function openAddChangeRequest() {
  _editCRId = null;
  document.getElementById('cr-modal-title').textContent = 'Log Change Request';
  ['cr-title','cr-requester','cr-scope','cr-schedule','cr-cost','cr-rationale','cr-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('cr-project').value = state.projects[0]?.name||'';
  document.getElementById('cr-impact').value  = 'Medium';
  document.getElementById('cr-status').value  = 'Pending';
  document.getElementById('cr-date').value    = new Date().toISOString().slice(0,10);
  openModal('cr-modal');
}
function editChangeRequest(id) {
  const c = state.changeRequests.find(x=>x.id===id); if(!c) return;
  _editCRId = id;
  document.getElementById('cr-modal-title').textContent = 'Edit Change Request';
  document.getElementById('cr-title').value     = c.title;
  document.getElementById('cr-project').value   = c.project;
  document.getElementById('cr-requester').value = c.requester;
  document.getElementById('cr-date').value      = c.date;
  document.getElementById('cr-impact').value    = c.impact;
  document.getElementById('cr-status').value    = c.status;
  document.getElementById('cr-scope').value     = c.scopeChange||'';
  document.getElementById('cr-schedule').value  = c.scheduleChange||'';
  document.getElementById('cr-cost').value      = c.costChange||'';
  document.getElementById('cr-rationale').value = c.rationale||'';
  document.getElementById('cr-notes').value     = c.notes||'';
  openModal('cr-modal');
}
function saveChangeRequest() {
  const title = document.getElementById('cr-title').value.trim();
  if (!title) { showToast('Title required','error'); return; }
  const d = { title, project:document.getElementById('cr-project').value.trim(), requester:document.getElementById('cr-requester').value.trim()||'TBD', date:document.getElementById('cr-date').value, impact:document.getElementById('cr-impact').value, status:document.getElementById('cr-status').value, scopeChange:document.getElementById('cr-scope').value.trim(), scheduleChange:document.getElementById('cr-schedule').value.trim(), costChange:document.getElementById('cr-cost').value.trim(), rationale:document.getElementById('cr-rationale').value.trim(), notes:document.getElementById('cr-notes').value.trim() };
  if (_editCRId) { const i=state.changeRequests.findIndex(x=>x.id===_editCRId); state.changeRequests[i]={...state.changeRequests[i],...d}; }
  else { d.id=state.nextId.changeRequests++; state.changeRequests.push(d); }
  saveState(); closeModal('cr-modal'); renderChangeRequests(); showToast('Saved');
}
function deleteChangeRequest(id) { if(!confirm('Delete?')) return; state.changeRequests=state.changeRequests.filter(x=>x.id!==id); saveState(); renderChangeRequests(); }

// ─── COMMS LOG ────────────────────────────────────────────────────────────────

const CHANNEL_COLOR = { Email:'blue', Slack:'purple', Teams:'teal', Meeting:'amber', Phone:'gray', Other:'gray' };

function renderCommsLog(filter = 'all') {
  const items = filter==='all' ? state.commsLog : state.commsLog.filter(c=>c.channel===filter||c.project===filter);
  const sorted = [...items].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const tbody = document.getElementById('comms-log-tbody');
  if (!tbody) return;
  tbody.innerHTML = sorted.length ? sorted.map(c => `
    <tr>
      <td style="color:var(--tx2);white-space:nowrap">${c.date}</td>
      <td style="font-weight:500;max-width:200px">${c.topic}</td>
      <td style="color:var(--tx2)">${c.recipients}</td>
      <td><span class="badge ${CHANNEL_COLOR[c.channel]||'gray'}">${c.channel}</span></td>
      <td style="color:var(--tx2)">${c.project}</td>
      <td style="color:var(--tx2);font-size:12px;max-width:160px">${c.summary||'—'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editCommsLog(${c.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteCommsLog(${c.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`) .join('') :
    `<tr><td colspan="7"><div class="empty-state"><i class="ti ti-messages"></i><p>No communications logged.</p></div></td></tr>`;
}

let _editCommsId = null;
function openAddCommsLog() {
  _editCommsId = null;
  document.getElementById('cl-modal-title').textContent = 'Log Communication';
  ['cl-topic','cl-recipients','cl-summary','cl-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('cl-channel').value = 'Email';
  document.getElementById('cl-project').value = state.projects[0]?.name||'';
  document.getElementById('cl-date').value    = new Date().toISOString().slice(0,10);
  openModal('commslog-modal');
}
function editCommsLog(id) {
  const c = state.commsLog.find(x=>x.id===id); if(!c) return;
  _editCommsId = id;
  document.getElementById('cl-modal-title').textContent = 'Edit Communication';
  document.getElementById('cl-date').value       = c.date;
  document.getElementById('cl-topic').value      = c.topic;
  document.getElementById('cl-recipients').value = c.recipients;
  document.getElementById('cl-channel').value    = c.channel;
  document.getElementById('cl-project').value    = c.project;
  document.getElementById('cl-summary').value    = c.summary||'';
  document.getElementById('cl-notes').value      = c.notes||'';
  openModal('commslog-modal');
}
function saveCommsLog() {
  const topic = document.getElementById('cl-topic').value.trim();
  if (!topic) { showToast('Topic required','error'); return; }
  const d = { topic, date:document.getElementById('cl-date').value, recipients:document.getElementById('cl-recipients').value.trim(), channel:document.getElementById('cl-channel').value, project:document.getElementById('cl-project').value.trim(), summary:document.getElementById('cl-summary').value.trim(), notes:document.getElementById('cl-notes').value.trim() };
  if (_editCommsId) { const i=state.commsLog.findIndex(x=>x.id===_editCommsId); state.commsLog[i]={...state.commsLog[i],...d}; }
  else { d.id=state.nextId.commsLog++; state.commsLog.push(d); }
  saveState(); closeModal('commslog-modal'); renderCommsLog(); showToast('Logged');
}
function deleteCommsLog(id) { if(!confirm('Delete?')) return; state.commsLog=state.commsLog.filter(x=>x.id!==id); saveState(); renderCommsLog(); }

// Auto-log when AI comms is sent
function autoLogComms(topic, recipients, channel) {
  state.commsLog.push({
    id: state.nextId.commsLog++,
    date: new Date().toISOString().slice(0,10),
    topic, recipients, channel,
    project: 'General', summary: 'AI-drafted communication sent via EDM Dashboard', notes: ''
  });
  saveState();
}

// ─── LESSONS LEARNED ──────────────────────────────────────────────────────────

const LL_CAT_COLOR = { 'Process':'blue','People':'purple','Technology':'teal','Communication':'amber','Governance':'gray','Risk':'red','Other':'gray' };

function renderLessonsLearned(filter = 'all') {
  const items = filter==='all' ? state.lessonsLearned : state.lessonsLearned.filter(l=>l.category===filter||l.project===filter);
  const tbody = document.getElementById('ll-tbody');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map(l => `
    <tr>
      <td style="color:var(--tx2);white-space:nowrap">${l.date}</td>
      <td style="color:var(--tx2)">${l.project}</td>
      <td><span class="badge ${LL_CAT_COLOR[l.category]||'gray'}">${l.category}</span></td>
      <td style="max-width:180px">${l.whatWorked||'—'}</td>
      <td style="max-width:180px;color:var(--red)">${l.whatDidnt||'—'}</td>
      <td style="max-width:180px;color:var(--green)">${l.recommendation||'—'}</td>
      <td style="color:var(--tx2)">${l.owner}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editLesson(${l.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteLesson(${l.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`) .join('') :
    `<tr><td colspan="8"><div class="empty-state"><i class="ti ti-book"></i><p>No lessons logged.</p></div></td></tr>`;
}

async function aiLessonsSummary() {
  if (!state.lessonsLearned.length) { showToast('No lessons to summarize','error'); return; }
  setAILoading('ll-ai-panel','ll-ai-text','Generating lessons summary...');
  const lessons = state.lessonsLearned.map(l=>`Project: ${l.project} | Category: ${l.category}\nWorked: ${l.whatWorked||'N/A'}\nDidnt: ${l.whatDidnt||'N/A'}\nRecommendation: ${l.recommendation||'N/A'}`).join('\n\n');
  const result = await callAI(`Analyze these lessons learned from across the portfolio and provide actionable recommendations for future projects.\n\n${lessons}\n\nProvide: top 3 patterns identified, key risk areas to watch, and 5 specific recommendations for future delivery.`);
  if (result) showAIOutput('ll-ai-panel','ll-ai-text',result,'Lessons Learned Analysis','Portfolio','Leadership');
}

let _editLLId = null;
function openAddLesson() {
  _editLLId = null;
  document.getElementById('ll-modal-title').textContent = 'Add Lesson Learned';
  ['ll-worked','ll-didnt','ll-recommendation','ll-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ll-project').value  = state.projects[0]?.name||'';
  document.getElementById('ll-category').value = 'Process';
  document.getElementById('ll-owner').value    = '';
  document.getElementById('ll-date').value     = new Date().toISOString().slice(0,10);
  openModal('lesson-modal');
}
function editLesson(id) {
  const l = state.lessonsLearned.find(x=>x.id===id); if(!l) return;
  _editLLId = id;
  document.getElementById('ll-modal-title').textContent = 'Edit Lesson';
  document.getElementById('ll-project').value        = l.project;
  document.getElementById('ll-category').value       = l.category;
  document.getElementById('ll-date').value           = l.date;
  document.getElementById('ll-owner').value          = l.owner;
  document.getElementById('ll-worked').value         = l.whatWorked||'';
  document.getElementById('ll-didnt').value          = l.whatDidnt||'';
  document.getElementById('ll-recommendation').value = l.recommendation||'';
  document.getElementById('ll-notes').value          = l.notes||'';
  openModal('lesson-modal');
}
function saveLesson() {
  const worked = document.getElementById('ll-worked').value.trim();
  if (!worked && !document.getElementById('ll-didnt').value.trim()) { showToast('Add at least one entry','error'); return; }
  const d = { project:document.getElementById('ll-project').value.trim(), category:document.getElementById('ll-category').value, date:document.getElementById('ll-date').value, owner:document.getElementById('ll-owner').value.trim()||'TBD', whatWorked:document.getElementById('ll-worked').value.trim(), whatDidnt:document.getElementById('ll-didnt').value.trim(), recommendation:document.getElementById('ll-recommendation').value.trim(), notes:document.getElementById('ll-notes').value.trim() };
  if (_editLLId) { const i=state.lessonsLearned.findIndex(x=>x.id===_editLLId); state.lessonsLearned[i]={...state.lessonsLearned[i],...d}; }
  else { d.id=state.nextId.lessonsLearned++; state.lessonsLearned.push(d); }
  saveState(); closeModal('lesson-modal'); renderLessonsLearned(); showToast('Saved');
}
function deleteLesson(id) { if(!confirm('Delete?')) return; state.lessonsLearned=state.lessonsLearned.filter(x=>x.id!==id); saveState(); renderLessonsLearned(); }

// ─── RAID LOG ─────────────────────────────────────────────────────────────────

function renderRAID() {
  // Pull from existing state and new assumptions/issues
  const raids = [
    ...state.risks.map(r=>({...r, raidType:'Risk',    desc:r.title,        rag:r.rag||'amber'})),
    ...state.assumptions.map(a=>({...a, raidType:'Assumption', desc:a.title, rag:'blue'})),
    ...(state.escalations||[]).map(e=>({...e, raidType:'Issue', desc:e.issue, rag:e.severity==='Critical'?'red':e.severity==='High'?'amber':'blue'})),
    ...state.dependencies.map(d=>({...d, raidType:'Dependency', desc:d.fromProject+' → '+d.toProject+': '+d.description, rag:d.status==='Blocked'?'red':d.status==='At Risk'?'amber':'green'}))
  ];

  const tbody = document.getElementById('raid-tbody');
  if (!tbody) return;
  const TYPE_COLOR = { Risk:'red', Assumption:'blue', Issue:'amber', Dependency:'teal' };
  tbody.innerHTML = raids.length ? raids.map(r => `
    <tr>
      <td><span class="badge ${TYPE_COLOR[r.raidType]||'gray'}">${r.raidType}</span></td>
      <td style="font-weight:500;max-width:220px">${r.desc}</td>
      <td style="color:var(--tx2)">${r.project||'—'}</td>
      <td style="color:var(--tx2)">${r.owner||'—'}</td>
      <td><span class="rag ${r.rag||'gray'}" style="display:inline-flex"></span></td>
      <td style="color:var(--tx2);font-size:12px">${r.status||'Open'}</td>
      <td style="color:var(--tx2);font-size:12px;max-width:160px">${r.mitigation||r.impact||r.notes||'—'}</td>
    </tr>`) .join('') :
    `<tr><td colspan="7"><div class="empty-state"><i class="ti ti-table"></i><p>No RAID items. Add risks, escalations, or dependencies to populate this view.</p></div></td></tr>`;

  document.getElementById('raid-risks').textContent       = state.risks.filter(r=>r.status!=='Closed').length;
  document.getElementById('raid-assumptions').textContent = state.assumptions.length;
  document.getElementById('raid-issues').textContent      = state.escalations.filter(e=>e.status!=='Resolved').length;
  document.getElementById('raid-deps').textContent        = state.dependencies.length;
}

// Assumptions (RAID-specific)
let _editAssumpId = null;
function openAddAssumption() {
  _editAssumpId = null;
  document.getElementById('assump-modal-title').textContent = 'Add Assumption';
  ['assump-title','assump-owner','assump-impact','assump-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('assump-project').value = state.projects[0]?.name||'';
  document.getElementById('assump-status').value  = 'Active';
  openModal('assumption-modal');
}
function saveAssumption() {
  const title = document.getElementById('assump-title').value.trim();
  if (!title) { showToast('Title required','error'); return; }
  const d = { title, project:document.getElementById('assump-project').value.trim(), owner:document.getElementById('assump-owner').value.trim()||'TBD', status:document.getElementById('assump-status').value, impact:document.getElementById('assump-impact').value.trim(), notes:document.getElementById('assump-notes').value.trim() };
  if (_editAssumpId) { const i=state.assumptions.findIndex(x=>x.id===_editAssumpId); state.assumptions[i]={...state.assumptions[i],...d}; }
  else { d.id=state.nextId.assumptions++; state.assumptions.push(d); }
  saveState(); closeModal('assumption-modal'); renderRAID(); showToast('Saved');
}
