// ─── AI CONFIG ────────────────────────────────────────────────────────────────

const AI_PRESETS = {
  openai:     {url:'https://api.openai.com/v1',      model:'gpt-4o'},
  anthropic:  {url:'https://api.anthropic.com/v1',   model:'claude-sonnet-4-20250514'},
  ollama:     {url:'http://localhost:11434/v1',       model:'llama3'},
  groq:       {url:'https://api.groq.com/openai/v1', model:'llama3-8b-8192'},
  openrouter: {url:'https://openrouter.ai/api/v1',   model:'openai/gpt-4o'}
};

function getAIConfig() {
  return {
    url:   localStorage.getItem('edm_ai_url')   || '',
    key:   localStorage.getItem('edm_ai_key')   || '',
    model: localStorage.getItem('edm_ai_model') || ''
  };
}
function saveAIConfig() {
  const url=document.getElementById('ai-url').value.trim();
  const key=document.getElementById('ai-key').value.trim();
  const model=document.getElementById('ai-model').value.trim();
  if(url)   localStorage.setItem('edm_ai_url',url);
  if(key)   localStorage.setItem('edm_ai_key',key);
  if(model) localStorage.setItem('edm_ai_model',model);
  document.getElementById('ai-key').value='';
  updateAIStatus(); showToast('AI config saved');
}
function clearAIConfig() {
  ['edm_ai_url','edm_ai_key','edm_ai_model'].forEach(k=>localStorage.removeItem(k));
  ['ai-url','ai-key','ai-model'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  updateAIStatus(); showToast('AI config cleared');
}
function applyPreset(key) {
  const p=AI_PRESETS[key]; if(!p) return;
  document.getElementById('ai-url').value=p.url;
  document.getElementById('ai-model').value=p.model;
  document.getElementById('ai-key').placeholder=key==='ollama'?'No key needed':'Paste API key...';
}
function updateAIStatus() {
  const cfg=getAIConfig(); const el=document.getElementById('ai-status');
  if(cfg.url&&cfg.model){
    el.className='ai-status ok';
    el.innerHTML='<span class="ai-dot"></span>'+cfg.url.replace(/https?:\/\//,'').split('/')[0]+' / '+cfg.model;
  } else {
    el.className='ai-status off';
    el.innerHTML='<span class="ai-dot"></span>Not configured';
  }
}

async function callAI(prompt, systemOverride) {
  const cfg=getAIConfig();
  if(!cfg.url||!cfg.model){ showToast('Configure AI endpoint first','error'); return null; }
  const system = systemOverride || 'You are an assistant for an Enterprise Delivery Manager. Write clear, direct, professional output. Plain text only. No markdown, no asterisks, no bullet symbols.';
  const endpoint=cfg.url.replace(/\/$/,'')+'/chat/completions';
  const headers={'Content-Type':'application/json'};
  if(cfg.key) headers['Authorization']='Bearer '+cfg.key;
  try {
    const res=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({
      model:cfg.model, max_tokens:1500,
      messages:[{role:'system',content:system},{role:'user',content:prompt}]
    })});
    const data=await res.json();
    if(data.error) throw new Error(data.error.message||JSON.stringify(data.error));
    return data.choices?.[0]?.message?.content||'No response.';
  } catch(err){ showToast('AI error: '+err.message,'error'); return null; }
}

// ── Shared AI output helpers ──────────────────────────────────────────────────

function setAILoading(panelId, textId, msg) {
  document.getElementById(panelId).style.display='block';
  const el=document.getElementById(textId); el.className='ai-output-text loading'; el.textContent=msg;
}
function showAIOutput(panelId, textId, text, title, projectName, audience) {
  const panel=document.getElementById(panelId); panel.style.display='block';
  const el=document.getElementById(textId); el.className='ai-output-text'; el.textContent=text;
  if(title)       panel.setAttribute('data-title',title);
  if(projectName) panel.setAttribute('data-project',projectName);
  if(audience)    panel.setAttribute('data-audience',audience);
  panel.setAttribute('data-report',text);
}
function copyOutput(textId) {
  navigator.clipboard.writeText(document.getElementById(textId).textContent).then(()=>showToast('Copied'));
}

