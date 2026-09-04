/* ============================================================
   Aaru AI — frontend app (Aaru-style)
   ============================================================ */
'use strict';

/* ---------------- icons ---------------- */
const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS = {
  menu:   I('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  home:   I('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>'),
  folder: I('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>'),
  code:   I('<path d="m8 8-5 4 5 4"/><path d="m16 8 5 4-5 4"/><path d="m13 4-2 16"/>'),
  image:  I('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5 19 5.5-5.5 3 3L17 13l2.5 2.5"/>'),
  video:  I('<rect x="2" y="6" width="13" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3"/>'),
  mic:    I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>'),
  music:  I('<path d="M9 18V6l11-2v11"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15" r="2.5"/>'),
  board:  I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4"/><path d="M8 20h8"/>'),
  globe:  I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>'),
  file:   I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/>'),
  zap:    I('<path d="M13 3 4 14h7l-1 7 9-11h-7Z"/>'),
  settings:I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  plus:   I('<path d="M12 5v14M5 12h14"/>'),
  send:   I('<path d="m5 12 14-8-4 16-3.5-6.5Z"/><path d="m11.5 13.5 3-3"/>'),
  x:      I('<path d="M18 6 6 18M6 6l12 12"/>'),
  paperclip:I('<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.5 17a1.7 1.7 0 0 1-2.4-2.4L15 7"/>'),
  web:    I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>'),
  brain:  I('<path d="M9.5 2.5A3 3 0 0 0 6 5.5 3.5 3.5 0 0 0 3 9a3.5 3.5 0 0 0 .5 6.5A3.5 3.5 0 0 0 6.5 19a3 3 0 0 0 3 2.5c1 0 2-.5 2.5-1.5V4c-.5-1-1.5-1.5-2.5-1.5Z"/><path d="M14.5 2.5A3 3 0 0 1 18 5.5a3.5 3.5 0 0 1 3 3.5 3.5 3.5 0 0 1-.5 6.5 3.5 3.5 0 0 1-3 3.5 3 3 0 0 1-3 2.5c-1 0-2-.5-2.5-1.5V4c.5-1 1.5-1.5 2.5-1.5Z"/>'),
  record: I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>'),
  copy:   I('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  refresh:I('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>'),
  speaker:I('<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/>'),
  trash:  I('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'),
  sparkle:I('<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/>'),
  bulb:   I('<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1.3 1.5 1.5 2.5h5c.2-1 .7-1.8 1.5-2.5A6 6 0 0 0 12 3Z"/>'),
  scan:   I('<path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M3 12h18"/>'),
  pen:    I('<path d="m17 3 4 4L8 20l-5 1 1-5Z"/>'),
  grid:   I('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  chat:   I('<path d="M21 12a8 8 0 0 1-8 8H4l2.2-2.9A8 8 0 1 1 21 12Z"/>'),
  stop:   I('<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>'),
  bot:    I('<rect x="4" y="8" width="16" height="12" rx="3"/><circle cx="9" cy="14" r="1.4"/><circle cx="15" cy="14" r="1.4"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/>'),
};

/* ---------------- static data ---------------- */
const TOOLS = [
  { id:'code',   name:'Code',      tag:'Build anything',  color:'#4f8ff7', icon:'code',  persona:'You are a senior software engineer. Write clean, working, production-quality code with explanations. Always provide runnable code in fenced blocks.' },
  { id:'image',  name:'Image',     tag:'Create visuals',  color:'#34d399', icon:'image', persona:'You are a world-class AI image prompt engineer. When the user asks for an image, give them a detailed, vivid, well-structured generation prompt they can use.' },
  { id:'video',  name:'Video',     tag:'Generate videos', color:'#f87171', icon:'video', persona:'You are a video director and storyboard expert. Help with scripts, shot lists, storyboards, and video generation prompts (e.g. Kling / Veo / Runway style prompts).' },
  { id:'voice',  name:'Voice',     tag:'Text to speech',  color:'#a78bfa', icon:'mic',   persona:'You are a voice-over scriptwriter. Write natural, pacing-aware scripts for narration, song lyrics, or voice-overs with direction for emphasis.' },
  { id:'music',  name:'Music',     tag:'Create songs',    color:'#fb923c', icon:'music', persona:'You are a music producer and songwriter. Write lyrics, chord progressions, and arrangement notes. Keep lines singable.' },
  { id:'ppt',    name:'PPT',       tag:'Present ideas',   color:'#facc15', icon:'board', persona:'You are a presentation designer. Produce slide-by-slide outlines in markdown (Slide 1: title …), with talking points and visual ideas per slide.' },
  { id:'webapp', name:'Web/App',   tag:'Build & deploy',  color:'#22d3ee', icon:'globe', persona:'You are a full-stack engineer. Build complete, self-contained web apps (single HTML file with CSS+JS, or React JSX) that run immediately when saved. Provide the full code in fenced blocks: put JSX apps in a ```jsx block and plain pages in a ```html block.' },
  { id:'more',   name:'More',      tag:'All tools',       color:'#94a3b8', icon:'grid',  persona:null },
];
const NAV = {
  MAIN: [ {id:'home', label:'Home', icon:'home'}, {id:'projects', label:'Projects', icon:'folder'}, {id:'workspace', label:'Workspace', icon:'grid'} ],
  'AI TOOLS': [
    {id:'code', label:'Code Editor', icon:'code'}, {id:'image', label:'Images', icon:'image'},
    {id:'video', label:'Videos', icon:'video'}, {id:'voice', label:'Voice', icon:'mic'},
    {id:'music', label:'Music', icon:'music'}, {id:'ppt', label:'Presentations', icon:'board'},
    {id:'webapp', label:'Web & App', icon:'globe'}, {id:'files', label:'Files', icon:'file'},
    {id:'prompts', label:'Prompts', icon:'zap'}, {id:'settings', label:'Settings', icon:'settings'},
  ],
  'AUTOMATION': [
    {id:'automation', label:'Automation', icon:'bot'}, {id:'websearch', label:'Web Search', icon:'web'},
    {id:'knowledge', label:'Knowledge Base', icon:'file'}, {id:'plugins', label:'Tools & Plugins', icon:'grid'},
  ],
};
const PILLS = [
  { id:'all',       name:'All',        sub:'Everything',      icon:'grid', color:'#94a3b8' },
  { id:'chat',      name:'Chat',       sub:'Ask anything',    icon:'chat', color:'#60a5fa' },
  { id:'code',      name:'Code',       sub:'Write & build',   icon:'code', color:'#4f8ff7' },
  { id:'document',  name:'Document',   sub:'Summarize & analyze', icon:'file', color:'#34d399' },
  { id:'image',     name:'Image',      sub:'Create with AI',  icon:'image', color:'#f472b6' },
  { id:'video',     name:'Video',      sub:'Turn ideas into videos', icon:'video', color:'#f87171' },
  { id:'automation',name:'Automation', sub:'Agents & workflows', icon:'bot', color:'#fbbf24' },
];
const PILL_PERSONAS = {
  code:   'You are a senior software engineer. Write clean, complete, runnable code. Prefer single-file apps (HTML+CSS+JS or React JSX) so they can be previewed instantly. Put JSX apps in a ```jsx block and plain pages in a ```html block.',
  document:'You are a documents expert. Summarize, analyze, compare and rewrite documents clearly. Use headings, bullets and tables. Ask for the content if it is not attached.',
  image:  'You are a world-class AI image prompt engineer. Write detailed, vivid generation prompts the user can paste into an image model.',
  video:  'You are a video director. Help with scripts, shot lists, storyboards and video-generation prompts.',
};
const QUICK = [
  { label:'Screenshot to Code', icon:'scan', color:'#8b5cf6', act:'shot' },
  { label:'Image to Prompt',    icon:'image', color:'#22d3ee', act:'img2prompt' },
  { label:'Idea to Plan',       icon:'bulb', color:'#34d399', act:'idea' },
  { label:'Blog Generator',     icon:'pen', color:'#f59e0b', act:'blog' },
];
const CHIPS = [
  'Build a website for my idea', 'Create a logo for SafetyOS', 'Make a 1 minute cartoon video',
  'Generate a presentation', 'Write and deploy a full app', 'Write a song for my channel',
];
const MCP_DEFS = [
  { id:'fileSystem', label:'File System', sub:'Read & manage local files', icon:'file', color:'#4f8ff7' },
  { id:'word', label:'Word/Excel', sub:'Create documents & spreadsheets', icon:'file', color:'#2563eb' },
  { id:'notion', label:'Notion', sub:'Sync pages & databases', icon:'file', color:'#a3a3a3' },
  { id:'figma', label:'Figma', sub:'Design files & components', icon:'pen', color:'#f472b6' },
  { id:'playwright', label:'Playwright', sub:'Browse & automate the web', icon:'web', color:'#34d399' },
  { id:'custom', label:'Custom MCP', sub:'Your own MCP server URL', icon:'bot', color:'#fbbf24', customUrl:true },
];
const PLUGIN_DEFS = [
  { id:'codePreview', label:'Code Preview', sub:'Render generated apps in the Live Preview panel', icon:'globe', color:'#22d3ee' },
  { id:'vision', label:'Vision (images in chat)', sub:'Attach screenshots & photos for the model to see', icon:'image', color:'#f472b6' },
  { id:'voice', label:'Voice (text-to-speech)', sub:'Read any answer aloud', icon:'mic', color:'#a78bfa' },
  { id:'webSearch', label:'Web Search', sub:'Ground answers with DuckDuckGo/Wikipedia context', icon:'web', color:'#34d399' },
];

/* ---------------- helpers ---------------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const svg = (name, cls='') => `<span class="${cls}">${ICONS[name]}</span>`;
function timeAgo(ts){ if(!ts) return ''; const s=(Date.now()-ts)/1000; if(s<60) return 'now'; if(s<3600) return Math.floor(s/60)+'m ago'; if(s<86400) return Math.floor(s/3600)+'h ago'; if(s<2592000) return Math.floor(s/86400)+'d ago'; return new Date(ts).toLocaleDateString(); }
let toastT;
function toast(msg, ms=3200){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.add('hidden'), ms); }
function filePick(accept){ return new Promise(res=>{ const i=document.createElement('input'); i.type='file'; i.accept=accept||''; i.onchange=()=>res(i.files?[...i.files]:[]); i.click(); }); }
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast('Copied to clipboard'); }catch{ try{ const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copied to clipboard'); }catch{ toast('Copy failed'); } } }
function shade(hex){ const n=parseInt(hex.slice(1),16); const f=v=>Math.max(0,Math.min(255,Math.round(v*.72))); return `rgb(${f(n>>16)},${f((n>>8)&255)},${f(n&255)})`; }

/* ---------------- markdown ---------------- */
function md(src){
  const fences=[]; let s=String(src||'').replace(/\r\n/g,'\n');
  s=s.replace(/```(\w*)[^\n]*\n?([\s\S]*?)```/g,(m,l,c)=>{fences.push({l:l||'code',c:c.replace(/\n$/,'')});return '\u0000C'+(fences.length-1)+'\u0000';});
  const inline=t=>t
    .replace(/`([^`\n]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines=s.split('\n'); const out=[]; let i=0, listStack='';
  const closeList=()=>{ if(listStack){ out.push('</'+listStack+'>'); listStack=''; } };
  while(i<lines.length){
    const ln=lines[i];
    if(ln.startsWith('\u0000C')){ closeList(); out.push(ln); i++; continue; }
    if(ln.trim()===''){ closeList(); i++; continue; }
    const tln=ln.trim();
    let m;
    if((m=tln.match(/^!\[([^\]]*)\]\((https?:[^)\s]+)\)/))){ closeList(); out.push('<img loading="lazy" src="'+m[2]+'" alt="'+m[1].replace(/"/g,'&quot;')+'">'); i++; continue; }
    if((m=ln.match(/^(#{1,4})\s+(.*)$/))){ closeList(); const n=m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue; }
    if((m=ln.match(/^\s*([-*+])\s+(.*)$/))){ if(listStack!=='ul'){ closeList(); out.push('<ul>'); listStack='ul'; } out.push('<li>'+inline(m[2])+'</li>'); i++; continue; }
    if((m=ln.match(/^\s*\d+[.)]\s+(.*)$/))){ if(listStack!=='ol'){ closeList(); out.push('<ol>'); listStack='ol'; } out.push('<li>'+inline(m[1])+'</li>'); i++; continue; }
    if(/^\s*(?:&gt;|>)\s?/.test(ln)){ closeList(); const q=[]; while(i<lines.length && /^\s*(?:&gt;|>)\s?/.test(lines[i])){ q.push(lines[i].replace(/^\s*(?:&gt;|>)\s?/,'')); i++; } out.push('<blockquote>'+md(q.join('\n'))+'</blockquote>'); continue; }
    if(ln.includes('|') && i+1<lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i+1]) && lines[i+1].includes('-')){
      closeList(); const rows=[ln]; i+=2;
      while(i<lines.length && lines[i].includes('|') && lines[i].trim()!==''){ rows.push(lines[i]); i++; }
      let html='<table><thead><tr>';
      rows[0].trim().replace(/^\|/,'').replace(/\|$/,'').split('|').forEach(c=>{ html+='<th>'+inline(c.trim())+'</th>'; });
      html+='</tr></thead><tbody>';
      for(let r=1;r<rows.length;r++){
        html+='<tr>'; rows[r].trim().replace(/^\|/,'').replace(/\|$/,'').split('|').forEach(c=>{ html+='<td>'+inline(c.trim())+'</td>'; }); html+='</tr>';
      }
      html+='</tbody></table>'; out.push(html); continue;
    }
    closeList(); const para=[ln]; i++;
    while(i<lines.length && lines[i].trim()!=='' && !/^(#{1,4})\s/.test(lines[i]) && !/^\s*[-*+]\s/.test(lines[i]) && !/^\s*\d+[.)]\s/.test(lines[i]) && !/^\s*(?:&gt;|>)\s?/.test(lines[i]) && !lines[i].includes('|') && !lines[i].startsWith('\u0000C')){
      para.push(lines[i]); i++;
    }
    out.push('<p>'+para.map(inline).join('<br>')+'</p>');
  }
  closeList();
  return out.join('\n').replace(/\u0000C(\d+)\u0000/g,(mm,n)=>{ const f=fences[+n];
    return `<div class="code-head"><span>${esc(f.l)}</span><button class="code-copy" type="button">Copy code</button></div><pre><code>${esc(f.c)}</code></pre>`; });
}

/* ---------------- state ---------------- */
const state = {
  s:null, msgs:[], chatId:null,
  streaming:false, abort:null,
  selectedTool:null, pill:'all', drawMode:false, webSearch:false, reason:false,
  selModel:'auto::', profile:null, agent:null,
  searchOn:false, audio:null,
  preview:null, pvDevice:'desktop',
};
let attachments=[];
let pendingLogo=null;

/* ---------------- boot ---------------- */
function bootIcons(){
  $('#logoMark').innerHTML=ICONS.sparkle;
  $('#aiosLogo').innerHTML=ICONS.sparkle;
  $('#newChatIcon').innerHTML=ICONS.plus;
  $('#sideSettings').innerHTML=ICONS.settings;
  $('#topSettingsBtn').innerHTML=ICONS.settings;
  $('#sidebarToggle').innerHTML=ICONS.menu;
  $('#searchIcon').innerHTML=ICONS.search;
  $('#attachBtn').innerHTML=ICONS.paperclip+'<span>Attach</span>';
  $('#drawBtn').innerHTML=ICONS.image+'<span>Image</span>';
  $('#webSearchBtn').innerHTML=ICONS.web+'<span>Web Search</span>';
  $('#reasonBtn').innerHTML=ICONS.brain+'<span>Reason</span>';
  $('#micBtn').innerHTML=ICONS.record;
  $('#sendBtn').innerHTML=ICONS.send;
  $('#pvCopy').innerHTML=ICONS.copy;
  $('#pvRefresh').textContent='⟳';
  $('#pvNewTab').textContent='↗';
  $('#pvClose').textContent='✕';
  $$('#modalBack [data-close]').forEach(b=>{ b.innerHTML=ICONS.x; });
}
function greeting(){ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; }
/* ---------------- session-aware fetch ---------------- */
let authRedirected=false;
function goLogin(){ if(!authRedirected){ authRedirected=true; window.location.replace('/login.html'); } }
async function apiFetch(url, opts){
  const r=await fetch(url, opts);
  if(r.status===401) goLogin();
  return r;
}
async function fetchState(){ const r=await apiFetch('/api/state'); state.s=await r.json(); return state.s; }

function renderBasics(){
  const s=state.s; const name=s.name||'Musahid';
  // branding
  document.body.dataset.accent=s.accent||'indigo';
  document.body.classList.toggle('compact', !!s.compact);
  const ws=(s.wsName&&s.wsName.trim())||'Aaru AI';
  $('#wsNameSide').textContent=ws;
  $('#taglineSide').textContent=s.tagline||'Personal AI Studio';
  $('#aiosTitle').innerHTML=esc(ws)+' <span class="badge-green"><i></i>Free Mode</span>';
  $('#aiosSub').textContent=(s.tagline||'Your personal AI assistant')+'. Ask anything, create anything.';
  if(s.logo){ $('#logoMark').innerHTML=`<img src="${esc(s.logo)}" alt="logo">`; $('#aiosLogo').innerHTML=`<img src="${esc(s.logo)}" alt="logo" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`; }
  else { $('#logoMark').innerHTML=ICONS.sparkle; $('#aiosLogo').innerHTML=ICONS.sparkle; }
  $('#greeting').innerHTML=`${greeting()}, ${esc(name)} <span class="wave">👋</span>`;
  $('#welcomeHi').textContent=`Hi ${name}! 👋`;
  $('#sideName').textContent=name;
  $('#sideTagline').textContent=s.tagline||'Dream • Build • Do';
  const letter=(name||'M').trim()[0].toUpperCase();
  $('#sideAvatar').textContent=letter; $('#topAvatar').textContent=letter;
  renderSidebar(); renderTools(); renderPills(); renderRail(); renderChips(); renderModelSelect();
  renderAgentChip();
  $('#drawBtn').classList.toggle('on', state.drawMode);
  $('#webSearchBtn').classList.toggle('on', state.webSearch);
  $('#reasonBtn').classList.toggle('on', state.reason);
}

/* ---------------- sidebar ---------------- */
function renderSidebar(){
  const nav=$('#sideNav'); nav.innerHTML='';
  for(const [group, items] of Object.entries(NAV)){
    const g=el(`<div class="nav-group"><div class="nav-group-title">${group}</div></div>`);
    for(const it of items){
      const isWeb = it.id==='websearch';
      const b=el(`<button class="nav-item ${isWeb&&state.webSearch?'active':''}" data-id="${it.id}">${ICONS[it.icon]}<span>${it.label}</span></button>`);
      b.addEventListener('click',()=>{
        if(it.id==='settings') return openSettings();
        if(it.id==='plugins') return openSettings('plugins');
        if(it.id==='automation') return openAgents();
        if(it.id==='websearch'){ state.webSearch=!state.webSearch; renderSidebar(); $('#webSearchBtn').classList.toggle('on',state.webSearch); toast(state.webSearch?'🌐 Web search ON':'Web search off'); return; }
        if(it.id==='knowledge'||it.id==='files'||it.id==='prompts') return toast(it.id==='knowledge'?'Knowledge Base — coming soon ⏳':(it.id==='files'?'Files manager — coming soon ⏳':'Prompt library — coming soon ⏳'));
        if(it.id==='home') return closeSidebar();
        if(it.id==='projects') return toast('Projects dashboard — coming soon ⏳');
        if(it.id==='workspace') return newChat();
        activeTool(it.id, b);
      });
      g.appendChild(b);
    }
    nav.appendChild(g);
  }
  renderRecents();
}
function closeSidebar(){ if(window.innerWidth<=1100) $('#sidebar').classList.remove('open'); }
function renderRecents(filter=''){
  const list=$('#recentList'); list.innerHTML='';
  const items=(state.s.chats||[]).filter(c=>c.title.toLowerCase().includes(filter.toLowerCase())).slice(0,state.searchOn?200:12);
  if(!items.length){ list.appendChild(el(`<div class="note" style="padding:4px 8px">No chats yet — say something ✨</div>`)); return; }
  for(const c of items){
    const row=el(`<div class="chat-item ${c.id===state.chatId?'active':''}" data-id="${c.id}">
      <span class="ci-ic">${ICONS.chat}</span><span class="ci-title">${esc(c.title)}</span><span class="ci-time">${timeAgo(c.updatedAt)}</span>
      <button class="ci-del" title="Delete">${ICONS.trash}</button></div>`);
    const title=$('.ci-title',row);
    row.addEventListener('click',(e)=>{ if(e.target.closest('.ci-del'))return; openChat(c.id); });
    $('.ci-del',row).addEventListener('click',async(e)=>{ e.stopPropagation(); await apiFetch('/api/chats/'+c.id,{method:'DELETE'}); if(state.chatId===c.id){ state.chatId=null; state.msgs=[]; renderChat(); } await refresh(); toast('Chat deleted'); });
    title.addEventListener('dblclick',()=>{
      const inp=el(`<input class="ci-edit" value="${esc(c.title)}">`);
      title.replaceWith(inp); inp.focus(); inp.select();
      const commit=async()=>{ const v=inp.value.trim(); if(v) await apiFetch('/api/chats/'+c.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:v})}); await refresh(); };
      inp.addEventListener('blur',commit); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ inp.blur(); } });
    });
    list.appendChild(row);
  }
}

