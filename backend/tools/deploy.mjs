#!/usr/bin/env node
/**
 * tools/deploy.mjs
 * Orkestrasi deploy otomatis ke Google Apps Script:
 *   1. pastikan login clasp
 *   2. buat project (bound ke spreadsheet baru) bila belum ada
 *   3. inject SPREADSHEET_ID + API_TOKEN ke src/Config.gs
 *   4. clasp push
 *   5. buat/update deployment web app
 *   6. panggil ?action=setup
 *   7. tulis deploy-output.json
 */

import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'src')
const CONFIG_FILE = path.join(SRC_DIR, 'Config.gs')
const CLASP_JSON = path.join(ROOT, '.clasp.json')
const OUTPUT_FILE = path.join(ROOT, 'deploy-output.json')
const CLASP_ENTRY = path.join(ROOT, 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js')
const PROJECT_TITLE = 'Crypto Trading Journal'
const DEPLOY_DESCRIPTION = 'auto-deploy v1'

function log(msg) {
  process.stdout.write(`${msg}\n`)
}

function die(msg) {
  process.stderr.write(`\n[ERROR] ${msg}\n`)
  process.exit(1)
}

function clasp(args, { inherit = false } = {}) {
  const result = spawnSync(process.execPath, [CLASP_ENTRY, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
  })
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    output: `${result.stdout || ''}${result.stderr || ''}`,
  }
}

