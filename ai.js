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

// ── PDF Export ────────────────────────────────────────────────────────────────

function getPdf() {
  if (typeof window.jspdf === 'undefined') { showToast('jsPDF not loaded yet — try again in a moment', 'error'); return null; }
  return new window.jspdf.jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
}

// Shared helpers
function pdfHeader(doc, title, subtitle) {
  // Blue header bar
  doc.setFillColor(24, 95, 165);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13); doc.setFont('helvetica','bold');
  doc.text('EDM Dashboard', 12, 9);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), 12, 16);
  // Title block
  doc.setTextColor(26, 26, 24);
  doc.setFontSize(18); doc.setFont('helvetica','bold');
  doc.text(title, 12, 34);
  if (subtitle) {
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.setTextColor(107, 107, 103);
    doc.text(subtitle, 12, 41);
  }
  // Divider
  doc.setDrawColor(236, 234, 228); doc.setLineWidth(0.4);
  doc.line(12, 45, 198, 45);
  return 50; // return Y cursor
}

function pdfFooter(doc, pageNum, totalPages) {
  const y = 287;
  doc.setDrawColor(236, 234, 228); doc.setLineWidth(0.3);
  doc.line(12, y, 198, y);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.setTextColor(158, 158, 154);
  doc.text('EDM Dashboard — Confidential', 12, y + 5);
  doc.text(`Page ${pageNum}${totalPages ? ' of ' + totalPages : ''}`, 198, y + 5, { align:'right' });
}

function pdfSectionLabel(doc, label, y) {
  doc.setFillColor(245, 245, 243);
  doc.rect(12, y, 186, 7, 'F');
  doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.setTextColor(107, 107, 103);
  doc.text(label.toUpperCase(), 15, y + 5);
  return y + 10;
}

function pdfRagDot(doc, rag, x, y, r = 2.5) {
  const colors = { red:[163,45,45], amber:[133,79,11], green:[59,109,17], blue:[24,95,165] };
  const c = colors[rag] || colors.blue;
  doc.setFillColor(...c); doc.circle(x, y, r, 'F');
}