/* ---------------- tools, pills, chips, rail ---------------- */
function renderTools(){
  const grid=$('#toolsGrid'); grid.innerHTML='';
  for(const t of TOOLS){
    const c=el(`<button class="tool-card" data-id="${t.id}" style="--tc:${t.color}">
      <span class="tool-ic" style="background:linear-gradient(135deg,${t.color},${shade(t.color)})">${ICONS[t.icon]}</span>
      <span><div class="tool-name">${t.name}</div><div class="tool-tag">${t.tag}</div></span></button>`);
    c.addEventListener('click',()=>activeTool(t.id, c));
    grid.appendChild(c);
  }
}
function renderPills(){
  const row=$('#toolPills'); row.innerHTML='';
  for(const p of PILLS){
    const b=el(`<button class="pill ${state.pill===p.id?'on':''}" data-id="${p.id}">
      <span class="pill-ic" style="background:linear-gradient(135deg,${p.color},${shade(p.color)})">${ICONS[p.icon]}</span>
      <span class="pill-name">${p.name}</span><span class="pill-sub">${p.sub}</span></button>`);
    b.addEventListener('click',()=>pillClick(p.id));
    row.appendChild(b);
  }
}
function pillClick(id){
  state.pill=id;
  if(id==='automation'){ openAgents(); return; }
  if(id==='all'){ state.selectedTool=null; setInput(''); toast('All tools — ask anything'); }
  else if(id==='chat'){ state.selectedTool='chat'; toast('Chat mode — ask anything'); }
  else { state.selectedTool=id; showPillPlaceholder(id); }
  renderPills(); renderTools(); renderChips();
  $('#input').focus();
  if(id!=='all'&&id!=='automation') setInput('');
}
function showPillPlaceholder(id){
  const map={code:'Describe the app or website you want, e.g. "a pomodoro timer with a dark theme"…',document:'Paste or attach a document to summarize, or describe the document you need…',image:'Describe the image you want to create…',video:'Describe the video you want to make…'};
  $('#input').placeholder=map[id]||'Type your message here...';
  toast(PILLS.find(p=>p.id===id).name+' tool active');
}
function renderChips(){
  const row=$('#chipsRow'); row.innerHTML='';
  for(const chip of CHIPS){
    const b=el(`<button class="chip" ${state.streaming?'disabled':''}>${esc(chip)}</button>`);
    b.addEventListener('click',()=>{
      if(chip.toLowerCase().includes('logo')){ state.drawMode=true; $('#drawBtn').classList.add('on'); }
      if(chip.toLowerCase().includes('video')) activeTool('video', null, true);
      if(chip.toLowerCase().includes('website')||chip.toLowerCase().includes('app')) pillClick('code');
      setInput(chip); $('#input').focus();
    });
    row.appendChild(b);
  }
}
function renderRail(){
  const s=state.s; const u=s.usage||{};
  $('#usageReset').textContent='Resets daily';
  const limits=s.limits||{};
  const k2k=Math.round((u.prompt+u.completion)/1000);
  const rows=[
    {label:'Text (LLM)', val:`${k2k} / ${limits.text??50}k`, pct:Math.min(100,k2k/((limits.text||50))*100), icon:'chat', color:'#a78bfa'},
    {label:'Images', val:`${u.images||0} / ${limits.images??0}`, pct:Math.min(100,((u.images||0)/(limits.images||1))*100), icon:'image', color:'#34d399'},
    {label:'Videos', val:`${u.video||0} / ${limits.video??0}`, pct:Math.min(100,((u.video||0)/(limits.video||1))*100), icon:'video', color:'#f87171'},
    {label:'Voice', val:`${Math.round((u.tts||0)/300)} / ${limits.voice??0} min`, pct:Math.min(100,Math.round((u.tts||0)/300/(limits.voice||1))*100), icon:'mic', color:'#60a5fa'},
    {label:'Music', val:`${u.music||0} / ${limits.music??0}`, pct:Math.min(100,((u.music||0)/(limits.music||1))*100), icon:'music', color:'#fb923c'},
  ];
  const box=$('#usageRows'); box.innerHTML='';
  for(const r of rows){
    box.appendChild(el(`<div class="usage-row">
      <span class="ur-ic" style="background:${r.color}22;color:${r.color}">${ICONS[r.icon]}</span>
      <div class="ur-body"><div class="ur-top"><span class="ur-name">${r.label}</span><span class="ur-val">${r.val}</span></div>
      <div class="ur-bar"><div class="ur-fill" style="width:${r.pct}%"></div></div></div></div>`));
  }
  const qg=$('#quickGrid'); qg.innerHTML='';
  for(const q of QUICK){
    const t=el(`<button class="q-tile"><span class="q-ic" style="background:${q.color}">${ICONS[q.icon]}</span><span class="q-label">${q.label}</span></button>`);
    t.addEventListener('click',()=>quickTool(q.act));
    qg.appendChild(t);
  }
  const projBody=$('#projectBody');
  const cur=(state.s.chats||[]).find(c=>c.id===state.chatId);
  projBody.innerHTML = cur
    ? `<div class="proj-ic">${ICONS.file}</div><div class="proj-name">${esc(cur.title)}</div><div class="muted">${cur.count} msg • updated ${timeAgo(cur.updatedAt)}</div>`
    : `<div class="proj-ic">${ICONS.sparkle}</div><div class="proj-name">New session</div><div class="muted">Start typing to create your project</div>`;
}
function renderModelSelect(){
  const sel=$('#modelSelect'); if(!sel) return;
  const prev=(state.profile?('profile:'+state.profile):(state.selModel||'auto::'));
  const provs=state.s.providers.filter(p=>(p.enabled&&(p.hasKey||p.local)));
  let html=`<option value="auto::">Auto — best available</option>`;
  if((state.s.aiModels||[]).length){
    html+=`<optgroup label="✨ My AI Models">`+(state.s.aiModels||[]).map(m=>`<option value="profile:${m.id}">✨ ${esc(m.name)}${m.provider?' · '+esc(m.provider):''}</option>`).join('')+`</optgroup>`;
  }
  for(const p of provs){
    const models=[]; const dm=p.model||p.defaultModel;
    if(dm) models.push(dm);
    for(const m of p.models||[]) if(!models.includes(m)) models.push(m);
    if(!models.length) models.push('(set a model in Settings)');
    html+=`<optgroup label="${esc(p.label)}">`+models.map(m=>`<option value="${p.id}::${m}">${esc(p.label)} · ${esc(m)}</option>`).join('')+`</optgroup>`;
  }
  sel.innerHTML=html;
  if([...sel.options].some(o=>o.value===prev)) sel.value=prev;
  sel.onchange=()=>{ state.selModel=sel.value; state.profile=sel.value.startsWith('profile:')?sel.value.slice(8):null; };
}
function renderAgentChip(){
  const chip=$('#agentChip');
  if(state.agent){ chip.classList.remove('hidden'); chip.innerHTML=`🤖 Agent: <b>${esc(state.agent.name)}</b><span class="x">✕</span>`; }
  else chip.classList.add('hidden');
}

