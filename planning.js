// ─── PLANNING MODULE ──────────────────────────────────────────────────────────
// Budget Tracker, Sprint Velocity Trend

// ─── BUDGET TRACKER ───────────────────────────────────────────────────────────

function calcBurnRate(budget) {
  if (!budget.startDate || !budget.planned) return null;
  const start    = new Date(budget.startDate);
  const end      = budget.endDate ? new Date(budget.endDate) : null;
  const today    = new Date();
  const elapsed  = Math.max(1, (today - start) / 86400000);
  const total    = end ? Math.max(1, (end - start) / 86400000) : null;
  const expected = total ? (elapsed / total) * budget.planned : null;
  const actual   = budget.actual || 0;
  const variance = expected ? actual - expected : null;
  const pctSpent = budget.planned ? Math.round((actual / budget.planned) * 100) : 0;
  const forecast = total && elapsed ? Math.round((actual / elapsed) * total) : null;
  return { elapsed:Math.round(elapsed), expected:expected?Math.round(expected):null, variance:variance?Math.round(variance):null, pctSpent, forecast };
}

function budgetRag(budget) {
  const b = calcBurnRate(budget);
  if (!b || !b.variance) return 'blue';
  const pct = budget.planned ? Math.abs(b.variance) / budget.planned * 100 : 0;
  if (pct > 15) return 'red';
  if (pct > 7)  return 'amber';
  return 'green';
}

function formatCurrency(val) {
  if (!val && val !== 0) return '—';
  return '$' + Number(val).toLocaleString();
}