function pdfBadge(doc, text, rag, x, y) {
  const colors = { red:[163,45,45], amber:[133,79,11], green:[59,109,17], blue:[24,95,165], gray:[95,94,90] };
  const bgs    = { red:[252,235,235], amber:[250,238,218], green:[234,243,222], blue:[230,241,251], gray:[241,239,232] };
  const c = colors[rag]||colors.gray; const bg = bgs[rag]||bgs.gray;
  doc.setFontSize(7.5); doc.setFont('helvetica','bold');
  const w = doc.getTextWidth(text) + 6;
  doc.setFillColor(...bg); doc.roundedRect(x, y-3.5, w, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(...c); doc.text(text, x+3, y);
  return x + w + 2;
}

function ragFromStatus(s) {
  if(s==='On Track'||s==='Resolved'||s==='Approved'||s==='green') return 'green';
  if(s==='At Risk'||s==='Monitoring'||s==='amber'||s==='Pending') return 'amber';
  if(s==='Critical'||s==='Open'||s==='red') return 'red';
  return 'blue';
}

// ── ONE-PAGE EXECUTIVE SUMMARY ────────────────────────────────────────────────

function exportPdfSummary(panelId) {
  const panel   = document.getElementById(panelId);
  const textEl  = document.getElementById(panelId.replace('-panel','-text'));
  const aiText  = textEl?.textContent || '';
  if (!aiText || aiText.length < 20) { showToast('Generate a report first', 'error'); return; }
  const title   = panel.getAttribute('data-title')   || 'Executive Summary';
  const project = panel.getAttribute('data-project') || 'Portfolio';
  const audience= panel.getAttribute('data-audience')|| 'Leadership';

  const doc = getPdf(); if (!doc) return;
  let y = pdfHeader(doc, title, project + '  |  Audience: ' + audience);

  // ── Portfolio stat strip
  const projects = state.projects;
  const statItems = [
    { label:'Total Projects', val:projects.length,                                   color:[24,95,165] },
    { label:'On Track',       val:projects.filter(p=>p.status==='On Track').length,  color:[59,109,17] },
    { label:'At Risk',        val:projects.filter(p=>p.status==='At Risk').length,   color:[133,79,11] },
    { label:'Critical',       val:projects.filter(p=>p.status==='Critical').length,  color:[163,45,45] },
    { label:'Open Risks',     val:state.risks.filter(r=>r.status==='Open').length,   color:[133,79,11] },
    { label:'Escalations',    val:state.escalations.filter(e=>e.status==='Open').length, color:[163,45,45] }
  ];
  const colW = 31;
  statItems.forEach((s, i) => {
    const x = 12 + i * colW;
    doc.setFillColor(245, 245, 243);
    doc.roundedRect(x, y, colW - 2, 18, 2, 2, 'F');
    doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.setTextColor(...s.color);
    doc.text(String(s.val), x + (colW-2)/2, y + 11, { align:'center' });
    doc.setFontSize(7); doc.setFont('helvetica','normal');
    doc.setTextColor(107, 107, 103);
    doc.text(s.label, x + (colW-2)/2, y + 16.5, { align:'center' });
  });
  y += 23;

  // ── RAG project list (compact)
  y = pdfSectionLabel(doc, 'Portfolio RAG Status', y);
  const showProjects = projects.slice(0, 8);
  showProjects.forEach(p => {
    pdfRagDot(doc, ragFromStatus(p.status), 16, y + 1);
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,24);
    doc.text(p.name, 22, y + 2.5);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(107,107,103);
    doc.text(p.owner + '  |  ' + p.progress + '%  |  Due ' + p.due, 22, y + 7);
    const barX = 140; const barW = 55; const barH = 2.5;
    doc.setFillColor(236,234,228); doc.roundedRect(barX, y+1, barW, barH, 1, 1, 'F');
    const fillColors = {'On Track':[29,158,117],'At Risk':[239,159,39],'Critical':[226,75,74],'Completed':[55,138,221]};
    const fc = fillColors[p.status]||[136,136,136];
    doc.setFillColor(...fc); doc.roundedRect(barX, y+1, barW*(p.progress/100), barH, 1, 1, 'F');
    y += 11;
    if(y > 240) return;
  });
  y += 3;

  // ── AI Summary text (trimmed to fit)
  y = pdfSectionLabel(doc, 'AI Summary', y);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(26,26,24);
  const summaryLines = doc.splitTextToSize(aiText.slice(0, 800) + (aiText.length > 800 ? '...' : ''), 186);
  const maxLines = Math.min(summaryLines.length, Math.floor((255 - y) / 5));
  doc.text(summaryLines.slice(0, maxLines), 12, y);
  y += maxLines * 5 + 4;

  // ── Top risks + escalations side by side if space
  if (y < 230) {
    const risks = state.risks.filter(r=>r.status!=='Closed').sort((a,b)=>
      (({High:3,Medium:2,Low:1}[b.probability]||0)*({High:3,Medium:2,Low:1}[b.impact]||0)) -
      (({High:3,Medium:2,Low:1}[a.probability]||0)*({High:3,Medium:2,Low:1}[a.impact]||0))
    ).slice(0,3);
    const escs = state.escalations.filter(e=>e.status!=='Resolved').slice(0,3);

    if (risks.length) {
      y = pdfSectionLabel(doc, 'Top Risks', y);
      risks.forEach(r => {
        pdfRagDot(doc, r.rag||'amber', 16, y+1, 2);
        doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,24);
        doc.text(r.title.slice(0,60), 21, y+2.5);
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(107,107,103);
        doc.text(r.project + '  |  ' + r.probability + ' prob / ' + r.impact + ' impact  |  ' + r.owner, 21, y+7);
        y += 10;
      });
      y += 2;
    }
    if (escs.length && y < 255) {
      y = pdfSectionLabel(doc, 'Open Escalations', y);
      escs.forEach(e => {
        pdfRagDot(doc, ragFromStatus(e.severity==='Critical'?'red':'amber'), 16, y+1, 2);
        doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,24);
        doc.text(e.issue.slice(0,60), 21, y+2.5);
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(107,107,103);
        doc.text(e.project + '  |  ' + e.owner + '  |  ' + e.days + ' days open', 21, y+7);
        y += 10;
      });
    }
  }

  pdfFooter(doc, 1, 1);
  doc.save('EDM-Summary-' + title.replace(/[^a-z0-9]/gi,'_').slice(0,30) + '.pdf');
  showToast('Executive Summary PDF saved');
}

