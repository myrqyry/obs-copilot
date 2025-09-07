#!/usr/bin/env node
import {existsSync} from 'fs';
import {join} from 'path';
import {spawnSync} from 'child_process';

const repoRoot = new URL('..', import.meta.url).pathname;
const backendDir = join(repoRoot, 'backend');
const venvDir = join(backendDir, 'venv');

if (existsSync(venvDir)) {
  console.log('Found existing backend/venv - skipping pipenv venv creation.');
  process.exit(0);
}

// If no venv, run pipenv install -r requirements.txt
console.log('No backend/venv found - creating virtualenv via pipenv...');
const r = spawnSync('pipenv', ['install', '-r', 'requirements.txt'], {cwd: backendDir, stdio: 'inherit'});
process.exit(r.status ?? 1);
