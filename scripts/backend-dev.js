/* scripts/backend-dev.js */
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

function runOrThrow(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function quoteArg(arg) {
  // Robust quoting to handle spaces/special chars in paths
  // JSON.stringify yields a valid shell-escaped string for execSync when passed as a single argument.
  return JSON.stringify(arg);
}

async function main() {
  const repoRoot = process.cwd();
  const venvRel = path.join('backend', 'venv');
  const venvPath = path.resolve(repoRoot, venvRel);

  const isWin = process.platform === 'win32';
  const pyInVenv = isWin
    ? path.join(venvPath, 'Scripts', 'python.exe')
    : path.join(venvPath, 'bin', 'python');

  // 1) Ensure venv exists
  if (!fs.existsSync(venvPath)) {
    console.log('Creating Python venv at', venvRel);
    try {
      runOrThrow('python3 -m venv ' + quoteArg(venvRel));
    } catch (e1) {
      console.log('python3 failed or is unavailable, trying python -m venv ...');
      try {
        runOrThrow('python -m venv ' + quoteArg(venvRel));
      } catch (e2) {
        console.error('Failed to create venv with python3 or python. Please ensure Python is installed.');
        process.exit(1);
      }
    }
  } else {
    console.log('Using existing venv at', venvRel);
  }

  // 2) Install requirements (best-effort; continue if it fails)
  const pythonExec = fs.existsSync(pyInVenv) ? pyInVenv : (isWin ? 'python' : 'python3');
  try {
    console.log('Installing python requirements using', pythonExec);
    runOrThrow(`${quoteArg(pythonExec)} -m pip install -r backend/requirements.txt`);
  } catch (e) {
    console.warn('pip install failed (continuing). If dependencies are missing, run:');
    console.warn(`${pythonExec} -m pip install -r backend/requirements.txt`);
  }

  // 3) Host/port
  const port = process.env.BACKEND_PORT || process.env.PORT || '8000';
  const host = process.env.BACKEND_HOST || '0.0.0.0';

  // 4) Spawn uvicorn
  const uvicornArgs = ['-m', 'uvicorn', 'backend.main:app', '--reload', '--port', String(port), '--host', String(host)];
  console.log('Spawning uvicorn:', pythonExec, uvicornArgs.join(' '));

  const child = spawn(pythonExec, uvicornArgs, { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
  child.on('error', (err) => {
    console.error('Failed to spawn uvicorn:', err);
    process.exit(1);
  });
}

main();