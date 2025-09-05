#!/usr/bin/env node

/**
 * Backend Development Server
 * 
 * Starts the FastAPI backend server with hot-reload enabled.
 * Automatically sets up the Python virtual environment if needed.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import net from 'net'; // Import net module for port checking

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function logInfo(message) {
  console.log(`${COLORS.cyan}ℹ️ ${message}${COLORS.reset}`);
}

function logSuccess(message) {
  console.log(`${COLORS.green}✓ ${message}${COLORS.reset}`);
}

function logWarning(message) {
  console.warn(`${COLORS.yellow}⚠️ ${message}${COLORS.reset}`);
}

function logError(message, error) {
  console.error(`${COLORS.red}✗ ${message}${COLORS.reset}`);
  if (error) {
    console.error(error);
  }
}

function runCommand(command, options = {}) {
  const { cwd = process.cwd(), exitOnError = true } = options;
  
  try {
    logInfo(`Running: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    return { success: true, result };
  } catch (error) {
    if (exitOnError) {
      logError(`Command failed: ${command}`, error);
      process.exit(1);
    }
    return { success: false, error };
  }
}

function getPythonExecutable(venvPath) {
  const isWindows = process.platform === 'win32';
  const pyInVenv = isWindows
    ? path.join(venvPath, 'Scripts', 'python.exe')
    : path.join(venvPath, 'bin', 'python');

  // Use the virtual environment's Python if it exists
  if (fs.existsSync(pyInVenv)) {
    return pyInVenv;
  }

  // Fall back to system Python
  return isWindows ? 'python' : 'python3';
}

async function ensureVenv() {
  const repoRoot = process.cwd();
  const venvRel = path.join('backend', 'venv');
  const venvPath = path.resolve(repoRoot, venvRel);

  if (!fs.existsSync(venvPath)) {
    logInfo('Creating Python virtual environment...');
    
    // Try python3 first, then python
    const pythonCommands = ['python3', 'python'];
    let venvCreated = false;
    
    for (const pyCmd of pythonCommands) {
      try {
        runCommand(`${pyCmd} -m venv "${venvPath}"`);
        logSuccess(`Virtual environment created at ${venvRel}`);
        venvCreated = true;
        break;
      } catch (error) {
        logWarning(`Failed to create venv with ${pyCmd}, trying next...`);
      }
    }
    
    if (!venvCreated) {
      logError('Failed to create virtual environment. Please ensure Python is installed.');
      process.exit(1);
    }
  } else {
    logInfo(`Using existing virtual environment at ${venvRel}`);
  }

  return venvPath;
}

async function installDependencies(venvPath) {
  const pythonExec = getPythonExecutable(venvPath);
  const requirementsPath = path.join('backend', 'requirements.txt');
  
  if (!fs.existsSync(requirementsPath)) {
    logWarning(`Requirements file not found at ${requirementsPath}`);
    return false;
  }

  try {
    logInfo('Installing Python dependencies...');
    runCommand(`"${pythonExec}" -m pip install --upgrade pip`);
    runCommand(`"${pythonExec}" -m pip install -r "${requirementsPath}"`);
    logSuccess('Dependencies installed successfully');
    return true;
  } catch (error) {
    logWarning('Failed to install dependencies. You may need to install them manually:');
    console.log(`  ${pythonExec} -m pip install -r ${requirementsPath}`);
    return false;
  }
}

// Function to check if a port is in use
function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => {
        resolve(false);
      });
    });
    server.listen(port);
  });
}

async function startUvicorn(venvPath) {
  const pythonExec = getPythonExecutable(venvPath);
  let port = process.env.BACKEND_PORT || process.env.PORT || '8000';
  const host = process.env.BACKEND_HOST || '0.0.0.0';

  // Check if default port 8000 is in use
  if (port === '8000' && await checkPortInUse(8000)) {
    logWarning('Port 8000 is in use, trying port 8001...');
    port = '8001';
  }
  
  const enableReload = (process.env.BACKEND_RELOAD || 'true').toLowerCase() !== 'false';

  const uvicornArgsBase = [
    '-m', 'uvicorn',
    'backend.main:app',
    '--port', port,
    '--host', host,
    '--app-dir', path.join(process.cwd(), 'backend')
  ];

  // Conditionally add reload args to avoid consuming many file watchers when not desired
  const uvicornArgs = enableReload
    ? uvicornArgsBase.concat(['--reload', '--reload-dir', path.join(process.cwd(), 'backend')])
    : uvicornArgsBase;

  logInfo(`Starting backend server at http://${host}:${port}`);
  logInfo(`Using Python: ${pythonExec}`);
  logInfo(`Uvicorn args: ${uvicornArgs.join(' ')}`);

  const child = spawn(pythonExec, uvicornArgs, { 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    logInfo('Shutting down backend server...');
    child.kill();
    process.exit(0);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      logError(`Backend server exited with code ${code}`);
    } else {
      logInfo('Backend server stopped');
    }
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    logError('Failed to start backend server', error);
    process.exit(1);
  });
}

async function main() {
  try {
    console.log(`\n${COLORS.bright}🚀 Starting OBS Copilot Backend${COLORS.reset}\n`);
    
    // 1. Ensure virtual environment exists
    const venvPath = await ensureVenv();
    
    // 2. Install dependencies (best effort)
    await installDependencies(venvPath);
    
    // 3. Start the backend server
    startUvicorn(venvPath);
    
  } catch (error) {
    logError('An unexpected error occurred', error);
    process.exit(1);
  }
}

// Run the main function
main();