/* tool activation */
function activeTool(id, cardEl, silent){
  const t=TOOLS.find(x=>x.id===id); if(!t||!t.persona){ if(id==='more') { openAgents(); } return; }
  state.selectedTool=id; state.pill = (id==='webapp')?'code':id;
  $$('.tool-card').forEach(c=>c.classList.toggle('active', c.dataset.id===id));
  $$('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.id===id));
  renderPills();
  if(!silent){ setInput(''); toast(`${t.name} tool active — describe what you want below`); $('#input').placeholder=`Use the ${t.name} tool… type your request`; }
  $('#input').focus();
  if(typeof cardEl!=='string') cardEl&&cardEl.classList.add('active');
}
function setInput(v){ const i=$('#input'); i.value=v; autoGrow(i); }

/* ---------------- chat rendering ---------------- */
function partsOf(m){ return (m&&Array.isArray(m.parts)&&m.parts.length)?m.parts:(m&&m.content?[{type:'text',text:m.content}]:[]); }
function userTextParts(parts){ return parts.filter(p=>p.type==='text').map(p=>p.text).join('\n\n'); }
function renderChat(){
  const box=$('#messages'); box.innerHTML='';
  $('#welcomeCard').classList.toggle('hidden', state.msgs.length>0);
  renderChips();
  for(const m of state.msgs) box.appendChild(renderMsg(m));
  scrollBottom();
}
function renderMsg(m){
  if(m.role==='user'){
    const imgs=partsOf(m).filter(p=>p.type==='image');
    const txt=userTextParts(partsOf(m));
    const n=el(`<div class="msg-user">${esc(txt)}${imgs.map(p=>`<br><img src="data:${p.mime||'image/png'};base64,${p.b64}" style="max-width:260px;border-radius:10px;margin-top:6px">`).join('')}</div>`);
    return n;
  }
  const n=el(`<div class="msg-assistant">
    <span class="msg-av">${ICONS.sparkle}</span>
    <div class="msg-body">
      ${m.reasoning?`<div class="msg-reasoning">${esc(m.reasoning)}</div>`:''}
      <div class="msg-content">${md(m.content||'')}</div>
      <div class="msg-meta"></div>
    </div></div>`);
  attachMeta(n, m);
  return n;
}
function attachMeta(node, m){
  const meta=$('.msg-meta',node); if(!meta) return;
  const isProfile=m.profile&&m.profile.name;
  const prov=state.s&&state.s.providers.find(p=>p.id===m.provider);
  meta.innerHTML=`<span>${isProfile?esc(m.profile.name):esc(prov?prov.label:'Aaru AI')} · ${esc(m.model||'')}</span>
    ${m.usage?`<span class="sep">·</span><span>${m.usage.prompt||0}+${m.usage.completion||0} tok</span>`:''}
    ${m.stopped?'<span class="sep">·</span><span class="status">stopped</span>':''}
    <span class="sep">·</span><span>${new Date(m.ts||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>`;
  const b1=el(`<button class="meta-btn">${ICONS.copy}Copy</button>`);
  b1.addEventListener('click',()=>copyText(m.content||''));
  const b2=el(`<button class="meta-btn">${ICONS.speaker}Speak</button>`);
  b2.addEventListener('click',()=>speak(m.content||''));
  const b3=el(`<button class="meta-btn">${ICONS.refresh}Regenerate</button>`);
  b3.addEventListener('click',()=>regen(m.id));
  meta.appendChild(b1); meta.appendChild(b2); meta.appendChild(b3);
}
function scrollBottom(){ const c=$('#content'); c.scrollTop=c.scrollHeight; }

/* ---------------- streaming ---------------- */
function setStreamingUI(on){
  state.streaming=on;
  $('#sendBtn').classList.toggle('stop-btn', on);
  $('#sendBtn').innerHTML = on?ICONS.stop:ICONS.send;
  $('#sendBtn').title = on?'Stop':'Send';
  renderChips();
  if(!on) autoGrow($('#input'));
}
function systemFor(){
  const base=state.s.systemPrompt||'';
  let head='';
  if(state.agent&&state.agent.instruction) head+=state.agent.instruction+'\n\n';
  else if(state.selectedTool){
    const t=TOOLS.find(x=>x.id===state.selectedTool&&x.persona);
    if(t) head+=t.persona+'\n\n';
    else if(PILL_PERSONAS[state.selectedTool]) head+=PILL_PERSONAS[state.selectedTool]+'\n\n';
  }
  return (head+base).trim();
}
async function send(){
  if(state.streaming) { stop(); return; }
  const area=$('#input');
  const text=area.value.trim();
  const parts=[];
  if(text) parts.push({type:'text', text});
  for(const a of attachments){
    if(a.kind==='image') parts.push({type:'image', mime:a.mime, b64:a.b64});
    else parts.push({type:'text', text:a.text});
  }
  if(!parts.length) return;
  if(state.drawMode && !attachments.length && parts.length===1 && parts[0].type==='text'){
    await sendImageOnly(text); return;
  }
  attachments=[]; renderAttach();
  area.value=''; autoGrow(area);
  const userMsg={id:rndId(), role:'user', parts, ts:Date.now()};
  state.msgs.push(userMsg);
  $('#welcomeCard').classList.add('hidden');
  $('#messages').appendChild(renderMsg(userMsg)); scrollBottom();
  let searchCtx=null;
  if(state.webSearch){ searchCtx=await fetchSearch(text); }
  if(state.streaming) return;
  setStreamingUI(true);
  state.abort=new AbortController();
  await runStream({
    history:state.msgs.slice(0,-1).map(m=>({role:m.role, content:m.content, parts:m.parts})),
    chatId:state.chatId, userParts:parts, commitUser:true,
    system:systemFor(), modelProfile:state.profile, provider:state.profile?undefined:parseSel(state.selModel)[0],
    model:state.profile?undefined:parseSel(state.selModel)[1],
    reason:state.reason, searchContext:searchCtx,
  });
}
function parseSel(v){ if(!v||v==='auto::') return [undefined, undefined]; const [p,m]=v.split('::'); return [p,m||undefined]; }
function rndId(){ return Math.random().toString(36).slice(2,10); }

async function runStream(payload){
  let resp;
  try{ resp=await apiFetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:state.abort.signal}); }
  catch(e){ setStreamingUI(false); toast('Network error — is the server running?'); return; }
  if(!resp.ok||!resp.body){ let msg='Stream failed ('+resp.status+')'; try{ msg=(await resp.json()).error||msg; }catch{} showErrorBubble(msg); setStreamingUI(false); return; }
  const reader=resp.body.getReader(); const dec=new TextDecoder();
  let buf='', acc={text:'',reasoning:''}, meta={}, err=null;
  let node=null, contentEl=null, reasoningEl=null;
  const ensureNode=()=>{
    if(node) return;
    node=el(`<div class="msg-assistant"><span class="msg-av">${ICONS.sparkle}</span><div class="msg-body"><div class="msg-content"><span class="cursor"></span></div><div class="msg-meta"></div></div></div>`);
    contentEl=$('.msg-content',node); reasoningEl=null; $('#messages').appendChild(node); scrollBottom();
  };
  let raf=0;
  const paint=()=>{ if(!node)return; if(acc.reasoning&&!reasoningEl){ reasoningEl=el(`<div class="msg-reasoning"></div>`); node.querySelector('.msg-body').insertBefore(reasoningEl, contentEl); } if(reasoningEl) reasoningEl.textContent=acc.reasoning; contentEl.innerHTML=md(acc.text)+(state.streaming?'<span class="cursor"></span>':''); scrollBottom(); };
  const paintSoon=()=>{ if(raf)return; raf=requestAnimationFrame(()=>{ raf=0; paint(); }); };
  while(true){
    let done;
    try{ ({done, value}=await reader.read()); }catch(e){ done=true; }
    if(done) break;
    buf+=dec.decode(value,{stream:true});
    let idx;
    while((idx=buf.indexOf('\n\n'))!==-1){
      const block=buf.slice(0,idx); buf=buf.slice(idx+2);
      let ev='message', data='';
      for(const line of block.split('\n')){
        if(line.startsWith('event:')) ev=line.slice(6).trim();
        else if(line.startsWith('data:')) data+=line.slice(5).trim();
      }
      if(!data) continue;
      let j; try{ j=JSON.parse(data); }catch{ continue; }
      if(ev==='meta'){ meta=j; state.chatId=j.chatId; refreshSilent(); }
      else if(ev==='delta'){ ensureNode(); acc.text+=j.text; paintSoon(); }
      else if(ev==='reasoning'){ ensureNode(); acc.reasoning+=j.text; paintSoon(); }
      else if(ev==='error'){ err=j.message; }
      else if(ev==='done'){
        const finalMeta={provider:meta.provider||j.provider, model:meta.model||j.model, profile:meta.profile||null, usage:j?{prompt:j.prompt||0,completion:j.completion||0}:undefined, stopped:j&&j.stopped};
        setStreamingUI(false);
        if(err && !acc.text){ showErrorBubble(err); }
        else if(acc.text||acc.reasoning){
          ensureNode();
          const m={id:rndId(), role:'assistant', content:acc.text||'(stopped)', reasoning:acc.reasoning||undefined, ...finalMeta, ts:Date.now()};
          state.msgs.push(m);
          paint(); attachMeta(node, m);
        }
        if(raf) cancelAnimationFrame(raf);
        maybePreview(acc.text);
        await refreshSilent();
        return;
      }
    }
  }
  setStreamingUI(false);
  if(err) showErrorBubble(err);
  maybePreview(acc.text);
  await refreshSilent();
}
function showErrorBubble(msg){
  const n=el(`<div class="msg-assistant"><span class="msg-av">${ICONS.sparkle}</span><div class="msg-body"><div class="msg-error">⚠️ ${esc(msg)}</div></div></div>`);
  $('#messages').appendChild(n); scrollBottom();
}
function stop(){ if(state.abort) state.abort.abort(); }
async function regen(assistantId){
  if(state.streaming) return;
  const idx=state.msgs.findIndex(m=>m.id===assistantId);
  if(idx<0) return;
  let u=idx-1; while(u>=0 && state.msgs[u].role!=='user') u--;
  if(u<0) return;
  const keep=state.msgs.slice(0,u+1);
  const removed=state.msgs.slice(u+1);
  state.msgs=keep;
  const nodes=$$('#messages .msg-assistant, #messages .msg-user');
  nodes.slice(nodes.length-removed.length).forEach(n=>n.remove());
  setStreamingUI(true);
  state.abort=new AbortController();
  await runStream({ history:keep.slice(0,-1).map(m=>({role:m.role, content:m.content, parts:m.parts})), chatId:state.chatId, userParts:partsOf(keep[keep.length-1]), commitUser:false, truncateAt:keep.length, system:systemFor(), modelProfile:state.profile, provider:state.profile?undefined:parseSel(state.selModel)[0], model:state.profile?undefined:parseSel(state.selModel)[1], reason:state.reason, searchContext:null });
}
async function refreshSilent(){
  try{ const s=await fetchState(); renderSidebar(); renderRail(); renderModelSelect(); }catch{}
}
async function refresh(){ await refreshSilent(); }
function openChat(id){
  apiFetch('/api/chats/'+id).then(r=>r.json()).then(c=>{
    state.chatId=id; state.msgs=c.messages||[];
    renderChat(); renderSidebar(); renderRail();
    $('#welcomeCard').classList.add('hidden');
    closeSidebar(); scrollBottom();
  }).catch(()=>toast('Could not open chat'));
}
function newChat(){
  state.chatId=null; state.msgs=[]; attachments=[]; renderAttach();
  state.selectedTool=null; state.pill='all'; state.drawMode=false; $('#drawBtn').classList.remove('on');
  renderChat(); renderPills(); renderTools(); renderSidebar(); renderRail(); setInput('');
  $('#input').placeholder='Type your message here...';
  closeSidebar(); $('#input').focus();
}