function renderBudget() {
  const tbody = document.getElementById('budget-tbody');
  if (!tbody) return;

  tbody.innerHTML = state.budgets.length ? state.budgets.map(b => {
    const burn = calcBurnRate(b);
    const rag  = budgetRag(b);
    const pct  = burn?.pctSpent || 0;
    return `<tr>
      <td style="font-weight:500">${b.project}</td>
      <td style="color:var(--tx2)">${formatCurrency(b.planned)}</td>
      <td style="color:var(--tx2)">${formatCurrency(b.actual)}</td>
      <td style="${rag==='red'?'color:var(--red)':rag==='amber'?'color:var(--amber)':'color:var(--green)'}">${burn?.variance !== null ? (burn.variance >= 0 ? '+' : '') + formatCurrency(burn.variance) : '—'}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:100px"><div class="progress-fill" style="width:${Math.min(pct,100)}%;background:${rag==='red'?'#E24B4A':rag==='amber'?'#EF9F27':'#1D9E75'}"></div></div>
          <span class="progress-label">${pct}%</span>
        </div>
      </td>
      <td style="color:var(--tx2)">${formatCurrency(burn?.forecast)}</td>
      <td><span class="rag ${rag}" style="display:inline-flex"></span></td>
      <td style="color:var(--tx2);font-size:12px">${b.notes||'—'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editBudget(${b.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteBudget(${b.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('') :
  `<tr><td colspan="9"><div class="empty-state"><i class="ti ti-coins"></i><p>No budget entries.</p></div></td></tr>`;

  // Summary metrics
  const total    = state.budgets.reduce((s,b)=>s+(b.planned||0),0);
  const actual   = state.budgets.reduce((s,b)=>s+(b.actual||0),0);
  const overBudget = state.budgets.filter(b=>budgetRag(b)==='red').length;
  document.getElementById('bm-total').textContent    = formatCurrency(total);
  document.getElementById('bm-actual').textContent   = formatCurrency(actual);
  document.getElementById('bm-variance').textContent = formatCurrency(actual - total);
  document.getElementById('bm-over').textContent     = overBudget;
}

let _editBudgetId = null;
function openAddBudget() {
  _editBudgetId = null;
  document.getElementById('bgt-modal-title').textContent = 'Add Budget Entry';
  ['bgt-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('bgt-project').value   = state.projects[0]?.name||'';
  document.getElementById('bgt-planned').value   = '';
  document.getElementById('bgt-actual').value    = '';
  document.getElementById('bgt-start').value     = '';
  document.getElementById('bgt-end').value       = '';
  openModal('budget-modal');
}
function editBudget(id) {
  const b = state.budgets.find(x=>x.id===id); if(!b) return;
  _editBudgetId = id;
  document.getElementById('bgt-modal-title').textContent = 'Edit Budget';
  document.getElementById('bgt-project').value = b.project;
  document.getElementById('bgt-planned').value = b.planned||'';
  document.getElementById('bgt-actual').value  = b.actual||'';
  document.getElementById('bgt-start').value   = b.startDate||'';
  document.getElementById('bgt-end').value     = b.endDate||'';
  document.getElementById('bgt-notes').value   = b.notes||'';
  openModal('budget-modal');
}
function saveBudget() {
  const project = document.getElementById('bgt-project').value.trim();
  if (!project) { showToast('Project required','error'); return; }
  const d = {
    project,
    planned:   parseFloat(document.getElementById('bgt-planned').value)||0,
    actual:    parseFloat(document.getElementById('bgt-actual').value)||0,
    startDate: document.getElementById('bgt-start').value,
    endDate:   document.getElementById('bgt-end').value,
    notes:     document.getElementById('bgt-notes').value.trim()
  };
  if (_editBudgetId) { const i=state.budgets.findIndex(x=>x.id===_editBudgetId); state.budgets[i]={...state.budgets[i],...d}; }
  else { d.id=state.nextId.budgets++; state.budgets.push(d); }
  saveState(); closeModal('budget-modal'); renderBudget(); showToast('Saved');
}
function deleteBudget(id) { if(!confirm('Delete?')) return; state.budgets=state.budgets.filter(x=>x.id!==id); saveState(); renderBudget(); }

// ─── SPRINT VELOCITY TREND ────────────────────────────────────────────────────

function renderVelocity() {
  const container = document.getElementById('velocity-chart');
  if (!container) return;

  const sprints = state.velocityData;
  if (!sprints.length) {
    container.innerHTML = '<div class="empty-state"><i class="ti ti-chart-line"></i><p>No sprint data. Add sprints to track velocity.</p></div>';
    renderVelocityTable();
    return;
  }

  const maxVel = Math.max(...sprints.map(s=>Math.max(s.committed||0,s.completed||0)),1);
  const barW   = Math.min(60, Math.floor(560 / sprints.length) - 8);
  const chartH = 160;

  const bars = sprints.map((s,i) => {
    const commH  = Math.round((s.committed / maxVel) * chartH);
    const compH  = Math.round((s.completed / maxVel) * chartH);
    const vel    = s.completed;
    const x      = 40 + i * (barW + 8);
    const rag    = s.completed >= s.committed * 0.9 ? '#1D9E75' : s.completed >= s.committed * 0.7 ? '#EF9F27' : '#E24B4A';
    return `
      <g>
        <rect x="${x}" y="${chartH - commH + 20}" width="${barW}" height="${commH}" fill="var(--bd2)" rx="3"/>
        <rect x="${x}" y="${chartH - compH + 20}" width="${barW}" height="${compH}" fill="${rag}" rx="3" opacity="0.85"/>
        <text x="${x + barW/2}" y="${chartH - compH + 14}" text-anchor="middle" font-size="9" fill="var(--tx2)">${vel}</text>
        <text x="${x + barW/2}" y="${chartH + 38}" text-anchor="middle" font-size="8" fill="var(--tx3)">${s.name.replace('Sprint ','S')}</text>
      </g>`;
  }).join('');

  // Trend line
  const avgVel = Math.round(sprints.reduce((s,v)=>s+v.completed,0)/sprints.length);
  const trendY = chartH - Math.round((avgVel/maxVel)*chartH) + 20;
  const firstX = 40; const lastX = 40 + (sprints.length-1)*(barW+8)+barW;

  container.innerHTML = `
    <svg width="100%" viewBox="0 0 ${Math.max(600,40+sprints.length*(barW+8)+40)} ${chartH+60}" style="overflow:visible">
      <line x1="${firstX}" y1="${trendY}" x2="${lastX}" y2="${trendY}" stroke="var(--blue)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>
      <text x="${lastX+4}" y="${trendY+4}" font-size="9" fill="var(--blue)">avg ${avgVel}</text>
      ${bars}
      <text x="12" y="${chartH+20}" font-size="9" fill="var(--tx3)" transform="rotate(-90,12,${chartH/2+20})">Points</text>
      <rect x="${40}" y="${chartH+50}" width="10" height="8" fill="var(--bd2)" rx="2"/>
      <text x="${55}" y="${chartH+57}" font-size="8" fill="var(--tx2)">Committed</text>
      <rect x="${120}" y="${chartH+50}" width="10" height="8" fill="var(--green)" rx="2"/>
      <text x="${135}" y="${chartH+57}" font-size="8" fill="var(--tx2)">Completed</text>
    </svg>`;

  renderVelocityTable();

  const avg = sprints.length ? Math.round(sprints.reduce((s,v)=>s+v.completed,0)/sprints.length) : 0;
  const last = sprints[sprints.length-1];
  const trend = sprints.length > 2
    ? (sprints.slice(-3).reduce((s,v)=>s+v.completed,0)/3) > avg ? 'Improving' : 'Declining'
    : 'Insufficient data';
  document.getElementById('vel-avg').textContent    = avg;
  document.getElementById('vel-last').textContent   = last?.completed||'—';
  document.getElementById('vel-trend').textContent  = trend;
  document.getElementById('vel-sprints').textContent= sprints.length;
}

function renderVelocityTable() {
  const tbody = document.getElementById('velocity-tbody');
  if (!tbody) return;
  tbody.innerHTML = state.velocityData.length ? [...state.velocityData].reverse().map(s => {
    const ach = s.committed ? Math.round((s.completed/s.committed)*100) : 0;
    const rag = ach >= 90 ? 'green' : ach >= 70 ? 'amber' : 'red';
    return `<tr>
      <td style="font-weight:500">${s.name}</td>
      <td style="color:var(--tx2)">${s.startDate||'—'}</td>
      <td style="color:var(--tx2)">${s.endDate||'—'}</td>
      <td style="color:var(--tx2)">${s.committed}</td>
      <td style="color:var(--tx2)">${s.completed}</td>
      <td><span class="badge ${rag}">${ach}%</span></td>
      <td style="color:var(--tx2);font-size:12px">${s.notes||'—'}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editVelocity(${s.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteVelocity(${s.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('') :
  `<tr><td colspan="8"><div class="empty-state"><i class="ti ti-chart-line"></i><p>No sprint data.</p></div></td></tr>`;
}

let _editVelId = null;
function openAddVelocity() {
  _editVelId = null;
  document.getElementById('vel-modal-title').textContent = 'Add Sprint';
  ['vel-name','vel-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('vel-committed').value = '';
  document.getElementById('vel-completed').value = '';
  document.getElementById('vel-start').value     = '';
  document.getElementById('vel-end').value       = '';
  openModal('velocity-modal');
}
function editVelocity(id) {
  const s = state.velocityData.find(x=>x.id===id); if(!s) return;
  _editVelId = id;
  document.getElementById('vel-modal-title').textContent = 'Edit Sprint';
  document.getElementById('vel-name').value      = s.name;
  document.getElementById('vel-committed').value = s.committed;
  document.getElementById('vel-completed').value = s.completed;
  document.getElementById('vel-start').value     = s.startDate||'';
  document.getElementById('vel-end').value       = s.endDate||'';
  document.getElementById('vel-notes').value     = s.notes||'';
  openModal('velocity-modal');
}
function saveVelocity() {
  const name = document.getElementById('vel-name').value.trim();
  if (!name) { showToast('Sprint name required','error'); return; }
  const d = { name, committed:parseInt(document.getElementById('vel-committed').value)||0, completed:parseInt(document.getElementById('vel-completed').value)||0, startDate:document.getElementById('vel-start').value, endDate:document.getElementById('vel-end').value, notes:document.getElementById('vel-notes').value.trim() };
  if (_editVelId) { const i=state.velocityData.findIndex(x=>x.id===_editVelId); state.velocityData[i]={...state.velocityData[i],...d}; }
  else { d.id=state.nextId.velocityData++; state.velocityData.push(d); }
  saveState(); closeModal('velocity-modal'); renderVelocity(); showToast('Saved');
}
function deleteVelocity(id) { if(!confirm('Delete?')) return; state.velocityData=state.velocityData.filter(x=>x.id!==id); saveState(); renderVelocity(); }