// ── FULL REPORT PDF ───────────────────────────────────────────────────────────

function exportPdfFull(panelId) {
  const panel   = document.getElementById(panelId);
  const textEl  = document.getElementById(panelId.replace('-panel','-text'));
  const aiText  = textEl?.textContent || '';
  if (!aiText || aiText.length < 20) { showToast('Generate a report first', 'error'); return; }
  const title   = panel.getAttribute('data-title')   || 'Full Report';
  const project = panel.getAttribute('data-project') || 'Portfolio';
  const audience= panel.getAttribute('data-audience')|| 'Management';

  const doc = getPdf(); if (!doc) return;
  let pageNum = 1;
  let y = pdfHeader(doc, title, project + '  |  Audience: ' + audience);

  const addPageIfNeeded = (needed = 20) => {
    if (y + needed > 275) {
      pdfFooter(doc, pageNum);
      doc.addPage(); pageNum++;
      doc.setFillColor(24,95,165); doc.rect(0,0,210,8,'F');
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(255,255,255);
      doc.text(title + ' (continued)', 12, 6);
      y = 16;
    }
  };

  // ── Portfolio snapshot table
  y = pdfSectionLabel(doc, 'Portfolio Snapshot', y);
  const headers = ['Project','Owner','Status','Progress','Due'];
  const colWidths = [62, 28, 22, 22, 24];
  const tableX = 12;
  // Header row
  doc.setFillColor(24,95,165);
  doc.rect(tableX, y, 186, 7, 'F');
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
  let cx = tableX + 2;
  headers.forEach((h,i)=>{ doc.text(h, cx, y+5); cx+=colWidths[i]; });
  y += 7;
  state.projects.forEach((p,idx) => {
    addPageIfNeeded(8);
    doc.setFillColor(idx%2===0?255:245,idx%2===0?255:245,idx%2===0?255:243);
    doc.rect(tableX, y, 186, 7, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(26,26,24);
    cx = tableX + 2;
    doc.text(p.name.slice(0,30), cx, y+5); cx+=colWidths[0];
    doc.text(p.owner.slice(0,14), cx, y+5); cx+=colWidths[1];
    pdfBadge(doc, p.status, ragFromStatus(p.status), cx, y+5); cx+=colWidths[2];
    doc.text(p.progress+'%', cx, y+5); cx+=colWidths[3];
    doc.text(p.due, cx, y+5);
    y += 7;
  });
  y += 6;

  // ── AI Report content — parse into sections
  addPageIfNeeded(20);
  y = pdfSectionLabel(doc, 'Report', y);
  const KEYS = ['overall','health','status','accomplish','complet','upcoming','milestone','risk','block','next step','action','recommend','summary','decision'];
  const lines = aiText.split('\n').map(l=>l.trim()).filter(l=>l.length);
  const sections = []; let cur = null;
  for (const line of lines) {
    const low = line.toLowerCase();
    const isH = KEYS.some(k=>low.includes(k)) && line.length < 80;
    if (isH && cur) sections.push(cur);
    if (isH) cur = { title:line, bullets:[] };
    else if (cur) cur.bullets.push(line);
    else { cur = { title:'Overview', bullets:[] }; cur.bullets.push(line); }
  }
  if (cur && cur.bullets.length) sections.push(cur);
  const content = sections.length ? sections : [{ title:'Report Content', bullets:lines }];

  content.forEach(sec => {
    addPageIfNeeded(14);
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(24,95,165);
    doc.text(sec.title, 12, y); y += 6;
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(26,26,24);
    sec.bullets.forEach(b => {
      addPageIfNeeded(8);
      const wrapped = doc.splitTextToSize('• ' + b, 182);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 5 + 1;
    });
    y += 4;
  });

  // ── Risk register section
  addPageIfNeeded(20);
  y = pdfSectionLabel(doc, 'Risk Register', y);
  const openRisks = state.risks.filter(r=>r.status!=='Closed');
  if (openRisks.length) {
    openRisks.forEach(r => {
      addPageIfNeeded(16);
      pdfRagDot(doc, r.rag||'amber', 16, y+2);
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,24);
      doc.text(r.title.slice(0,70), 22, y+3);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(107,107,103);
      doc.text(r.project+'  |  Prob: '+r.probability+'  |  Impact: '+r.impact+'  |  Owner: '+r.owner, 22, y+8);
      if (r.mitigation) {
        const mLines = doc.splitTextToSize('Mitigation: '+r.mitigation, 172);
        doc.setTextColor(26,26,24); doc.setFontSize(8);
        doc.text(mLines, 22, y+13);
        y += mLines.length * 4.5 + 14;
      } else { y += 13; }
      doc.setDrawColor(236,234,228); doc.setLineWidth(0.2);
      doc.line(22, y, 198, y); y += 3;
    });
  } else {
    doc.setFontSize(9); doc.setTextColor(158,158,154); doc.text('No open risks.', 12, y); y += 8;
  }

  // ── Open escalations section
  addPageIfNeeded(20);
  y = pdfSectionLabel(doc, 'Open Escalations', y);
  const openEsc = state.escalations.filter(e=>e.status!=='Resolved');
  if (openEsc.length) {
    openEsc.forEach(e => {
      addPageIfNeeded(13);
      const rc = e.severity==='Critical'?'red':'amber';
      pdfRagDot(doc, rc, 16, y+2, 2);
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,24);
      doc.text(e.issue.slice(0,70), 21, y+3);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(107,107,103);
      doc.text(e.project+'  |  '+e.owner+'  |  '+e.days+' days open  |  '+e.status, 21, y+8);
      y += 12;
    });
  } else {
    doc.setFontSize(9); doc.setTextColor(158,158,154); doc.text('No open escalations.', 12, y); y += 8;
  }

  // ── Decision log (approved/pending)
  const keyDecs = state.decisions.filter(d=>d.status==='Pending'||d.status==='Approved').slice(0,5);
  if (keyDecs.length) {
    addPageIfNeeded(20);
    y = pdfSectionLabel(doc, 'Key Decisions', y);
    keyDecs.forEach(d => {
      addPageIfNeeded(14);
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(26,26,24);
      doc.text(d.title.slice(0,70), 12, y+3);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(107,107,103);
      doc.text(d.project+'  |  '+d.owner+'  |  '+d.date, 12, y+8);
      const ratLines = doc.splitTextToSize('Rationale: '+d.rationale, 186);
      doc.setTextColor(26,26,24); doc.setFontSize(8);
      doc.text(ratLines.slice(0,2), 12, y+13);
      y += 14 + Math.min(ratLines.length,2)*4;
    });
  }

  pdfFooter(doc, pageNum);
  doc.save('EDM-Report-' + title.replace(/[^a-z0-9]/gi,'_').slice(0,35) + '.pdf');
  showToast('Full Report PDF saved');
}

// ── Unified PDF picker ────────────────────────────────────────────────────────

function exportPdf(panelId) {
  // Show a quick inline choice
  const panel = document.getElementById(panelId);
  const existing = panel.querySelector('.pdf-choice');
  if (existing) { existing.remove(); return; }
  const div = document.createElement('div');
  div.className = 'pdf-choice';
  div.style.cssText = 'display:flex;gap:8px;margin-top:8px;padding:10px 12px;background:var(--bg3);border-radius:var(--rmd);align-items:center;flex-wrap:wrap';
  div.innerHTML = `<span style="font-size:12px;color:var(--tx2);font-weight:500">PDF format:</span>
    <button class="btn small primary" onclick="exportPdfSummary('${panelId}');this.closest('.pdf-choice').remove()"><i class="ti ti-file-description"></i> One-page Summary</button>
    <button class="btn small" onclick="exportPdfFull('${panelId}');this.closest('.pdf-choice').remove()"><i class="ti ti-file-text"></i> Full Report</button>
    <button class="btn small" onclick="this.closest('.pdf-choice').remove()">Cancel</button>`;
  panel.querySelector('.ai-output-actions').after(div);
}

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