/* ---------------- live preview ---------------- */
function extractCode(text){
  const blocks=[];
  const re=/```(jsx|tsx|html|htm|css|js|javascript|jsx?)\n([\s\S]*?)```/g;
  let m;
  while((m=re.exec(text))) blocks.push({lang:m[1].toLowerCase(), code:m[2]});
  if(!blocks.length) return null;
  const jsx=blocks.filter(b=>['jsx','tsx'].includes(b.lang)).map(b=>b.code);
  const html=blocks.filter(b=>['html','htm'].includes(b.lang)).map(b=>b.code);
  const css=blocks.filter(b=>b.lang==='css').map(b=>b.code).join('\n\n');
  const js=blocks.filter(b=>['js','javascript'].includes(b.lang)).map(b=>b.code).join('\n\n');
  if(html.length){
    let doc=html[html.length-1];
    if(css&&!/(<style[ >])/i.test(doc)) doc=doc.replace(/<head([^>]*)>/i, `<head$1><style>${css}</style>`);
    return {file:'app.html', lang:'HTML', css:false, code:html[html.length-1], doc};
  }
  if(jsx.length){
    let cr=jsx[jsx.length-1];
    cr=cr.replace(/^import\s+.*$/gm,'');
    cr=cr.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g,'function $1');
    cr=cr.replace(/export\s+default\s+/g,'const __App = ');
    const nameM=cr.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/);
    const appName=nameM?nameM[1]:'App';
    let render=`ReactDOM.createRoot(document.getElementById('root')).render(<${appName} />);`;
    if(cr.includes('__App')) render=`ReactDOM.createRoot(document.getElementById('root')).render(<__App />);`;
    const doc=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>*{box-sizing:border-box;margin:0}body{font-family:system-ui,-apple-system,sans-serif}${css}</style>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head>
