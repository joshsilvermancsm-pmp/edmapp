// ─── SERVICENOW MODULE ────────────────────────────────────────────────────────
// Connects to ServiceNow REST API (Table API)
// Pulls: Incidents, Change Requests, Problems, Tasks
// Pushes: Create incidents and change requests from app data

const SNOW = {

  // ── Config ──────────────────────────────────────────────────────────────────

  getConfig() {
    return {
      instance: localStorage.getItem('snow_instance') || '',  // e.g. yourco.service-now.com
      user:     localStorage.getItem('snow_user')     || '',
      pass:     localStorage.getItem('snow_pass')     || '',
      authType: localStorage.getItem('snow_auth')     || 'basic' // basic or oauth
    };
  },

  saveConfig() {
    const instance = document.getElementById('snow-instance').value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const user     = document.getElementById('snow-user').value.trim();
    const pass     = document.getElementById('snow-pass').value.trim();
    const auth     = document.getElementById('snow-auth').value;
    if (instance) localStorage.setItem('snow_instance', instance);
    if (user)     localStorage.setItem('snow_user',     user);
    if (pass)     localStorage.setItem('snow_pass',     pass);
    if (auth)     localStorage.setItem('snow_auth',     auth);
    document.getElementById('snow-pass').value = '';
    SNOW.updateStatus();
    showToast('ServiceNow config saved');
  },

  clearConfig() {
    ['snow_instance','snow_user','snow_pass','snow_auth'].forEach(k => localStorage.removeItem(k));
    ['snow-instance','snow-user','snow-pass'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    SNOW.updateStatus();
    showToast('ServiceNow config cleared');
  },

  isConfigured() {
    const c = SNOW.getConfig();
    return !!(c.instance && c.user && c.pass);
  },

  updateStatus() {
    const el = document.getElementById('snow-connection-status');
    if (!el) return;
    if (SNOW.isConfigured()) {
      const cfg = SNOW.getConfig();
      el.className = 'int-status ok';
      el.textContent = cfg.instance;
    } else {
      el.className = 'int-status off';
      el.textContent = 'Not configured';
    }
    const badge = document.getElementById('snow-nav-badge');
    if (badge) badge.style.display = SNOW.isConfigured() ? 'inline-flex' : 'none';
  },

  // ── API ──────────────────────────────────────────────────────────────────────

  async request(table, params = {}) {
    const cfg = SNOW.getConfig();
    if (!cfg.instance || !cfg.user || !cfg.pass) throw new Error('ServiceNow not configured');

    const query = new URLSearchParams({
      sysparm_limit:   params.limit  || 20,
      sysparm_fields:  params.fields || '',
      sysparm_query:   params.query  || '',
      sysparm_display_value: 'true',
      ...params.extra
    });

    const url = `https://${cfg.instance}/api/now/table/${table}?${query}`;
    const cred = btoa(cfg.user + ':' + cfg.pass);

    const res = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + cred,
        'Accept':        'application/json',
        'Content-Type':  'application/json'
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'ServiceNow error ' + res.status);
    }

    const data = await res.json();
    return data.result || [];
  },

  async post(table, body) {
    const cfg = SNOW.getConfig();
    const cred = btoa(cfg.user + ':' + cfg.pass);
    const res = await fetch(`https://${cfg.instance}/api/now/table/${table}`, {
      method:  'POST',
      headers: {
        'Authorization': 'Basic ' + cred,
        'Accept':        'application/json',
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'ServiceNow error ' + res.status);
    }
    return (await res.json()).result;
  },

  // ── Test connection ──────────────────────────────────────────────────────────

  async testConnection() {
    const btn = document.getElementById('snow-test-btn');
    btn.textContent = 'Testing...';
    btn.disabled = true;
    try {
      const result = await SNOW.request('sys_user', {
        limit: 1,
        fields: 'user_name,name',
        query: `user_name=${SNOW.getConfig().user}`
      });
      const name = result[0]?.name?.display_value || SNOW.getConfig().user;
      showToast('Connected as ' + name);
      SNOW.updateStatus();
    } catch(e) {
      showToast('Connection failed: ' + e.message, 'error');
    }
    btn.textContent = 'Test Connection';
    btn.disabled = false;
  },

  // ── Priority / state mappings ────────────────────────────────────────────────

  priorityToSeverity(p) {
    const map = { '1':'Critical', '2':'High', '3':'Medium', '4':'Low', '5':'Low' };
    const val = typeof p === 'object' ? p.value || p.display_value : p;
    return map[String(val)] || 'Medium';
  },

  stateLabel(s) {
    const val = typeof s === 'object' ? s.display_value : s;
    return val || 'Open';
  },

  getField(record, field) {
    const f = record[field];
    if (!f) return '';
    if (typeof f === 'object') return f.display_value || f.value || '';
    return f;
  },

  // ── Pull Incidents → Escalations ─────────────────────────────────────────────

  async pullIncidents() {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    SNOW.setLoading('snow-incidents-panel', 'Fetching incidents...');
    try {
      const records = await SNOW.request('incident', {
        limit:  30,
        fields: 'number,short_description,priority,state,assigned_to,category,opened_at,updated_at,sys_id',
        query:  'active=true^stateNOT IN6,7^ORDERBYDESCpriority'
      });
      SNOW.lastIncidents = records;
      SNOW.renderIncidents(records);
      showToast(`Loaded ${records.length} incidents`);
    } catch(e) { showToast('ServiceNow error: ' + e.message, 'error'); SNOW.clearLoading('snow-incidents-panel'); }
  },

  async importIncidentsToEscalations() {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    showToast('Importing incidents...');
    try {
      const records = await SNOW.request('incident', {
        limit:  20,
        fields: 'number,short_description,priority,state,assigned_to,opened_at,sys_id',
        query:  'active=true^priority<=2^ORDERBYDESCpriority'
      });
      let added = 0;
      records.forEach(r => {
        const num = SNOW.getField(r, 'number');
        if (state.escalations.find(e => e.notes && e.notes.includes(num))) return;
        const openedAt  = SNOW.getField(r, 'opened_at');
        const days = openedAt ? Math.floor((Date.now() - new Date(openedAt)) / 86400000) : 0;
        state.escalations.push({
          id:       state.nextId.escalations++,
          issue:    `[${num}] ${SNOW.getField(r, 'short_description')}`,
          project:  'ServiceNow',
          severity: SNOW.priorityToSeverity(r.priority),
          owner:    SNOW.getField(r, 'assigned_to') || 'Unassigned',
          status:   'Open',
          days,
          notes:    `ServiceNow: ${num} | https://${SNOW.getConfig().instance}/nav_to.do?uri=incident.do?sys_id=${SNOW.getField(r,'sys_id')}`
        });
        added++;
      });
      saveState();
      renderEscalations();
      navigate('escalations', document.querySelector('[data-section="escalations"]'));
      showToast(`Added ${added} escalations from ServiceNow`);
    } catch(e) { showToast('Error: ' + e.message, 'error'); }
  },

  // ── Pull Change Requests ─────────────────────────────────────────────────────

  async pullChangeRequests() {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    SNOW.setLoading('snow-changes-panel', 'Fetching change requests...');
    try {
      const records = await SNOW.request('change_request', {
        limit:  20,
        fields: 'number,short_description,priority,state,assigned_to,type,start_date,end_date,risk,sys_id',
        query:  'active=true^stateNOT IN-5^ORDERBYDESCsys_created_on'
      });
      SNOW.lastChanges = records;
      SNOW.renderChanges(records);
      showToast(`Loaded ${records.length} change requests`);
    } catch(e) { showToast('ServiceNow error: ' + e.message, 'error'); SNOW.clearLoading('snow-changes-panel'); }
  },

  async importChangesToLog() {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    showToast('Importing change requests...');
    try {
      const records = await SNOW.request('change_request', {
        limit:  20,
        fields: 'number,short_description,priority,state,assigned_to,risk,start_date,sys_id',
        query:  'active=true^stateNOT IN-5'
      });
      let added = 0;
      const targetArray = state.changeRequests || state.changes || [];
      records.forEach(r => {
        const num = SNOW.getField(r, 'number');
        if (targetArray.find(c => c.notes && c.notes.includes(num))) return;
        const entry = {
          id:        (state.nextId?.changeRequests || state.nextId?.changes || 1),
          title:     `[${num}] ${SNOW.getField(r, 'short_description')}`,
          project:   'ServiceNow',
          requester: SNOW.getField(r, 'assigned_to') || 'Unassigned',
          date:      SNOW.getField(r, 'start_date')?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          impact:    SNOW.priorityToSeverity(r.priority),
          status:    'Under Review',
          scopeChange: '', scheduleChange: '', costChange: '',
          rationale: SNOW.getField(r, 'risk') || '',
          notes:     `ServiceNow: ${num}`
        };
        if (state.changeRequests) {
          entry.id = state.nextId.changeRequests++;
          state.changeRequests.push(entry);
        } else if (state.changes) {
          entry.id = state.nextId.changes++;
          state.changes.push(entry);
        }
        added++;
      });
      saveState();
      if (typeof renderChangeRequests === 'function') renderChangeRequests();
      else if (typeof renderChanges === 'function') renderChanges();
      showToast(`Added ${added} change requests from ServiceNow`);
    } catch(e) { showToast('Error: ' + e.message, 'error'); }
  },

  // ── Pull Problems → Risks ────────────────────────────────────────────────────

  async pullProblems() {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    SNOW.setLoading('snow-problems-panel', 'Fetching problems...');
    try {
      const records = await SNOW.request('problem', {
        limit:  20,
        fields: 'number,short_description,priority,state,assigned_to,workaround,sys_id',
        query:  'active=true^stateNOT IN4,107^ORDERBYDESCpriority'
      });
      SNOW.lastProblems = records;
      SNOW.renderProblems(records);
      showToast(`Loaded ${records.length} problems`);
    } catch(e) { showToast('ServiceNow error: ' + e.message, 'error'); SNOW.clearLoading('snow-problems-panel'); }
  },

  async importProblemsToRisks() {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    showToast('Importing problems as risks...');
    try {
      const records = await SNOW.request('problem', {
        limit:  15,
        fields: 'number,short_description,priority,state,assigned_to,workaround,sys_id',
        query:  'active=true^priority<=3'
      });
      let added = 0;
      records.forEach(r => {
        const num = SNOW.getField(r, 'number');
        if (state.risks.find(risk => risk.notes && risk.notes.includes(num))) return;
        const sev = SNOW.priorityToSeverity(r.priority);
        const prob = sev === 'Critical' || sev === 'High' ? 'High' : 'Medium';
        state.risks.push({
          id:          state.nextId.risks++,
          title:       `[${num}] ${SNOW.getField(r, 'short_description')}`,
          project:     'ServiceNow',
          probability: prob,
          impact:      sev === 'Critical' ? 'High' : sev === 'High' ? 'High' : 'Medium',
          rag:         sev === 'Critical' ? 'red' : 'amber',
          owner:       SNOW.getField(r, 'assigned_to') || 'Unassigned',
          mitigation:  SNOW.getField(r, 'workaround') || 'None logged',
          status:      'Open',
          created:     new Date().toISOString().slice(0, 10),
          notes:       `ServiceNow: ${num}`
        });
        added++;
      });
      saveState();
      renderRisks();
      navigate('risks', document.querySelector('[data-section="risks"]'));
      showToast(`Added ${added} risks from ServiceNow`);
    } catch(e) { showToast('Error: ' + e.message, 'error'); }
  },

  // ── Pull Tasks → Action Items ─────────────────────────────────────────────────

  async pullTasks() {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    SNOW.setLoading('snow-tasks-panel', 'Fetching tasks...');
    try {
      const records = await SNOW.request('task', {
        limit:  25,
        fields: 'number,short_description,priority,state,assigned_to,due_date,sys_id',
        query:  `active=true^assigned_to.user_name=${SNOW.getConfig().user}^stateNOT IN3,4^ORDERBYDESCpriority`
      });
      SNOW.lastTasks = records;
      SNOW.renderTasks(records);
      showToast(`Loaded ${records.length} tasks assigned to you`);
    } catch(e) { showToast('ServiceNow error: ' + e.message, 'error'); SNOW.clearLoading('snow-tasks-panel'); }
  },

  // ── Create incident from escalation ──────────────────────────────────────────

  async createIncidentFromEscalation(escalationId) {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    const esc = state.escalations.find(e => e.id === escalationId);
    if (!esc) return;
    const priorityMap = { Critical:'1', High:'2', Medium:'3', Low:'4' };
    try {
      showToast('Creating ServiceNow incident...');
      const result = await SNOW.post('incident', {
        short_description: esc.issue,
        description:       `Escalation from EDM Dashboard.\nProject: ${esc.project}\nOwner: ${esc.owner}\nDays open: ${esc.days}\nNotes: ${esc.notes || 'None'}`,
        priority:          priorityMap[esc.severity] || '3',
        category:          'software',
        urgency:           priorityMap[esc.severity] || '3'
      });
      const num = result.number?.display_value || result.number;
      const idx = state.escalations.findIndex(e => e.id === escalationId);
      state.escalations[idx].notes = (state.escalations[idx].notes || '') + ` | SNOW: ${num}`;
      saveState();
      renderEscalations();
      showToast(`Created incident ${num} in ServiceNow`);
    } catch(e) { showToast('Failed: ' + e.message, 'error'); }
  },

  // ── Create change request from app ────────────────────────────────────────────

  async createChangeRequest(crId) {
    if (!SNOW.isConfigured()) { showToast('Configure ServiceNow first', 'error'); return; }
    const targetArray = state.changeRequests || state.changes || [];
    const cr = targetArray.find(c => c.id === crId);
    if (!cr) return;
    const riskMap = { High:'high', Medium:'moderate', Low:'low' };
    try {
      showToast('Creating ServiceNow change request...');
      const result = await SNOW.post('change_request', {
        short_description: cr.title,
        description:       `Change request from EDM Dashboard.\nProject: ${cr.project}\nRequester: ${cr.requester || cr.requestor}\nScope: ${cr.scopeChange || 'N/A'}\nSchedule: ${cr.scheduleChange || 'N/A'}\nRationale: ${cr.rationale || 'N/A'}`,
        risk:              riskMap[cr.impact] || 'moderate',
        type:              'normal',
        category:          'Software'
      });
      const num = result.number?.display_value || result.number;
      const idx = targetArray.findIndex(c => c.id === crId);
      targetArray[idx].notes = (targetArray[idx].notes || '') + ` | SNOW: ${num}`;
      saveState();
      if (typeof renderChangeRequests === 'function') renderChangeRequests();
      else if (typeof renderChanges === 'function') renderChanges();
      showToast(`Created change request ${num} in ServiceNow`);
    } catch(e) { showToast('Failed: ' + e.message, 'error'); }
  },

  // ── Build AI context from ServiceNow data ─────────────────────────────────────

  buildAIContext() {
    let ctx = '';
    if (SNOW.lastIncidents?.length) {
      ctx += `\n\nServiceNow Active Incidents (${SNOW.lastIncidents.length}):\n`;
      ctx += SNOW.lastIncidents.slice(0, 10).map(r =>
        `- [${SNOW.getField(r,'number')}] ${SNOW.getField(r,'short_description')} | Priority: ${SNOW.getField(r,'priority')} | State: ${SNOW.getField(r,'state')} | Assigned: ${SNOW.getField(r,'assigned_to')}`
      ).join('\n');
    }
    if (SNOW.lastChanges?.length) {
      ctx += `\n\nServiceNow Change Requests (${SNOW.lastChanges.length}):\n`;
      ctx += SNOW.lastChanges.slice(0, 5).map(r =>
        `- [${SNOW.getField(r,'number')}] ${SNOW.getField(r,'short_description')} | Risk: ${SNOW.getField(r,'risk')} | State: ${SNOW.getField(r,'state')}`
      ).join('\n');
    }
    if (SNOW.lastProblems?.length) {
      ctx += `\n\nServiceNow Problems (${SNOW.lastProblems.length}):\n`;
      ctx += SNOW.lastProblems.slice(0, 5).map(r =>
        `- [${SNOW.getField(r,'number')}] ${SNOW.getField(r,'short_description')} | Priority: ${SNOW.getField(r,'priority')}`
      ).join('\n');
    }
    return ctx;
  },

  // ── Render functions ─────────────────────────────────────────────────────────

  renderIncidents(records) {
    const panel = document.getElementById('snow-incidents-panel');
    if (!panel) return;
    if (!records.length) { panel.innerHTML = '<div class="empty-state" style="padding:12px 0"><i class="ti ti-check"></i><p>No active incidents.</p></div>'; return; }
    const pc = { '1':'red','2':'amber','3':'blue','4':'gray','5':'gray' };
    const cfg = SNOW.getConfig();
    panel.innerHTML = `<div style="overflow-x:auto"><table><thead><tr><th>Number</th><th>Description</th><th>Priority</th><th>State</th><th>Assigned To</th><th>Updated</th></tr></thead><tbody>
      ${records.map(r => {
        const num = SNOW.getField(r,'number');
        const pri = r.priority?.value || r.priority;
        return `<tr>
          <td><a href="https://${cfg.instance}/nav_to.do?uri=incident.do?sys_id=${SNOW.getField(r,'sys_id')}" target="_blank" style="color:var(--blue);text-decoration:none;font-weight:500">${num}</a></td>
          <td style="max-width:260px">${SNOW.getField(r,'short_description')}</td>
          <td><span class="badge ${pc[String(pri)]||'gray'}">${SNOW.getField(r,'priority')}</span></td>
          <td style="color:var(--tx2)">${SNOW.getField(r,'state')}</td>
          <td style="color:var(--tx2);white-space:nowrap">${SNOW.getField(r,'assigned_to')}</td>
          <td style="color:var(--tx2);white-space:nowrap">${SNOW.getField(r,'updated_at')?.slice(0,10) || '—'}</td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
  },

  renderChanges(records) {
    const panel = document.getElementById('snow-changes-panel');
    if (!panel) return;
    if (!records.length) { panel.innerHTML = '<div class="empty-state" style="padding:12px 0"><i class="ti ti-check"></i><p>No active change requests.</p></div>'; return; }
    const rc = { high:'red', moderate:'amber', low:'green' };
    const cfg = SNOW.getConfig();
    panel.innerHTML = `<div style="overflow-x:auto"><table><thead><tr><th>Number</th><th>Description</th><th>Type</th><th>Risk</th><th>State</th><th>Start Date</th></tr></thead><tbody>
      ${records.map(r => {
        const num = SNOW.getField(r,'number');
        const risk = (r.risk?.value || r.risk || 'moderate').toLowerCase();
        return `<tr>
          <td><a href="https://${cfg.instance}/nav_to.do?uri=change_request.do?sys_id=${SNOW.getField(r,'sys_id')}" target="_blank" style="color:var(--blue);text-decoration:none;font-weight:500">${num}</a></td>
          <td style="max-width:240px">${SNOW.getField(r,'short_description')}</td>
          <td style="color:var(--tx2)">${SNOW.getField(r,'type')}</td>
          <td><span class="badge ${rc[risk]||'gray'}">${SNOW.getField(r,'risk')}</span></td>
          <td style="color:var(--tx2)">${SNOW.getField(r,'state')}</td>
          <td style="color:var(--tx2);white-space:nowrap">${SNOW.getField(r,'start_date')?.slice(0,10) || '—'}</td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
  },

  renderProblems(records) {
    const panel = document.getElementById('snow-problems-panel');
    if (!panel) return;
    if (!records.length) { panel.innerHTML = '<div class="empty-state" style="padding:12px 0"><i class="ti ti-check"></i><p>No active problems.</p></div>'; return; }
    const pc = { '1':'red','2':'amber','3':'blue','4':'gray' };
    const cfg = SNOW.getConfig();
    panel.innerHTML = `<div style="overflow-x:auto"><table><thead><tr><th>Number</th><th>Description</th><th>Priority</th><th>State</th><th>Assigned To</th><th>Workaround</th></tr></thead><tbody>
      ${records.map(r => {
        const num = SNOW.getField(r,'number');
        const pri = r.priority?.value || r.priority;
        return `<tr>
          <td><a href="https://${cfg.instance}/nav_to.do?uri=problem.do?sys_id=${SNOW.getField(r,'sys_id')}" target="_blank" style="color:var(--blue);text-decoration:none;font-weight:500">${num}</a></td>
          <td style="max-width:220px">${SNOW.getField(r,'short_description')}</td>
          <td><span class="badge ${pc[String(pri)]||'gray'}">${SNOW.getField(r,'priority')}</span></td>
          <td style="color:var(--tx2)">${SNOW.getField(r,'state')}</td>
          <td style="color:var(--tx2)">${SNOW.getField(r,'assigned_to')}</td>
          <td style="color:var(--tx2);font-size:12px;max-width:140px">${SNOW.getField(r,'workaround') || '—'}</td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
  },

  renderTasks(records) {
    const panel = document.getElementById('snow-tasks-panel');
    if (!panel) return;
    if (!records.length) { panel.innerHTML = '<div class="empty-state" style="padding:12px 0"><i class="ti ti-check"></i><p>No active tasks assigned to you.</p></div>'; return; }
    const pc = { '1':'red','2':'amber','3':'blue','4':'gray','5':'gray' };
    const cfg = SNOW.getConfig();
    panel.innerHTML = `<div style="overflow-x:auto"><table><thead><tr><th>Number</th><th>Description</th><th>Priority</th><th>State</th><th>Due Date</th></tr></thead><tbody>
      ${records.map(r => {
        const num = SNOW.getField(r,'number');
        const pri = r.priority?.value || r.priority;
        const due = SNOW.getField(r,'due_date')?.slice(0,10);
        const overdue = due && new Date(due) < new Date();
        return `<tr${overdue ? ' style="background:var(--red-bg)"' : ''}>
          <td><a href="https://${cfg.instance}/nav_to.do?uri=task.do?sys_id=${SNOW.getField(r,'sys_id')}" target="_blank" style="color:var(--blue);text-decoration:none;font-weight:500">${num}</a></td>
          <td style="max-width:260px">${SNOW.getField(r,'short_description')}</td>
          <td><span class="badge ${pc[String(pri)]||'gray'}">${SNOW.getField(r,'priority')}</span></td>
          <td style="color:var(--tx2)">${SNOW.getField(r,'state')}</td>
          <td style="color:${overdue?'var(--red)':'var(--tx2)'};white-space:nowrap">${due || '—'}${overdue?' ⚠':''}</td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
  },

  // ── Helpers ──────────────────────────────────────────────────────────────────

  setLoading(panelId, msg) {
    const p = document.getElementById(panelId);
    if (p) p.innerHTML = `<div style="padding:14px;color:var(--tx3);font-style:italic;font-size:13px">${msg}</div>`;
  },

  clearLoading(panelId) {
    const p = document.getElementById(panelId);
    if (p) p.innerHTML = '<div class="empty-state" style="padding:12px 0"><i class="ti ti-alert-circle"></i><p>Failed to load. Check your config and try again.</p></div>';
  },

  lastIncidents: null,
  lastChanges:   null,
  lastProblems:  null,
  lastTasks:     null
};

// ── Inject SNOW context into AI reports ───────────────────────────────────────

const _origBuildAllAIContext = typeof EXT !== 'undefined' ? EXT.buildAllAIContext.bind(EXT) : null;
if (typeof EXT !== 'undefined') {
  EXT.buildAllAIContext = function() {
    return (_origBuildAllAIContext ? _origBuildAllAIContext() : '') + SNOW.buildAIContext();
  };
}

// ── Init ──────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  SNOW.updateStatus();
  const cfg = SNOW.getConfig();
  if (cfg.instance) document.getElementById('snow-instance').value = cfg.instance;
  if (cfg.user)     document.getElementById('snow-user').value     = cfg.user;
  if (cfg.authType) document.getElementById('snow-auth').value     = cfg.authType;
});
