import { useState, useCallback, useEffect } from "react";

const CRM_ID = "1PgVO-bwV0ewACExAoG48XxDK0K4UEtrYmBlc7CLIdpk";

function windowStatus(season) {
  const M={JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
  const [mo,yr]=season.split(" ");
  const now=new Date(),cm=now.getMonth()+1,cy=now.getFullYear();
  const ey=parseInt(yr),em=M[mo],ahead=(ey-cy)*12+(em-cm);
  if(ahead<=0)  return{label:"EVENT PASSED",   cls:"w-dead"};
  if(ahead===1) return{label:"LAST CHANCE",    cls:"w-red"};
  if(ahead<=3)  return{label:"WINDOW CLOSING", cls:"w-yellow"};
  if(ahead<=6)  return{label:"★ IN WINDOW",    cls:"w-green"};
  if(ahead<=8)  return{label:"OPENS SOON",     cls:"w-yellow"};
  return              {label:`OPENS IN ${ahead-6}MO`,cls:"w-muted"};
}

const EVENTS=[
  {id:"coachella", label:"Coachella",         season:"APR 2026",cat:"Music Festival" },
  {id:"superbowl", label:"Super Bowl LXI",    season:"FEB 2027",cat:"Sports"         },
  {id:"comiccon",  label:"Comic-Con",         season:"JUL 2026",cat:"Pop Culture"    },
  {id:"sxsw",      label:"SXSW",              season:"MAR 2027",cat:"Tech / Culture" },
  {id:"nba",       label:"NBA Finals",        season:"JUN 2026",cat:"Sports"         },
  {id:"ces",       label:"CES",               season:"JAN 2027",cat:"Consumer Tech"  },
  {id:"cannes",    label:"Cannes Lions",      season:"JUN 2026",cat:"Advertising"    },
  {id:"essence",   label:"Essence Fest",      season:"JUL 2026",cat:"Music / Culture"},
  {id:"artbasel",  label:"Art Basel Miami",   season:"DEC 2026",cat:"Art / Culture"  },
  {id:"burningman",label:"Burning Man",       season:"AUG 2026",cat:"Festival"       },
  {id:"nfl_draft", label:"NFL Draft",         season:"APR 2027",cat:"Sports"         },
  {id:"grammy",    label:"Grammy Week",       season:"FEB 2027",cat:"Music"          },
];

const DOROTHY_WINS=[
  {client:"Nike",   work:"athlete experience zone at a major sporting event",              ctx:"sports performance consumer athletic"  },
  {client:"Uber",   work:"branded transportation hub and hospitality at a live event",    ctx:"mobility tech rideshare consumer"      },
  {client:"Hisense",work:"immersive product showcase and sensory demo at CES",            ctx:"consumer electronics tech hardware"    },
  {client:"Moloco", work:"B2B thought leadership lounge at an ad-tech summit",            ctx:"technology b2b advertising software"   },
  {client:"NBC",    work:"fan activation and social content capture experience",          ctx:"media entertainment broadcast streaming"},
];

function pickWin(lead){
  const ctx=`${lead.industry} ${lead.experientialStatus}`.toLowerCase();
  return DOROTHY_WINS.find(w=>ctx.split(/\s+/).some(k=>k.length>3&&w.ctx.includes(k)))||DOROTHY_WINS[0];
}
function hookColor(s){return s>=8?"#00D46A":s>=6?"#F5C400":"#555";}
function daysSince(d){return Math.max(0,Math.floor((Date.now()-new Date(d).getTime())/(864e5)));}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}

function pipeStatus(entry){
  if(entry.meetingBooked) return{label:"MEETING BOOKED",cls:"ps-meeting",urgent:false};
  if(entry.status==="DEAD") return{label:"CLOSED",cls:"ps-dead",urgent:false};
  const d=daysSince(entry.sentAt);
  if(d>10) return{label:"FOLLOW UP NOW",cls:"ps-urgent",urgent:true};
  if(d>=5) return{label:"FOLLOW UP SOON",cls:"ps-warn",urgent:false};
  return{label:"ACTIVE",cls:"ps-active",urgent:false};
}