<body><div id="root"></div><script type="text/babel">
${cr}
${render}
</script></body></html>`;
    return {file:'App.jsx', lang:'React', code:cr, doc};
  }
  if(blocks.some(b=>b.lang==='css')||blocks.some(b=>['js','javascript'].includes(b.lang))){
    const doc=`<!doctype html><html><head><meta charset="utf-8"><style>${css||'body{font-family:sans-serif;padding:20px}'}</style></head><body>${js||'<p>Preview needs an HTML block.'}</body></html>`;
    return {file:'styles.css', lang:'CSS/JS', code:css||js, doc};
  }
  return null;
}
function maybePreview(text){
  if(!state.s.plugins||!state.s.plugins.codePreview) return;
  if(!text||text.length<40) return;
  const pv=extractCode(text);
  if(!pv) return;
  state.preview=pv;
  renderPreview();
  $('#previewPanel').classList.remove('hidden');
  $('#workspace').classList.add('with-preview');
}
function renderPreview(){
  const pv=state.preview; if(!pv) return;
  $('#pvEmpty').style.display='none';
  $('#pvFile').textContent=pv.file;
  $('#pvLang').textContent=pv.lang;
  $('#pvFrame').srcdoc=pv.doc;
  $('#pvCode').innerHTML=`<pre>${esc(pv.code)}</pre>`;
}
function togglePvCode(){
  const code=$('#pvCode'), wrap=$('.pv-frame-wrap');
  const showing=code.style.display==='block';
  code.style.display=showing?'none':'block';
  wrap.style.display=showing?'flex':'none';
}
function pvSetDevice(d){
  state.pvDevice=d;
  $$('.pv-dev').forEach(b=>b.classList.toggle('on', b.dataset.dev===d));
  $('.pv-frame-wrap').classList.toggle('mobile', d==='mobile');
}

/* ---------------- image mode ---------------- */
async function sendImageOnly(prompt){
  const area=$('#input');
  area.value=''; autoGrow(area);
  const userMsg={id:rndId(), role:'user', parts:[{type:'text',text:'🎨 Draw mode: '+prompt}], ts:Date.now()};
  state.msgs.push(userMsg);
  $('#welcomeCard').classList.add('hidden');
  $('#messages').appendChild(renderMsg(userMsg)); scrollBottom();
  const n=el(`<div class="msg-assistant"><span class="msg-av">${ICONS.sparkle}</span><div class="msg-body"><div class="msg-content"><span class="cursor"></span></div><div class="msg-meta"></div></div></div>`);
  $('#messages').appendChild(n); scrollBottom();
  setStreamingUI(true);
  try{
    const r=await apiFetch('/api/images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
    const j=await r.json();
    setStreamingUI(false);
    if(!r.ok){ n.querySelector('.msg-content').innerHTML=`<div class="msg-error">⚠️ ${esc(j.error||'Image generation failed')}</div>`; await refreshSilent(); return; }
    const m={id:rndId(), role:'assistant', content:`I generated this image for you:\n\n![${prompt}](${j.url})`, profile:null, provider:(state.s.image||{}).provider, model:(state.s.image||{}).model, ts:Date.now()};
    state.msgs.push(m);
    n.querySelector('.msg-content').innerHTML=md(m.content);
    attachMeta(n,m); scrollBottom();
    state.drawMode=false; $('#drawBtn').classList.remove('on');
    await refreshSilent();
  }catch(e){ setStreamingUI(false); n.querySelector('.msg-content').innerHTML=`<div class="msg-error">⚠️ ${esc(e.message||'Image generation failed')}</div>`; }
}

/* ---------------- TTS ---------------- */
async function speak(text){
  if(state.s.plugins&&state.s.plugins.voice===false){ toast('Voice is disabled — enable it in Settings → Plugins'); return; }
  try{
    toast('Generating voice…', 1600);
    const r=await apiFetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.slice(0,4000)})});
    if(!r.ok){ let m='TTS failed ('+r.status+')'; try{ m=(await r.json()).error||m; }catch{} toast('⚠️ '+m); return; }
    const blob=await r.blob();
    if(state.audio) state.audio.pause();
    state.audio=new Audio(URL.createObjectURL(blob));
    state.audio.play().then(()=>toast('Playing voice 🎙️',1500)).catch(()=>toast('Playback blocked by browser'));
    await refreshSilent();
  }catch(e){ toast('⚠️ '+e.message); }
}

/* ---------------- search ---------------- */
async function fetchSearch(q){
  try{
    const r=await apiFetch('/api/search?q='+encodeURIComponent(q));
    const j=await r.json();
    const parts=[];
    if(j.heading||j.abstract) parts.push((j.heading?j.heading+': ':'')+(j.abstract||''));
    for(const t of (j.topics||[]).slice(0,5)) parts.push('- '+(t.url?`[${t.text}](${t.url})`:t.text));
    return parts.length?parts.join('\n'):null;
  }catch{ return null; }
}

/* ---------------- attachments ---------------- */
async function addAttachments(files){
  for(const f of files){
    const isImg=/^image\//.test(f.type)||/\.(png|jpe?g|gif|webp)$/i.test(f.name);
    if(isImg && !(state.s.plugins&&state.s.plugins.vision===false)){
      const b64=await fileToB64(f);
      attachments.push({kind:'image', name:f.name, mime:f.type||'image/png', b64, preview:`data:${f.type||'image/png'};base64,${b64}`});
    } else if(f.size<2_500_000 && (/^text\//.test(f.type)||/\.(md|txt|json|js|jsx|ts|tsx|html|css|py|java|c|cpp|sh|yml|yaml|xml|csv|ini|sql)$/i.test(f.name))){
      const txt=await f.text();
      attachments.push({kind:'file', name:f.name, text:`📎 File: ${f.name}\n\n\`\`\`\n${txt.slice(0,12000)}\n\`\`\``});
    } else {
      attachments.push({kind:'note', name:f.name, text:`📎 Attached: ${f.name} (${(f.size/1024).toFixed(0)} KB, ${f.type||'file'})`});
      toast('Tip: image attachments are read by the AI; for PDFs/Office files, paste the text instead.');
    }
  }
  renderAttach();
}
function fileToB64(f){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result).split(',')[1]); r.onerror=rej; r.readAsDataURL(f); }); }
function renderAttach(){
  const p=$('#attachPreview'); p.innerHTML='';
  p.classList.toggle('hidden', !attachments.length);
  attachments.forEach((a,i)=>{
    const c=el(`<span class="at-chip">${a.kind==='image'?`<img src="${a.preview}">`:ICONS.file}<span>${esc(a.name)}</span><span class="rm">✕</span></span>`);
    $('.rm',c).addEventListener('click',()=>{ attachments.splice(i,1); renderAttach(); });
    p.appendChild(c);
  });
}