// ── PowerPoint export ─────────────────────────────────────────────────────────

function exportToPptx(panelId) {
  if(typeof PptxGenJS==='undefined'){ showToast('PptxGenJS not loaded','error'); return; }
  const panel   = document.getElementById(panelId);
  const textId  = panelId.replace('-panel','-text');
  const text    = document.getElementById(textId)?.textContent || '';
  const title   = panel.getAttribute('data-title')   || 'EDM Report';
  const project = panel.getAttribute('data-project') || 'Portfolio';
  const audience= panel.getAttribute('data-audience')|| 'Management';
  if(!text||text.length<20){ showToast('Generate a report first','error'); return; }

  const pptx=new PptxGenJS(); pptx.layout='LAYOUT_WIDE';
  const BL='185FA5',DK='1a1a18',GR='6b6b67',WH='FFFFFF',LT='F5F5F3';

  // Title slide
  const s1=pptx.addSlide(); s1.background={color:BL};
  s1.addText('EDM Dashboard',{x:0.5,y:0.4,w:12,h:0.5,fontSize:13,color:WH,transparency:30});
  s1.addText(title,{x:0.5,y:1.2,w:12,h:1.4,fontSize:34,bold:true,color:WH,wrap:true});
  s1.addText(project,{x:0.5,y:2.7,w:12,h:0.5,fontSize:17,color:WH,transparency:20});
  s1.addText('Audience: '+audience,{x:0.5,y:3.3,w:12,h:0.4,fontSize:13,color:WH,transparency:30});
  s1.addText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),{x:0.5,y:6.8,w:12,h:0.4,fontSize:11,color:WH,transparency:40});

  // Parse sections
  const lines=text.split('\n').map(l=>l.trim()).filter(l=>l.length);
  const KEYS=['overall','health','status','accomplish','complet','upcoming','milestone','risk','block','next step','action','recommend','summary','decision'];
  const sections=[]; let cur=null;
  for(const line of lines){
    const low=line.toLowerCase();
    const isH=KEYS.some(k=>low.includes(k))&&line.length<80;
    if(isH&&cur) sections.push(cur);
    if(isH) cur={title:line,bullets:[]};
    else if(cur) cur.bullets.push(line);
    else { cur={title:'Overview',bullets:[]}; cur.bullets.push(line); }
  }
  if(cur&&cur.bullets.length) sections.push(cur);
  const content=sections.length?sections:chunkLines(lines,6).map((c,i)=>({title:i===0?'Report':'Continued',bullets:c}));

  content.forEach((sec,idx)=>{
    const sl=pptx.addSlide(); sl.background={color:WH};
    sl.addShape(pptx.ShapeType.rect,{x:0,y:0,w:0.07,h:'100%',fill:{color:BL}});
    sl.addShape(pptx.ShapeType.rect,{x:0.07,y:0,w:'100%',h:0.82,fill:{color:LT}});
    sl.addText(sec.title,{x:0.28,y:0.17,w:12,h:0.5,fontSize:19,bold:true,color:DK});
    sl.addShape(pptx.ShapeType.rect,{x:0,y:7.1,w:'100%',h:0.4,fill:{color:LT}});
    sl.addText(title+' | '+new Date().toLocaleDateString(),{x:0.28,y:7.15,w:8,h:0.3,fontSize:9,color:GR});
    sl.addText((idx+2)+'/'+(content.length+2),{x:11.5,y:7.15,w:1,h:0.3,fontSize:9,color:GR,align:'right'});
    sec.bullets.slice(0,8).forEach((b,bi)=>{
      sl.addShape(pptx.ShapeType.ellipse,{x:0.32,y:1.12+bi*0.7,w:0.1,h:0.1,fill:{color:BL}});
      sl.addText(b,{x:0.55,y:1.02+bi*0.7,w:12,h:0.58,fontSize:12,color:DK,wrap:true});
    });
  });

  // Portfolio snapshot
  const snap=pptx.addSlide(); snap.background={color:WH};
  snap.addShape(pptx.ShapeType.rect,{x:0,y:0,w:0.07,h:'100%',fill:{color:BL}});
  snap.addShape(pptx.ShapeType.rect,{x:0.07,y:0,w:'100%',h:0.82,fill:{color:LT}});
  snap.addText('Portfolio Snapshot',{x:0.28,y:0.17,w:12,h:0.5,fontSize:19,bold:true,color:DK});
  const stats=[
    {l:'Total',v:state.projects.length,c:'185FA5'},
    {l:'On Track',v:state.projects.filter(p=>p.status==='On Track').length,c:'3B6D11'},
    {l:'At Risk',v:state.projects.filter(p=>p.status==='At Risk').length,c:'854F0B'},
    {l:'Critical',v:state.projects.filter(p=>p.status==='Critical').length,c:'A32D2D'},
    {l:'Open Risks',v:state.risks.filter(r=>r.status==='Open').length,c:'854F0B'},
    {l:'Escalations',v:state.escalations.filter(e=>e.status==='Open').length,c:'A32D2D'}
  ];
  stats.forEach((s,i)=>{
    const x=0.3+i*2.15;
    snap.addShape(pptx.ShapeType.rect,{x,y:1.05,w:1.95,h:1.5,fill:{color:LT},line:{color:'E0DED8',width:0.5}});
    snap.addText(String(s.v),{x,y:1.18,w:1.95,h:0.8,fontSize:34,bold:true,color:s.c,align:'center'});
    snap.addText(s.l,{x,y:2.0,w:1.95,h:0.4,fontSize:11,color:GR,align:'center'});
  });
  const rows=[['Project','Owner','Status','Progress','Due'],...state.projects.slice(0,5).map(p=>[p.name,p.owner,p.status,p.progress+'%',p.due])];
  snap.addTable(rows,{x:0.28,y:2.9,w:12.8,fontSize:10,border:{type:'solid',color:'E0DED8',pt:0.5},fill:{color:WH},colW:[4,1.8,1.5,1.2,1.5],rowH:0.36});

  // Closing
  const last=pptx.addSlide(); last.background={color:BL};
  last.addText('Thank You',{x:0.5,y:2.5,w:12,h:1,fontSize:42,bold:true,color:WH,align:'center'});
  last.addText('Questions & Discussion',{x:0.5,y:3.7,w:12,h:0.6,fontSize:19,color:WH,align:'center',transparency:20});
  last.addText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),{x:0.5,y:6.8,w:12,h:0.4,fontSize:11,color:WH,transparency:40,align:'center'});

  pptx.writeFile({fileName:'EDM-'+title.replace(/[^a-z0-9]/gi,'_').slice(0,40)+'.pptx'})
    .then(()=>showToast('PowerPoint saved'))
    .catch(e=>showToast('PPTX error: '+e.message,'error'));
}

