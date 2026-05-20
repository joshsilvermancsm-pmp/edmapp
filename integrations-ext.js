// ─── EXTERNAL INTEGRATIONS MODULE ────────────────────────────────────────────
// GitHub, Confluence, Google Calendar, Outlook (MS Graph)

const EXT = {

  // ── GitHub ──────────────────────────────────────────────────────────────────

  github: {
    getConfig() { return { token:localStorage.getItem('gh_token')||'', owner:localStorage.getItem('gh_owner')||'', repo:localStorage.getItem('gh_repo')||'' }; },
    saveConfig() {
      const t=document.getElementById('gh-token').value.trim();
      const o=document.getElementById('gh-owner').value.trim();
      const r=document.getElementById('gh-repo').value.trim();
      if(t) localStorage.setItem('gh_token',t); if(o) localStorage.setItem('gh_owner',o); if(r) localStorage.setItem('gh_repo',r);
      document.getElementById('gh-token').value='';
      EXT.github.updateStatus(); showToast('GitHub config saved');
    },
    clearConfig() { ['gh_token','gh_owner','gh_repo'].forEach(k=>localStorage.removeItem(k)); EXT.github.updateStatus(); showToast('GitHub cleared'); },
    isConfigured() { const c=this.getConfig(); return !!(c.token&&c.owner&&c.repo); },
    updateStatus() {
      const el=document.getElementById('gh-status'); if(!el) return;
      const cfg=this.getConfig();
      el.className='int-status '+(this.isConfigured()?'ok':'off');
      el.textContent=this.isConfigured()?cfg.owner+'/'+cfg.repo:'Not configured';
    },
    async request(path) {
      const cfg=this.getConfig();
      const res=await fetch('https://api.github.com'+path,{headers:{'Authorization':'Bearer '+cfg.token,'Accept':'application/vnd.github.v3+json'}});
      if(!res.ok) throw new Error('GitHub API error '+res.status);
      return res.json();
    },
    async pullPRs() {
      if(!this.isConfigured()){ showToast('Configure GitHub first','error'); return; }
      const cfg=this.getConfig();
      document.getElementById('gh-prs-panel').innerHTML='<div style="padding:12px;color:var(--tx3);font-style:italic;font-size:13px">Fetching pull requests...</div>';
      try {
        const prs=await this.request(`/repos/${cfg.owner}/${cfg.repo}/pulls?state=open&per_page=20`);
        EXT.github.lastPRs=prs;
        EXT.github.renderPRs(prs);
        showToast(`Loaded ${prs.length} open PRs`);
      } catch(e){ showToast('GitHub error: '+e.message,'error'); }
    },
    async pullDeployments() {
      if(!this.isConfigured()){ showToast('Configure GitHub first','error'); return; }
      const cfg=this.getConfig();
      document.getElementById('gh-deploys-panel').innerHTML='<div style="padding:12px;color:var(--tx3);font-style:italic;font-size:13px">Fetching deployments...</div>';
      try {
        const deploys=await this.request(`/repos/${cfg.owner}/${cfg.repo}/deployments?per_page=10`);
        EXT.github.lastDeploys=deploys;
        EXT.github.renderDeployments(deploys);
        showToast(`Loaded ${deploys.length} deployments`);
      } catch(e){ showToast('GitHub error: '+e.message,'error'); }
    },
    async pullWorkflows() {
      if(!this.isConfigured()){ showToast('Configure GitHub first','error'); return; }
      const cfg=this.getConfig();
      try {
        const runs=await this.request(`/repos/${cfg.owner}/${cfg.repo}/actions/runs?per_page=10`);
        EXT.github.renderWorkflows(runs.workflow_runs||[]);
        showToast('CI/CD status loaded');
      } catch(e){ showToast('GitHub error: '+e.message,'error'); }
    },
    renderPRs(prs) {
      const p=document.getElementById('gh-prs-panel'); if(!p) return;
      if(!prs.length){ p.innerHTML='<div class="empty-state" style="padding:16px 0"><i class="ti ti-git-pull-request"></i><p>No open PRs.</p></div>'; return; }
      p.innerHTML=`<div style="overflow-x:auto"><table><thead><tr><th>#</th><th>Title</th><th>Author</th><th>Base</th><th>Reviews</th><th>Updated</th></tr></thead><tbody>${
        prs.map(pr=>`<tr>
          <td><a href="${pr.html_url}" target="_blank" style="color:var(--blue);text-decoration:none;font-weight:500">#${pr.number}</a></td>
          <td style="max-width:260px">${pr.title}</td>
          <td style="color:var(--tx2)">${pr.user?.login||'—'}</td>
          <td style="color:var(--tx2)">${pr.base?.ref||'—'}</td>
          <td style="color:var(--tx2)">${pr.requested_reviewers?.length||0} pending</td>
          <td style="color:var(--tx2);white-space:nowrap">${pr.updated_at?new Date(pr.updated_at).toLocaleDateString():'—'}</td>
        </tr>`).join('')
      }</tbody></table></div>`;
    },
    renderDeployments(deploys) {
      const p=document.getElementById('gh-deploys-panel'); if(!p) return;
      if(!deploys.length){ p.innerHTML='<div class="empty-state" style="padding:16px 0"><i class="ti ti-rocket"></i><p>No deployments.</p></div>'; return; }
      p.innerHTML=`<div style="overflow-x:auto"><table><thead><tr><th>Environment</th><th>Ref</th><th>Created</th><th>Description</th></tr></thead><tbody>${
        deploys.map(d=>`<tr>
          <td style="font-weight:500">${d.environment||'—'}</td>
          <td style="color:var(--tx2)">${d.ref||'—'}</td>
          <td style="color:var(--tx2);white-space:nowrap">${d.created_at?new Date(d.created_at).toLocaleDateString():'—'}</td>
          <td style="color:var(--tx2);font-size:12px">${d.description||'—'}</td>
        </tr>`).join('')
      }</tbody></table></div>`;
    },
    renderWorkflows(runs) {
      const p=document.getElementById('gh-workflows-panel'); if(!p) return;
      if(!runs.length){ p.innerHTML='<p style="color:var(--tx3);font-size:12px;padding:8px 0">No recent workflow runs.</p>'; return; }
      const STAT={'success':'green','failure':'red','in_progress':'blue','queued':'amber','cancelled':'gray'};
      p.innerHTML=`<div style="overflow-x:auto"><table><thead><tr><th>Workflow</th><th>Status</th><th>Branch</th><th>Triggered</th><th>Duration</th></tr></thead><tbody>${
        runs.slice(0,8).map(r=>{
          const dur=r.created_at&&r.updated_at?Math.round((new Date(r.updated_at)-new Date(r.created_at))/60000)+'m':'—';
          return `<tr>
            <td style="font-weight:500;max-width:200px">${r.name||r.workflow_id}</td>
            <td><span class="badge ${STAT[r.status]||'gray'}">${r.status} ${r.conclusion?'('+r.conclusion+')':''}</span></td>
            <td style="color:var(--tx2)">${r.head_branch||'—'}</td>
            <td style="color:var(--tx2);white-space:nowrap">${r.created_at?new Date(r.created_at).toLocaleDateString():'—'}</td>
            <td style="color:var(--tx2)">${dur}</td>
          </tr>`;
        }).join('')
      }</tbody></table></div>`;
    },
    buildAIContext() {
      let ctx='';
      if(this.lastPRs?.length){ ctx+=`\n\nGitHub Open PRs (${this.lastPRs.length}):\n`+this.lastPRs.slice(0,8).map(p=>`- #${p.number}: ${p.title} by ${p.user?.login} (${p.requested_reviewers?.length||0} reviewers pending)`).join('\n'); }
      return ctx;
    },
    lastPRs:null, lastDeploys:null
  },

  // ── Confluence ──────────────────────────────────────────────────────────────

  confluence: {
    getConfig() { return { baseUrl:localStorage.getItem('conf_url')||'', email:localStorage.getItem('conf_email')||'', token:localStorage.getItem('conf_token')||'', spaceKey:localStorage.getItem('conf_space')||'' }; },
    saveConfig() {
      const url=document.getElementById('conf-url').value.trim().replace(/\/$/,'');
      const email=document.getElementById('conf-email').value.trim();
      const token=document.getElementById('conf-token').value.trim();
      const space=document.getElementById('conf-space').value.trim().toUpperCase();
      if(url) localStorage.setItem('conf_url',url); if(email) localStorage.setItem('conf_email',email);
      if(token) localStorage.setItem('conf_token',token); if(space) localStorage.setItem('conf_space',space);
      document.getElementById('conf-token').value=''; EXT.confluence.updateStatus(); showToast('Confluence config saved');
    },
    clearConfig() { ['conf_url','conf_email','conf_token','conf_space'].forEach(k=>localStorage.removeItem(k)); EXT.confluence.updateStatus(); },
    isConfigured() { const c=this.getConfig(); return !!(c.baseUrl&&c.email&&c.token); },
    updateStatus() { const el=document.getElementById('conf-status'); if(!el) return; const cfg=this.getConfig(); el.className='int-status '+(this.isConfigured()?'ok':'off'); el.textContent=this.isConfigured()?(cfg.spaceKey||'Connected'):'Not configured'; },
    async request(path) {
      const cfg=this.getConfig(); const cred=btoa(cfg.email+':'+cfg.token);
      const res=await fetch(cfg.baseUrl+'/rest/api'+path,{headers:{'Authorization':'Basic '+cred,'Accept':'application/json'}});
      if(!res.ok) throw new Error('Confluence error '+res.status); return res.json();
    },
    async searchPages(query) {
      if(!this.isConfigured()){ showToast('Configure Confluence first','error'); return; }
      const cfg=this.getConfig();
      document.getElementById('conf-results-panel').innerHTML='<div style="padding:12px;color:var(--tx3);font-style:italic;font-size:13px">Searching...</div>';
      try {
        const spaceFilter=cfg.spaceKey?` AND space.key="${cfg.spaceKey}"`:'';
        const data=await this.request(`/content/search?cql=type=page AND title~"${query}"${spaceFilter}&limit=10&expand=space,version`);
        EXT.confluence.renderPages(data.results||[]);
        showToast(`Found ${(data.results||[]).length} pages`);
      } catch(e){ showToast('Confluence error: '+e.message,'error'); }
    },
    async fetchRecentPages() {
      if(!this.isConfigured()){ showToast('Configure Confluence first','error'); return; }
      const cfg=this.getConfig();
      const spaceFilter=cfg.spaceKey?`space.key="${cfg.spaceKey}" AND `:'';
      document.getElementById('conf-results-panel').innerHTML='<div style="padding:12px;color:var(--tx3);font-style:italic;font-size:13px">Loading recent pages...</div>';
      try {
        const data=await this.request(`/content/search?cql=${spaceFilter}type=page ORDER BY lastModified DESC&limit=10&expand=space,version`);
        EXT.confluence.renderPages(data.results||[]);
      } catch(e){ showToast('Confluence error: '+e.message,'error'); }
    },
    renderPages(pages) {
      const p=document.getElementById('conf-results-panel'); if(!p) return;
      if(!pages.length){ p.innerHTML='<div class="empty-state" style="padding:16px 0"><i class="ti ti-file-text"></i><p>No pages found.</p></div>'; return; }
      const cfg=this.getConfig();
      p.innerHTML=`<table><thead><tr><th>Title</th><th>Space</th><th>Version</th><th>Last Modified</th></tr></thead><tbody>${
        pages.map(pg=>`<tr>
          <td><a href="${cfg.baseUrl}/wiki${pg._links?.webui||'/'+pg.id}" target="_blank" style="color:var(--blue);text-decoration:none;font-weight:500">${pg.title}</a></td>
          <td style="color:var(--tx2)">${pg.space?.name||'—'}</td>
          <td style="color:var(--tx2)">${pg.version?.number||'—'}</td>
          <td style="color:var(--tx2);white-space:nowrap">${pg.version?.when?new Date(pg.version.when).toLocaleDateString():'—'}</td>
        </tr>`).join('')
      }</tbody></table>`;
    }
  },

  // ── Google Calendar ─────────────────────────────────────────────────────────

  gcal: {
    getConfig() { return { apiKey:localStorage.getItem('gcal_key')||'', calendarId:localStorage.getItem('gcal_id')||'primary' }; },
    saveConfig() {
      const key=document.getElementById('gcal-key').value.trim();
      const id=document.getElementById('gcal-id').value.trim();
      if(key) localStorage.setItem('gcal_key',key); if(id) localStorage.setItem('gcal_id',id||'primary');
      document.getElementById('gcal-key').value=''; EXT.gcal.updateStatus(); showToast('Google Calendar config saved');
    },
    clearConfig() { ['gcal_key','gcal_id'].forEach(k=>localStorage.removeItem(k)); EXT.gcal.updateStatus(); },
    isConfigured() { return !!this.getConfig().apiKey; },
    updateStatus() { const el=document.getElementById('gcal-status'); if(!el) return; el.className='int-status '+(this.isConfigured()?'ok':'off'); el.textContent=this.isConfigured()?'API key saved':'Not configured'; },
    async fetchEvents() {
      if(!this.isConfigured()){ showToast('Configure Google Calendar first','error'); return; }
      const cfg=this.getConfig();
      const now=new Date().toISOString(); const future=new Date(Date.now()+30*86400000).toISOString();
      document.getElementById('gcal-events-panel').innerHTML='<div style="padding:12px;color:var(--tx3);font-style:italic;font-size:13px">Loading events...</div>';
      try {
        const res=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events?key=${cfg.apiKey}&timeMin=${now}&timeMax=${future}&orderBy=startTime&singleEvents=true&maxResults=20`);
        if(!res.ok) throw new Error('Calendar API error '+res.status);
        const data=await res.json();
        EXT.gcal.lastEvents=data.items||[];
        EXT.gcal.renderEvents(data.items||[]);
        showToast(`Loaded ${(data.items||[]).length} upcoming events`);
      } catch(e){ showToast('Calendar error: '+e.message,'error'); }
    },
    renderEvents(events) {
      const p=document.getElementById('gcal-events-panel'); if(!p) return;
      if(!events.length){ p.innerHTML='<div class="empty-state" style="padding:16px 0"><i class="ti ti-calendar"></i><p>No upcoming events in next 30 days.</p></div>'; return; }
      p.innerHTML=`<table><thead><tr><th>Event</th><th>Date</th><th>Time</th><th>Location</th></tr></thead><tbody>${
        events.map(e=>{
          const start=e.start?.dateTime||e.start?.date;
          const d=start?new Date(start):null;
          return `<tr>
            <td style="font-weight:500;max-width:220px">${e.summary||'(No title)'}</td>
            <td style="color:var(--tx2);white-space:nowrap">${d?d.toLocaleDateString():'—'}</td>
            <td style="color:var(--tx2);white-space:nowrap">${e.start?.dateTime?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'All day'}</td>
            <td style="color:var(--tx2);font-size:12px">${e.location||'—'}</td>
          </tr>`;
        }).join('')
      }</tbody></table>`;
    },
    buildAIContext() {
      if(!this.lastEvents?.length) return '';
      return '\n\nUpcoming Calendar Events (30 days):\n'+this.lastEvents.slice(0,8).map(e=>{
        const d=e.start?.dateTime||e.start?.date; return `- ${e.summary||'(No title)'}: ${d?new Date(d).toLocaleDateString():'TBD'}`;
      }).join('\n');
    },
    lastEvents:null
  },

  // ── Microsoft Outlook / MS Graph ────────────────────────────────────────────

  outlook: {
    getConfig() { return { clientId:localStorage.getItem('ms_client_id')||'', tenantId:localStorage.getItem('ms_tenant_id')||'', token:localStorage.getItem('ms_token')||'' }; },
    saveConfig() {
      const cid=document.getElementById('ms-client-id').value.trim();
      const tid=document.getElementById('ms-tenant-id').value.trim();
      if(cid) localStorage.setItem('ms_client_id',cid); if(tid) localStorage.setItem('ms_tenant_id',tid);
      EXT.outlook.updateStatus(); showToast('Outlook config saved — use token auth to connect');
    },
    clearConfig() { ['ms_client_id','ms_tenant_id','ms_token'].forEach(k=>localStorage.removeItem(k)); EXT.outlook.updateStatus(); },
    setToken(token) { localStorage.setItem('ms_token',token); EXT.outlook.updateStatus(); },
    isConfigured() { return !!this.getConfig().token; },
    updateStatus() { const el=document.getElementById('outlook-status'); if(!el) return; el.className='int-status '+(this.isConfigured()?'ok':'off'); el.textContent=this.isConfigured()?'Token active':'Not connected'; },
    async fetchEvents() {
      const cfg=this.getConfig();
      if(!cfg.token){ showToast('Paste an MS Graph token to load Outlook events','error'); return; }
      const now=new Date().toISOString(); const future=new Date(Date.now()+30*86400000).toISOString();
      document.getElementById('outlook-events-panel').innerHTML='<div style="padding:12px;color:var(--tx3);font-style:italic;font-size:13px">Loading events...</div>';
      try {
        const res=await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${now}&endDateTime=${future}&$top=20&$orderby=start/dateTime`,{headers:{'Authorization':'Bearer '+cfg.token,'Accept':'application/json'}});
        if(!res.ok) throw new Error('MS Graph error '+res.status);
        const data=await res.json();
        EXT.outlook.lastEvents=data.value||[];
        EXT.outlook.renderEvents(data.value||[]);
        showToast(`Loaded ${(data.value||[]).length} Outlook events`);
      } catch(e){ showToast('Outlook error: '+e.message,'error'); }
    },
    renderEvents(events) {
      const p=document.getElementById('outlook-events-panel'); if(!p) return;
      if(!events.length){ p.innerHTML='<div class="empty-state" style="padding:16px 0"><i class="ti ti-brand-office"></i><p>No upcoming events.</p></div>'; return; }
      p.innerHTML=`<table><thead><tr><th>Subject</th><th>Date</th><th>Time</th><th>Organizer</th></tr></thead><tbody>${
        events.map(e=>{
          const d=e.start?.dateTime?new Date(e.start.dateTime):null;
          return `<tr>
            <td style="font-weight:500;max-width:220px">${e.subject||'(No subject)'}</td>
            <td style="color:var(--tx2);white-space:nowrap">${d?d.toLocaleDateString():'—'}</td>
            <td style="color:var(--tx2);white-space:nowrap">${d?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}</td>
            <td style="color:var(--tx2)">${e.organizer?.emailAddress?.name||'—'}</td>
          </tr>`;
        }).join('')
      }</tbody></table>`;
    },
    buildAIContext() {
      if(!this.lastEvents?.length) return '';
      return '\n\nOutlook Calendar (30 days):\n'+this.lastEvents.slice(0,8).map(e=>{
        const d=e.start?.dateTime?new Date(e.start.dateTime).toLocaleDateString():'TBD';
        return `- ${e.subject||'(No subject)'}: ${d}`;
      }).join('\n');
    },
    lastEvents:null
  },

  // ── Aggregate AI context from all integrations ──────────────────────────────

  buildAllAIContext() {
    return [
      typeof JIRA!=='undefined'?JIRA.buildAIContext():'',
      this.github.buildAIContext(),
      this.gcal.buildAIContext(),
      this.outlook.buildAIContext()
    ].join('');
  },

  // ── Init ────────────────────────────────────────────────────────────────────

  init() {
    this.github.updateStatus();
    this.confluence.updateStatus();
    this.gcal.updateStatus();
    this.outlook.updateStatus();
    const ghCfg=this.github.getConfig();
    if(ghCfg.owner) document.getElementById('gh-owner').value=ghCfg.owner;
    if(ghCfg.repo)  document.getElementById('gh-repo').value=ghCfg.repo;
    const confCfg=this.confluence.getConfig();
    if(confCfg.baseUrl)  document.getElementById('conf-url').value=confCfg.baseUrl;
    if(confCfg.email)    document.getElementById('conf-email').value=confCfg.email;
    if(confCfg.spaceKey) document.getElementById('conf-space').value=confCfg.spaceKey;
    const gcalCfg=this.gcal.getConfig();
    if(gcalCfg.calendarId) document.getElementById('gcal-id').value=gcalCfg.calendarId;
    const msCfg=this.outlook.getConfig();
    if(msCfg.clientId) document.getElementById('ms-client-id').value=msCfg.clientId;
    if(msCfg.tenantId) document.getElementById('ms-tenant-id').value=msCfg.tenantId;
  }
};

window.addEventListener('DOMContentLoaded', () => EXT.init());