/* ---------------- quick tools ---------------- */
async function quickTool(act){
  if(act==='shot'){
    const files=await filePick('image/*');
    if(!files.length||!files[0]) return;
    const f=files[0]; const b64=await fileToB64(f);
    state.selectedTool='code'; state.pill='code'; renderPills();
    const parts=[{type:'image',mime:f.type||'image/png',b64},{type:'text',text:'Convert this screenshot into a clean, modern, responsive web page. Use a single HTML file with embedded CSS and JS. Recreate the layout, colors and content as closely as possible. Put the complete page in one ```html fenced code block.'}];
    sendParts(parts);
  } else if(act==='img2prompt'){
    const files=await filePick('image/*');
    if(!files.length||!files[0]) return;
    const f=files[0]; const b64=await fileToB64(f);
    sendParts([{type:'image',mime:f.type||'image/png',b64},{type:'text',text:'Write a detailed prompt that could regenerate this exact image: subject, style, colors, lighting, composition, camera, mood. End with a single consolidated prompt line that starts with "PROMPT:"'}]);
  } else if(act==='idea'){
    setInput('');
    sendParts([{type:'text',text:'I have an idea and I want to turn it into a step-by-step plan. Ask me up to 5 clarifying questions first, then produce: 1) Summary, 2) 10-step execution plan, 3) tools I need, 4) estimated timeline.'}]);
  } else if(act==='blog'){
    sendParts([{type:'text',text:'Act as a professional blog writer. Pick a compelling topic related to AI tools and creativity, then write a 700-word blog post with a catchy title, subheadings, list and a call to action. Format in markdown.'}]);
  }
}
async function sendParts(parts){
  attachments=[]; renderAttach();
  const userMsg={id:rndId(), role:'user', parts, ts:Date.now()};
  state.msgs.push(userMsg);
  $('#welcomeCard').classList.add('hidden');
  $('#messages').appendChild(renderMsg(userMsg)); scrollBottom();
  setStreamingUI(true);
  state.abort=new AbortController();
  await runStream({ history:state.msgs.slice(0,-1).map(m=>({role:m.role, content:m.content, parts:m.parts})), chatId:state.chatId, userParts:parts, commitUser:true, system:systemFor(), modelProfile:state.profile, provider:state.profile?undefined:parseSel(state.selModel)[0], model:state.profile?undefined:parseSel(state.selModel)[1], reason:false, searchContext:null });
}

/* ---------------- agents ---------------- */
function openAgents(){
  renderAgents();
  $('#agentsModal').classList.remove('hidden');
  $('#modalBack').classList.remove('hidden');
  $('#settingsModal').classList.add('hidden');
}
function renderAgents(){
  const grid=$('#agentsGrid'); grid.innerHTML='';
  for(const a of (state.s.agents||[])){
    const color=AGENT_COLORS[a.icon]||'#8b5cf6';
    const c=el(`<button class="agent-card ${state.agent&&state.agent.id===a.id?'on':''}" data-id="${a.id}">
      <div class="agent-c"><span class="agent-ic" style="background:linear-gradient(135deg,${color},${shade(color)})">${ICONS[a.icon]||ICONS.bot}</span><span class="agent-n">${esc(a.name)}</span></div>
      <div class="agent-i">${esc(a.instruction||'').slice(0,110)}</div>
      <div class="agent-state">${state.agent&&state.agent.id===a.id?'✓ ACTIVE — click to deactivate':'Activate'}</div></button>`);
    c.addEventListener('click',()=>{
      if(state.agent&&state.agent.id===a.id){ state.agent=null; }
      else { state.agent=a; }
      renderAgents(); renderAgentChip(); toast(state.agent?`🤖 Agent "${a.name}" active`:'Agent off');
    });
    grid.appendChild(c);
  }
}
const AGENT_COLORS={code:'#4f8ff7',pen:'#f472b6',grid:'#34d399',web:'#22d3ee',globe:'#fbbf24',bot:'#8b5cf6',file:'#fb923c',zap:'#facc15'};