function chunkLines(lines,size){ const c=[]; for(let i=0;i<lines.length;i+=size) c.push(lines.slice(i,i+size)); return c; }

// ── Send helpers ──────────────────────────────────────────────────────────────

async function sendToSlack(text) {
  const wh=localStorage.getItem('int_slack_webhook');
  if(!wh){ showToast('Configure Slack webhook in Integrations','error'); return; }
  try {
    await fetch(wh,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
    showToast('Sent to Slack');
  } catch(e){ showToast('Slack error: '+e.message,'error'); }
}
async function sendToTeams(text) {
  const wh=localStorage.getItem('int_teams_webhook');
  if(!wh){ showToast('Configure Teams webhook in Integrations','error'); return; }
  try {
    await fetch(wh,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
    showToast('Sent to Teams');
  } catch(e){ showToast('Teams error: '+e.message,'error'); }
}
function sendReportSlack(panelId){ const t=document.getElementById(panelId.replace('-panel','-text'))?.textContent; if(!t||t.length<10){ showToast('Generate a report first','error'); return; } sendToSlack(t); }
function sendReportTeams(panelId){ const t=document.getElementById(panelId.replace('-panel','-text'))?.textContent; if(!t||t.length<10){ showToast('Generate a report first','error'); return; } sendToTeams(t); }
function emailReport(panelId){ const t=document.getElementById(panelId.replace('-panel','-text'))?.textContent; if(!t||t.length<10){ showToast('Generate a report first','error'); return; } const sub=document.getElementById(panelId).getAttribute('data-title')||'EDM Report'; window.location.href='mailto:?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(t); }