function safeJSON(text){
  if(!text)return null;
  let c=text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").replace(/\[\d+\]/g,"")
            .replace(/\u2019/g,"'").replace(/\u201c|\u201d/g,'"').trim();
  try{return JSON.parse(c);}catch{}
  const om=c.match(/\{[\s\S]*\}/);
  if(om){try{return JSON.parse(om[0]);}catch{}}
  const lm=c.match(/"leads"\s*:\s*(\[[\s\S]*?\])\s*[},]/);
  if(lm){try{return{leads:JSON.parse(lm[1])};}catch{}}
  return null;
}
function extractText(content){
  if(!Array.isArray(content))return typeof content==="string"?content:"";
  return content.map(b=>{
    if(b.type==="text")return b.text;
    if(b.type==="mcp_tool_result"&&Array.isArray(b.content))
      return b.content.filter(x=>x.type==="text").map(x=>x.text).join("\n");
    return"";
  }).join("\n");
}
async function apiFetch(payload){
  const res=await fetch("https://dorothy-intel-production.up.railway.app/api/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data.type==="error")throw new Error(data?.error?.message||`API error ${res.status}`);
  return data;
}

/* ─ Arc gauge SVG ───────────────────────────────────────────── */
function ArcGauge({rate}){
  const r=38,cx=50,cy=54,circ=2*Math.PI*r;
  const filled=(rate/100)*circ*0.75;
  const total=circ*0.75;
  const color=rate>=40?"#00D46A":rate>=20?"#F5C400":"#FF4040";
  return(
    <svg width="108" height="90" viewBox="0 0 100 90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f1f1f" strokeWidth="7"
        strokeDasharray={`${total} ${circ}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{transition:"stroke-dasharray .6s ease"}}/>
      <text x="50" y="52" textAnchor="middle" fill="#fff"
        style={{fontFamily:"Barlow Condensed,sans-serif",fontWeight:900,fontSize:22}}>{rate}%</text>
      <text x="50" y="66" textAnchor="middle" fill="#555"
        style={{fontFamily:"IBM Plex Mono,monospace",fontSize:7,letterSpacing:2}}>HIT RATE</text>
    </svg>
  );
}

/* ════════════ CSS ════════════════════════════════════════════════ */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080808;--bg2:#0f0f0f;--panel:#111;--card:#161616;
  --line:#1f1f1f;--line2:#2a2a2a;
  --y:#F5C400;--y2:#C9A000;--yg:rgba(245,196,0,.12);
  --w:#fff;--dim:#888;--muted:#444;--dead:#2a2a2a;
  --green:#00D46A;--red:#FF4040;
  --mono:'IBM Plex Mono',monospace;--disp:'Barlow Condensed',sans-serif;
}
html,body{background:var(--bg);color:var(--w);height:100%}
.app{font-family:var(--mono);background:var(--bg);min-height:100vh;display:flex;flex-direction:column}

.hdr{background:var(--bg);border-bottom:1px solid var(--line2);padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;position:relative}
.hdr::after{content:'';position:absolute;bottom:0;left:0;width:200px;height:1px;background:var(--y)}
.logo{display:flex;align-items:center;gap:12px}
.logo-d{width:32px;height:32px;background:var(--y);display:flex;align-items:center;justify-content:center;clip-path:polygon(0 0,100% 0,100% 80%,80% 100%,0 100%);flex-shrink:0}
.logo-d span{font-family:var(--disp);font-weight:900;font-size:18px;color:#000;line-height:1}
.logo-name{font-family:var(--disp);font-weight:800;font-size:17px;color:var(--w);letter-spacing:.12em}
.logo-sub{font-size:8px;color:var(--y);letter-spacing:.25em;margin-top:2px;font-weight:600}
.hdr-r{display:flex;align-items:center;gap:16px}
.status-live{display:flex;align-items:center;gap:6px;font-size:9px;color:var(--dim);letter-spacing:.15em}
.dot{width:5px;height:5px;border-radius:50%;background:var(--y);animation:blink 2s ease-in-out infinite}
.dot.green{background:var(--green)}.dot.dead{background:var(--dead);animation:none}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.hdr-date{font-size:8px;color:var(--muted);letter-spacing:.12em}

.tabs{background:var(--bg);border-bottom:1px solid var(--line2);display:flex;padding:0 24px;flex-shrink:0;overflow-x:auto}
.tab{font-family:var(--mono);font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--muted);background:none;border:none;border-bottom:2px solid transparent;padding:14px 14px 13px;cursor:pointer;transition:color .15s,border-color .15s;display:flex;align-items:center;gap:7px;white-space:nowrap}
.tab:hover{color:#777}.tab.on{color:var(--y);border-bottom-color:var(--y)}
.tab-n{background:var(--y);color:#000;font-size:8px;font-weight:700;width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tab-new{background:#1a1a1a;color:var(--dim);border:1px solid #333;font-size:7px;padding:2px 5px;margin-left:2px}
.tab-alert{background:var(--red);color:#fff;font-size:8px;font-weight:700;width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:blink 1.5s ease-in-out infinite}
.tab-crumb{margin-left:auto;display:flex;align-items:center;padding:0 4px;font-size:8px;color:var(--muted);letter-spacing:.1em;white-space:nowrap}
.tab-crumb strong{color:var(--y);font-weight:600}

.body{flex:1;overflow:hidden;display:flex;flex-direction:column}
.content{flex:1;padding:20px 24px;overflow-y:auto}
.err{margin:16px 24px 0;padding:11px 14px;background:rgba(255,64,64,.08);border:1px solid rgba(255,64,64,.3);font-size:10px;color:#ff7070;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;word-break:break-word}
.err button{background:none;border:none;color:#ff5050;cursor:pointer;font-size:12px;flex-shrink:0}

/* LEADS */
.leads-wrap{display:grid;grid-template-columns:260px 1fr;gap:16px;height:calc(100vh - 116px)}
.event-panel{background:var(--panel);border:1px solid var(--line2);display:flex;flex-direction:column;overflow:hidden}
.panel-hdr{padding:11px 14px;border-bottom:1px solid var(--line2);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.panel-lbl{font-size:8px;font-weight:600;letter-spacing:.22em;color:var(--muted)}
.panel-count{font-size:8px;color:var(--dead)}
.event-list{overflow-y:auto;flex:1}
.ev-item{padding:10px 14px;border-bottom:1px solid var(--line);cursor:pointer;transition:background .12s;border-left:2px solid transparent}
.ev-item:hover{background:var(--card)}.ev-item.on{background:var(--card);border-left-color:var(--y)}
.ev-name{font-family:var(--disp);font-weight:700;font-size:14px;color:var(--w);letter-spacing:.04em}
.ev-row{display:flex;align-items:center;justify-content:space-between;margin-top:3px;gap:4px}
.ev-cat{font-size:8px;color:var(--dim);letter-spacing:.08em}.ev-date{font-size:8px;color:var(--y);letter-spacing:.06em}
.ev-win{font-size:7px;font-weight:700;letter-spacing:.1em;padding:2px 5px;display:inline-block;margin-top:4px}
.w-green{color:var(--green);border:1px solid var(--green);background:rgba(0,212,106,.06)}
.w-yellow{color:var(--y);border:1px solid rgba(245,196,0,.5)}
.w-red{color:var(--red);border:1px solid var(--red)}
.w-muted{color:var(--muted);border:1px solid #333}.w-dead{color:#333;border:1px solid #222}
.gen-btn{margin:14px;padding:12px;background:var(--y);color:#000;font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:.2em;border:none;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px;flex-shrink:0}
.gen-btn:hover:not(:disabled){background:#ffd700}
.gen-btn:disabled{background:var(--line2);color:var(--muted);cursor:not-allowed}
.results-panel{background:var(--panel);border:1px solid var(--line2);display:flex;flex-direction:column;overflow:hidden}
.sort-row{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--line);flex-shrink:0}
.sort-lbl{font-size:7px;color:var(--muted);letter-spacing:.18em}
.sort-btn{font-family:var(--mono);font-size:7px;letter-spacing:.12em;padding:3px 8px;background:none;border:1px solid var(--line2);color:var(--dim);cursor:pointer;transition:all .12s}
.sort-btn.on{background:var(--y);color:#000;border-color:var(--y)}
.leads-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:14px;overflow-y:auto;flex:1}
.lcard{background:var(--card);border:1px solid var(--line2);padding:14px;cursor:pointer;transition:border-color .15s,background .15s;position:relative;overflow:hidden;animation:fadeUp .3s ease both}
.lcard:nth-child(1){animation-delay:0ms}.lcard:nth-child(2){animation-delay:50ms}.lcard:nth-child(3){animation-delay:100ms}
.lcard:nth-child(4){animation-delay:150ms}.lcard:nth-child(5){animation-delay:200ms}.lcard:nth-child(6){animation-delay:250ms}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.lcard::after{content:'';position:absolute;top:0;left:0;width:3px;height:100%;background:var(--y);transform:scaleY(0);transition:transform .15s;transform-origin:bottom}
.lcard:hover{background:#1a1a1a}.lcard:hover::after,.lcard.sel::after{transform:scaleY(1)}
.lcard.sel{border-color:var(--y);background:#1a1900}
.lcard-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.hook-score{font-family:var(--disp);font-weight:900;font-size:32px;line-height:1;flex-shrink:0}
.hook-label{font-size:7px;color:var(--muted);letter-spacing:.15em;margin-top:2px}
.brand-n{font-family:var(--disp);font-weight:800;font-size:20px;color:var(--w);line-height:1;letter-spacing:.02em}
.brand-ind{font-size:8px;color:var(--dim);letter-spacing:.15em;margin-top:2px;text-transform:uppercase}
.badge-row{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}
.badge{font-size:7px;font-weight:700;letter-spacing:.12em;padding:3px 6px;border:1px solid;text-transform:uppercase}
.b-active{color:var(--green);border-color:var(--green);background:rgba(0,212,106,.07)}
.b-emerging{color:var(--y);border-color:var(--y);background:var(--yg)}
.b-untapped{color:var(--muted);border-color:#333}
.b-crm{color:var(--y);border-color:var(--y);background:var(--yg)}.b-nocrm{color:#444;border-color:var(--dead)}
.opp-note{font-size:10px;color:#777;margin-top:9px;line-height:1.55}
.hook-note{font-size:9px;color:#555;margin-top:6px;line-height:1.5;font-style:italic}
.dm-mini{margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
.dm-mini-lbl{font-size:7px;color:var(--muted);letter-spacing:.18em}
.dm-mini-name{font-size:12px;color:var(--w);margin-top:2px;font-weight:500}
.dm-mini-title{font-size:9px;color:var(--dim);margin-top:1px}
.card-cta{font-size:8px;color:var(--muted);letter-spacing:.12em;margin-top:9px}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;text-align:center}
.empty-icon{font-size:28px;color:#222}.empty-txt{font-size:9px;color:#333;letter-spacing:.2em}.empty-sub{font-size:8px;color:var(--y);letter-spacing:.1em}
.loader{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:18px}
.spin{width:36px;height:36px;border:2px solid var(--line2);border-top-color:var(--y);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.load-msg{font-size:9px;color:var(--dim);letter-spacing:.2em}.load-phase{font-size:8px;color:var(--muted);margin-top:4px;letter-spacing:.12em}

/* TARGET PKG */
.pkg-hero{background:var(--panel);border:1px solid var(--line2);padding:22px 24px;margin-bottom:14px;position:relative;overflow:hidden}
.pkg-hero::before{content:'';position:absolute;top:0;right:0;width:180px;height:180px;background:var(--yg);clip-path:polygon(100% 0,100% 100%,0 0);pointer-events:none}
.pkg-name{font-family:var(--disp);font-weight:900;font-size:42px;color:var(--w);letter-spacing:.03em;line-height:1}
.pkg-sub{font-size:9px;color:var(--y);letter-spacing:.2em;margin-top:6px}
.pkg-summary{font-size:11px;color:#888;line-height:1.75;margin-top:12px;max-width:720px}
.pkg-grid{display:grid;grid-template-columns:1fr 300px;gap:14px}
.s-lbl{font-size:8px;font-weight:700;letter-spacing:.22em;color:var(--muted);margin-bottom:10px;text-transform:uppercase}
.win-box{background:#0e1209;border:1px solid #233018;padding:14px 16px;margin-bottom:12px;border-left:3px solid var(--green)}
.win-lbl{font-size:7px;font-weight:700;letter-spacing:.2em;color:var(--green);margin-bottom:8px}
.win-hl{font-family:var(--disp);font-weight:700;font-size:16px;color:var(--w);line-height:1.3}
.win-det{font-size:10px;color:#777;margin-top:6px;line-height:1.6}
.hl-card{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--y);padding:12px 14px;margin-bottom:8px}
.hl-title{font-size:12px;color:var(--w);font-weight:500;line-height:1.4}
.hl-sum{font-size:10px;color:#666;margin-top:5px;line-height:1.5}
.hl-date{font-size:8px;color:var(--muted);margin-top:5px;letter-spacing:.1em}
.hist-box{background:var(--panel);border:1px solid var(--line);padding:14px;font-size:11px;color:#777;line-height:1.8;margin-bottom:14px}
.mutual-box{background:var(--bg2);border:1px solid var(--line2);padding:12px 14px;margin-top:12px}
.mutual-lbl{font-size:8px;font-weight:700;letter-spacing:.2em;color:var(--muted);margin-bottom:6px}
.mutual-input{width:100%;background:none;border:none;color:#aaa;font-family:var(--mono);font-size:10px;line-height:1.6;outline:none;resize:none;min-height:48px}
.mutual-input::placeholder{color:#333}
.notes-input{width:100%;background:var(--bg2);border:1px solid var(--line2);color:#888;font-family:var(--mono);font-size:10px;line-height:1.7;padding:12px 14px;outline:none;resize:vertical;margin-top:12px;min-height:72px}
.notes-input::placeholder{color:var(--dead)}.notes-input:focus{border-color:var(--muted)}
.dm-card{background:var(--panel);border:1px solid var(--line2);padding:18px;margin-bottom:12px}
.dm-name-big{font-family:var(--disp);font-weight:800;font-size:22px;color:var(--w);line-height:1}
.dm-title-big{font-size:10px;color:var(--y);letter-spacing:.12em;margin-top:5px}
.dm-notes-txt{font-size:10px;color:var(--dim);margin-top:11px;line-height:1.6}
.crm-tag{margin-top:12px;padding:8px 10px;background:rgba(245,196,0,.07);border:1px solid rgba(245,196,0,.2);font-size:8px;color:var(--y);letter-spacing:.15em}
.crm-detail{font-size:9px;color:var(--dim);margin-top:4px}
.pitch-box{background:#151100;border:1px solid #302800;padding:14px;font-size:11px;color:var(--y);line-height:1.7;margin-bottom:12px}
.pitch-lbl{font-size:7px;font-weight:700;color:var(--y2);letter-spacing:.2em;margin-bottom:6px}
.act-item{padding:9px 12px;background:var(--panel);border:1px solid var(--line);margin-bottom:7px;font-size:10px;color:#777;line-height:1.5}
.email-btn{width:100%;padding:13px;background:transparent;color:var(--y);font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:.2em;border:1px solid var(--y);cursor:pointer;transition:all .15s;margin-top:14px}
.email-btn:hover:not(:disabled){background:var(--y);color:#000}
.email-btn:disabled{opacity:.4;cursor:not-allowed}
.section{margin-bottom:16px}

/* OUTREACH */
.out-wrap{max-width:860px}
.out-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;gap:16px}
.out-title-sm{font-size:8px;color:var(--muted);letter-spacing:.2em;margin-bottom:5px}
.out-title{font-family:var(--disp);font-weight:800;font-size:26px;color:var(--w);line-height:1}
.btn-row{display:flex;gap:8px;align-items:center;flex-shrink:0;flex-wrap:wrap}
.btn-p{padding:9px 16px;background:var(--y);color:#000;font-family:var(--mono);font-size:8px;font-weight:700;letter-spacing:.18em;border:none;cursor:pointer;transition:background .15s;white-space:nowrap}
.btn-p:hover{background:#ffd700}
.btn-g{padding:9px 16px;background:rgba(0,212,106,.12);color:var(--green);font-family:var(--mono);font-size:8px;font-weight:700;letter-spacing:.15em;border:1px solid var(--green);cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-g:hover{background:var(--green);color:#000}
.btn-o{padding:9px 16px;background:none;color:var(--dim);font-family:var(--mono);font-size:8px;font-weight:500;letter-spacing:.15em;border:1px solid var(--line2);cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-o:hover{border-color:var(--muted);color:#aaa}
.seq-tabs{display:flex;gap:0;margin-bottom:12px;border:1px solid var(--line2)}
.seq-tab{flex:1;padding:11px 12px;background:none;border:none;border-right:1px solid var(--line2);cursor:pointer;transition:all .15s;text-align:left}
.seq-tab:last-child{border-right:none}.seq-tab.on{background:var(--card)}
.seq-tab-day{font-size:8px;color:var(--muted);letter-spacing:.15em;margin-bottom:3px}
.seq-tab-label{font-family:var(--disp);font-weight:700;font-size:13px;color:var(--dim);letter-spacing:.06em}
.seq-tab.on .seq-tab-label{color:var(--y)}
.seq-tab-bar{height:2px;background:transparent;margin-top:8px;transition:background .15s}
.seq-tab.on .seq-tab-bar{background:var(--y)}
.composer{background:var(--panel);border:1px solid var(--line2);margin-bottom:12px}
.comp-row{display:flex;border-bottom:1px solid var(--line);align-items:flex-start}
.comp-lbl{font-size:8px;font-weight:700;letter-spacing:.18em;color:var(--muted);padding:14px 16px;width:72px;flex-shrink:0}
.comp-val{flex:1;font-size:12px;color:var(--w);padding:13px 16px 13px 0;line-height:1.5}
.comp-val.sub{color:var(--y);font-family:var(--disp);font-size:16px;font-weight:700}
.comp-body{padding:18px 24px;border-bottom:1px solid var(--line)}
.greet{font-size:12px;color:#aaa;margin-bottom:12px}
.body-area{width:100%;background:none;border:none;color:#c0c0c0;font-family:var(--mono);font-size:11px;line-height:1.9;outline:none;resize:none;min-height:180px}
.sign{font-size:11px;color:#555;margin-top:12px;white-space:pre-line;line-height:1.8}
.comp-footer{padding:11px 18px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.wc{margin-left:auto;font-size:8px;color:var(--dead);letter-spacing:.1em}
.asset-box{background:var(--panel);border:1px solid var(--line2);padding:18px;margin-bottom:12px}
.asset-lbl{font-size:8px;font-weight:700;letter-spacing:.2em;color:var(--y);margin-bottom:12px}
.asset-hl{font-family:var(--disp);font-weight:700;font-size:18px;color:var(--w);line-height:1.2;margin-bottom:10px}
.asset-s{margin-bottom:10px}
.asset-s-lbl{font-size:7px;font-weight:700;letter-spacing:.18em;color:var(--muted);margin-bottom:4px}
.asset-s-txt{font-size:10px;color:#888;line-height:1.65}
.asset-rel{background:#151100;border:1px solid #302800;padding:10px 12px;font-size:10px;color:var(--y);line-height:1.6;margin-top:10px}
.hooks-bar{background:var(--panel);border:1px solid var(--line);padding:11px 16px;display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}
.hooks-lbl{font-size:7px;font-weight:600;letter-spacing:.2em;color:var(--muted);flex-shrink:0;padding-top:1px}
.hooks-grid{display:flex;gap:20px;flex-wrap:wrap}
.hook-item{font-size:9px;color:#666}
.hook-item strong{color:var(--y);font-weight:600}

/* PIPELINE */
.pipe-wrap{max-width:900px}
.pipe-stats{display:grid;grid-template-columns:auto 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:22px;align-items:stretch}
.stat-box{background:var(--panel);border:1px solid var(--line2);padding:16px 18px;display:flex;flex-direction:column;justify-content:center}
.stat-big{font-family:var(--disp);font-weight:900;font-size:38px;color:var(--w);line-height:1}
.stat-big.green{color:var(--green)}.stat-big.yellow{color:var(--y)}.stat-big.red{color:var(--red)}
.stat-lbl{font-size:7px;color:var(--muted);letter-spacing:.2em;margin-top:4px}
.pipe-add{background:var(--panel);border:1px solid var(--line2);padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.pipe-add-lbl{font-size:8px;font-weight:700;letter-spacing:.2em;color:var(--muted);margin-bottom:6px}
.pipe-input{background:var(--bg2);border:1px solid var(--line2);color:var(--w);font-family:var(--mono);font-size:10px;padding:8px 10px;outline:none;min-width:120px;flex:1}
.pipe-input::placeholder{color:var(--muted)}.pipe-input:focus{border-color:var(--muted)}
.add-btn{padding:9px 16px;background:var(--y);color:#000;font-family:var(--mono);font-size:8px;font-weight:700;letter-spacing:.18em;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0}
.add-btn:hover{background:#ffd700}
.add-btn:disabled{background:var(--line2);color:var(--muted);cursor:not-allowed}

.pipe-sort-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.pipe-entry{background:var(--card);border:1px solid var(--line2);padding:14px 16px;margin-bottom:8px;display:grid;grid-template-columns:200px 1fr auto auto;align-items:center;gap:14px;transition:border-color .15s;animation:fadeUp .25s ease both}
.pipe-entry.urgent{border-left:3px solid var(--red);animation:fadeUp .25s ease both,urgentPulse 3s ease-in-out infinite}
@keyframes urgentPulse{0%,100%{border-left-color:var(--red)}50%{border-left-color:rgba(255,64,64,.3)}}
.pipe-entry.meeting{border-left:3px solid var(--green);opacity:.7}
.pe-brand{font-family:var(--disp);font-weight:800;font-size:17px;color:var(--w);line-height:1}
.pe-contact{font-size:9px;color:var(--dim);margin-top:2px}
.pe-event{font-size:8px;color:var(--muted);margin-top:3px;letter-spacing:.06em}
.timeline-col{display:flex;flex-direction:column;gap:5px}
.timeline-track{height:4px;background:var(--line2);position:relative;overflow:hidden}
.timeline-fill{height:100%;transition:width .6s ease}
.timeline-meta{display:flex;align-items:center;justify-content:space-between}
.timeline-days{font-size:8px;color:var(--muted);letter-spacing:.1em}
.pipe-status-col{text-align:right;min-width:110px}
.pipe-badge{font-size:7px;font-weight:700;letter-spacing:.12em;padding:3px 8px;border:1px solid;text-transform:uppercase;white-space:nowrap}
.ps-meeting{color:var(--green);border-color:var(--green);background:rgba(0,212,106,.08)}
.ps-urgent{color:var(--red);border-color:var(--red);background:rgba(255,64,64,.08)}
.ps-warn{color:var(--y);border-color:var(--y);background:var(--yg)}
.ps-active{color:var(--muted);border-color:#333}
.ps-dead{color:#333;border-color:#222}
.mtg-col{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0}
.mtg-lbl{font-size:7px;color:var(--muted);letter-spacing:.12em}
.mtg-check{width:20px;height:20px;border:1.5px solid var(--line2);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
.mtg-check:hover{border-color:var(--green)}
.mtg-check.checked{background:var(--green);border-color:var(--green)}
.mtg-check.checked::after{content:'✓';font-size:11px;color:#000;font-weight:700}
.del-btn{background:none;border:none;color:#333;cursor:pointer;font-size:14px;padding:2px 4px;transition:color .12s;flex-shrink:0}
.del-btn:hover{color:var(--red)}
.pipe-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;gap:12px}

/* REPLY */
.reply-wrap{max-width:760px}
.reply-title{font-family:var(--disp);font-weight:900;font-size:32px;color:var(--w);line-height:1}
.reply-sub{font-size:9px;color:var(--dim);letter-spacing:.15em;margin-top:5px;margin-bottom:20px}
.reply-context{font-size:9px;color:var(--y);letter-spacing:.1em;margin-top:4px}
.paste-box{background:var(--panel);border:1px solid var(--line2);padding:16px 20px;margin-bottom:14px}
.paste-lbl{font-size:8px;font-weight:700;letter-spacing:.2em;color:var(--muted);margin-bottom:10px}
.paste-area{width:100%;background:none;border:none;color:#c0c0c0;font-family:var(--mono);font-size:11px;line-height:1.8;outline:none;resize:none;min-height:120px}
.paste-area::placeholder{color:#2a2a2a}
.analyze-btn{width:100%;padding:12px;background:var(--y);color:#000;font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:.2em;border:none;cursor:pointer;transition:all .15s}
.analyze-btn:hover:not(:disabled){background:#ffd700}
.analyze-btn:disabled{background:var(--line2);color:var(--muted);cursor:not-allowed}
.sentiment-row{display:flex;align-items:center;gap:10px;margin:16px 0 12px}
.sentiment-pill{font-size:9px;font-weight:700;letter-spacing:.15em;padding:5px 12px;border:1px solid}
.s-positive{color:var(--green);border-color:var(--green);background:rgba(0,212,106,.08)}
.s-neutral{color:var(--y);border-color:var(--y);background:var(--yg)}
.s-negative{color:var(--red);border-color:var(--red);background:rgba(255,64,64,.08)}
.intent-txt{font-size:11px;color:#888;line-height:1.6}
.reply-draft{background:var(--panel);border:1px solid var(--line2)}

.fade-in{animation:fadeUp .25s ease both}
`;

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function App() {
  const [tab,        setTab]       = useState("leads");
  const [selEvent,   setSelEvent]  = useState(null);
  const [leads,      setLeads]     = useState([]);
  const [sortBy,     setSortBy]    = useState("hook");
  const [selLead,    setSelLead]   = useState(null);
  const [pkg,        setPkg]       = useState(null);
  const [mutual,     setMutual]    = useState("");
  const [notes,      setNotes]     = useState("");
  const [sequence,   setSequence]  = useState(null);
  const [seqIdx,     setSeqIdx]    = useState(0);
  const [asset,      setAsset]     = useState(null);
  const [bodies,     setBodies]    = useState(["","",""]);
  const [replyText,  setReplyText] = useState("");
  const [replyResult,setReplyResult]=useState(null);
  const [loading,    setLoading]   = useState(null);
  const [err,        setErr]       = useState(null);
  const [copied,     setCopied]    = useState(false);

  // Pipeline — persisted to localStorage
  const [pipeline, setPipelineRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dorothy_pipeline")||"[]"); } catch { return []; }
  });
  const savePipeline = useCallback(entries => {
    setPipelineRaw(entries);
    try { localStorage.setItem("dorothy_pipeline", JSON.stringify(entries)); } catch {}
  }, []);

  // Manual add form
  const [addBrand,   setAddBrand]  = useState("");
  const [addContact, setAddContact]= useState("");
  const [addTitle,   setAddTitle]  = useState("");
  const [addEvent,   setAddEvent]  = useState("");
  const [pipeSortBy, setPipeSortBy]= useState("urgent"); // urgent | date | alpha

  const bStatus = s => s==="ACTIVE"?"b-active":s==="EMERGING"?"b-emerging":"b-untapped";
  const sortedLeads = [...leads].sort((a,b) => sortBy==="hook"?(b.hookScore||0)-(a.hookScore||0):0);

  // Pipeline stats
  const totalOut  = pipeline.length;
  const meetings  = pipeline.filter(e=>e.meetingBooked).length;
  const hitRate   = totalOut>0 ? Math.round((meetings/totalOut)*100) : 0;
  const urgent    = pipeline.filter(e=>!e.meetingBooked&&daysSince(e.sentAt)>=10).length;
  const followSoon= pipeline.filter(e=>!e.meetingBooked&&daysSince(e.sentAt)>=5&&daysSince(e.sentAt)<10).length;

  const sortedPipeline = [...pipeline].sort((a,b) => {
    if(pipeSortBy==="urgent"){
      const urgA=!a.meetingBooked&&daysSince(a.sentAt)>=10?0:!a.meetingBooked&&daysSince(a.sentAt)>=5?1:a.meetingBooked?3:2;
      const urgB=!b.meetingBooked&&daysSince(b.sentAt)>=10?0:!b.meetingBooked&&daysSince(b.sentAt)>=5?1:b.meetingBooked?3:2;
      return urgA-urgB;
    }
    if(pipeSortBy==="date") return new Date(b.sentAt)-new Date(a.sentAt);
    return a.brand.localeCompare(b.brand);
  });

  /* ── PIPELINE ACTIONS ────────────────────────────────────────── */
  const addToPipeline = useCallback((entry) => {
    savePipeline([{ id:uid(), sentAt:new Date().toISOString(), meetingBooked:false, status:"SENT", ...entry }, ...pipeline]);
    setTab("pipeline");
  }, [pipeline, savePipeline]);

  const toggleMeeting = useCallback((id) => {
    savePipeline(pipeline.map(e => e.id===id ? {...e, meetingBooked:!e.meetingBooked} : e));
  }, [pipeline, savePipeline]);

  const removeEntry = useCallback((id) => {
    savePipeline(pipeline.filter(e=>e.id!==id));
  }, [pipeline, savePipeline]);

  const addManual = useCallback(() => {
    if(!addBrand.trim()) return;
    addToPipeline({ brand:addBrand.trim(), contactName:addContact.trim()||"Unknown", contactTitle:addTitle.trim()||"", event:addEvent.trim()||"—", emailSubject:"" });
    setAddBrand(""); setAddContact(""); setAddTitle(""); setAddEvent("");
  }, [addBrand, addContact, addTitle, addEvent, addToPipeline]);

  /* ── GENERATE LEADS ──────────────────────────────────────────── */
  const genLeads = useCallback(async () => {
    if(!selEvent||loading) return;
    setLeads([]); setSelLead(null); setPkg(null); setSequence(null); setAsset(null); setErr(null);
    try {
      setLoading({ msg:"Scanning experiential landscape", sub:"Brand research · Hook scoring" });
      const d1 = await apiFetch({
        model:"claude-sonnet-4-6", max_tokens:2500,
        system:`You are a new business intelligence researcher for Dorothy Creative, a boutique LA experiential marketing agency (clients: Nike, Uber, Hisense, Moloco, NBC). CRITICAL: Respond with ONLY a valid JSON object. No prose, no markdown, no fences. Start with { end with }.`,
        messages:[{role:"user",content:`Research 6 brand prospects for experiential at ${selEvent.label} (${selEvent.season}, ${selEvent.cat}). Mix ACTIVE spenders and UNTAPPED brands. Score each "hookScore" 1-10 (relevant Dorothy case study, timely news, decision-maker accessibility, brand's experiential appetite). Respond ONLY with this JSON:
{"leads":[{"brand":"string","industry":"string","experientialStatus":"ACTIVE","opportunityNote":"string","recentActivation":"string or null","hookScore":7,"hookNote":"1 sentence","decisionMaker":{"name":"string or null","title":"string","notes":"string"}}]}`}],
      });
      const p1 = safeJSON(extractText(d1.content));
      if(!p1?.leads?.length) throw new Error(`Parse failed: "${extractText(d1.content).slice(0,180).replace(/\n/g," ")}"`);

      setLoading({ msg:"Cross-referencing CRM", sub:"Google Drive · Dorothy CRM" });
      let crmMap={};
      try {
        const d2 = await apiFetch({
          model:"claude-sonnet-4-6", max_tokens:1000,
          system:"Use Google Drive. Respond with ONLY a valid JSON object starting with {.",
          messages:[{role:"user",content:`Read Google Sheets file ID: ${CRM_ID}. Check which of these companies appear: ${p1.leads.map(l=>l.brand).join(", ")}. Respond ONLY: {"matches":[{"brand":"string","inCRM":true,"contactName":"string or null","contactTitle":"string or null","contactEmail":"string or null","status":"string or null"}]}`}],
          mcp_servers:[{type:"url",url:"https://drivemcp.googleapis.com/mcp/v1",name:"gdrive"}]
        });
        const p2 = safeJSON(extractText(d2.content));
        if(p2?.matches) p2.matches.filter(m=>m.inCRM).forEach(m=>{ crmMap[m.brand.toLowerCase()]=m; });
      } catch { /* optional */ }

      setLeads(p1.leads.map((l,i) => {
        const crm = crmMap[l.brand.toLowerCase()];
        return {id:`l${i}`,...l, inCRM:!!crm, crmContact:crm||null};
      }));
    } catch(e) { setErr(e.message); }
    finally    { setLoading(null); }
  }, [selEvent, loading]);

  /* ── RESEARCH TARGET ─────────────────────────────────────────── */
  const researchTarget = useCallback(async (l) => {
    setSelLead(l); setPkg(null); setSequence(null); setAsset(null);
    setMutual(""); setNotes(""); setTab("target");
    setLoading({ msg:"Pulling brand intel", sub:"News · Activations · Pitch angle" });
    try {
      const d = await apiFetch({
        model:"claude-sonnet-4-6", max_tokens:2000,
        system:"You are a research analyst. Your entire response must be a single valid JSON object. Start with { end with }. No markdown, no fences.",
        messages:[{role:"user",content:`Research ${l.brand} for an experiential marketing pitch at ${selEvent?.label}. Respond ONLY with this JSON:
{"brandSummary":"string","recentWin":{"headline":"string","detail":"string"},"headlines":[{"title":"string","summary":"string","date":"string"}],"experientialHistory":"string","pitchAngle":"string","recentActivations":["string","string"]}`}],
      });
      const p = safeJSON(extractText(d.content));
      if(!p) throw new Error("Target research parse failed");
      setPkg(p);
    } catch(e) { setErr(e.message); }
    finally    { setLoading(null); }
  }, [selEvent]);

  /* ── GENERATE SEQUENCE ───────────────────────────────────────── */
  const genSequence = useCallback(async () => {
    if(!selLead||!pkg) return;
    setSequence(null); setAsset(null); setTab("outreach");
    setLoading({ msg:"Drafting 3-touch sequence + asset", sub:"Emails 1, 2, 3 · Pre-suasion brief" });
    const win=pickWin(selLead);
    const ws=windowStatus(selEvent?.season||"JAN 2099");
    try {
      const d = await apiFetch({
        model:"claude-sonnet-4-6", max_tokens:2000,
        system:`You write sharp outreach sequences for Dorothy Creative, a boutique LA experiential agency. Clients: Nike, Uber, Hisense, Moloco, NBC. Peer-to-peer tone. No buzzwords. Your entire response must be a single valid JSON object. Start with { end with }.`,
        messages:[{role:"user",content:`Write a 3-email outreach sequence from Max at Dorothy Creative to ${selLead.decisionMaker?.name||"the experiential lead"} (${selLead.decisionMaker?.title}) at ${selLead.brand}.
Congrat hook: ${pkg.recentWin?.headline}. Their activation: ${pkg.recentActivations?.[0]||selLead.recentActivation||"their recent brand work"}. Dorothy cred: ${win.client} — ${win.work}. Event: ${selEvent?.label} (${ws.label}). Why they fit: ${pkg.pitchAngle}. Mutual context: ${mutual||"none"}.
Email 1 (Day 0): Warm intro ~120w. Email 2 (Day 5): Value-add trend/idea ~80w. Email 3 (Day 10): Light bump ~30w.
Also write a 1-page pre-suasion mini case study.
Respond ONLY:
{"emails":[{"day":0,"label":"WARM INTRO","subject":"string","greeting":"string","body":"string","signoff":"Best,\\nMax\\nDorothy Creative\\ndorothy-creative.com"},{"day":5,"label":"VALUE ADD","subject":"string","greeting":"string","body":"string","signoff":"Best,\\nMax"},{"day":10,"label":"LIGHT BUMP","subject":"string","greeting":"string","body":"string","signoff":"— Max"}],"caseStudy":{"headline":"string","challenge":"string","approach":"string","result":"string","relevance":"string"}}`}]
      });
      const p = safeJSON(extractText(d.content));
      if(!p?.emails) throw new Error("Sequence parse failed");
      setSequence(p.emails); setAsset(p.caseStudy||null);
      setBodies(p.emails.map(e=>e.body)); setSeqIdx(0);
    } catch(e) { setErr(e.message); }
    finally    { setLoading(null); }
  }, [selLead, pkg, selEvent, mutual, notes]);

  /* ── ANALYZE REPLY ───────────────────────────────────────────── */
  const analyzeReply = useCallback(async () => {
    if(!replyText.trim()) return;
    setReplyResult(null);
    setLoading({ msg:"Analyzing reply", sub:"Sentiment · Intent · Draft response" });
    try {
      const d = await apiFetch({
        model:"claude-sonnet-4-6", max_tokens:1000,
        system:"You help Dorothy Creative respond to sales replies. Your entire response must be a single valid JSON object. Start with { end with }.",
        messages:[{role:"user",content:`Analyze this reply to Dorothy Creative's outreach${selLead?` to ${selLead.decisionMaker?.name||"contact"} at ${selLead.brand}`:""}: "${replyText}". Write a response moving toward a meeting. Brief, peer-to-peer. Respond ONLY: {"sentiment":"POSITIVE","intent":"string","suggestedResponse":"string","greeting":"string","signoff":"Best,\\nMax","proposedCTA":"string"}`}]
      });
      const p = safeJSON(extractText(d.content));
      if(!p) throw new Error("Reply analysis parse failed");
      setReplyResult(p);
    } catch(e) { setErr(e.message); }
    finally    { setLoading(null); }
  }, [replyText, selLead]);

  const copyEmail = (emailObj, bodyStr) => {
    if(!emailObj) return;
    navigator.clipboard.writeText(`${emailObj.greeting}\n\n${bodyStr}\n\n${emailObj.signoff}`);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };
  const updateBody = (i,val) => { const n=[...bodies]; n[i]=val; setBodies(n); };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <style dangerouslySetInnerHTML={{__html:CSS}} />
      <div className="app">

        {/* HEADER */}
        <div className="hdr">
          <div className="logo">
            <div className="logo-d"><span>D</span></div>
            <div><div className="logo-name">DOROTHY CREATIVE</div><div className="logo-sub">INTEL / NEW BUSINESS</div></div>
          </div>
          <div className="hdr-r">
            {loading
              ? <div className="status-live"><div className="dot"/>{loading.msg.toUpperCase()}</div>
              : leads.length>0
              ? <div className="status-live"><div className="dot green"/>{leads.length} LEADS · TOP HOOK {Math.max(...leads.map(l=>l.hookScore||0))}/10</div>
              : <div className="status-live"><div className="dot dead"/>STANDBY</div>
            }
            <div className="hdr-date">{new Date().toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}).toUpperCase()}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {[
            {id:"leads",    label:"LEAD GEN",      n:leads.length||null},
            {id:"target",   label:"TARGET PACKAGE", n:null},
            {id:"outreach", label:"OUTREACH",        n:sequence?3:null},
            {id:"pipeline", label:"PIPELINE",        n:totalOut||null, alert:urgent||null},
            {id:"reply",    label:"REPLY HANDLER",  n:null},
          ].map(t=>(
            <button key={t.id} className={`tab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>
              {t.label}
              {t.n&&!t.alert?<span className="tab-n">{t.n}</span>:null}
              {t.alert?<span className="tab-alert">{t.alert}</span>:null}
            </button>
          ))}
          {selLead&&<div className="tab-crumb">ACTIVE: <strong style={{marginLeft:4}}>{selLead.brand.toUpperCase()}</strong></div>}
        </div>

        {err&&<div className="err"><span>⚠ {err}</span><button onClick={()=>setErr(null)}>✕</button></div>}

        <div className="body"><div className="content">

          {/* ══ LEADS TAB ══ */}
          {tab==="leads"&&(
            <div className="leads-wrap">
              <div className="event-panel">
                <div className="panel-hdr"><span className="panel-lbl">MARKETING CALENDAR</span><span className="panel-count">{EVENTS.length} EVENTS</span></div>
                <div className="event-list">
                  {EVENTS.map(e=>{
                    const ws=windowStatus(e.season);
                    return(
                      <div key={e.id} className={`ev-item ${selEvent?.id===e.id?"on":""}`} onClick={()=>setSelEvent(e)}>
                        <div className="ev-name">{e.label}</div>
                        <div className="ev-row"><span className="ev-cat">{e.cat}</span><span className="ev-date">{e.season}</span></div>
                        <span className={`ev-win ${ws.cls}`}>{ws.label}</span>
                      </div>
                    );
                  })}
                </div>
                <button className="gen-btn" onClick={genLeads} disabled={!selEvent||!!loading}>
                  {loading?"◌  PROCESSING...":"◈  GENERATE LEADS"}
                </button>
              </div>
              <div className="results-panel">
                <div className="panel-hdr">
                  <span className="panel-lbl">BRAND PROSPECTS</span>
                  {leads.length>0&&<span className="panel-count">{leads.filter(l=>l.inCRM).length} IN CRM · {leads.filter(l=>!l.inCRM).length} NEW</span>}
                </div>
                {leads.length>0&&(
                  <div className="sort-row">
                    <span className="sort-lbl">SORT</span>
                    <button className={`sort-btn ${sortBy==="hook"?"on":""}`} onClick={()=>setSortBy("hook")}>HOOK SCORE</button>
                    <button className={`sort-btn ${sortBy==="status"?"on":""}`} onClick={()=>setSortBy("status")}>STATUS</button>
                  </div>
                )}
                {loading?(<div className="loader"><div className="spin"/><div><div className="load-msg">{loading.msg.toUpperCase()}</div><div className="load-phase">{loading.sub}</div></div></div>)
                :leads.length===0?(<div className="empty"><div className="empty-icon">◈</div><div className="empty-txt">SELECT AN EVENT AND GENERATE LEADS</div>{selEvent&&<div className="empty-sub">{selEvent.label.toUpperCase()} · {selEvent.season}</div>}</div>)
                :(
                  <div className="leads-grid">
                    {sortedLeads.map(l=>(
                      <div key={l.id} className={`lcard ${selLead?.id===l.id?"sel":""}`} onClick={()=>researchTarget(l)}>
                        <div className="lcard-top">
                          <div><div className="brand-n">{l.brand}</div><div className="brand-ind">{l.industry}</div></div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div className="hook-score" style={{color:hookColor(l.hookScore||0)}}>{l.hookScore||"?"}</div>
                            <div className="hook-label">HOOK /10</div>
                          </div>
                        </div>
                        <div className="badge-row">
                          <span className={`badge ${bStatus(l.experientialStatus)}`}>{l.experientialStatus}</span>
                          <span className={`badge ${l.inCRM?"b-crm":"b-nocrm"}`}>{l.inCRM?"★ IN CRM":"NOT IN CRM"}</span>
                        </div>
                        <div className="opp-note">{l.opportunityNote}</div>
                        {l.hookNote&&<div className="hook-note">"{l.hookNote}"</div>}
                        {l.decisionMaker?.name&&(
                          <div className="dm-mini">
                            <div className="dm-mini-lbl">DECISION MAKER</div>
                            <div className="dm-mini-name">{l.decisionMaker.name}</div>
                            <div className="dm-mini-title">{l.decisionMaker.title}</div>
                          </div>
                        )}
                        <div className="card-cta">CLICK TO RESEARCH →</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TARGET PACKAGE TAB ══ */}
          {tab==="target"&&(
            <div>
              {!selLead?(<div className="empty" style={{height:400}}><div className="empty-icon">◎</div><div className="empty-txt">SELECT A LEAD FROM LEAD GEN TAB</div></div>)
              :loading?(<div className="loader" style={{height:400}}><div className="spin"/><div><div className="load-msg">{loading.msg.toUpperCase()}</div><div className="load-phase">{loading.sub}</div></div></div>)
              :(
                <div className="fade-in">
                  <div className="pkg-hero">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div className="pkg-name">{selLead.brand}</div>
                        <div className="pkg-sub">{selLead.industry?.toUpperCase()} · {selEvent?.label?.toUpperCase()} · {windowStatus(selEvent?.season||"JAN 2099").label}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                        <div style={{display:"flex",gap:6}}>
                          <span className={`badge ${bStatus(selLead.experientialStatus)}`}>{selLead.experientialStatus}</span>
                          <span className={`badge ${selLead.inCRM?"b-crm":"b-nocrm"}`}>{selLead.inCRM?"★ IN CRM":"NOT IN CRM"}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:9,color:"var(--muted)",letterSpacing:".15em"}}>HOOK</span>
                          <span style={{fontFamily:"var(--disp)",fontWeight:900,fontSize:28,color:hookColor(selLead.hookScore||0),lineHeight:1}}>{selLead.hookScore||"?"}</span>
                          <span style={{fontSize:9,color:"var(--muted)"}}>/ 10</span>
                        </div>
                      </div>
                    </div>
                    {pkg&&<div className="pkg-summary">{pkg.brandSummary}</div>}
                  </div>
                  {pkg&&(
                    <div className="pkg-grid">
                      <div>
                        <div className="section">
                          <div className="s-lbl">★ RECENT WIN — OPEN WITH THIS</div>
                          <div className="win-box"><div className="win-lbl">CONGRATULATE ON THIS</div><div className="win-hl">{pkg.recentWin?.headline}</div><div className="win-det">{pkg.recentWin?.detail}</div></div>
                        </div>
                        <div className="section">
                          <div className="s-lbl">PRESS & INTEL</div>
                          {(pkg.headlines||[]).map((h,i)=>(
                            <div key={i} className="hl-card"><div className="hl-title">{h.title}</div><div className="hl-sum">{h.summary}</div><div className="hl-date">{h.date?.toUpperCase()}</div></div>
                          ))}
                        </div>
                        {pkg.experientialHistory&&(<div className="section"><div className="s-lbl">EXPERIENTIAL HISTORY</div><div className="hist-box">{pkg.experientialHistory}</div></div>)}
                        <textarea className="notes-input" rows={3} placeholder="ADD NOTES..." value={notes} onChange={e=>setNotes(e.target.value)}/>
                      </div>
                      <div>
                        <div className="s-lbl">DECISION MAKER</div>
                        <div className="dm-card">
                          <div className="dm-name-big">{selLead.decisionMaker?.name||"Unknown"}</div>
                          <div className="dm-title-big">{selLead.decisionMaker?.title}</div>
                          {selLead.inCRM&&selLead.crmContact&&(
                            <div className="crm-tag">★ IN DOROTHY CRM{selLead.crmContact.contactEmail&&<div className="crm-detail">{selLead.crmContact.contactEmail}</div>}{selLead.crmContact.status&&<div className="crm-detail">STATUS: {selLead.crmContact.status?.toUpperCase()}</div>}</div>
                          )}
                          {selLead.decisionMaker?.notes&&<div className="dm-notes-txt">{selLead.decisionMaker.notes}</div>}
                        </div>
                        <div className="section">
                          <div className="mutual-box">
                            <div className="mutual-lbl">MUTUAL CONNECTIONS / WARM CONTEXT</div>
                            <textarea className="mutual-input" rows={2} placeholder="e.g. 'John at Nike mentioned them'..." value={mutual} onChange={e=>setMutual(e.target.value)}/>
                          </div>
                        </div>
                        {pkg.pitchAngle&&(<div className="section"><div className="s-lbl">PITCH ANGLE</div><div className="pitch-box"><div className="pitch-lbl">WHY DOROTHY / WHY NOW</div>{pkg.pitchAngle}</div></div>)}
                        {(pkg.recentActivations||[]).length>0&&(<div className="section"><div className="s-lbl">RECENT ACTIVATIONS</div>{pkg.recentActivations.map((a,i)=><div key={i} className="act-item">◎ {a}</div>)}</div>)}
                        <button className="email-btn" onClick={genSequence} disabled={!!loading}>◤ DRAFT 3-TOUCH SEQUENCE</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ OUTREACH TAB ══ */}
          {tab==="outreach"&&(
            <div>
              {!selLead?(<div className="empty" style={{height:400}}><div className="empty-icon">◤</div><div className="empty-txt">SELECT A LEAD FIRST</div></div>)
              :loading?(<div className="loader" style={{height:400}}><div className="spin"/><div><div className="load-msg">{loading.msg.toUpperCase()}</div><div className="load-phase">{loading.sub}</div></div></div>)
              :!sequence?(<div className="empty" style={{height:400}}><div className="empty-icon">◤</div><div className="empty-txt">{pkg?"READY TO DRAFT":"BUILD TARGET PACKAGE FIRST"}</div>{pkg&&<button className="email-btn" style={{width:280,marginTop:16}} onClick={genSequence}>◤ DRAFT 3-TOUCH SEQUENCE</button>}</div>)
              :(
                <div className="out-wrap fade-in">
                  <div className="out-header">
                    <div><div className="out-title-sm">3-TOUCH SEQUENCE</div><div className="out-title">{selLead.brand} / {selLead.decisionMaker?.name||"DM"}</div></div>
                    <div className="btn-row">
                      <button className="btn-o" onClick={genSequence} disabled={!!loading}>↻ REGEN</button>
                      <button className="btn-p" onClick={()=>copyEmail(sequence[seqIdx],bodies[seqIdx])}>{copied?"✓ COPIED":"⎘ COPY"}</button>
                      <button className="btn-g" onClick={()=>addToPipeline({brand:selLead.brand,contactName:selLead.decisionMaker?.name||"Unknown",contactTitle:selLead.decisionMaker?.title||"",event:selEvent?.label||"—",emailSubject:sequence[0]?.subject||""})}>◎ LOG TO PIPELINE</button>
                    </div>
                  </div>
                  {pkg&&(
                    <div className="hooks-bar">
                      <div className="hooks-lbl">HOOKS</div>
                      <div className="hooks-grid">
                        {pkg.recentWin?.headline&&<div className="hook-item"><strong>WIN:</strong> {pkg.recentWin.headline}</div>}
                        {mutual&&<div className="hook-item"><strong>MUTUAL:</strong> {mutual}</div>}
                        <div className="hook-item"><strong>CRED:</strong> {pickWin(selLead).client}</div>
                        <div className="hook-item"><strong>TIMING:</strong> {windowStatus(selEvent?.season||"JAN 2099").label}</div>
                      </div>
                    </div>
                  )}
                  <div className="seq-tabs">
                    {sequence.map((e,i)=>(
                      <button key={i} className={`seq-tab ${seqIdx===i?"on":""}`} onClick={()=>setSeqIdx(i)}>
                        <div className="seq-tab-day">DAY {e.day}</div>
                        <div className="seq-tab-label">{e.label}</div>
                        <div className="seq-tab-bar"/>
                      </button>
                    ))}
                  </div>
                  {sequence[seqIdx]&&(
                    <div className="composer">
                      <div className="comp-row"><div className="comp-lbl">TO</div><div className="comp-val">{selLead.decisionMaker?.name||"DM"} · {selLead.decisionMaker?.title} · {selLead.brand}</div></div>
                      <div className="comp-row"><div className="comp-lbl">SUBJECT</div><div className="comp-val sub">{sequence[seqIdx].subject}</div></div>
                      <div className="comp-body">
                        <div className="greet">{sequence[seqIdx].greeting}</div>
                        <textarea className="body-area" value={bodies[seqIdx]} onChange={e=>updateBody(seqIdx,e.target.value)} rows={seqIdx===2?3:8}/>
                        <div className="sign">{sequence[seqIdx].signoff}</div>
                      </div>
                      <div className="comp-footer">
                        <button className="btn-p" onClick={()=>copyEmail(sequence[seqIdx],bodies[seqIdx])}>{copied?"✓ COPIED":"⎘ COPY"}</button>
                        <button className="btn-o" onClick={()=>setTab("reply")}>→ LOG REPLY</button>
                        <div className="wc">{bodies[seqIdx].split(/\s+/).filter(Boolean).length} WORDS</div>
                      </div>
                    </div>
                  )}
                  {asset&&(
                    <div style={{marginTop:14}}>
                      <div className="s-lbl">PRE-SUASION ASSET</div>
                      <div className="asset-box">
                        <div className="asset-lbl">◈ MINI CASE STUDY · DOROTHY CREATIVE</div>
                        <div className="asset-hl">{asset.headline}</div>
                        <div className="asset-s"><div className="asset-s-lbl">THE CHALLENGE</div><div className="asset-s-txt">{asset.challenge}</div></div>
                        <div className="asset-s"><div className="asset-s-lbl">OUR APPROACH</div><div className="asset-s-txt">{asset.approach}</div></div>
                        <div className="asset-s"><div className="asset-s-lbl">THE RESULT</div><div className="asset-s-txt">{asset.result}</div></div>
                        <div className="asset-rel">→ {asset.relevance}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ PIPELINE TAB ══ */}
          {tab==="pipeline"&&(
            <div className="pipe-wrap fade-in">

              {/* Stats row */}
              <div className="pipe-stats">
                {/* Arc gauge */}
                <div style={{background:"var(--panel)",border:"1px solid var(--line2)",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
                  <ArcGauge rate={hitRate}/>
                </div>
                <div className="stat-box">
                  <div className={`stat-big ${meetings>0?"green":""}`}>{meetings}</div>
                  <div className="stat-lbl">MEETINGS BOOKED</div>
                </div>
                <div className="stat-box">
                  <div className="stat-big">{totalOut}</div>
                  <div className="stat-lbl">TOTAL OUTREACH</div>
                </div>
                <div className="stat-box">
                  <div className={`stat-big ${urgent>0?"red":""}`}>{urgent}</div>
                  <div className="stat-lbl">FOLLOW UP NOW</div>
                </div>
                <div className="stat-box">
                  <div className={`stat-big ${followSoon>0?"yellow":""}`}>{followSoon}</div>
                  <div className="stat-lbl">FOLLOW UP SOON</div>
                </div>
              </div>

              {/* Manual add */}
              <div className="pipe-add">
                <div style={{flex:1,minWidth:100}}>
                  <div className="pipe-add-lbl">BRAND</div>
                  <input className="pipe-input" placeholder="Nike" value={addBrand} onChange={e=>setAddBrand(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addManual()}/>
                </div>
                <div style={{flex:1,minWidth:100}}>
                  <div className="pipe-add-lbl">CONTACT NAME</div>
                  <input className="pipe-input" placeholder="Jane Smith" value={addContact} onChange={e=>setAddContact(e.target.value)}/>
                </div>
                <div style={{flex:1,minWidth:100}}>
                  <div className="pipe-add-lbl">TITLE</div>
                  <input className="pipe-input" placeholder="VP Brand" value={addTitle} onChange={e=>setAddTitle(e.target.value)}/>
                </div>
                <div style={{flex:1,minWidth:80}}>
                  <div className="pipe-add-lbl">EVENT</div>
                  <input className="pipe-input" placeholder="Coachella" value={addEvent} onChange={e=>setAddEvent(e.target.value)}/>
                </div>
                <button className="add-btn" onClick={addManual} disabled={!addBrand.trim()}>+ ADD</button>
              </div>

              {/* Sort */}
              {pipeline.length>0&&(
                <div className="pipe-sort-row">
                  <span className="sort-lbl">SORT BY</span>
                  {[["urgent","FOLLOW-UP"],["date","DATE SENT"],["alpha","BRAND A→Z"]].map(([v,l])=>(
                    <button key={v} className={`sort-btn ${pipeSortBy===v?"on":""}`} onClick={()=>setPipeSortBy(v)}>{l}</button>
                  ))}
                  <span style={{marginLeft:"auto",fontSize:8,color:"var(--muted)",letterSpacing:".12em"}}>
                    {pipeline.length} ENTRIES · SAVED LOCALLY
                  </span>
                </div>
              )}

              {/* Entries */}
              {pipeline.length===0?(
                <div className="pipe-empty">
                  <div style={{fontSize:24,color:"#222"}}>◎</div>
                  <div className="empty-txt">NO OUTREACH LOGGED YET</div>
                  <div style={{fontSize:9,color:"#333",letterSpacing:".12em"}}>USE "LOG TO PIPELINE" IN THE OUTREACH TAB OR ADD MANUALLY ABOVE</div>
                </div>
              ):(
                <div>
                  {sortedPipeline.map(entry=>{
                    const days=daysSince(entry.sentAt);
                    const ps=pipeStatus(entry);
                    const fillPct=Math.min(days/14,1)*100;
                    const fillColor=entry.meetingBooked?"#00D46A":days>=10?"#FF4040":days>=5?"#F5C400":"#444";
                    const sentDate=new Date(entry.sentAt).toLocaleDateString("en-US",{month:"short",day:"numeric"});
                    return(
                      <div key={entry.id} className={`pipe-entry ${ps.urgent?"urgent":""} ${entry.meetingBooked?"meeting":""}`}>
                        {/* Brand info */}
                        <div>
                          <div className="pe-brand">{entry.brand}</div>
                          <div className="pe-contact">{entry.contactName}{entry.contactTitle?` · ${entry.contactTitle}`:""}</div>
                          <div className="pe-event">{entry.event}</div>
                        </div>
                        {/* Timeline bar */}
                        <div className="timeline-col">
                          <div className="timeline-track">
                            <div className="timeline-fill" style={{width:`${fillPct}%`,background:fillColor}}/>
                          </div>
                          <div className="timeline-meta">
                            <span className="timeline-days">SENT {sentDate}</span>
                            <span className="timeline-days" style={{color:fillColor,fontWeight:days>=5?600:400}}>{days === 0 ? "TODAY" : `${days}D AGO`}</span>
                          </div>
                        </div>
                        {/* Status */}
                        <div className="pipe-status-col">
                          <span className={`pipe-badge ${ps.cls}`}>{ps.label}</span>
                        </div>
                        {/* Meeting checkbox */}
                        <div className="mtg-col">
                          <div className="mtg-lbl">MTG</div>
                          <div className={`mtg-check ${entry.meetingBooked?"checked":""}`} onClick={()=>toggleMeeting(entry.id)}/>
                        </div>
                        {/* Delete */}
                        <button className="del-btn" onClick={()=>removeEntry(entry.id)} title="Remove">✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ REPLY HANDLER TAB ══ */}
          {tab==="reply"&&(
            <div className="reply-wrap fade-in">
              <div className="reply-title">REPLY HANDLER</div>
              <div className="reply-sub">PASTE A REPLY · GET AI-DRAFTED RESPONSE{selLead&&<span className="reply-context" style={{marginLeft:12}}>CONTEXT: {selLead.brand} / {selLead.decisionMaker?.name||"Contact"}</span>}</div>
              <div className="paste-box">
                <div className="paste-lbl">PASTE THEIR REPLY</div>
                <textarea className="paste-area" rows={6} placeholder="Paste the reply here..." value={replyText} onChange={e=>setReplyText(e.target.value)}/>
              </div>
              <button className="analyze-btn" onClick={analyzeReply} disabled={!replyText.trim()||!!loading}>
                {loading?"◌  ANALYZING...":"◎  ANALYZE & DRAFT RESPONSE"}
              </button>
              {loading&&<div className="loader" style={{height:180}}><div className="spin"/><div><div className="load-msg">{loading.msg.toUpperCase()}</div><div className="load-phase">{loading.sub}</div></div></div>}
              {replyResult&&!loading&&(
                <div style={{marginTop:20}}>
                  <div className="sentiment-row">
                    <span className={`sentiment-pill ${replyResult.sentiment==="POSITIVE"?"s-positive":replyResult.sentiment==="NEGATIVE"?"s-negative":"s-neutral"}`}>{replyResult.sentiment}</span>
                    <div className="intent-txt">{replyResult.intent}</div>
                  </div>
                  {replyResult.proposedCTA&&(
                    <div style={{marginBottom:12,padding:"10px 14px",background:"#151100",border:"1px solid #302800",fontSize:11,color:"var(--y)",lineHeight:1.6}}>
                      <span style={{fontSize:8,fontWeight:700,letterSpacing:".2em",color:"var(--y2)",display:"block",marginBottom:4}}>PROPOSED NEXT STEP</span>
                      {replyResult.proposedCTA}
                    </div>
                  )}
                  <div className="s-lbl">DRAFTED RESPONSE</div>
                  <div className="reply-draft">
                    <div className="comp-body">
                      <div className="greet">{replyResult.greeting}</div>
                      <div style={{fontSize:11,color:"#c0c0c0",lineHeight:1.9,whiteSpace:"pre-wrap"}}>{replyResult.suggestedResponse}</div>
                      <div className="sign">{replyResult.signoff}</div>
                    </div>
                    <div className="comp-footer">
                      <button className="btn-p" onClick={()=>{navigator.clipboard.writeText(`${replyResult.greeting}\n\n${replyResult.suggestedResponse}\n\n${replyResult.signoff}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>{copied?"✓ COPIED":"⎘ COPY RESPONSE"}</button>
                      <button className="btn-o" onClick={()=>{setReplyText("");setReplyResult(null);}}>↺ NEW REPLY</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div></div>
      </div>
    </>
  );
}