/* ---------------- settings ---------------- */
let currentSec='general';
function setSec(sec){
  currentSec=sec;
  $$('.set-tab').forEach(t=>t.classList.toggle('on', t.dataset.sec===sec));
  $$('.set-sec').forEach(s=>s.classList.toggle('hidden', s.id!=='sec-'+sec));
}
function openSettings(sec){
  const s=state.s;
  setSec(sec||'general');
  // general
  $('#setName').value=s.name||''; $('#setSystem').value=s.systemPrompt||'';
  $('#setTemp').value=s.temperature; $('#setMaxTokens').value=s.maxTokens;
  $('#limitText').value=s.limits.text; $('#limitImages').value=s.limits.images; $('#limitVoice').value=s.limits.voice;
  $('#limitVideo').value=s.limits.video; $('#limitMusic').value=s.limits.music;
  // appearance
  $$('#accentRow .accent').forEach(b=>b.classList.toggle('on', b.dataset.a===s.accent));
  $('#compactToggle').checked=!!s.compact;
  // profile
  $('#setWsName').value=s.wsName||'Aaru AI'; $('#setTagline').value=s.tagline||'';
  $('#wsLogoPrev').innerHTML = pendingLogo?`<img src="${pendingLogo}">`:(s.logo?`<img src="${esc(s.logo)}">`:'<span>🅰️</span>');
  // workspace tab
  $('#wsName2').value=s.wsName||'Aaru AI'; $('#wsTagline2').value=s.tagline||'';
  $('#dataPath').textContent=s.dataDir||'data/ (on this machine)';
  $('#dbMode').textContent=(s.dbMode==='postgres')?'PostgreSQL (DATABASE_URL)':(s.dbMode==='firebase')?'Firebase Firestore':(s.dbMode==='rtdb')?'Firebase Realtime DB':'JSON files (data/)';
  // security / account
  $('#acctUser').textContent=(s.user&&s.user.username)||'—';
  $('#authAllowSignup').checked=!!s.authAllowSignup;
  // api manager
  $('#imgProvider').innerHTML=s.providers.map(p=>`<option value="${p.id}" ${(s.image.provider||'openai')===p.id?'selected':''}>${esc(p.label)}</option>`).join('');
  $('#imgModel').value=(s.image.model||'gpt-image-1');
  $('#imgSize').value=(s.image.size||'1024x1024');
  $('#ttsProvider').innerHTML=s.providers.map(p=>`<option value="${p.id}" ${(s.tts.provider||'openai')===p.id?'selected':''}>${esc(p.label)}</option>`).join('');
  $('#ttsModel').value=(s.tts.model||'tts-1'); $('#ttsVoice').value=(s.tts.voice||'alloy');
  renderProvForm(); renderAiModels(); renderMcp(); renderPlugins();
  modalOpen(true);
}
function renderProvForm(){
  const pf=$('#providersForm'); pf.innerHTML='';
  for(const p of state.s.providers){
    const row=el(`<div class="prov-row" data-id="${p.id}">
      <div class="prov-head">
        <label class="switch"><input type="checkbox" ${p.enabled?'checked':''}><span class="tr"></span></label>
        <div class="prov-info">
          <div class="prov-name">${esc(p.label)}
            ${p.local?'<span class="badge free">FREE·LOCAL</span>':''}
            ${p.hasKey?'<span class="badge ready">Connected ✓</span>':'<span class="badge miss">Not connected</span>'}
          </div>
          <div class="prov-sub">${p.baseURL?esc(p.baseURL):'(no base URL set)'}</div>
        </div>
        ${p.keyURL?`<a class="linkish" href="${esc(p.keyURL)}" target="_blank" rel="noopener">Get key ↗</a>`:''}
      </div>
      <div class="prov-fields">
        <input class="inp key-inp" placeholder="${p.hasKey?'•••• '+p.keyTail+' — leave blank to keep':'Paste API key'}" type="password" autocomplete="off">
        <input class="inp url-inp" placeholder="Base URL" value="${esc(p.baseURL||'')}">
        <input class="inp model-inp" list="models-${p.id}" placeholder="${p.local?'Model e.g. llama3.2':'Model'}" value="${esc(p.model||'')}">
        <datalist id="models-${p.id}">${(p.models||[]).map(m=>`<option value="${esc(m)}">`).join('')}</datalist>
      </div></div>`);
    pf.appendChild(row);
  }
}
function renderAiModels(){
  const box=$('#aiModelsForm'); box.innerHTML='';
  for(const m of (state.s.aiModels||[])){
    box.appendChild(aiModelRow(m.id, m.name, m.provider, m.model));
  }
}
function aiModelRow(id, name, provider, model){
  const row=el(`<div class="model-row" data-id="${id}">
    <input class="inp m-name" placeholder="Profile name" value="${esc(name||'')}">
    <select class="inp m-prov">${state.s.providers.map(p=>`<option value="${p.id}" ${p.id===provider?'selected':''}>${esc(p.label)}</option>`).join('')}</select>
    <input class="inp m-model" placeholder="Model id" value="${esc(model||'')}">
    <button class="del-m" title="Remove">✕</button></div>`);
  $('.del-m',row).addEventListener('click',()=>row.remove());
  return row;
}
function renderMcp(){
  const box=$('#mcpForm'); box.innerHTML='';
  const cfg=state.s.mcp||{};
  for(const d of MCP_DEFS){
    const on=!!cfg[d.id];
    const row=el(`<div class="mcp-row" data-id="${d.id}">
      <span class="mcp-ic" style="background:${d.color}">${ICONS[d.icon]}</span>
      <div class="mcp-body"><div class="mcp-name">${d.label}</div><div class="mcp-sub">${d.sub}</div></div>
      <label class="switch"><input type="checkbox" data-on="${on?'1':'0'}" ${on?'checked':''}><span class="tr"></span></label></div>`);
    if(d.customUrl){
      const u=el(`<input class="inp mcp-custom-url" placeholder="ws://… / http://…" value="${esc(cfg.customUrl||'')}">`);
      $('.mcp-body',row).appendChild(u); u.style.marginTop='5px';
    }
    box.appendChild(row);
  }
}
function renderPlugins(){
  const box=$('#pluginForm'); box.innerHTML='';
  const cfg=state.s.plugins||{};
  for(const d of PLUGIN_DEFS){
    const on=cfg[d.id]!==false;
    const row=el(`<div class="plug-row" data-id="${d.id}">
      <span class="plug-ic" style="background:${d.color}">${ICONS[d.icon]}</span>
      <div class="plug-body"><div class="plug-name">${d.label}</div><div class="plug-sub">${d.sub}</div></div>
      <label class="switch"><input type="checkbox" ${on?'checked':''}><span class="tr"></span></label></div>`);
    box.appendChild(row);
  }
}
function modalOpen(open){
  $('#modalBack').classList.toggle('hidden', !open);
  $('#settingsModal').classList.toggle('hidden', !open);
  $('#agentsModal').classList.add('hidden');
}
async function saveSettings(){
  const providers={};
  $$('#providersForm .prov-row').forEach(row=>{
    const id=row.dataset.id;
    const key=$('.key-inp',row).value.trim();
    const baseURL=$('.url-inp',row).value.trim();
    const model=$('.model-inp',row).value.trim();
    const enabled=$('input[type=checkbox]',row).checked;
    const p={enabled};
    if(key) p.key=key;
    p.baseURL=baseURL; p.model=model;
    providers[id]=p;
  });
  const aiModels=$$('#aiModelsForm .model-row').map(r=>({
    id:r.dataset.id||('m-'+Math.random().toString(36).slice(2,7)),
    name:$('.m-name',r).value.trim(), provider:$('.m-prov',r).value, model:$('.m-model',r).value.trim(),
  })).filter(m=>m.name||m.model);
  const mcp={}; $$('#mcpForm .mcp-row').forEach(r=>{ mcp[r.dataset.id]=$('input[type=checkbox]',r).checked; const u=$('.mcp-custom-url',r); if(u) mcp.customUrl=u.value.trim(); });
  const plugins={}; $$('#pluginForm .plug-row').forEach(r=>{ plugins[r.dataset.id]=$('input[type=checkbox]',r).checked; });
  const body={
    authAllowSignup:$('#authAllowSignup').checked,
    name:$('#setName').value.trim(),
    wsName:$('#setWsName').value.trim()||'Aaru AI',
    tagline:$('#setTagline').value.trim(),
    logo:pendingLogo||(state.s.logo||''),
    accent: (($('#accentRow .accent.on')||{}).dataset||{}).a || 'indigo',
    compact:$('#compactToggle').checked,
    systemPrompt:$('#setSystem').value, temperature:+$('#setTemp').value, maxTokens:+$('#setMaxTokens').value,
    providers, aiModels, mcp, plugins,
    image:{provider:$('#imgProvider').value, model:$('#imgModel').value.trim(), size:$('#imgSize').value},
    tts:{provider:$('#ttsProvider').value, model:$('#ttsModel').value.trim(), voice:$('#ttsVoice').value},
    limits:{ text:+$('#limitText').value||50, images:+$('#limitImages').value||20, voice:+$('#limitVoice').value||10, video:+$('#limitVideo').value||5, music:+$('#limitMusic').value||10 },
  };
  const btn=$('#saveSettings'); btn.textContent='Saving…'; btn.disabled=true;
  try{
    const r=await apiFetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok) throw new Error((await r.json()).error||'save failed');
    await fetchState(); pendingLogo=null; renderBasics(); renderChat();
    $('#saveNote').textContent='Saved ✓'; toast('Settings saved ✓');
  }catch(e){ toast('⚠️ '+e.message); }
  btn.textContent='Save settings'; btn.disabled=false;
}
function a(elA){ return elA&&elA.dataset?elA.dataset.a:'indigo'; }

