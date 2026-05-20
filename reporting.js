// ─── REPORTING MODULE ─────────────────────────────────────────────────────────
// Executive Report Builder + Program Health Scorecard

// ─── PROGRAM HEALTH SCORECARD ────────────────────────────────────────────────

const HEALTH_WEIGHTS = {
  schedule:      { label: 'Schedule',      weight: 0.25 },
  budget:        { label: 'Budget',        weight: 0.20 },
  risk:          { label: 'Risk',          weight: 0.20 },
  quality:       { label: 'Quality',       weight: 0.15 },
  stakeholder:   { label: 'Stakeholder',   weight: 0.10 },
  team:          { label: 'Team Capacity', weight: 0.10 }
};

function calcProjectHealth(project) {
  // Schedule score: based on status and progress vs expected
  const scheduleScore = project.status === 'On Track' ? 90 :
    project.status === 'At Risk' ? 55 : project.status === 'Critical' ? 20 :
    project.status === 'Completed' ? 100 : 70;

  // Budget score: from budget tracker if exists
  const budgetEntry = (state.budgets||[]).find(b => b.project === project.name);
  let budgetScore = 80;
  if (budgetEntry && budgetEntry.planned) {
    const pct = (budgetEntry.actual / budgetEntry.planned) * 100;
    budgetScore = pct <= 90 ? 95 : pct <= 100 ? 85 : pct <= 110 ? 60 : pct <= 120 ? 35 : 15;
  }

  // Risk score: based on open red/amber risks for this project
  const projectRisks = (state.risks||[]).filter(r => r.project === project.name && r.status !== 'Closed');
  const redRisks   = projectRisks.filter(r => r.rag === 'red').length;
  const amberRisks = projectRisks.filter(r => r.rag === 'amber').length;
  const riskScore  = redRisks > 2 ? 15 : redRisks > 0 ? 40 : amberRisks > 2 ? 55 : amberRisks > 0 ? 70 : 90;

  // Quality score: based on open escalations and change requests
  const openEsc = (state.escalations||[]).filter(e => e.project === project.name && e.status !== 'Resolved').length;
  const qualityScore = openEsc > 2 ? 30 : openEsc > 0 ? 60 : 85;

  // Stakeholder score: based on stakeholder engagement
  const champions    = (state.stakeholders||[]).filter(s => s.engagement === 'Champion').length;
  const resistors    = (state.stakeholders||[]).filter(s => s.engagement === 'Resistant').length;
  const stakeholderScore = resistors > 1 ? 40 : resistors > 0 ? 60 : champions > 2 ? 90 : 75;

  // Team score: from capacity
  const teamMembers = (state.capacity||[]);
  const overAllocated = teamMembers.filter(m => m.allocation > 100).length;
  const teamScore = overAllocated > 2 ? 40 : overAllocated > 0 ? 65 : 85;

  const scores = { schedule: scheduleScore, budget: budgetScore, risk: riskScore, quality: qualityScore, stakeholder: stakeholderScore, team: teamScore };
  const weighted = Object.entries(HEALTH_WEIGHTS).reduce((sum, [key, cfg]) => sum + (scores[key] * cfg.weight), 0);
  const overall = Math.round(weighted);
  const rag = overall >= 75 ? 'green' : overall >= 50 ? 'amber' : 'red';
  return { scores, overall, rag };
}

