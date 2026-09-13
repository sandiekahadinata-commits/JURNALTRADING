#!/usr/bin/env node
/**
 * tools/smoke-test.mjs
 * Uji end-to-end API GAS: ping, config, monthly, dashboard, CRUD trade, validate.
 *
 * Idempotent: semua trade uji diberi penanda unik dan dibersihkan di awal & akhir.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUTPUT_FILE = path.join(ROOT, 'deploy-output.json')

if (!fs.existsSync(OUTPUT_FILE)) {
  console.error('deploy-output.json tidak ditemukan. Jalankan: npm run deploy')
  process.exit(1)
}

const { execUrl, token } = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
const MARKER = `smoke-${Date.now()}`

let passed = 0
let failed = 0

const REQUEST_DELAY = 900

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseJsonOrNull(text) {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

/** Request dengan retry: jaringan gagal atau respons non-JSON (interstitial Google). */
async function requestJson(makeInit, attempts = 10) {
  let lastText = ''
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await sleep(REQUEST_DELAY)
    try {
      const res = await fetch(makeInit.url, makeInit)
      const text = await res.text()
      lastText = text
      const json = parseJsonOrNull(text)
      if (json) return json
    } catch (err) {
      lastText = err.message
    }
    await sleep(1000 * attempt)
  }
  return { ok: false, error: { code: 'NON_JSON', message: lastText.slice(0, 200) } }
}

async function get(action, params = {}) {
  const url = new URL(execUrl)
  url.searchParams.set('action', action)
  url.searchParams.set('token', token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const init = { url: url.toString(), redirect: 'follow' }
  return requestJson(init)
}

async function post(action, payload = {}) {
  const init = {
    url: execUrl,
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, payload }),
    redirect: 'follow',
  }
  return requestJson(init)
}

function check(name, condition, extra = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${name}${extra ? ` — ${extra}` : ''}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`)
  }
}

/** Hapus semua trade uji ber-penanda MARKER (ama untuk retry duplikat). */
async function cleanupMarker() {
  const found = await get('listTrades', { search: MARKER })
  if (!found.ok) return false
  for (const trade of found.data) {
    const res = await post('deleteTrade', { id: trade.id })
    if (!res.ok && res.error && res.error.code !== 'NOT_FOUND') return false
  }
  const after = await get('listTrades', { search: MARKER })
  return after.ok && after.data.length === 0
}

function buildPayload(overrides = {}) {
  return {
    entryDate: '2026-09-01',
    exitDate: '2026-09-02',
    symbol: 'BTC/USDT',
    direction: 'Long',
    timeframe: '1H',
    entryPrice: 60000,
    stopLoss: 58800,
    takeProfit: 63600,
    positionSize: 500,
    result: 'Win',
    exitPrice: 63600,
    pnl: 300,
    setupTag: 'Breakout',
    session: 'London',
    notes: MARKER,
    screenshotUrl: '',
    ...overrides,
  }
}

async function main() {
  console.log('=== Smoke Test API ===\n')
  console.log(`Endpoint: ${execUrl}`)
  console.log(`Marker  : ${MARKER}\n`)

  const preClean = await cleanupMarker()
  check('bersihkan sisa data uji', preClean)

  const ping = await get('ping')
  check('ping public', ping.ok === true, ping.ok ? ping.data.app : JSON.stringify(ping.error))

  let unauthJson = null
  for (let i = 0; i < 10 && !unauthJson; i += 1) {
    await sleep(REQUEST_DELAY)
    try {
      const res = await fetch(`${execUrl}?action=getConfig&token=wrong`, { redirect: 'follow' })
      unauthJson = parseJsonOrNull(await res.text())
    } catch {
      /* retry */
    }
    if (!unauthJson) await sleep(900 * (i + 1))
  }
  check('token invalid ditolak', !!unauthJson && unauthJson.ok === false)

  const config = await get('getConfig')
  check('getConfig', config.ok === true, config.ok ? `balance=${config.data.accountBalance}` : JSON.stringify(config.error))

  const dashboard = await get('getDashboard')
  check('getDashboard', dashboard.ok === true, dashboard.ok ? `trades=${dashboard.data.totals.trades}` : JSON.stringify(dashboard.error))

  const monthly = await get('getMonthly')
  check('getMonthly', monthly.ok === true && Array.isArray(monthly.data))

  const create = await post('createTrade', buildPayload())
  check('createTrade', create.ok === true, create.ok ? create.data.id : JSON.stringify(create.error))

  const createdId = create.ok ? create.data.id : null

  if (createdId) {
    const fetched = await get('getTrade', { id: createdId })
    check(
      'getTrade',
      fetched.ok === true && fetched.data.id === createdId,
      fetched.ok ? `R=${fetched.data.rMultiple} bulan=${fetched.data.month}` : JSON.stringify(fetched.error),
    )

    const updated = await post('updateTrade', {
      id: createdId,
      input: buildPayload({ timeframe: '4H', result: 'Loss', exitPrice: 58800, pnl: -100 }),
    })
    check('updateTrade', updated.ok === true && updated.data.timeframe === '4H', updated.ok ? `result=${updated.data.result}` : JSON.stringify(updated.error))

    const listed = await get('listTrades', { search: MARKER })
    check('listTrades(search)', listed.ok === true && listed.data.length >= 1, listed.ok ? `${listed.data.length} hasil` : JSON.stringify(listed.error))
  }

  const cleaned = await cleanupMarker()
  check('deleteTrade + cleanup', cleaned)

  const validate = await get('validateAll')
  check('validateAll', validate.ok === true, validate.ok ? `${validate.data.invalidCount}/${validate.data.total} tidak konsisten` : JSON.stringify(validate.error))

  console.log(`\n=== Hasil: ${passed} PASS, ${failed} FAIL ===`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('\nSmoke test error:', err && err.stack ? err.stack : err)
  process.exit(1)
})