/* backup / reset */
async function exportBackup(){
  toast('Preparing backup…',1500);
  const r=await apiFetch('/api/export');
  const blob=await r.blob();
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='ai-os-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('Backup downloaded ✓');
}
async function importBackup(file){
  if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    const r=await apiFetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!r.ok) throw new Error('import failed');
    await fetchState(); renderBasics(); renderChat(); toast('Backup imported ✓');
  }catch(e){ toast('⚠️ '+e.message); }
}
async function resetAll(){
  if(!confirm('Reset EVERYTHING? All chats, usage and settings (incl. API keys) will be wiped.')) return;
  await apiFetch('/api/reset',{method:'POST'});
  await fetchState(); pendingLogo=null; newChat(); renderBasics(); toast('Workspace reset to defaults ✓');
}

/* ---------------- events ---------------- */
function bind(){
  bootIcons();
  $('#newChatBtn').addEventListener('click',newChat);
  $('#sidebarToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#topSettingsBtn').addEventListener('click',()=>openSettings());
  $('#sideSettings').addEventListener('click',()=>openSettings());
  $('#bellBtn').addEventListener('click',()=>toast('🔔 No new notifications'));
  $('#newWorkspaceBtn').addEventListener('click',()=>{ newChat(); toast('New workspace session created ✨'); });
  $('#saveSettings').addEventListener('click',saveSettings);
  $('#helpBtn').addEventListener('click',()=>{ $('#settingsModal').classList.add('hidden'); $('#helpModal').classList.remove('hidden'); buildHelp(); });
  $('#helpBtn2').addEventListener('click',()=>{ $('#settingsModal').classList.add('hidden'); $('#helpModal').classList.remove('hidden'); buildHelp(); });
  $('#modalBack').addEventListener('click',(e)=>{ if(e.target.id==='modalBack') modalOpen(false); });
  $$('#modalBack [data-close]').forEach(b=>b.addEventListener('click',()=>modalOpen(false)));
  // settings tabs
  $$('.set-tab').forEach(t=>t.addEventListener('click',()=>setSec(t.dataset.sec)));
  // accents
  $$('#accentRow .accent').forEach(b=>b.addEventListener('click',()=>{ $$('#accentRow .accent').forEach(x=>x.classList.remove('on')); b.classList.add('on'); }));
  // logo
  $('#logoUploadBtn').addEventListener('click',()=>$('#wsLogoFile').click());
  $('#logoClearBtn').addEventListener('click',()=>{ pendingLogo=''; $('#wsLogoPrev').innerHTML='<span>🅰️</span>'; toast('Logo will be removed on save'); });
  $('#wsLogoFile').addEventListener('change',async(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    if(f.size>300*1024){ toast('Logo too big — max ~300KB'); return; }
    pendingLogo=await fileToB64(f);
    $('#wsLogoPrev').innerHTML=`<img src="${pendingLogo}" alt="logo">`;
    toast('Logo attached — press Save settings');
  });
  // models add
  $('#aiModelsAdd').addEventListener('click',()=>{ $('#aiModelsForm').insertBefore(aiModelRow('m-'+Math.random().toString(36).slice(2,7),'',state.s.providers[0].id,''), $('#aiModelsForm').firstChild); });
  $('#apiAddBtn').addEventListener('click',()=>{ toast('All supported APIs are listed below — enable one and add its key'); });
  // export/import/reset
  $('#exportBtn').addEventListener('click',exportBackup);
  $('#importBtn').addEventListener('click',()=>$('#importFile').click());
  $('#importFile').addEventListener('change',e=>importBackup(e.target.files&&e.target.files[0]));
  $('#resetBtn').addEventListener('click',resetAll);
  $('#logoutBtn').addEventListener('click',async()=>{
    await apiFetch('/api/auth/logout',{method:'POST'});
    window.location.replace('/login.html');
  });
  // agents
  $('#agentChip').addEventListener('click',openAgents);
  $('#agentSave').addEventListener('click',()=>{
    const name=$('#agentName').value.trim(); const instr=$('#agentInstr').value.trim();
    if(!name||!instr){ toast('Give your agent a name and instructions'); return; }
    state.s.agents.push({id:'a-u'+Math.random().toString(36).slice(2,7), name, instruction:instr, icon:'bot'});
    $('#agentName').value=''; $('#agentInstr').value='';
    renderAgents(); toast('Agent added ✓ (it appears in the list above)');
  });
  // preview
  $('#pvClose').addEventListener('click',()=>{ state.preview=null; $('#workspace').classList.remove('with-preview'); $('#previewPanel').classList.add('hidden'); $('#pvEmpty').style.display=''; $('#pvFrame').srcdoc=''; });
  $('#pvCopy').addEventListener('click',()=>{ if(state.preview) copyText(state.preview.code); });
  $('#pvRefresh').addEventListener('click',()=>{ if(state.preview) $('#pvFrame').srcdoc=state.preview.doc; });
  $('#pvNewTab').addEventListener('click',()=>{
    if(!state.preview) return;
    const blob=new Blob([state.preview.doc],{type:'text/html'});
    window.open(URL.createObjectURL(blob),'_blank');
  });
  $('#pvCodeBtn').addEventListener('click',togglePvCode);
  $$('.pv-dev').forEach(b=>b.addEventListener('click',()=>pvSetDevice(b.dataset.dev)));
  $('#pvFile').addEventListener('click',togglePvCode);
  $('#openProject').addEventListener('click',()=>{ if(state.chatId) openChat(state.chatId); else { newChat(); toast('This is your new project — say something to start!'); } });
  $('#seeAllBtn').addEventListener('click',()=>{ state.searchOn=!state.searchOn; $('#seeAllBtn').textContent=state.searchOn?'Show less':'See all'; renderRecents($('#globalSearch').value.trim()); });
  $('#globalSearch').addEventListener('input',e=>renderRecents(e.target.value.trim()));
  $('#globalSearch').addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.value.trim()){ const v=e.target.value.trim(); e.target.value=''; newChat(); setInput(v); send(); } });
  window.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); $('#globalSearch').focus(); } if(e.key==='Escape') modalOpen(false); });
  const area=$('#input');
  area.addEventListener('input',()=>autoGrow(area));
  area.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } });
  $('#sendBtn').addEventListener('click',send);
  $('#attachBtn').addEventListener('click',async()=>{ const files=await filePick(); if(files.length) await addAttachments(files); });
  $('#drawBtn').addEventListener('click',()=>{ state.drawMode=!state.drawMode; $('#drawBtn').classList.toggle('on',state.drawMode); toast(state.drawMode?'🎨 Draw mode ON — type a prompt and press Enter':'Draw mode off'); });
  $('#webSearchBtn').addEventListener('click',()=>{ if(state.s.plugins&&state.s.plugins.webSearch===false){ toast('Web search is disabled — enable it in Settings → Plugins'); return; } state.webSearch=!state.webSearch; $('#webSearchBtn').classList.toggle('on',state.webSearch); });
  $('#reasonBtn').addEventListener('click',()=>{ state.reason=!state.reason; $('#reasonBtn').classList.toggle('on',state.reason); });
  $('#micBtn').addEventListener('click',micInput);
  document.addEventListener('click',(e)=>{
    const b=e.target.closest('.code-copy');
    if(b){ const pre=b.parentElement.nextElementSibling; if(pre) copyText(pre.querySelector('code').innerText); }
  });
}
function autoGrow(t){ t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,190)+'px'; }
let recog=null, listening=false;
function micInput(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ toast('Voice input needs a browser with SpeechRecognition (Chrome/Edge)'); return; }
  if(!recog){ recog=new SR(); recog.lang='en-IN'; recog.interimResults=false; recog.onresult=(e)=>{ const t=e.results[0][0].transcript; const a=$('#input'); a.value=(a.value? a.value+' ':'')+t; autoGrow(a); }; recog.onend=()=>{ listening=false; $('#micBtn').classList.remove('on'); }; recog.onerror=()=>{ listening=false; $('#micBtn').classList.remove('on'); }; }
  if(listening){ recog.stop(); return; }
  try{ recog.start(); listening=true; $('#micBtn').classList.add('on'); toast('Listening… speak now'); }catch{ toast('Mic unavailable — allow microphone access'); }
}
function buildHelp(){
  const list=$('#helpList'); list.innerHTML='';
  for(const p of (state.s.providers||[]).filter(x=>x.keyURL&&!x.local)){
    list.appendChild(el(`<li><b>${esc(p.label)}</b> — <a class="linkish" style="font-size:13px" href="${esc(p.keyURL)}" target="_blank" rel="noopener">get an API key</a></li>`));
  }
}

/* ---------------- init ---------------- */
(async function init(){
  bind();
  try{
    await fetchState();
    renderBasics();
    // restore branding from config after first paint
    document.body.dataset.accent=state.s.accent||'indigo';
  }catch(e){
    toast('⚠️ Could not load server state');
    console.error(e);
  }
})();