function readOutput() {
  if (!fs.existsSync(OUTPUT_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeOutput(data) {
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function ensureLoggedIn() {
  log('• Memeriksa status login clasp...')
  const check = clasp(['show-authorized-user', '--json'])
  if (check.status === 0) {
    log('  sudah login.')
    return
  }
  log('  belum login — membuka alur login Google (butuh klik "Allow" di browser).')
  const login = clasp(['login'], { inherit: true })
  if (login.status !== 0) {
    die('Login clasp gagal. Jalankan manual: npm run login')
  }
}

function parseCreateOutput(output) {
  // Mode --json mengembalikan { scriptId, parentId, files }. parentId = ID spreadsheet.
  try {
    const start = output.indexOf('{')
    if (start >= 0) {
      const parsed = JSON.parse(output.slice(start))
      if (parsed.scriptId) {
        return { scriptId: parsed.scriptId, spreadsheetId: parsed.parentId || null }
      }
    }
  } catch {
    /* fallback regex di bawah */
  }
  const sheetMatch =
    output.match(/spreadsheets\/d\/([A-Za-z0-9_-]+)/) || output.match(/[?&]id=([A-Za-z0-9_-]{20,})/)
  const scriptUrlMatch = output.match(/script\.google\.com\/d\/([A-Za-z0-9_-]+)/)
  return {
    spreadsheetId: sheetMatch ? sheetMatch[1] : null,
    scriptId: scriptUrlMatch ? scriptUrlMatch[1] : null,
  }
}

function cleanupStrayFiles() {
  const stray = ['Code.gs', 'appsscript.json']
  for (const name of stray) {
    const target = path.join(ROOT, name)
    if (fs.existsSync(target)) fs.rmSync(target)
  }
}

function ensureProject(existing) {
  if (!fs.existsSync(CLASP_JSON) && process.env.SCRIPT_ID) {
    log('• CI: membuat .clasp.json dari env SCRIPT_ID...')
    fs.writeFileSync(
      CLASP_JSON,
      `${JSON.stringify({ scriptId: process.env.SCRIPT_ID, rootDir: 'src' }, null, 2)}\n`,
      'utf8',
    )
  }

  if (fs.existsSync(CLASP_JSON)) {
    log('• Project clasp sudah ada (.clasp.json ditemukan).')
    ensureRootDir()
    const claspJson = JSON.parse(fs.readFileSync(CLASP_JSON, 'utf8'))
    return {
      scriptId: claspJson.scriptId,
      spreadsheetId: process.env.SPREADSHEET_ID || existing.spreadsheetId || null,
    }
  }

  log('• Membuat project Apps Script baru (bound ke Google Sheets)...')
  const created = clasp(['create-script', '--type', 'sheets', '--title', PROJECT_TITLE, '--json'])
  if (created.status !== 0) {
    if (/Apps Script API/i.test(created.output)) {
      die(
        'Apps Script API belum diaktifkan. Buka https://script.google.com/home/usersettings , ' +
          'aktifkan "Google Apps Script API", tunggu 1-2 menit, lalu jalankan ulang: npm run deploy',
      )
    }
    die(`Gagal membuat project:\n${created.output}`)
  }

  cleanupStrayFiles()
  const parsed = parseCreateOutput(created.output)
  ensureRootDir()

  let scriptId = parsed.scriptId
  if (!scriptId && fs.existsSync(CLASP_JSON)) {
    scriptId = JSON.parse(fs.readFileSync(CLASP_JSON, 'utf8')).scriptId
  }
  if (!parsed.spreadsheetId) {
    die(
      'Tidak menemukan ID spreadsheet dari output clasp. Jalankan ulang: npm run deploy',
    )
  }
  return { scriptId, spreadsheetId: parsed.spreadsheetId }
}

function ensureRootDir() {
  if (!fs.existsSync(CLASP_JSON)) return
  const data = JSON.parse(fs.readFileSync(CLASP_JSON, 'utf8'))
  if (data.rootDir !== 'src') {
    data.rootDir = 'src'
    fs.writeFileSync(CLASP_JSON, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
}

function injectConfig(spreadsheetId, token) {
  log('• Inject SPREADSHEET_ID & API_TOKEN ke src/Config.gs...')
  let content = fs.readFileSync(CONFIG_FILE, 'utf8')
  if (!/var SPREADSHEET_ID = '[^']*';/.test(content)) die('Placeholder SPREADSHEET_ID tidak ditemukan di Config.gs')
  content = content.replace(/var SPREADSHEET_ID = '[^']*';/, `var SPREADSHEET_ID = '${spreadsheetId}';`)
  content = content.replace(/var API_TOKEN = '[^']*';/, `var API_TOKEN = '${token}';`)
  fs.writeFileSync(CONFIG_FILE, content, 'utf8')
}

function push() {
  log('• clasp push...')
  const result = clasp(['push', '--force'])
  if (result.status !== 0) die(`Gagal push:\n${result.output}`)
  log('  push sukses.')
}

function deploy(existingDeploymentId) {
  log('• Membuat deployment web app...')
  const args = ['create-deployment', '-d', DEPLOY_DESCRIPTION, '--json']
  if (existingDeploymentId) {
    args.push('-i', existingDeploymentId)
  }
  const result = clasp(args)
  let deploymentId = null

  if (result.status === 0) {
    try {
      const jsonStart = result.output.indexOf('{')
      if (jsonStart >= 0) {
        const parsed = JSON.parse(result.output.slice(jsonStart))
        deploymentId = parsed.deploymentId || parsed.deploymentID || null
      }
    } catch {
      /* fallback ke regex di bawah */
    }
    const match = result.output.match(/([A-Za-z0-9_-]{20,})\s*@\s*\d+/)
    if (!deploymentId && match) deploymentId = match[1]
  }

  if (!deploymentId) {
    log('  output deployment tidak terparse, membaca list-deployments...')
    const list = clasp(['list-deployments', '--json'])
    try {
      const jsonStart = list.output.indexOf('[')
      const arr = JSON.parse(list.output.slice(jsonStart))
      const candidates = arr.filter((d) => d.deploymentId && d.deploymentId !== '@HEAD')
      deploymentId = (candidates[candidates.length - 1] || arr[0] || {}).deploymentId
    } catch {
      const match = list.output.match(/- ([A-Za-z0-9_-]{20,}) @/g)
      if (match && match.length) {
        deploymentId = match[match.length - 1].replace(/- | @/g, '')
      }
    }
  }

  if (!deploymentId) die(`Gagal mendapatkan deployment ID.\n${result.output}`)
  return deploymentId
}

async function callSetup(execUrl, token) {
  const url = `${execUrl}?action=setup&token=${encodeURIComponent(token)}`
  log('• Memanggil ?action=setup...')
  let lastError = ''
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      const text = await res.text()
      let json = null
      try {
        json = JSON.parse(text)
      } catch {
        /* bukan JSON (butuh otorisasi) */
      }
      if (json && json.ok) {
        log(`  setup OK (${json.data.trades} trade, ${json.data.months} bulan).`)
        return { ok: true, data: json.data }
      }
      lastError = text.slice(0, 200)
    } catch (err) {
      lastError = err.message
    }
    log(`  percobaan ${attempt} belum berhasil, menunggu...`)
    await new Promise((resolve) => setTimeout(resolve, 3000 * attempt))
  }
  log(`  setup belum berhasil. Respons terakhir: ${lastError}`)
  return { ok: false, raw: lastError }
}

async function main() {
  log('=== Deploy Crypto Trading Journal (GAS) ===\n')
  if (!fs.existsSync(CLASP_ENTRY)) die('Dependency @google/clasp belum terinstall. Jalankan: npm install')

  const existing = readOutput()
  ensureLoggedIn()

  const project = ensureProject(existing)
  const token = process.env.API_TOKEN || existing.token || crypto.randomBytes(24).toString('hex')
  const spreadsheetId = process.env.SPREADSHEET_ID || project.spreadsheetId
  if (!spreadsheetId) die('SPREADSHEET_ID tidak diketahui (env atau deploy-output.json).')
  injectConfig(spreadsheetId, token)
  project.spreadsheetId = spreadsheetId
  push()

  const deploymentId = deploy(process.env.DEPLOYMENT_ID || existing.deploymentId)
  const execUrl = `https://script.google.com/macros/s/${deploymentId}/exec`
  log(`  deployment ID: ${deploymentId}`)

  const setupResult = await callSetup(execUrl, token)

  const output = {
    scriptId: project.scriptId || (fs.existsSync(CLASP_JSON) ? JSON.parse(fs.readFileSync(CLASP_JSON, 'utf8')).scriptId : null),
    spreadsheetId: project.spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${project.spreadsheetId}/edit`,
    scriptUrl: project.scriptId ? `https://script.google.com/d/${project.scriptId}/edit` : null,
    deploymentId,
    execUrl,
    token,
    setup: setupResult.ok ? 'ok' : 'pending-authorization',
    deployedAt: new Date().toISOString(),
  }
  writeOutput(output)

  log('\n=== Ringkasan ===')
  log(`Spreadsheet : ${output.spreadsheetUrl}`)
  log(`Script IDE  : ${output.scriptUrl}`)
  log(`API URL     : ${output.execUrl}`)
  log(`Token       : ${output.token}`)
  log(`File        : ${OUTPUT_FILE}`)

  if (!setupResult.ok) {
    log('\n[PERHATIAN] Buka Script IDE di atas, jalankan fungsi "setupSpreadsheet" sekali')
    log('untuk memberikan otorisasi (setujui permission), lalu jalankan: npm run deploy')
  } else {
    log('\nSelesai. Jalankan "npm run smoke" untuk uji end-to-end.')
  }
}

main().catch((err) => die(err && err.stack ? err.stack : String(err)))
