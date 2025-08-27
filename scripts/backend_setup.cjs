const {execSync, spawn}=require('child_process');
const fs=require('fs');
const isWin=process.platform==='win32';
const py = isWin ? 'backend/venv/Scripts/python.exe' : 'backend/venv/bin/python';
if(!fs.existsSync('backend/venv')){
  try{
    execSync('python3 -m venv backend/venv', {stdio:'inherit'});
  }catch(e){
    try{
      execSync('python -m venv backend/venv', {stdio:'inherit'});
    }catch(e2){
      console.error('Failed to create venv');
      process.exit(1);
    }
  }
}
try{
  execSync(`${py} -m pip install -r backend/requirements.txt`, {stdio:'inherit'});
}catch(e){}
const port = process.env.BACKEND_PORT || process.env.PORT || '8000';
const host = process.env.BACKEND_HOST || '0.0.0.0';
const child = spawn(py, ['-m','uvicorn','backend.main:app','--reload','--port',port,'--host',host], {stdio:'inherit'});
child.on('exit', code=>process.exit(code));
