# Backend — Crypto Trading Journal (Google Apps Script + Google Sheets)

Backend full PRD: 4 sheet (DASHBOARD, TRADE LOG, MONTHLY, CONFIG), engine metrik, status IMPROVING,
custom menu, chart di Sheets, plus REST API untuk frontend.

## Prasyarat (sekali saja)

1. Node.js 20+.
2. Aktifkan **Google Apps Script API**: https://script.google.com/home/usersettings → aktifkan
   "Google Apps Script API".
3. `npm install` di folder `backend`.

## Deploy otomatis

```bash
cd backend
npm install
npm run deploy
```

Yang terjadi otomatis:
1. Cek/`clasp login` (butuh klik **Allow** di browser sekali).
2. Buat project Apps Script baru yang terikat ke **Google Sheet baru**.
3. Inject `SPREADSHEET_ID` + `API_TOKEN` acak ke `src/Config.gs`.
4. `clasp push`.
5. Buat deployment Web App → dapat URL `/exec`.
6. Panggil `?action=setup` untuk membuat 4 sheet, dropdown, proteksi, trigger, dan dashboard.
7. Tulis `deploy-output.json` (URL, token, id).

Jika `setup` belum berhasil karena otorisasi, buka Script IDE, jalankan fungsi `setupSpreadsheet`
sekali (setujui permission), lalu `npm run deploy` lagi.

## Uji API

```bash
npm run smoke
```

## Konfigurasi

- `SPREADSHEET_ID` & `API_TOKEN` di `src/Config.gs` (hasil inject). Bisa dioverride via
  Script Properties (`SPREADSHEET_ID`, `API_TOKEN`).
- Rotasi token: hapus `deploy-output.json` lalu `npm run deploy`.

## Endpoint

Auth: `token` di query (GET) atau body (POST). Envelope: `{ ok, data }` / `{ ok, error }`.

GET:
- `?action=ping`
- `?action=setup`
- `?action=getConfig`
- `?action=listTrades&month=&symbol=&result=&search=`
- `?action=getTrade&id=TRD-001`
- `?action=getMonthly`
- `?action=getDashboard`
- `?action=validateAll`

POST (Content-Type: `text/plain`, body JSON `{ action, token, payload }`):
- `createTrade` — payload = field trade
- `updateTrade` — payload `{ id, input }`
- `deleteTrade` — payload `{ id }`
- `updateConfig` — payload `{ accountBalance, riskPercent, targetWinRate, setupTags }`
- `recalcAll`
- `seedDemo`

Contoh createTrade:

```bash
curl -L -X POST "<EXEC_URL>" \
  -H "Content-Type: text/plain;charset=utf-8" \
  --data '{"action":"createTrade","token":"<TOKEN>","payload":{"entryDate":"2026-09-01","exitDate":"2026-09-02","symbol":"BTC/USDT","direction":"Long","timeframe":"1H","entryPrice":60000,"stopLoss":58800,"takeProfit":63600,"positionSize":500,"result":"Win","exitPrice":63600,"pnl":300}}'
```

> Catatan: Web App GAS tidak menangani preflight CORS, jadi POST memakai `text/plain`. Beberapa
> browser tidak bisa membaca body respons POST lintas-origin — untuk operasi tulis, cek hasil di
> sheet/`getDashboard`. Operasi baca via GET aman.

## Menu di Spreadsheet

Menu **Trading Journal**: Refresh Dashboard, Recalculate All, Export Bulan Ini, Validasi Semua Trade,
Setup / Inisialisasi, Reset ke Data Dummy.
