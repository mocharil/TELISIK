import {spawn} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=process.cwd(),args=process.argv.slice(2),fromFile=existsSync('.env.local')&&/^VITE_USE_LOCAL_API=true\s*$/m.test(readFileSync('.env.local','utf8'));
const local=args.includes('--local')||process.env.VITE_USE_LOCAL_API==='true'||fromFile;
const env={...process.env,VITE_USE_LOCAL_API:local?'true':'false'};
let backend;
async function healthy(){try{const r=await fetch('http://127.0.0.1:8000/api/health',{signal:AbortSignal.timeout(500)});return r.ok&&(await r.json()).service==='telisik';}catch{return false;}}
if(local&&!(await healthy())){
 const python=resolve(root,process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
 if(!existsSync(python)){console.error('Create .venv and install backend/requirements.txt before starting local API mode.');process.exit(1);}
 backend=spawn(python,['-m','uvicorn','backend.main:app','--host','127.0.0.1','--port','8000'],{cwd:root,env,stdio:'inherit'});
 let ready=false;
 for(let i=0;i<80;i++){if(backend.exitCode!==null)break;if(await healthy()){ready=true;break;}await new Promise(r=>setTimeout(r,100));}
 if(!ready){backend.kill();console.error('Local API did not start. Check port 8000 and backend dependencies.');process.exit(1);}
}
const frontend=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),...args.filter(a=>a!=='--local')],{cwd:root,env,stdio:'inherit'});
function stop(){frontend.kill();backend?.kill();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
frontend.on('exit',code=>{backend?.kill();process.exitCode=code??0;});
backend?.on('exit',code=>{if(code&&frontend.exitCode===null){console.error('Backend stopped unexpectedly.');frontend.kill();}});
