/* SA Mod Manager - 34-release-notes.js: GitHub-flavoured markdown for the update dialog (release notes) */
/* Classic script: loaded in order by index.html, shares globals with the other files. Self-contained, only called at runtime from 30-updater.js. */
const RN=(()=>{
const REPO='H4cKz7/San-Andreas-Mod-Manager',GH='https://github.com/'+REPO,RAW='https://raw.githubusercontent.com/'+REPO+'/HEAD/';
const ec=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const esc=s=>String(s).replace(/&(?!#?\w+;)/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const attr=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const unent=s=>String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const ind=s=>String(s).replace(/\t/g,'    ').match(/^ */)[0].length;
const stripTo=(s,n)=>{s=String(s).replace(/\t/g,'    ');let k=0;while(k<n&&s[k]===' ')k++;return s.slice(k)};
const EMOJI={tada:'🎉',rocket:'🚀',sparkles:'✨',bug:'🐛',fire:'🔥',warning:'⚠️',white_check_mark:'✅',heavy_check_mark:'✔️',x:'❌',memo:'📝',books:'📚',book:'📖',wrench:'🔧',hammer:'🔨',hammer_and_wrench:'🛠️',zap:'⚡',lock:'🔒',art:'🎨',construction:'🚧',boom:'💥',star:'⭐',bulb:'💡',heart:'❤️','+1':'👍','-1':'👎',thumbsup:'👍',thumbsdown:'👎',eyes:'👀',pray:'🙏','100':'💯',package:'📦',gear:'⚙️',link:'🔗',mag:'🔍',recycle:'♻️',arrow_up:'⬆️',arrow_down:'⬇️',bookmark:'🔖',information_source:'ℹ️',question:'❓',exclamation:'❗',lipstick:'💄',racing_car:'🏎️',car:'🚗',video_game:'🎮',joystick:'🕹️',game_die:'🎲',gift:'🎁',trophy:'🏆',clap:'👏',wave:'👋',muscle:'💪',smile:'😄',grin:'😁',joy:'😂',cry:'😢',thinking:'🤔',skull:'💀',ghost:'👻',robot:'🤖',computer:'💻',keyboard:'⌨️',file_folder:'📁',open_file_folder:'📂',page_facing_up:'📄',clipboard:'📋',pencil:'✏️',pencil2:'✏️',scissors:'✂️',wastebasket:'🗑️',trash:'🗑️',floppy_disk:'💾',cd:'💿',globe_with_meridians:'🌐',earth_africa:'🌍',beers:'🍻',coffee:'☕',pizza:'🍕',checkered_flag:'🏁',triangular_flag_on_post:'🚩',new:'🆕',up:'🆙',ok:'🆗',soon:'🔜',under_construction:'🚧',chart_with_upwards_trend:'📈',speech_balloon:'💬',bell:'🔔',key:'🔑',shield:'🛡️',pushpin:'📌',paperclip:'📎',hourglass:'⌛',stopwatch:'⏱️',alarm_clock:'⏰',calendar:'📆',sunny:'☀️',crescent_moon:'🌙',snowflake:'❄️',cloud:'☁️',umbrella:'☔',rainbow:'🌈'};
/* ---------- safe URLs and raw-HTML allow-list ---------- */
function safeUrl(u,img){u=unent(u).replace(/[\u0000-\u001f\u007f]/g,'').trim();
 if(!u||u[0]==='#')return '';
 if(u.slice(0,2)==='//')u='https:'+u;
 const m=u.match(/^([a-z][a-z0-9+.-]*):/i);
 if(m){const p=m[1].toLowerCase();
  if(p==='http'||p==='https'||(!img&&p==='mailto'))return u;
  if(img&&p==='data'&&/^data:image\/(png|gif|jpe?g|webp);base64,[a-z0-9+\/=]+$/i.test(u))return u;
  return ''}
 u=u.replace(/^(\.{0,2}\/)+/,'');
 return (img?RAW:GH+'/blob/HEAD/')+encodeURI(u)}
const VOID={br:1,hr:1,img:1};
const OK={a:['href','title'],img:['src','alt','title','width','height','align'],p:['align'],div:['align'],span:[],h1:['align'],h2:['align'],h3:['align'],h4:['align'],h5:['align'],h6:['align'],
 br:[],hr:[],b:[],i:[],strong:[],em:[],del:[],s:[],strike:[],u:[],ins:[],mark:[],small:[],code:[],kbd:[],samp:[],var:[],sub:[],sup:[],abbr:['title'],pre:[],blockquote:[],
 ul:[],ol:['start'],li:[],dl:[],dt:[],dd:[],details:['open'],summary:[],center:[],caption:[],
 table:[],thead:[],tbody:[],tfoot:[],tr:[],th:['align','colspan','rowspan'],td:['align','colspan','rowspan']};
const DROP={script:1,style:1,iframe:1,object:1,embed:1,noscript:1,template:1,textarea:1,title:1,svg:1,math:1,head:1};
const TAG=/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s"'<>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>\x60]+))?)*)\s*\/?>/g;
function cleanTag(close,name,attrs){name=name.toLowerCase();const al=OK[name];if(!al)return '';
 if(close)return VOID[name]?'':'</'+name+'>';
 let o='<'+name,src=false;
 String(attrs||'').replace(/([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+)))?/g,(m,k,a,b,c)=>{k=k.toLowerCase();if(al.indexOf(k)<0)return m;
  let v=a!==undefined?a:b!==undefined?b:c!==undefined?c:'';
  if(k==='href'||k==='src'){v=safeUrl(v,k==='src');if(!v)return m;if(k==='src')src=true;o+=' '+k+'="'+attr(v)+'"';if(k==='href')o+=' data-x="'+attr(v)+'"';return m}
  if(k==='align'){if(/^(left|right|center|justify)$/i.test(v))o+=' align="'+v.toLowerCase()+'"';return m}
  if(k==='width'||k==='height'||k==='colspan'||k==='rowspan'||k==='start'){if(/^\d{1,4}%?$/.test(v))o+=' '+k+'="'+v+'"';return m}
  if(k==='open'){o+=' open';return m}
  o+=' '+k+'="'+attr(unent(v))+'"';return m});
 if(name==='img'){if(!src)return '';o+=' loading="lazy"'}
 return o+'>'}
/* full sanitiser for HTML release notes (electron-updater hands over HTML for GitHub releases) */
function sanitize(h){h=String(h).replace(/<!--[\s\S]*?-->/g,'');
 const re=new RegExp(TAG.source,'g');let out='',last=0,skip=null,m;
 while((m=re.exec(h))){const txt=h.slice(last,m.index);last=re.lastIndex;const nm=m[2].toLowerCase();
  if(!skip)out+=esc(txt);
  if(DROP[nm]){if(!m[1])skip=skip||nm;else if(skip===nm)skip=null;continue}
  if(!skip)out+=cleanTag(!!m[1],m[2],m[3])}
 if(!skip)out+=esc(h.slice(last));
 return out}
/* ---------- inline ---------- */
function shortUrl(u){let m=u.match(/^https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:pull|issues|discussions)\/(\d+)(?:[#?\/].*)?$/i);
 if(m)return (m[1].toLowerCase()===REPO.toLowerCase()?'':m[1])+'#'+m[2];
 m=u.match(/^https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/commit\/([0-9a-f]{7,40})(?:[#?\/].*)?$/i);
 if(m)return (m[1].toLowerCase()===REPO.toLowerCase()?'':m[1]+'@')+m[2].slice(0,7);
 m=u.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/compare\/([^?#]+)$/i);
 if(m){try{return decodeURIComponent(m[1])}catch(e){return m[1]}}
 return u}
const A=(u,label,title)=>'<a href="'+attr(u)+'" data-x="'+attr(u)+'"'+(title?' title="'+attr(unent(title))+'"':'')+'>'+label+'</a>';
const emph=t=>t.replace(/\*\*\*(?=\S)(.+?)(?<=\S)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g,'<strong>$1</strong>')
 .replace(/(^|[^\w])__(?=\S)(.+?)(?<=\S)__(?!\w)/g,'$1<strong>$2</strong>')
 .replace(/(^|[^*\w])\*(?![\s*])([^*\n]+?)(?<![\s*])\*(?!\*)/g,'$1<em>$2</em>').replace(/(^|[^\w])_(?![\s_])([^_\n]+?)(?<![\s_])_(?!\w)/g,'$1<em>$2</em>')
 .replace(/~~(?=\S)(.+?)(?<=\S)~~/g,'<del>$1</del>').replace(/(^|[^~\w])~(?=\S)([^~\n]+?)(?<=\S)~(?!~)/g,'$1<del>$2</del>');
function inl(s,o,ctx){o=o||{};ctx=ctx||{defs:{},fns:{},order:[]};const st=[],keep=h=>{st.push(h);return '\u0001'+(st.length-1)+'\u0001'};
 let t=String(s).replace(/[\u0001\u0002]/g,'');
 t=t.replace(/(\x60+)([\s\S]*?[^\x60])\1(?!\x60)/g,(m,a,b)=>keep('<code>'+ec(b.trim())+'</code>'));
 t=t.replace(/\\\n/g,'  \n').replace(/\\([\\\x60*_{}\[\]()#+\-.!|~<>@:&])/g,(m,c)=>keep(esc(c)));
 if(!o.noA)t=t.replace(/<a\s+([^>]*?)>([\s\S]*?)<\/a\s*>/gi,(m,at,inner)=>keep(cleanTag(false,'a',at)+inl(inner,{noA:1},ctx)+'</a>'));
 t=t.replace(/<((?:https?:\/\/|mailto:)[^\s<>]+)>/gi,(m,u)=>{const v=safeUrl(u);return v?keep(A(v,ec(shortUrl(v)))):m})
  .replace(/<([^\s<>@]+@[^\s<>@.]+\.[^\s<>@]+)>/g,(m,e)=>keep(A('mailto:'+e,ec(e))));
 t=t.replace(new RegExp(TAG.source,'g'),(m,c,n,a)=>{const r=cleanTag(!!c,n,a);return r?keep(r):m});
 t=esc(t);
 t=t.replace(/!\[([^\]]*)\]\(\s*((?:[^\s()]|\([^\s()]*\))+)(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)/g,(m,a,u,t1,t2)=>{const v=safeUrl(u,true),ti=t1||t2;
  return v?keep('<img src="'+attr(v)+'" alt="'+attr(unent(a))+'"'+(ti?' title="'+attr(unent(ti))+'"':'')+' loading="lazy">'):a});
 t=t.replace(/\[((?:[^\[\]]|\[[^\]]*\])*)\]\(\s*((?:[^\s()]|\([^\s()]*\))+)(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)/g,(m,a,u,t1,t2)=>{const v=safeUrl(u);return keep(v?A(v,emph(a),t1||t2):emph(a))});
 t=t.replace(/\[\^([^\]\s]+)\]/g,(m,id)=>{if(ctx.fns[id]===undefined)return m;let n=ctx.order.indexOf(id)+1;if(!n)n=ctx.order.push(id);return keep('<sup class="rn-fn">'+n+'</sup>')});
 t=t.replace(/\[((?:[^\[\]]|\[[^\]]*\])+)\]\[([^\]]*)\]/g,(m,a,id)=>{const d=ctx.defs[(id||a).toLowerCase()],v=d&&safeUrl(d.u);return v?keep(A(v,emph(a),d.t)):m});
 t=t.replace(/\[([^\[\]]+)\](?!\()/g,(m,a)=>{const d=ctx.defs[a.toLowerCase()],v=d&&safeUrl(d.u);return v?keep(A(v,emph(a),d.t)):m});
 if(!o.noA){
  t=t.replace(/(^|[\s(>*_~])((?:https?:\/\/|www\.)[^\s<>\u0001]+)/g,(m,pre,u)=>{let tail='';
   for(;;){if(/[.,:;!?'"*~_]$/.test(u)){tail=u.slice(-1)+tail;u=u.slice(0,-1)}
    else if(u.slice(-1)===')'&&(u.match(/\(/g)||[]).length<(u.match(/\)/g)||[]).length){tail=')'+tail;u=u.slice(0,-1)}
    else if(/&(amp|lt|gt|quot);$/.test(u)&&/&(lt|gt|quot);$/.test(u)){const k=u.lastIndexOf('&');tail=u.slice(k)+tail;u=u.slice(0,k)}
    else break}
   const href=safeUrl(/^www\./i.test(u)?'https://'+u:u);if(!href)return m;
   return pre+keep(A(href,ec(shortUrl(unent(href)))))+tail});
  t=t.replace(/(^|[^\w\x60\/@.\-\u0001])@([A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38})(?![\w\/-])/g,(m,pre,u)=>pre+keep(A('https://github.com/'+u,'@'+u)));
  t=t.replace(/(^|[^\w&\/#\u0001])#(\d{1,7})(?![\w-])/g,(m,pre,n)=>pre+keep(A(GH+'/issues/'+n,'#'+n)));
  t=t.replace(/(^|[^\w\/#@.\-\u0001])([0-9a-f]{7,40})(?![\w-])/g,(m,pre,h)=>/\d/.test(h)&&/[a-f]/.test(h)?pre+keep(A(GH+'/commit/'+h,'<code>'+h.slice(0,7)+'</code>')):m)}
 t=t.replace(/(^|[^\w:]):([a-z0-9_+-]+):(?!\w)/g,(m,pre,n)=>EMOJI[n]?pre+EMOJI[n]:m);
 t=emph(t).replace(/[ \t]+\n/g,'\n').replace(/\n/g,o.nobr?'\n':'<br>');
 for(let n=0;n<8&&/\u0001\d+\u0001/.test(t);n++)t=t.replace(/\u0001(\d+)\u0001/g,(m,i)=>st[i]);
 return t}
/* ---------- blocks ---------- */
const FENCE=/^( {0,3})(\x60{3,}|~{3,})[ \t]*([^\s\x60]*)[^\x60]*$/,ATX=/^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/,
 LI=/^([ \t]*)([-*+]|\d{1,9}[.)])(?:[ \t]+(.*)|[ \t]*)$/,
 HTMLB=/^\s{0,3}<\/?(p|div|center|table|thead|tbody|tfoot|tr|td|th|caption|h[1-6]|ul|ol|li|blockquote|pre|hr|details|summary|dl|dt|dd)\b/i;
const mk=x=>/\d/.test(x[0])?x.slice(-1):x;
const isHr=l=>/^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(l);
const isSep=l=>l!==undefined&&l.includes('-')&&/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(l);
const CO={NOTE:['note','Note'],TIP:['tip','Tip'],IMPORTANT:['imp','Important'],WARNING:['warn','Warning'],CAUTION:['bad','Caution']};
function starts(l,n){if(FENCE.test(l)||ATX.test(l)||isHr(l)||/^ {0,3}>/.test(l)||HTMLB.test(l)||(l.includes('|')&&isSep(n)))return true;
 const m=l.match(LI);return !!(m&&m[3]&&(!/\d/.test(m[2][0])||/^1[.)]$/.test(m[2])))}
function code(b,lang){let h;
 if(lang==='diff'||lang==='patch')h=b.map(x=>{const e=ec(x);return /^\+(?!\+\+)/.test(x)?'<span class="rn-add">'+e+'</span>':/^-(?!--)/.test(x)?'<span class="rn-del">'+e+'</span>':e}).join('\n');
 else h=ec(b.join('\n'));
 return '<pre class="rn-code"><code>'+h+'</code></pre>'}
function list(L,i,ctx,dep){const f=L[i].match(LI),base=ind(f[1]),ord=/\d/.test(f[2][0]),start=ord?parseInt(f[2],10):1,items=[];let loose=false;
 while(i<L.length){const m=L[i].match(LI);
  if(!m||ind(m[1])>base||/\d/.test(m[2][0])!==ord||mk(m[2])!==mk(f[2]))break;
  const rest=L[i].slice(m[1].length+m[2].length),sp=rest.match(/^[ \t]*/)[0].length,off=ind(m[1])+m[2].length+(sp>4||!sp?1:sp),lines=[m[3]||''];i++;
  while(i<L.length){const x=L[i];
   if(!x.trim()){let j=i;while(j<L.length&&!L[j].trim())j++;if(j>=L.length)break;
    const y=L[j],ym=y.match(LI);
    if(ym&&ind(ym[1])<=base){if(/\d/.test(ym[2][0])===ord){loose=true;i=j}break}
    if(ind(y)>base){for(let k=i;k<j;k++)lines.push('');i=j;continue}
    break}
   const xm=x.match(LI);if(xm&&ind(xm[1])<=base)break;
   if(ind(x)>base){lines.push(stripTo(x,off));i++;continue}
   if(lines[lines.length-1].trim()&&!starts(x,L[i+1])){lines.push(x);i++;continue}
   break}
  items.push(lines)}
 let tasks=false;
 const lis=items.map(lines=>{let pre='',k=lines[0].match(/^\[([ xX])\][ \t]+(.*)$/);
  if(k){tasks=true;pre='<input type="checkbox" disabled'+(k[1]===' '?'':' checked')+'> ';lines[0]=k[2]}
  let body=blocks(lines,ctx,dep+1);if(!loose)body=body.replace(/^<p>([\s\S]*?)<\/p>/,'$1');
  return '<li'+(pre?' class="rn-task"':'')+'>'+pre+body+'</li>'}).join('');
 const tag=ord?'ol':'ul';
 return{i,html:'<'+tag+(ord&&start!==1?' start="'+start+'"':'')+(tasks?' class="rn-tasks"':'')+'>'+lis+'</'+tag+'>'}}
function blocks(L,ctx,dep){const out=[];let i=0,m;dep=dep||0;
 if(dep>8)return '<p>'+inl(L.join('\n'),{},ctx)+'</p>';
 while(i<L.length){const l=L[i];
  if(!l.trim()){i++;continue}
  if((m=l.match(FENCE))){const ch=m[2][0],n=m[2].length,id=m[1].length,lang=(m[3]||'').toLowerCase(),b=[],close=new RegExp('^ {0,3}\\'+ch+'{'+n+',}[ \\t]*$'),strip=new RegExp('^ {0,'+id+'}');i++;
   while(i<L.length&&!close.test(L[i])){b.push(L[i].replace(strip,''));i++}i++;
   out.push(code(b,lang));continue}
  if((m=l.match(ATX))){i++;const lv=m[1].length;out.push('<h'+lv+' class="rn-h">'+inl(m[2]||'',{},ctx)+'</h'+lv+'>');continue}
  if(isHr(l)){out.push('<hr>');i++;continue}
  if(/^ {0,3}>/.test(l)){const b=[];
   while(i<L.length){const x=L[i];
    if(/^ {0,3}>/.test(x)){b.push(x.replace(/^ {0,3}> ?/,''));i++}
    else if(x.trim()&&b.length&&b[b.length-1].trim()&&!starts(x,L[i+1])){b.push(x);i++}
    else break}
   const c=b[0].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*$/i);
   if(c){const k=CO[c[1].toUpperCase()];out.push('<div class="rn-alert '+k[0]+'"><div class="rn-at">'+k[1]+'</div>'+blocks(b.slice(1),ctx,dep+1)+'</div>')}
   else out.push('<blockquote>'+blocks(b,ctx,dep+1)+'</blockquote>');
   continue}
  if(l.includes('|')&&isSep(L[i+1])){
   const cells=r=>r.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|'));
   const hd=cells(l),al=cells(L[i+1]).map(c=>/^:-+:$/.test(c)?'center':/-:$/.test(c)?'right':'');i+=2;const rows=[];
   while(i<L.length&&L[i].trim()&&L[i].includes('|')&&!starts(L[i],L[i+1])){rows.push(cells(L[i]));i++}
   const cell=(c,k,tg)=>'<'+tg+(al[k]?' style="text-align:'+al[k]+'"':'')+'>'+inl(c,{},ctx)+'</'+tg+'>';
   out.push('<div class="rn-tw"><table><thead><tr>'+hd.map((c,k)=>cell(c,k,'th')).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+hd.map((_,k)=>cell(r[k]||'',k,'td')).join('')+'</tr>').join('')+'</tbody></table></div>');continue}
  if(/^\s{0,3}<details\b/i.test(l)){let j=i,d=0;const buf=[];
   for(;j<L.length;j++){buf.push(L[j]);d+=(L[j].match(/<details\b/gi)||[]).length-(L[j].match(/<\/details\s*>/gi)||[]).length;if(d<=0)break}
   const mm=d<=0&&buf.join('\n').match(/^\s*<details([^>]*)>([\s\S]*)<\/details\s*>\s*$/i);
   if(mm){i=j+1;let inner=mm[2],sum='Details';const sm=inner.match(/<summary[^>]*>([\s\S]*?)<\/summary\s*>/i);
    if(sm){sum=sm[1];inner=inner.replace(sm[0],'')}
    out.push('<details class="rn-details"'+(/\bopen\b/i.test(mm[1])?' open':'')+'><summary>'+inl(sum.trim(),{nobr:1},ctx)+'</summary>'+blocks(inner.split('\n'),ctx,dep+1)+'</details>');continue}}
  if(HTMLB.test(l)){const b=[];
   if(/^\s{0,3}<pre\b/i.test(l)){while(i<L.length){b.push(L[i]);if(/<\/pre\s*>/i.test(L[i++]))break}out.push(sanitize(b.join('\n')));continue}
   while(i<L.length&&L[i].trim()){b.push(L[i]);i++}
   out.push(inl(b.join('\n'),{nobr:1},ctx));continue}
  if(LI.test(l)){const r=list(L,i,ctx,dep);i=r.i;out.push(r.html);continue}
  if(/^( {4}|\t)/.test(l)){const b=[];
   while(i<L.length){if(/^( {4}|\t)/.test(L[i])){b.push(stripTo(L[i],4));i++}
    else if(!L[i].trim()){let j=i;while(j<L.length&&!L[j].trim())j++;if(j<L.length&&/^( {4}|\t)/.test(L[j])){for(;i<j;i++)b.push('')}else break}
    else break}
   out.push(code(b,''));continue}
  const p=[l];i++;let setext=0;
  while(i<L.length&&L[i].trim()){
   if(/^ {0,3}=+[ \t]*$/.test(L[i])){setext=1;i++;break}
   if(/^ {0,3}-+[ \t]*$/.test(L[i])){setext=2;i++;break}
   if(starts(L[i],L[i+1]))break;
   p.push(L[i++])}
  if(setext)out.push('<h'+setext+' class="rn-h">'+inl(p.join('\n'),{},ctx)+'</h'+setext+'>');
  else out.push('<p>'+inl(p.join('\n'),{},ctx)+'</p>')}
 return out.join('\n')}
/* comments, reference definitions and footnote definitions are pulled out before parsing */
function prep(src){const L=String(src).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n'),out=[],defs={},fns={};let fence=null,com=false;
 for(let i=0;i<L.length;i++){let l=L[i],m;
  if(com){const k=l.indexOf('-->');if(k<0)continue;l=l.slice(k+3);com=false;if(!l.trim())continue}
  if(fence){out.push(l);if(new RegExp('^[ \\t]*\\'+fence[0]+'{'+fence.length+',}[ \\t]*$').test(l))fence=null;continue}
  if((m=l.match(/^[ \t]*(\x60{3,}|~{3,})/))){fence=m[1];out.push(l);continue}
  l=l.replace(/<!--[\s\S]*?-->/g,'');
  const c=l.indexOf('<!--');if(c>=0){com=true;l=l.slice(0,c);if(!l.trim())continue}
  if((m=l.match(/^ {0,3}\[\^([^\]\s]+)\]:[ \t]*(.*)$/))){let t=m[2];while(i+1<L.length&&/^( {2,}|\t)\S/.test(L[i+1]))t+=' '+L[++i].trim();fns[m[1]]=t;continue}
  if((m=l.match(/^ {0,3}\[([^\]]+)\]:[ \t]*<?([^\s>]+)>?(?:[ \t]+["'(]([^"')]*)["')])?[ \t]*$/))){defs[m[1].toLowerCase()]={u:m[2],t:m[3]||''};continue}
  out.push(l)}
 return{L:out,defs,fns}}
function mdToHtml(src){const p=prep(src),ctx={defs:p.defs,fns:p.fns,order:[]};let h=blocks(p.L,ctx,0),f='';
 for(let k=0;k<ctx.order.length;k++)f+='<li>'+inl(ctx.fns[ctx.order[k]],{},ctx)+'</li>';
 return h+(f?'<div class="rn-fns"><hr><ol>'+f+'</ol></div>':'')}
/* ---------- entry points ---------- */
function toText(n){if(n==null)return '';
 if(Array.isArray(n))return n.map(x=>x&&typeof x==='object'?(x.version?'## '+x.version+'\n\n':'')+(x.note||x.notes||''):String(x)).join('\n\n');
 if(typeof n==='object')return String(n.note||n.notes||n.body||'');
 return String(n)}
function looksHtml(t){const md=(t.match(/^\s*([-*+] |\d+[.)] |#{1,6} |\x60\x60\x60|>)/gm)||[]).length,ht=(t.match(/<(li|p|h[1-6]|ul|ol|pre|br)\b/gi)||[]).length;return ht>0&&md===0}
function render(notes){let t=toText(notes).replace(/\r\n?/g,'\n').trim();if(!t)return '';
 /* notes that were stored or sent with escaped newlines (the two characters \ and n) */
 if(t.indexOf('\n')<0&&t.indexOf('\\n')>=0)t=t.replace(/\\r\\n|\\n/g,'\n');
 return '<div class="rn-md">'+(looksHtml(t)?sanitize(t):mdToHtml(t))+'</div>'}
function dialog(head,notes,foot){const body=render(notes);
 return '<p class="rn-head">'+ec(head)+'</p>'+(body?'<div class="rn-sec">What’s new</div><div class="rn-notes">'+body+'</div>':'')+'<p class="rn-foot">'+ec(foot)+'</p>'}
function open(u){const n=window.__native||{};const f=n.openExternal||n.openUrl||n.openLink||n.shellOpen;
 try{if(typeof f==='function')return f.call(n,u)}catch(e){}
 try{if(typeof require==='function')return require('electron').shell.openExternal(u)}catch(e){}
 window.open(u,'_blank','noopener')}
if(typeof document!=='undefined')document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#asktext.rn a');if(!a)return;
 e.preventDefault();const u=a.getAttribute('data-x')||a.getAttribute('href')||'';if(/^(https?|mailto):/i.test(u))open(u)});
return{render,dialog,sanitize,mdToHtml,open}})();
