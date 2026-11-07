const {chromium}=require('playwright');
(async()=>{const mode=process.argv[2];const b=await chromium.launch({args:['--disable-web-security']});const p=await b.newPage({viewport:{width:1080,height:1920}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://127.0.0.1:8765/index.html');await p.waitForFunction(()=>window.READY===true,null,{timeout:60000});
if(mode==='stills'){for(const t of process.argv[3].split(',').map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot({path:`st_${t}.jpg`,type:'jpeg',quality:80})}}
else if(mode==='events'){require('fs').writeFileSync('events.json',JSON.stringify(await p.evaluate(()=>window.EV)))}
else{require('fs').mkdirSync('fr',{recursive:true});const a=+(process.argv[3]||0),z=+(process.argv[4]||Math.round(78.3*24));
 for(let i=a;i<z;i++){await p.evaluate(t=>render(t),i/24);await p.screenshot({path:`fr/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90})}}
console.log(errs.join('\n')||'ok');await b.close()})();
