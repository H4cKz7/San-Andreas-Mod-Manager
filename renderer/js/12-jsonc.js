/* SA Mod Manager - 12-jsonc.js: JC: JSON-with-comments parser and in-place editor */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== JSON with comments: parsed into positions so edits keep comments, indentation and line endings ===== */
const JC=(()=>{
 const NUM=/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y,LIT=/true|false|null/y;
 const cleanC=(t,c)=>{const s=t.slice(c.s,c.e);return(c.block?s.replace(/^\/\*+/,'').replace(/\*+\/$/,'').split(/\r?\n/).map(x=>x.replace(/^\s*\*+\s?/,'').trim()).filter(Boolean).join(' '):s.replace(/^\/\/+\s?/,'').trim()).replace(/^[-=~_*]{3,}\s*|\s*[-=~_*]{3,}$/g,'').trim()};
 const end=m=>m.trail?m.trail.e:m.comma!=null?m.comma+1:m.v.e;
 function parse(text){
  const n=text.length;let i=0;
  const err=(m,p=i)=>{throw new Error(m+' (line '+(text.slice(0,p).split('\n').length)+')')};
  function skip(out){for(;;){const c=text[i];
   if(c===' '||c==='\t'||c==='\n'||c==='\r'||c==='\uFEFF'){i++;continue}
   if(c==='/'&&text[i+1]==='/'){const s=i;i+=2;while(i<n&&text[i]!=='\n')i++;let e=i;if(text[e-1]==='\r')e--;if(out)out.push({s,e,block:false});continue}
   if(c==='/'&&text[i+1]==='*'){const s=i,k=text.indexOf('*/',i+2);if(k<0)err('Unterminated comment',s);i=k+2;if(out)out.push({s,e:i,block:true});continue}
   return}}
  function trailing(){let j=i;while(text[j]===' '||text[j]==='\t')j++;
   if(text[j]==='/'&&text[j+1]==='/'){let e=j+2;while(e<n&&text[e]!=='\n')e++;if(text[e-1]==='\r')e--;i=e;return{s:j,e,block:false}}
   if(text[j]==='/'&&text[j+1]==='*'){const k=text.indexOf('*/',j+2);if(k>=0&&!text.slice(j,k).includes('\n')){i=k+2;return{s:j,e:i,block:true}}}
   return null}
  function str(){const s=i;i++;
   for(;i<n;i++){const c=text[i];
    if(c==='\\')i++;
    else if(c==='"'){i++;try{return JSON.parse(text.slice(s,i))}catch(e){err('Invalid text in quotes',s)}}
    else if(c==='\n')err('Unterminated text in quotes',s)}
   err('Unterminated text in quotes',s)}
  function member(cms,ks,ke,key,v){let k=cms.length,nx=ks;
   while(k>0){const c=cms[k-1];if((text.slice(c.e,nx).match(/\n/g)||[]).length>1)break;nx=c.s;k--}
   const own=cms.slice(k);
   const ruled=own.some(c=>!c.block&&/^\/\/+\s*[-=~_*]{3,}|[-=~_*]{3,}\s*$/.test(text.slice(c.s,c.e))),txt=own.map(c=>cleanC(text,c)).filter(Boolean).join(' ');
   return{key,ks,ke,v,s:own.length?own[0].s:ks,desc:ruled?'':txt,head:ruled?txt:'',comma:null,trail:null}}
  function tdesc(m){const x=m.trail?cleanC(text,m.trail):'';if(x)m.desc=m.desc?m.desc+' '+x:x}
  function after(m,close){const save=i;skip(null);
   if(text[i]===','){m.comma=i;i++;m.trail=trailing()}
   else{if(i>=n)err('The file ends before the '+(close==='}'?'object':'list')+' is closed');if(text[i]!==close)err('Expected "," or "'+close+'"');i=save;m.trail=trailing()}}
  function obj(){const nd={t:'object',s:i,members:[]};i++;
   for(;;){const cms=[];skip(cms);
    if(i>=n)err('Unterminated {',nd.s);
    if(text[i]==='}'){nd.e=++i;return nd}
    if(text[i]!=='"')err('Expected a property name in quotes');
    const ks=i,key=str(),ke=i;skip(null);
    if(text[i]!==':')err('Expected ":" after the property name');
    i++;skip(null);
    const m=member(cms,ks,ke,key,value());nd.members.push(m);after(m,'}');tdesc(m)}}
  function arr(){const nd={t:'array',s:i,members:[]};i++;
   for(;;){const cms=[];skip(cms);
    if(i>=n)err('Unterminated [',nd.s);
    if(text[i]===']'){nd.e=++i;return nd}
    const ks=i,m=member(cms,ks,ks,null,value());nd.members.push(m);after(m,']');tdesc(m)}}
  function value(){const c=text[i];
   if(c==='{')return obj();
   if(c==='[')return arr();
   if(c==='"'){const s=i,v=str();return{t:'string',s,e:i,v}}
   LIT.lastIndex=i;let m=LIT.exec(text);
   if(m){const s=i;i+=m[0].length;return{t:m[0]==='null'?'null':'boolean',s,e:i,v:m[0]==='null'?null:m[0]==='true'}}
   NUM.lastIndex=i;m=NUM.exec(text);
   if(m){const s=i;i+=m[0].length;return{t:'number',s,e:i,v:Number(m[0])}}
   err(c===undefined?'The file ends too early':'Unexpected “'+c+'”')}
  const lead=[];skip(lead);const root=value();skip(null);
  if(i<n)err('Unexpected content after the end of the data');
  return{root,lead:lead.map(c=>cleanC(text,c)).filter(Boolean),text}}
 const val=nd=>nd.t==='object'?nd.members.reduce((o,m)=>(o[m.key]=val(m.v),o),Object.create(null)):nd.t==='array'?nd.members.map(m=>val(m.v)):nd.v;
 function nodeAt(root,p){let nd=root;
  for(const k of p){if(nd.t==='object'){let f=null;for(const m of nd.members)if(m.key===k)f=m;if(!f)return null;nd=f.v}
   else if(nd.t==='array'){const m=nd.members[k];if(!m)return null;nd=m.v}else return null}
  return nd}
 function descs(ast){const mp=new Map();
  const walk=(nd,p)=>{if(nd.t==='object'||nd.t==='array')nd.members.forEach((m,i)=>{const q=[...p,nd.t==='object'?m.key:i];if(m.desc)mp.set(JSON.stringify(q),m.desc);walk(m.v,q)})};
  walk(ast.root,[]);return mp}
 const eolOf=t=>t.includes('\r\n')?'\r\n':'\n';
 const indentOf=(t,pos)=>{let a=pos;while(a>0&&t[a-1]!=='\n')a--;let b=a;while(t[b]===' '||t[b]==='\t')b++;return t.slice(a,b)};
 const unitOf=t=>{const m=t.match(/^([ \t]+)"/m);return m?m[1]:'  '};
 function set(t,ast,p,raw){const nd=nodeAt(ast.root,p);return t.slice(0,nd.s)+raw+t.slice(nd.e)}
 function del(t,ast,p){const k=p[p.length-1],par=nodeAt(ast.root,p.slice(0,-1)),mem=par.members;
  let idx=-1;if(par.t==='object')mem.forEach((m,j)=>{if(m.key===k)idx=j});else idx=+k;
  const m=mem[idx];let s=m.s,e=end(m);
  let ls=s;while(ls>0&&(t[ls-1]===' '||t[ls-1]==='\t'))ls--;
  let le=e;while(le<t.length&&(t[le]===' '||t[le]==='\t'||t[le]==='\r'))le++;
  if((ls===0||t[ls-1]==='\n')&&(le>=t.length||t[le]==='\n')){s=ls;e=le<t.length?le+1:le}
  else while(t[e]===' '||t[e]==='\t')e++;
  if(idx===mem.length-1&&m.comma==null&&idx>0&&mem[idx-1].comma!=null){const pc=mem[idx-1].comma;
   if(/^[ \t]*$/.test(t.slice(pc+1,s)))s=pc;
   else return t.slice(0,pc)+t.slice(pc+1,s)+t.slice(e)}
  return t.slice(0,s)+t.slice(e)}
 function add(t,ast,p,key,raw){const c=nodeAt(ast.root,p),isO=c.t==='object',mem=c.members,close=c.e-1,eol=eolOf(t);
  let sep=': ';if(isO&&mem.length){const l=mem[mem.length-1],x=t.slice(l.ke,l.v.s);if(/^[ \t]*:[ \t]*$/.test(x))sep=x}
  const item=isO?JSON.stringify(key)+sep+raw:raw;
  if(!mem.length){const inner=t.slice(c.s+1,close),bi=indentOf(t,c.s),ci=bi+unitOf(t);
   if(/^\s*$/.test(inner))return isO?t.slice(0,c.s+1)+eol+ci+item+eol+bi+t.slice(close):t.slice(0,c.s+1)+item+t.slice(close);
   return t.slice(0,c.s+1)+eol+ci+item+t.slice(c.s+1)}
  const last=mem[mem.length-1],le=end(last),multi=t.slice(c.s,last.ks).includes('\n')||t.slice(le,close).includes('\n');
  if(!multi){if(last.comma==null)return t.slice(0,last.v.e)+', '+item+t.slice(last.v.e);return t.slice(0,le)+' '+item+','+t.slice(le)}
  const ind=indentOf(t,last.ks);
  if(last.comma==null)return t.slice(0,last.v.e)+','+t.slice(last.v.e,le)+eol+ind+item+t.slice(le);
  return t.slice(0,le)+eol+ind+item+','+t.slice(le)}
 function heads(ast){const mp=new Map();
  const walk=(nd,p)=>{if(nd.t==='object'||nd.t==='array')nd.members.forEach((m,i)=>{const q=[...p,nd.t==='object'?m.key:i];if(m.head)mp.set(JSON.stringify(q),m.head);walk(m.v,q)})};
  walk(ast.root,[]);return mp}
 return{parse,val,nodeAt,descs,heads,set,del,add}})();

