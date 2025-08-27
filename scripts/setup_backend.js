#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const backendDir = path.join(__dirname, '..', 'backend');
const venvPath = path.join(backendDir, 'venv');
const requirementsPath = path.join(backendDir, 'requirements.txt');
const pythonExecutable = isWindows 
  ? path.join(venvPath, 'Scripts', 'python.exe')
  : path.join(venvPath, 'bin', 'python');

function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage}`);
    console.error(error.message);
    return false;
  }
}

// Check if Python is installed
console.log('🔍 Checking Python installation...');
const pythonCheck = runCommand('python3 --version || python --version', 
  'Python is not installed or not in PATH. Please install Python 3.8 or higher and try again.'
);

if (!pythonCheck) {
  process.exit(1);
}

// Create virtual environment if it doesn't exist
if (!fs.existsSync(venvPath)) {
  console.log('🚀 Creating virtual environment...');
  const venvCmd = `python3 -m venv "${venvPath}"`;
  if (!runCommand(venvCmd, 'Failed to create virtual environment')) {
    process.exit(1);
  }
}

// Install requirements
console.log('📦 Installing Python dependencies...');
const pipInstallCmd = `"${pythonExecutable}" -m pip install -r "${requirementsPath}"`;
if (!runCommand(pipInstallCmd, 'Failed to install requirements')) {
  process.exit(1);
}

// Start the server
console.log('🚀 Starting backend server...');
const port = process.env.BACKEND_PORT || process.env.PORT || '8000';
const host = process.env.BACKEND_HOST || '0.0.0.0';

const server = spawn(
  pythonExecutable,
  [
    '-m',
    'uvicorn',
    'main:app',
    '--reload',
    '--port', port,
    '--host', host,
    '--app-dir', backendDir
  ],
  { stdio: 'inherit' }
);

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping backend server...');
  server.kill();
  process.exit(0);
});

server.on('exit', (code) => {
  console.log(`Backend server exited with code ${code}`);
  process.exit(code);
});
