// ─── BUSINESS MODULE ──────────────────────────────────────────────────────────
// Benefits Realization Tracker + OKR/KPI Tracker + Vendor/Contract Tracker

// ─── BENEFITS REALIZATION TRACKER ────────────────────────────────────────────

function calcBenefitRag(benefit) {
  if (benefit.status === 'Achieved') return 'green';
  if (!benefit.projected || !benefit.actual) return 'gray';
  const ratio = benefit.actual / benefit.projected;
  if (ratio >= 0.9) return 'green';
  if (ratio >= 0.6) return 'amber';
  return 'red';
}

function renderBenefits() {
  const tbody = document.getElementById('benefits-tbody');
  if (!tbody) return;

  const benefits = state.benefits || [];
  tbody.innerHTML = benefits.length ? benefits.map(b => {
    const rag = calcBenefitRag(b);
    const realizationPct = b.projected && b.actual ? Math.round((b.actual / b.projected) * 100) : null;
    return `<tr>
      <td style="font-weight:500;max-width:200px">${b.title}</td>
      <td style="color:var(--tx2)">${b.project}</td>
      <td><span class="badge ${b.type === 'Financial' ? 'green' : b.type === 'Strategic' ? 'blue' : 'purple'}">${b.type}</span></td>
      <td style="color:var(--tx2)">${b.projected ? (b.unit === '$' ? '$' + b.projected.toLocaleString() : b.projected + ' ' + (b.unit || '')) : '—'}</td>
      <td style="color:var(--tx2)">${b.actual !== undefined && b.actual !== null ? (b.unit === '$' ? '$' + b.actual.toLocaleString() : b.actual + ' ' + (b.unit || '')) : '—'}</td>
      <td>
        ${realizationPct !== null ? `<div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(realizationPct,100)}%;background:${rag==='green'?'#1D9E75':rag==='amber'?'#EF9F27':'#E24B4A'}"></div></div><span class="progress-label">${realizationPct}%</span></div>` : '—'}
      </td>
      <td style="color:var(--tx2);white-space:nowrap">${b.targetDate || '—'}</td>
      <td><span class="badge ${rag}">${b.status}</span></td>
      <td style="color:var(--tx2);font-size:12px">${b.owner}</td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editBenefit(${b.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteBenefit(${b.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('') :
  `<tr><td colspan="10"><div class="empty-state"><i class="ti ti-target"></i><p>No benefits tracked. Add projected benefits for each project to measure realization.</p></div></td></tr>`;

  const all = state.benefits || [];
  const achieved = all.filter(b => b.status === 'Achieved').length;
  const financial = all.filter(b => b.type === 'Financial').reduce((s,b) => s + (b.actual || 0), 0);
  document.getElementById('ben-total').textContent    = all.length;
  document.getElementById('ben-achieved').textContent = achieved;
  document.getElementById('ben-pending').textContent  = all.filter(b => b.status !== 'Achieved').length;
  document.getElementById('ben-financial').textContent= '$' + financial.toLocaleString();
}

let _editBenefitId = null;
function openAddBenefit() {
  _editBenefitId = null;
  document.getElementById('ben-modal-title').textContent = 'Add Benefit';
  ['ben-title','ben-projected','ben-actual','ben-unit','ben-owner','ben-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ben-project').value    = (state.projects||[])[0]?.name || '';
  document.getElementById('ben-type').value       = 'Financial';
  document.getElementById('ben-status').value     = 'Projected';
  document.getElementById('ben-target-date').value = '';
  openModal('benefit-modal');
}
function editBenefit(id) {
  const b = (state.benefits || []).find(x => x.id === id); if (!b) return;
  _editBenefitId = id;
  document.getElementById('ben-modal-title').textContent = 'Edit Benefit';
  document.getElementById('ben-title').value      = b.title;
  document.getElementById('ben-project').value    = b.project;
  document.getElementById('ben-type').value       = b.type;
  document.getElementById('ben-projected').value  = b.projected || '';
  document.getElementById('ben-actual').value     = b.actual !== undefined ? b.actual : '';
  document.getElementById('ben-unit').value       = b.unit || '';
  document.getElementById('ben-target-date').value= b.targetDate || '';
  document.getElementById('ben-status').value     = b.status;
  document.getElementById('ben-owner').value      = b.owner;
  document.getElementById('ben-notes').value      = b.notes || '';
  openModal('benefit-modal');
}
function saveBenefit() {
  const title = document.getElementById('ben-title').value.trim();
  if (!title) { showToast('Title required', 'error'); return; }
  const d = {
    title, project: document.getElementById('ben-project').value.trim(),
    type: document.getElementById('ben-type').value,
    projected: parseFloat(document.getElementById('ben-projected').value) || null,
    actual:    document.getElementById('ben-actual').value !== '' ? parseFloat(document.getElementById('ben-actual').value) : null,
    unit:      document.getElementById('ben-unit').value.trim() || '$',
    targetDate:document.getElementById('ben-target-date').value,
    status:    document.getElementById('ben-status').value,
    owner:     document.getElementById('ben-owner').value.trim() || 'TBD',
    notes:     document.getElementById('ben-notes').value.trim()
  };
  if (!state.benefits) state.benefits = [];
  if (_editBenefitId) {
    const i = state.benefits.findIndex(x => x.id === _editBenefitId);
    state.benefits[i] = { ...state.benefits[i], ...d };
  } else {
    d.id = (state.nextId?.benefits || 1);
    if (!state.nextId) state.nextId = {};
    state.nextId.benefits = (state.nextId.benefits || 1) + 1;
    state.benefits.push(d);
  }
  saveState(); closeModal('benefit-modal'); renderBenefits(); showToast('Saved');
}
function deleteBenefit(id) {
  if (!confirm('Delete?')) return;
  state.benefits = (state.benefits || []).filter(x => x.id !== id);
  saveState(); renderBenefits();
}

async function aiBenefitsAnalysis() {
  const benefits = state.benefits || [];
  if (!benefits.length) { showToast('No benefits data', 'error'); return; }
  setAILoading('ben-ai-panel', 'ben-ai-text', 'Analyzing benefits realization...');
  const data = benefits.map(b => {
    const pct = b.projected && b.actual !== null ? Math.round((b.actual/b.projected)*100) + '%' : 'Not yet measured';
    return `${b.title} | ${b.project} | Type: ${b.type} | Projected: ${b.projected || 'TBD'} ${b.unit} | Actual: ${b.actual ?? 'Not yet'} ${b.unit} | Realization: ${pct} | ${b.status}`;
  }).join('\n');
  const result = await callAI(
    `Analyze this benefits realization data for an enterprise portfolio.\n\n${data}\n\nProvide: overall realization assessment, benefits at risk of not being achieved, patterns in underperformance, and 3 specific recommendations to improve benefits realization. Include suggestions for benefits that haven't been measured yet.`
  );
  if (result) showAIOutput('ben-ai-panel', 'ben-ai-text', result, 'Benefits Realization Analysis', 'Portfolio', 'Executive Leadership');
}

// ─── OKR / KPI TRACKER ────────────────────────────────────────────────────────

function okrRag(okr) {
  if (okr.status === 'Achieved') return 'green';
  const pct = okr.target ? Math.round((okr.progress / okr.target) * 100) : okr.progress;
  if (pct >= 80) return 'green';
  if (pct >= 50) return 'amber';
  return 'red';
}

function renderOKRs(filter = 'all') {
  const okrs = filter === 'all' ? (state.okrs || []) : (state.okrs || []).filter(o => o.type === filter || o.status === filter);
  const tbody = document.getElementById('okr-tbody');
  if (!tbody) return;

  tbody.innerHTML = okrs.length ? okrs.map(o => {
    const rag = okrRag(o);
    const pct = o.target ? Math.round((o.progress / o.target) * 100) : o.progress;
    return `<tr>
      <td><span class="badge ${o.type==='OKR'?'blue':'purple'}">${o.type}</span></td>
      <td style="font-weight:500;max-width:220px">${o.objective}</td>
      <td style="color:var(--tx2);max-width:160px;font-size:12px">${o.keyResult || '—'}</td>
      <td style="color:var(--tx2)">${o.project || 'Portfolio'}</td>
      <td style="color:var(--tx2)">${o.owner}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(pct,100)}%;background:${rag==='green'?'#1D9E75':rag==='amber'?'#EF9F27':'#E24B4A'}"></div></div>
          <span class="progress-label">${o.progress}${o.unit||'%'}${o.target?' / '+o.target+o.unit:''}</span>
        </div>
      </td>
      <td style="color:var(--tx2);white-space:nowrap">${o.dueDate || '—'}</td>
      <td><span class="badge ${rag}">${o.status}</span></td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editOKR(${o.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteOKR(${o.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('') :
  `<tr><td colspan="9"><div class="empty-state"><i class="ti ti-target"></i><p>No OKRs or KPIs. Add objectives to connect delivery to business outcomes.</p></div></td></tr>`;

  const all = state.okrs || [];
  document.getElementById('okr-total').textContent    = all.length;
  document.getElementById('okr-achieved').textContent = all.filter(o => o.status === 'Achieved').length;
  document.getElementById('okr-atrisk').textContent   = all.filter(o => okrRag(o) === 'red').length;
  document.getElementById('okr-ontrack').textContent  = all.filter(o => okrRag(o) === 'green' && o.status !== 'Achieved').length;
}

let _editOKRId = null;
function openAddOKR() {
  _editOKRId = null;
  document.getElementById('okr-modal-title').textContent = 'Add OKR / KPI';
  ['okr-objective','okr-key-result','okr-owner','okr-unit','okr-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('okr-type').value     = 'OKR';
  document.getElementById('okr-project').value  = '';
  document.getElementById('okr-progress').value = '0';
  document.getElementById('okr-target').value   = '100';
  document.getElementById('okr-status').value   = 'In Progress';
  document.getElementById('okr-due').value      = '';
  openModal('okr-modal');
}
function editOKR(id) {
  const o = (state.okrs || []).find(x => x.id === id); if (!o) return;
  _editOKRId = id;
  document.getElementById('okr-modal-title').textContent = 'Edit OKR / KPI';
  document.getElementById('okr-type').value       = o.type;
  document.getElementById('okr-objective').value  = o.objective;
  document.getElementById('okr-key-result').value = o.keyResult || '';
  document.getElementById('okr-project').value    = o.project || '';
  document.getElementById('okr-owner').value      = o.owner;
  document.getElementById('okr-progress').value   = o.progress;
  document.getElementById('okr-target').value     = o.target || 100;
  document.getElementById('okr-unit').value       = o.unit || '%';
  document.getElementById('okr-status').value     = o.status;
  document.getElementById('okr-due').value        = o.dueDate || '';
  document.getElementById('okr-notes').value      = o.notes || '';
  openModal('okr-modal');
}
function saveOKR() {
  const objective = document.getElementById('okr-objective').value.trim();
  if (!objective) { showToast('Objective required', 'error'); return; }
  const d = {
    type: document.getElementById('okr-type').value,
    objective, keyResult: document.getElementById('okr-key-result').value.trim(),
    project:  document.getElementById('okr-project').value.trim(),
    owner:    document.getElementById('okr-owner').value.trim() || 'TBD',
    progress: parseFloat(document.getElementById('okr-progress').value) || 0,
    target:   parseFloat(document.getElementById('okr-target').value) || 100,
    unit:     document.getElementById('okr-unit').value.trim() || '%',
    status:   document.getElementById('okr-status').value,
    dueDate:  document.getElementById('okr-due').value,
    notes:    document.getElementById('okr-notes').value.trim()
  };
  if (!state.okrs) state.okrs = [];
  if (_editOKRId) {
    const i = state.okrs.findIndex(x => x.id === _editOKRId);
    state.okrs[i] = { ...state.okrs[i], ...d };
  } else {
    d.id = (state.nextId?.okrs || 1);
    if (!state.nextId) state.nextId = {};
    state.nextId.okrs = (state.nextId.okrs || 1) + 1;
    state.okrs.push(d);
  }
  saveState(); closeModal('okr-modal'); renderOKRs(); showToast('Saved');
}
function deleteOKR(id) {
  if (!confirm('Delete?')) return;
  state.okrs = (state.okrs || []).filter(x => x.id !== id);
  saveState(); renderOKRs();
}

async function aiOKRAnalysis() {
  const okrs = state.okrs || [];
  if (!okrs.length) { showToast('No OKR data', 'error'); return; }
  setAILoading('okr-ai-panel', 'okr-ai-text', 'Analyzing OKRs...');
  const data = okrs.map(o => {
    const pct = o.target ? Math.round((o.progress/o.target)*100) : o.progress;
    return `${o.type}: ${o.objective} | Key Result: ${o.keyResult || 'N/A'} | Progress: ${pct}% | Owner: ${o.owner} | ${o.status}`;
  }).join('\n');
  const portfolioHealth = (state.projects||[]).map(p => `${p.name}: ${p.status}`).join(', ');
  const result = await callAI(
    `Analyze OKRs and KPIs for an enterprise delivery portfolio.\n\nOKRs/KPIs:\n${data}\n\nPortfolio status: ${portfolioHealth}\n\nProvide: assessment of how delivery is tracking against strategic objectives, OKRs at risk, alignment gaps between project delivery and business objectives, and 3 recommendations to improve OKR achievement.`
  );
  if (result) showAIOutput('okr-ai-panel', 'okr-ai-text', result, 'OKR Analysis', 'Portfolio', 'Executive Leadership');
}

// ─── VENDOR / CONTRACT TRACKER ────────────────────────────────────────────────

function vendorRag(vendor) {
  if (vendor.performance >= 90) return 'green';
  if (vendor.performance >= 70) return 'amber';
  if (vendor.performance < 70) return 'red';
  if (!vendor.contractEnd) return 'gray';
  const daysToExpiry = Math.ceil((new Date(vendor.contractEnd) - new Date()) / 86400000);
  if (daysToExpiry < 30) return 'red';
  if (daysToExpiry < 90) return 'amber';
  return 'green';
}

function renderVendors(filter = 'all') {
  const vendors = filter === 'all' ? (state.vendors || []) : (state.vendors || []).filter(v => v.status === filter || v.category === filter);
  const tbody = document.getElementById('vendors-tbody');
  if (!tbody) return;

  tbody.innerHTML = vendors.length ? vendors.map(v => {
    const rag = vendorRag(v);
    const daysToExpiry = v.contractEnd ? Math.ceil((new Date(v.contractEnd) - new Date()) / 86400000) : null;
    const expiryLabel = daysToExpiry === null ? '—' : daysToExpiry < 0 ? 'Expired' : daysToExpiry < 30 ? `${daysToExpiry}d ⚠` : daysToExpiry < 90 ? `${daysToExpiry}d` : v.contractEnd;
    return `<tr>
      <td style="font-weight:500">${v.name}</td>
      <td style="color:var(--tx2)">${v.category || '—'}</td>
      <td style="color:var(--tx2)">${v.project || 'Multiple'}</td>
      <td style="color:var(--tx2)">${v.contractValue ? '$' + Number(v.contractValue).toLocaleString() : '—'}</td>
      <td style="color:var(--tx2);white-space:nowrap">${v.contractStart || '—'}</td>
      <td style="color:${daysToExpiry !== null && daysToExpiry < 90 ? 'var(--amber)' : daysToExpiry !== null && daysToExpiry < 0 ? 'var(--red)' : 'var(--tx2)'};white-space:nowrap">${expiryLabel}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${v.performance||0}%;background:${rag==='green'?'#1D9E75':rag==='amber'?'#EF9F27':'#E24B4A'}"></div></div>
          <span class="progress-label">${v.performance || 0}%</span>
        </div>
      </td>
      <td style="color:var(--tx2);font-size:12px;max-width:140px">${v.slaTerms || '—'}</td>
      <td><span class="badge ${v.status==='Active'?'green':v.status==='At Risk'?'amber':v.status==='Expired'?'red':'gray'}">${v.status}</span></td>
      <td><div style="display:flex;gap:3px">
        <button class="icon-btn" onclick="editVendor(${v.id})"><i class="ti ti-edit"></i></button>
        <button class="icon-btn danger" onclick="deleteVendor(${v.id})"><i class="ti ti-trash"></i></button>
      </div></td>
    </tr>`;
  }).join('') :
  `<tr><td colspan="10"><div class="empty-state"><i class="ti ti-building-store"></i><p>No vendors tracked.</p></div></td></tr>`;

  const all = state.vendors || [];
  const expiringSoon = all.filter(v => { const d = v.contractEnd ? Math.ceil((new Date(v.contractEnd)-new Date())/86400000) : 999; return d >= 0 && d <= 90; }).length;
  document.getElementById('vm-total').textContent   = all.length;
  document.getElementById('vm-active').textContent  = all.filter(v=>v.status==='Active').length;
  document.getElementById('vm-expiring').textContent= expiringSoon;
  document.getElementById('vm-atrisk').textContent  = all.filter(v=>v.performance < 70).length;
}

let _editVendorId = null;
function openAddVendor() {
  _editVendorId = null;
  document.getElementById('vendor-modal-title').textContent = 'Add Vendor';
  ['ven-name','ven-category','ven-project','ven-value','ven-start','ven-end','ven-sla','ven-contact','ven-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ven-performance').value = '85';
  document.getElementById('ven-status').value      = 'Active';
  openModal('vendor-modal');
}
function editVendor(id) {
  const v = (state.vendors || []).find(x => x.id === id); if (!v) return;
  _editVendorId = id;
  document.getElementById('vendor-modal-title').textContent = 'Edit Vendor';
  document.getElementById('ven-name').value        = v.name;
  document.getElementById('ven-category').value    = v.category || '';
  document.getElementById('ven-project').value     = v.project || '';
  document.getElementById('ven-value').value       = v.contractValue || '';
  document.getElementById('ven-start').value       = v.contractStart || '';
  document.getElementById('ven-end').value         = v.contractEnd || '';
  document.getElementById('ven-performance').value = v.performance || 85;
  document.getElementById('ven-sla').value         = v.slaTerms || '';
  document.getElementById('ven-contact').value     = v.contact || '';
  document.getElementById('ven-status').value      = v.status;
  document.getElementById('ven-notes').value       = v.notes || '';
  openModal('vendor-modal');
}
function saveVendor() {
  const name = document.getElementById('ven-name').value.trim();
  if (!name) { showToast('Name required', 'error'); return; }
  const d = {
    name, category:      document.getElementById('ven-category').value.trim(),
    project:     document.getElementById('ven-project').value.trim(),
    contractValue: parseFloat(document.getElementById('ven-value').value) || null,
    contractStart: document.getElementById('ven-start').value,
    contractEnd:   document.getElementById('ven-end').value,
    performance:   parseInt(document.getElementById('ven-performance').value) || 85,
    slaTerms:      document.getElementById('ven-sla').value.trim(),
    contact:       document.getElementById('ven-contact').value.trim(),
    status:        document.getElementById('ven-status').value,
    notes:         document.getElementById('ven-notes').value.trim()
  };
  if (!state.vendors) state.vendors = [];
  if (_editVendorId) {
    const i = state.vendors.findIndex(x => x.id === _editVendorId);
    state.vendors[i] = { ...state.vendors[i], ...d };
  } else {
    d.id = (state.nextId?.vendors || 1);
    if (!state.nextId) state.nextId = {};
    state.nextId.vendors = (state.nextId.vendors || 1) + 1;
    state.vendors.push(d);
  }
  saveState(); closeModal('vendor-modal'); renderVendors(); showToast('Saved');
}
function deleteVendor(id) {
  if (!confirm('Delete?')) return;
  state.vendors = (state.vendors || []).filter(x => x.id !== id);
  saveState(); renderVendors();
}

async function aiVendorAnalysis() {
  const vendors = state.vendors || [];
  if (!vendors.length) { showToast('No vendor data', 'error'); return; }
  setAILoading('vendor-ai-panel', 'vendor-ai-text', 'Analyzing vendors...');
  const data = vendors.map(v => {
    const days = v.contractEnd ? Math.ceil((new Date(v.contractEnd)-new Date())/86400000) : null;
    return `${v.name} | Category: ${v.category} | Performance: ${v.performance}% | Contract expires: ${days !== null ? days + ' days' : 'N/A'} | Status: ${v.status} | SLA: ${v.slaTerms || 'None'} | Project: ${v.project || 'Multiple'}`;
  }).join('\n');
  const result = await callAI(
    `Analyze this vendor portfolio for an Enterprise Delivery Manager.\n\n${data}\n\nProvide: vendor risk assessment, contracts expiring in next 90 days requiring action, underperforming vendors and recommended remediation, and 3 strategic vendor management recommendations.`
  );
  if (result) showAIOutput('vendor-ai-panel', 'vendor-ai-text', result, 'Vendor Analysis', 'Portfolio', 'Procurement & Leadership');
}

// ─── Init renderAll additions ─────────────────────────────────────────────────

// These functions are called from app.js renderAll — graceful if state not populated
window.addEventListener('DOMContentLoaded', () => {
  // Seed default sample data for new sections if empty
  if (!state.vendors || !state.vendors.length) {
    state.vendors = [
      {id:1, name:'Apex API Solutions', category:'Technology', project:'Mobile SDK Release', contractValue:180000, contractStart:'2026-01-01', contractEnd:'2026-12-31', performance:62, slaTerms:'99.9% uptime, 4hr response', contact:'sarah@apex.com', status:'At Risk', notes:'SLA breach under review'},
      {id:2, name:'CloudBase Infrastructure', category:'Cloud', project:'Platform Migration', contractValue:95000, contractStart:'2026-01-01', contractEnd:'2026-06-30', performance:94, slaTerms:'99.95% uptime', contact:'ops@cloudbase.com', status:'Active', notes:'Contract renewal due'},
      {id:3, name:'DataSync Partners', category:'Data', project:'Data Warehouse Modernization', contractValue:240000, contractStart:'2025-09-01', contractEnd:'2026-08-31', performance:88, slaTerms:'24hr support', contact:'james@datasync.com', status:'Active', notes:''}
    ];
    if (!state.nextId) state.nextId = {};
    state.nextId.vendors = 4;
  }
  if (!state.okrs || !state.okrs.length) {
    state.okrs = [
      {id:1, type:'OKR', objective:'Reduce time-to-market for new features by 30%', keyResult:'Deploy cadence from monthly to bi-weekly', project:'Platform Migration', owner:'J. Torres', progress:55, target:100, unit:'%', status:'In Progress', dueDate:'2026-09-30', notes:''},
      {id:2, type:'KPI', objective:'Platform availability SLA', keyResult:'Maintain 99.9% uptime across all production systems', project:'Platform Migration', owner:'R. Patel', progress:99.7, target:99.9, unit:'%', status:'In Progress', dueDate:'2026-12-31', notes:''},
      {id:3, type:'OKR', objective:'Improve customer satisfaction score to 4.5/5', keyResult:'Portal redesign drives CSAT improvement', project:'Customer Portal Redesign', owner:'M. Chen', progress:70, target:100, unit:'%', status:'In Progress', dueDate:'2026-08-31', notes:''}
    ];
    state.nextId.okrs = 4;
  }
  if (!state.benefits || !state.benefits.length) {
    state.benefits = [
      {id:1, title:'Annual cloud infrastructure cost savings', project:'Platform Migration', type:'Financial', projected:450000, actual:210000, unit:'$', targetDate:'2027-01-01', status:'In Progress', owner:'J. Torres', notes:'On track based on Q1 actuals'},
      {id:2, title:'Customer retention improvement', project:'Customer Portal Redesign', type:'Strategic', projected:15, actual:null, unit:'%', targetDate:'2026-12-31', status:'Projected', owner:'M. Chen', notes:'Measurement begins at go-live'},
      {id:3, title:'Compliance audit cost avoidance', project:'Compliance Audit Prep', type:'Financial', projected:120000, actual:null, unit:'$', targetDate:'2026-09-30', status:'Projected', owner:'R. Patel', notes:''}
    ];
    state.nextId.benefits = 4;
  }
  saveState();
  renderVendors();
  renderOKRs();
  renderBenefits();
  renderHealthScorecard();
  renderReportBuilder();
  renderResourceForecast();
  renderSkillsMatrix();
});
