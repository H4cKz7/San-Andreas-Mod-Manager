/* SA Mod Manager - 10-backups.js: BK: config backup storage on disk */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== backups: the original and every earlier version of a config are kept before it is overwritten ===== */
const fsN=require('fs'),pathN=require('path'),cryptoN=require('crypto');
const fmtSize=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(1)+' MB';
const BK={
 base(){return pathN.join(window.__native.userData,'backups')},
 anchor(){const a=game||root;return a&&a._path?a._path:''},
 rel(abs){const a=this.anchor();return a&&abs.toLowerCase().startsWith(a.toLowerCase())?pathN.relative(a,abs).replace(/\\/g,'/'):abs.replace(/\\/g,'/')},
 dir(rel){return pathN.join(this.base(),S.curInst||'default',cryptoN.createHash('sha1').update(rel.toLowerCase()).digest('hex').slice(0,16))},
 versions(abs){const d=this.dir(this.rel(abs));if(!fsN.existsSync(d))return[];
  const names=fsN.readdirSync(d).filter(n=>n.endsWith('.bak')).map(n=>n.slice(0,-4)),v=names.filter(x=>x!=='original').sort((a,b)=>b-a).map(id=>({id,time:+id}));
  if(names.includes('original'))v.push({id:'original',time:fsN.statSync(pathN.join(d,'original.bak')).mtimeMs});return v},
 save(abs,text){const rel=this.rel(abs),d=this.dir(rel);fsN.mkdirSync(d,{recursive:true});fsN.writeFileSync(pathN.join(d,'.rel'),rel);
  const o=pathN.join(d,'original.bak');if(!fsN.existsSync(o)){fsN.writeFileSync(o,text);return'new'}
  const vs=this.versions(abs).filter(v=>v.id!=='original'),newest=vs.length?pathN.join(d,vs[0].id+'.bak'):o;
  if(fsN.readFileSync(newest,'utf8')===text)return'same';
  fsN.writeFileSync(pathN.join(d,Date.now()+'.bak'),text);
  this.versions(abs).filter(v=>v.id!=='original').slice(20).forEach(v=>fsN.unlinkSync(pathN.join(d,v.id+'.bak')));return'added'},
 async firstAsync(abs){const rel=this.rel(abs),d=this.dir(rel),o=pathN.join(d,'original.bak');
  try{await fsN.promises.access(o);return false}catch(e){}
  await fsN.promises.mkdir(d,{recursive:true});await fsN.promises.writeFile(pathN.join(d,'.rel'),rel);await fsN.promises.copyFile(abs,o);return true},
 removeFile(abs){fsN.rmSync(this.dir(this.rel(abs)),{recursive:true,force:true})},
 read(abs,id){return fsN.readFileSync(pathN.join(this.dir(this.rel(abs)),id+'.bak'),'utf8')},
 has(abs){return fsN.existsSync(pathN.join(this.dir(this.rel(abs)),'original.bak'))},
 all(){const d=pathN.join(this.base(),S.curInst||'default'),a=this.anchor(),out=[];if(!fsN.existsSync(d))return out;
  for(const h of fsN.readdirSync(d)){const rf=pathN.join(d,h,'.rel');if(!fsN.existsSync(rf))continue;const rel=fsN.readFileSync(rf,'utf8'),abs=pathN.join(a,rel);
   const names=fsN.readdirSync(pathN.join(d,h)).filter(n=>n.endsWith('.bak'));
   out.push({rel,abs,dir:pathN.join(d,h),count:names.length,last:Math.max(0,...names.map(n=>n==='original.bak'?0:+n.slice(0,-4))),missing:!fsN.existsSync(abs)})}
  return out.sort((x,y)=>y.last-x.last)}};