function renderHealthScorecard() {
  const container = document.getElementById('health-scorecard-grid');
  if (!container) return;

  const projects = state.projects || [];
  if (!projects.length) {
    container.innerHTML = '<div class="empty-state"><i class="ti ti-gauge"></i><p>No projects to score.</p></div>';
    return;
  }

  const healths = projects.map(p => ({ project: p, health: calcProjectHealth(p) }))
    .sort((a, b) => a.health.overall - b.health.overall);

  container.innerHTML = healths.map(({ project: p, health: h }) => {
    const ragColor = { green: '#3B6D11', amber: '#854F0B', red: '#A32D2D' };
    const ragBg    = { green: '#EAF3DE', amber: '#FAEEDA', red: '#FCEBEB' };
    return `
    <div class="health-card">
      <div class="health-card-header">
        <div>
          <div class="health-card-name">${p.name}</div>
          <div class="health-card-owner">${p.owner} &bull; ${p.status}</div>
        </div>
        <div class="health-score-circle" style="background:${ragBg[h.rag]};color:${ragColor[h.rag]}">${h.overall}</div>
      </div>
      <div class="health-bars">
        ${Object.entries(HEALTH_WEIGHTS).map(([key, cfg]) => {
          const score = h.scores[key];
          const barColor = score >= 75 ? '#1D9E75' : score >= 50 ? '#EF9F27' : '#E24B4A';
          return `<div class="health-bar-row">
            <span class="health-bar-label">${cfg.label}</span>
            <div class="health-bar-track"><div class="health-bar-fill" style="width:${score}%;background:${barColor}"></div></div>
            <span class="health-bar-val" style="color:${barColor}">${score}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  // Portfolio average
  const avg = Math.round(healths.reduce((s, h) => s + h.health.overall, 0) / healths.length);
  const greenCount = healths.filter(h => h.health.rag === 'green').length;
  const amberCount = healths.filter(h => h.health.rag === 'amber').length;
  const redCount   = healths.filter(h => h.health.rag === 'red').length;
  document.getElementById('hs-avg').textContent    = avg;
  document.getElementById('hs-green').textContent  = greenCount;
  document.getElementById('hs-amber').textContent  = amberCount;
  document.getElementById('hs-red').textContent    = redCount;
}

async function aiHealthAnalysis() {
  const projects = state.projects || [];
  if (!projects.length) { showToast('No projects to analyze', 'error'); return; }
  setAILoading('health-ai-panel', 'health-ai-text', 'Analyzing portfolio health...');

  const healthData = projects.map(p => {
    const h = calcProjectHealth(p);
    return `${p.name}: Overall ${h.overall}/100 (${h.rag}) | Schedule:${h.scores.schedule} Budget:${h.scores.budget} Risk:${h.scores.risk} Quality:${h.scores.quality}`;
  }).join('\n');

  const result = await callAI(
    `Analyze this portfolio health scorecard data and provide a leadership-ready assessment.\n\n${healthData}\n\nProvide: overall portfolio health assessment, top 3 projects needing immediate attention, specific recommended interventions per at-risk project, and what leadership should focus on this week.`
  );
  if (result) showAIOutput('health-ai-panel', 'health-ai-text', result, 'Portfolio Health Analysis', 'Portfolio', 'Executive Leadership');
}

// ─── EXECUTIVE REPORT BUILDER ─────────────────────────────────────────────────

const REPORT_SECTIONS = {
  portfolio_rag:  { label: 'Portfolio RAG Summary',    default: true },
  health_scores:  { label: 'Program Health Scores',    default: true },
  open_risks:     { label: 'Open Risks (Red/Amber)',    default: true },
  escalations:    { label: 'Open Escalations',          default: true },
  milestones:     { label: 'Upcoming Milestones',       default: true },
  budget_status:  { label: 'Budget Status',             default: true },
  decisions:      { label: 'Recent Decisions',          default: false },
  action_items:   { label: 'Overdue Action Items',      default: false },
  velocity:       { label: 'Sprint Velocity',           default: false },
  dependencies:   { label: 'At-Risk Dependencies',      default: false },
  changes:        { label: 'Pending Change Requests',   default: false },
  kpis:           { label: 'OKR / KPI Status',          default: false }
};

function renderReportBuilder() {
  const container = document.getElementById('report-sections-config');
  if (!container) return;

  const saved = JSON.parse(localStorage.getItem('edm_report_config') || '{}');

  container.innerHTML = Object.entries(REPORT_SECTIONS).map(([key, cfg]) => {
    const checked = saved[key] !== undefined ? saved[key] : cfg.default;
    return `<label class="report-section-toggle">
      <input type="checkbox" id="rsc-${key}" ${checked ? 'checked' : ''} onchange="saveReportConfig()">
      <span>${cfg.label}</span>
    </label>`;
  }).join('');
}

function saveReportConfig() {
  const config = {};
  Object.keys(REPORT_SECTIONS).forEach(key => {
    const el = document.getElementById('rsc-' + key);
    if (el) config[key] = el.checked;
  });
  localStorage.setItem('edm_report_config', JSON.stringify(config));
}

function getEnabledSections() {
  const saved = JSON.parse(localStorage.getItem('edm_report_config') || '{}');
  return Object.entries(REPORT_SECTIONS)
    .filter(([key, cfg]) => saved[key] !== undefined ? saved[key] : cfg.default)
    .map(([key]) => key);
}

function buildReportData(sections) {
  const lines = [];
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  if (sections.includes('portfolio_rag')) {
    lines.push('PORTFOLIO RAG SUMMARY');
    state.projects.forEach(p => {
      const h = calcProjectHealth(p);
      lines.push(`${p.name} | ${p.status} | ${p.progress}% complete | Health: ${h.overall}/100 | Due: ${p.due}`);
    });
    lines.push('');
  }

  if (sections.includes('health_scores')) {
    lines.push('PROGRAM HEALTH SCORES');
    state.projects.forEach(p => {
      const h = calcProjectHealth(p);
      lines.push(`${p.name}: ${h.overall}/100 (${h.rag.toUpperCase()}) — Schedule:${h.scores.schedule} Budget:${h.scores.budget} Risk:${h.scores.risk}`);
    });
    lines.push('');
  }

  if (sections.includes('open_risks')) {
    const risks = (state.risks || []).filter(r => r.status !== 'Closed' && (r.rag === 'red' || r.rag === 'amber'));
    lines.push(`OPEN RISKS (${risks.length})`);
    risks.forEach(r => lines.push(`[${r.rag?.toUpperCase()}] ${r.title} | ${r.project} | Owner: ${r.owner} | Mitigation: ${r.mitigation || 'None'}`));
    lines.push('');
  }

  if (sections.includes('escalations')) {
    const escs = (state.escalations || []).filter(e => e.status !== 'Resolved');
    lines.push(`OPEN ESCALATIONS (${escs.length})`);
    escs.forEach(e => lines.push(`[${e.severity}] ${e.issue} | ${e.project} | ${e.days} days open | Owner: ${e.owner}`));
    lines.push('');
  }

  if (sections.includes('milestones')) {
    const upcoming = (state.milestones || [])
      .filter(m => m.status !== 'Completed' && m.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 8);
    lines.push(`UPCOMING MILESTONES (${upcoming.length})`);
    upcoming.forEach(m => {
      const days = Math.ceil((new Date(m.date) - new Date()) / 86400000);
      lines.push(`${m.title} | ${m.project} | ${m.date} (${days > 0 ? days + 'd away' : Math.abs(days) + 'd overdue'}) | ${m.status}`);
    });
    lines.push('');
  }

  if (sections.includes('budget_status')) {
    lines.push('BUDGET STATUS');
    (state.budgets || []).forEach(b => {
      const pct = b.planned ? Math.round((b.actual / b.planned) * 100) : 0;
      lines.push(`${b.project} | Planned: $${b.planned?.toLocaleString()} | Actual: $${b.actual?.toLocaleString()} | ${pct}% spent`);
    });
    lines.push('');
  }

  if (sections.includes('decisions')) {
    const recent = (state.decisions || []).slice(-5).reverse();
    lines.push(`RECENT DECISIONS (${recent.length})`);
    recent.forEach(d => lines.push(`${d.date} | ${d.title} | ${d.project} | ${d.status}`));
    lines.push('');
  }

  if (sections.includes('action_items')) {
    const overdue = (state.actions || state.actionItems || [])
      .filter(a => a.due && a.status !== 'Done' && a.status !== 'Completed' && new Date(a.due || a.dueDate) < new Date());
    lines.push(`OVERDUE ACTION ITEMS (${overdue.length})`);
    overdue.forEach(a => lines.push(`${a.title} | Owner: ${a.owner} | Due: ${a.due || a.dueDate} | ${a.project}`));
    lines.push('');
  }

  if (sections.includes('velocity')) {
    const vdata = (state.velocityData || state.velocity || []);
    if (vdata.length) {
      const avg = Math.round(vdata.reduce((s, v) => s + (v.completed || 0), 0) / vdata.length);
      const last = vdata[vdata.length - 1];
      lines.push('SPRINT VELOCITY');
      lines.push(`Average velocity: ${avg} points | Last sprint: ${last?.name} — ${last?.completed}/${last?.committed} points`);
      lines.push('');
    }
  }

  if (sections.includes('dependencies')) {
    const atRisk = (state.dependencies || []).filter(d => d.status === 'At Risk' || d.status === 'Blocked');
    lines.push(`AT-RISK DEPENDENCIES (${atRisk.length})`);
    atRisk.forEach(d => lines.push(`[${d.status}] ${d.fromProject} → ${d.toProject}: ${d.description} | Impact: ${d.impact || 'TBD'}`));
    lines.push('');
  }

  if (sections.includes('changes')) {
    const pending = (state.changes || state.changeRequests || []).filter(c => c.status === 'Pending' || c.status === 'Under Review');
    lines.push(`PENDING CHANGE REQUESTS (${pending.length})`);
    pending.forEach(c => lines.push(`${c.title} | ${c.project} | Impact: ${c.impact} | Requester: ${c.requestor || c.requester}`));
    lines.push('');
  }

  if (sections.includes('kpis')) {
    const okrs = (state.okrs || []).filter(o => o.status !== 'Achieved');
    lines.push(`OKR / KPI STATUS (${okrs.length} active)`);
    okrs.forEach(o => lines.push(`${o.objective} | Progress: ${o.progress}% | Owner: ${o.owner} | ${o.status}`));
    lines.push('');
  }

  return lines.join('\n');
}

async function generateExecutiveReport() {
  const sections = getEnabledSections();
  const reportData = buildReportData(sections);
  const period     = document.getElementById('report-period')?.value || 'Weekly';
  const audience   = document.getElementById('report-audience')?.value || 'Executive sponsors';
  const notes      = document.getElementById('report-notes')?.value || '';

  setAILoading('exec-report-panel', 'exec-report-text', 'Building executive report...');

  const result = await callAI(
    `Write a ${period} Executive Delivery Report for ${audience}.\n\nSource data:\n${reportData}\n${notes ? '\nAdditional context from the delivery manager:\n' + notes : ''}\n\nFormat as a professional executive report with: executive summary (3-4 sentences), section-by-section status, key decisions needed from leadership, and recommended actions. Write in clear, direct language suitable for senior leadership. Flag critical items prominently.`
  );

  if (result) {
    showAIOutput('exec-report-panel', 'exec-report-text', result, `${period} Executive Report`, 'Portfolio', audience);
    // Auto-log to comms log
    if (state.commsLog !== undefined) {
      state.commsLog.push({
        id: (state.nextId?.commsLog || 1),
        date: new Date().toISOString().slice(0, 10),
        topic: `${period} Executive Delivery Report`,
        recipients: audience,
        channel: 'Report',
        project: 'Portfolio',
        summary: `AI-generated ${period} executive report distributed`,
        notes: ''
      });
      if (state.nextId) state.nextId.commsLog = (state.nextId.commsLog || 1) + 1;
      saveState();
    }
  }
}

function saveReportTemplate() {
  saveReportConfig();
  showToast('Report template saved');
}
