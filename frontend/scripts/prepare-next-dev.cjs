'use strict'

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const nextDir = path.join(__dirname, '..', '.next')

function sleepMs(ms) {
  try {
    execFileSync('powershell', ['-NoProfile', '-Command', `Start-Sleep -Milliseconds ${ms}`], {
      stdio: 'ignore'
    })
  } catch {
    const end = Date.now() + ms
    while (Date.now() < end) {
      /* spin */
    }
  }
}

/** @returns {string[]} */
function listenPidsWindows(port) {
  const script = `$ErrorActionPreference = 'SilentlyContinue'; (Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }).OwningProcess | Sort-Object -Unique`
  try {
    const out = execFileSync('powershell', ['-NoProfile', '-Command', script], {
      encoding: 'utf8',
      windowsHide: true
    }).trim()
    if (!out) return []
    return out
      .split(/[\r\n]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
  } catch {
    return []
  }
}

function killPidTreeWindows(pid) {
  if (pid === String(process.pid)) return
  try {
    execFileSync('taskkill', ['/PID', pid, '/F', '/T'], { stdio: 'ignore', windowsHide: true })
  } catch {
    /* ignore — may be access denied or already exited */
  }
}

function freeNextPortsWindows() {
  const ports = [3000, 3001]
  const seen = new Set()
  for (const port of ports) {
    for (const pid of listenPidsWindows(port)) {
      if (seen.has(pid)) continue
      seen.add(pid)
      killPidTreeWindows(pid)
    }
  }
  if (seen.size > 0) {
    sleepMs(800)
  }
}

function removeNextDir() {
  if (!fs.existsSync(nextDir)) return
  try {
    fs.rmSync(nextDir, { recursive: true, force: true })
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : ''
    if (code === 'EPERM' || code === 'EBUSY') {
      console.error(
        'Still cannot remove .next (files in use). Close other terminals running Next.js, Cursor preview servers, or antivirus locks on this folder, then retry.'
      )
      process.exit(1)
    }
    throw err
  }
}

if (process.env.SKIP_FREE_PORTS !== '1' && process.platform === 'win32') {
  freeNextPortsWindows()
}

removeNextDir()
