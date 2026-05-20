// ─── RESOURCES MODULE ─────────────────────────────────────────────────────────
// Resource Forecasting + Skills Matrix

// ─── RESOURCE FORECASTING ─────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getNextSixMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
  }
  return months;
}

function renderResourceForecast() {
  const container = document.getElementById('resource-forecast-grid');
  const tableContainer = document.getElementById('resource-forecast-table');
  if (!container || !tableContainer) return;

  const forecasts = state.resourceForecasts || [];
  const months = getNextSixMonths();

  if (!forecasts.length) {
    container.innerHTML = '<div class="empty-state"><i class="ti ti-users-group"></i><p>No resource forecasts. Add team members and their planned allocation per month.</p></div>';
    tableContainer.innerHTML = '';
    updateForecastMetrics([]);
    return;
  }

  // Summary heatmap
  const roles = [...new Set(forecasts.map(f => f.role))];
  container.innerHTML = `
    <div style="overflow-x:auto">
      <table style="font-size:12px">
        <thead>
          <tr>
            <th style="min-width:140px">Resource / Role</th>
            ${months.map(m => `<th style="text-align:center;min-width:70px">${m.label}</th>`).join('')}
            <th>Project</th>
          </tr>
        </thead>
        <tbody>
          ${forecasts.map(f => {
            const totalAlloc = months.reduce((s, m) => s + (f.monthlyAlloc?.[m.key] || 0), 0);
            return `<tr>
              <td style="font-weight:500">${f.name}</td>
              ${months.map(m => {
                const pct = f.monthlyAlloc?.[m.key] || 0;
                const bg = pct > 100 ? 'var(--red-bg)' : pct > 85 ? 'var(--amber-bg)' : pct > 0 ? 'var(--green-bg)' : 'var(--bg2)';
                const color = pct > 100 ? 'var(--red)' : pct > 85 ? 'var(--amber)' : pct > 0 ? 'var(--green)' : 'var(--tx3)';
                return `<td style="text-align:center;background:${bg};color:${color};font-weight:500;padding:6px 8px">${pct || '—'}${pct ? '%' : ''}</td>`;
              }).join('')}
              <td style="color:var(--tx2);font-size:11px">${f.project || '—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  // Gap analysis table
  tableContainer.innerHTML = `
    <div style="margin-top:16px">
      <div style="font-size:13px;font-weight:500;margin-bottom:10px">Gap Analysis — Capacity vs Demand</div>
      <div style="overflow-x:auto">
        <table style="font-size:12px">
          <thead><tr><th>Month</th><th>Total Demand (%)</th><th>Headcount</th><th>Avg Allocation</th><th>Status</th></tr></thead>
          <tbody>
            ${months.map(m => {
              const totalPct = forecasts.reduce((s, f) => s + (f.monthlyAlloc?.[m.key] || 0), 0);
              const headcount = forecasts.length;
              const avg = headcount ? Math.round(totalPct / headcount) : 0;
              const rag = avg > 100 ? 'red' : avg > 85 ? 'amber' : 'green';
              const label = avg > 100 ? 'Overallocated' : avg > 85 ? 'Near capacity' : 'Healthy';
              return `<tr>
                <td style="font-weight:500">${m.label}</td>
                <td>${totalPct}%</td>
                <td>${headcount}</td>
                <td style="color:var(--${rag})">${avg}%</td>
                <td><span class="badge ${rag}">${label}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  updateForecastMetrics(forecasts);
}

function updateForecastMetrics(forecasts) {
  const months = getNextSixMonths();
  const currentMonth = months[0]?.key;
  const currentAllocs = forecasts.map(f => f.monthlyAlloc?.[currentMonth] || 0);
  const avg = currentAllocs.length ? Math.round(currentAllocs.reduce((s,v)=>s+v,0)/currentAllocs.length) : 0;
  const over = currentAllocs.filter(v => v > 100).length;
  const gaps = forecasts.filter(f => {
    const next3 = months.slice(1,4).map(m => f.monthlyAlloc?.[m.key] || 0);
    return next3.some(v => v === 0) && next3.some(v => v > 0);
  }).length;

  document.getElementById('rf-headcount').textContent = forecasts.length;
  document.getElementById('rf-avg').textContent       = avg + '%';
  document.getElementById('rf-over').textContent      = over;
  document.getElementById('rf-gaps').textContent      = gaps;
}

let _editForecastId = null;
function openAddForecast() {
  _editForecastId = null;
  document.getElementById('rf-modal-title').textContent = 'Add Resource Forecast';
  ['rf-name','rf-role','rf-project','rf-notes'].forEach(id => document.getElementById(id).value = '');
  getNextSixMonths().forEach(m => {
    const el = document.getElementById('rf-month-' + m.key);
    if (el) el.value = '';
  });
  openModal('forecast-modal');
}
function editForecast(id) {
  const f = (state.resourceForecasts || []).find(x => x.id === id); if (!f) return;
  _editForecastId = id;
  document.getElementById('rf-modal-title').textContent = 'Edit Forecast';
  document.getElementById('rf-name').value    = f.name;
  document.getElementById('rf-role').value    = f.role || '';
  document.getElementById('rf-project').value = f.project || '';
  document.getElementById('rf-notes').value   = f.notes || '';
  getNextSixMonths().forEach(m => {
    const el = document.getElementById('rf-month-' + m.key);
    if (el) el.value = f.monthlyAlloc?.[m.key] || '';
  });
  openModal('forecast-modal');
}
function saveForecast() {
  const name = document.getElementById('rf-name').value.trim();
  if (!name) { showToast('Name required', 'error'); return; }
  const monthlyAlloc = {};
  getNextSixMonths().forEach(m => {
    const el = document.getElementById('rf-month-' + m.key);
    if (el && el.value) monthlyAlloc[m.key] = parseInt(el.value) || 0;
  });
  const d = {
    name, role: document.getElementById('rf-role').value.trim(),
    project: document.getElementById('rf-project').value.trim(),
    notes: document.getElementById('rf-notes').value.trim(),
    monthlyAlloc
  };
  if (!state.resourceForecasts) state.resourceForecasts = [];
  if (_editForecastId) {
    const i = state.resourceForecasts.findIndex(x => x.id === _editForecastId);
    state.resourceForecasts[i] = { ...state.resourceForecasts[i], ...d };
  } else {
    d.id = (state.nextId?.resourceForecasts || 1);
    if (!state.nextId) state.nextId = {};
    state.nextId.resourceForecasts = (state.nextId.resourceForecasts || 1) + 1;
    state.resourceForecasts.push(d);
  }
  saveState(); closeModal('forecast-modal'); renderResourceForecast(); showToast('Saved');
}
function deleteForecast(id) {
  if (!confirm('Delete?')) return;
  state.resourceForecasts = (state.resourceForecasts || []).filter(x => x.id !== id);
  saveState(); renderResourceForecast();
}

function buildForecastModalMonths() {
  const container = document.getElementById('rf-months-grid');
  if (!container) return;
  const months = getNextSixMonths();
  container.innerHTML = months.map(m => `
    <div class="form-group">
      <label class="form-label">${m.label} (%)</label>
      <input id="rf-month-${m.key}" class="form-input" type="number" min="0" max="200" placeholder="0-200" />
    </div>`).join('');
}

async function aiForecastAnalysis() {
  if (!(state.resourceForecasts || []).length) { showToast('No forecast data', 'error'); return; }
  const months = getNextSixMonths();
  setAILoading('rf-ai-panel', 'rf-ai-text', 'Analyzing resource forecast...');
  const data = (state.resourceForecasts || []).map(f =>
    `${f.name} (${f.role}): ${months.map(m => m.label + ':' + (f.monthlyAlloc?.[m.key] || 0) + '%').join(', ')} | Project: ${f.project || 'TBD'}`
  ).join('\n');
  const result = await callAI(
    `Analyze this 6-month resource forecast for an enterprise delivery portfolio.\n\n${data}\n\nIdentify: capacity gaps, overallocation risks, months of concern, specific resources at risk of burnout, and 3 recommendations for capacity planning.`
  );
  if (result) showAIOutput('rf-ai-panel', 'rf-ai-text', result, 'Resource Forecast Analysis', 'Portfolio', 'PMO');
}

// ─── SKILLS MATRIX ────────────────────────────────────────────────────────────

const SKILL_LEVELS = { 0:'—', 1:'Basic', 2:'Proficient', 3:'Expert' };
const SKILL_COLORS = { 0:'var(--tx3)', 1:'var(--amber)', 2:'var(--blue)', 3:'var(--green)' };

function renderSkillsMatrix() {
  const container = document.getElementById('skills-matrix-container');
  if (!container) return;

  const matrix = state.skillsMatrix || [];
  if (!matrix.length) {
    container.innerHTML = '<div class="empty-state"><i class="ti ti-school"></i><p>No skills data. Add team members and their skill levels.</p></div>';
    return;
  }

  const allSkills = [...new Set(matrix.flatMap(m => Object.keys(m.skills || {})))].sort();
  if (!allSkills.length) {
    container.innerHTML = '<div class="empty-state"><i class="ti ti-school"></i><p>No skills recorded yet.</p></div>';
    return;
  }

  container.innerHTML = `<div style="overflow-x:auto"><table style="font-size:12px">
    <thead><tr>
      <th style="min-width:140px">Team Member</th>
      <th style="color:var(--tx2)">Role</th>
      ${allSkills.map(s => `<th style="text-align:center;min-width:80px;font-size:10px">${s}</th>`).join('')}
    </tr></thead>
    <tbody>
      ${matrix.map(m => `<tr>
        <td style="font-weight:500">${m.name}</td>
        <td style="color:var(--tx2);font-size:11px">${m.role || '—'}</td>
        ${allSkills.map(s => {
          const level = m.skills?.[s] || 0;
          return `<td style="text-align:center;color:${SKILL_COLORS[level]};font-size:11px;font-weight:500">${SKILL_LEVELS[level]}</td>`;
        }).join('')}
      </tr>`).join('')}
    </tbody>
  </table></div>

  <div style="margin-top:12px;display:flex;gap:16px;font-size:11px">
    ${Object.entries(SKILL_LEVELS).filter(([k])=>k>0).map(([k,v])=>`
      <span style="color:${SKILL_COLORS[k]};font-weight:500">${v}</span>`).join('')}
  </div>`;

  // Gap analysis — skills with no Expert
  const gaps = allSkills.filter(skill =>
    !matrix.some(m => (m.skills?.[skill] || 0) >= 3)
  );
  document.getElementById('skills-gaps').textContent = gaps.length ? gaps.join(', ') : 'None identified';
  document.getElementById('sm-members').textContent  = matrix.length;
  document.getElementById('sm-skills').textContent   = allSkills.length;
  document.getElementById('sm-gaps').textContent     = gaps.length;
}

let _editSkillsId = null;
function openAddSkills() {
  _editSkillsId = null;
  document.getElementById('sm-modal-title').textContent = 'Add Team Member Skills';
  document.getElementById('sm-name').value = '';
  document.getElementById('sm-role').value = '';
  buildSkillsInputs({});
  openModal('skills-modal');
}
function editSkills(id) {
  const m = (state.skillsMatrix || []).find(x => x.id === id); if (!m) return;
  _editSkillsId = id;
  document.getElementById('sm-modal-title').textContent = 'Edit Skills';
  document.getElementById('sm-name').value = m.name;
  document.getElementById('sm-role').value = m.role || '';
  buildSkillsInputs(m.skills || {});
  openModal('skills-modal');
}

function buildSkillsInputs(existing) {
  const DEFAULT_SKILLS = ['Agile/Scrum','Stakeholder Management','Risk Management','Budget Management','Technical Architecture','Change Management','Data Analysis','Communication','Leadership','JIRA','Confluence','MS Project'];
  const container = document.getElementById('sm-skills-grid');
  if (!container) return;
  container.innerHTML = DEFAULT_SKILLS.map(skill => `
    <div class="form-group">
      <label class="form-label" style="font-size:11px">${skill}</label>
      <select id="sm-skill-${skill.replace(/[^a-z]/gi,'_')}" class="form-input" style="font-size:12px">
        <option value="0" ${!existing[skill]?'selected':''}>— Not rated</option>
        <option value="1" ${existing[skill]===1?'selected':''}>Basic</option>
        <option value="2" ${existing[skill]===2?'selected':''}>Proficient</option>
        <option value="3" ${existing[skill]===3?'selected':''}>Expert</option>
      </select>
    </div>`).join('');
}

function saveSkills() {
  const name = document.getElementById('sm-name').value.trim();
  if (!name) { showToast('Name required', 'error'); return; }
  const DEFAULT_SKILLS = ['Agile/Scrum','Stakeholder Management','Risk Management','Budget Management','Technical Architecture','Change Management','Data Analysis','Communication','Leadership','JIRA','Confluence','MS Project'];
  const skills = {};
  DEFAULT_SKILLS.forEach(skill => {
    const el = document.getElementById('sm-skill-' + skill.replace(/[^a-z]/gi,'_'));
    if (el && parseInt(el.value) > 0) skills[skill] = parseInt(el.value);
  });
  const d = { name, role: document.getElementById('sm-role').value.trim(), skills };
  if (!state.skillsMatrix) state.skillsMatrix = [];
  if (_editSkillsId) {
    const i = state.skillsMatrix.findIndex(x => x.id === _editSkillsId);
    state.skillsMatrix[i] = { ...state.skillsMatrix[i], ...d };
  } else {
    d.id = (state.nextId?.skillsMatrix || 1);
    if (!state.nextId) state.nextId = {};
    state.nextId.skillsMatrix = (state.nextId.skillsMatrix || 1) + 1;
    state.skillsMatrix.push(d);
  }
  saveState(); closeModal('skills-modal'); renderSkillsMatrix(); showToast('Saved');
}
function deleteSkills(id) {
  if (!confirm('Remove?')) return;
  state.skillsMatrix = (state.skillsMatrix || []).filter(x => x.id !== id);
  saveState(); renderSkillsMatrix();
}
