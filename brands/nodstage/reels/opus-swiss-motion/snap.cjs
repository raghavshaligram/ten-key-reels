const {chromium}=require('playwright');
(async()=>{const mode=process.argv[2];const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/index.html?clean=1');await p.evaluate(()=>window.ready);
if(mode==='stills'){const ts=process.argv[3].split(',').map(Number);
 for(const t of ts){await p.evaluate(t=>seek(t),t);await p.screenshot({path:`st_${t}.jpg`,type:'jpeg',quality:80})}}
else if(mode==='events'){require('fs').writeFileSync('events.json',JSON.stringify(await p.evaluate(()=>EV)))}
else{require('fs').mkdirSync('fr',{recursive:true});const D=await p.evaluate(()=>DURATION);const N=Math.round(D*30);
 for(let i=0;i<N;i++){await p.evaluate(t=>seek(t),i/30);await p.screenshot({path:`fr/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})}}
console.log(errs.join('\n')||'ok');await b.close()})();
