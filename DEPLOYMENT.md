# Deployment & Operasional

Crypto Trading Journal — React SPA (Vercel) + Google Apps Script (Google Sheets).

## Arsitektur

```
Browser ──same-origin──► Vercel SPA
                            │  /api/login, /api/session, /api/journal
                            ▼
                     Vercel Serverless Function (proxy + auth cookie)
                            │  menyisipkan token server-side
                            ▼
                     Google Apps Script Web App ──► Google Sheets
```

- Token/URL Google Sheets **hanya di server** (Vercel env), tidak masuk bundle browser.
- Akses dilindungi **login password** (cookie HttpOnly bertanda tangan HMAC).

## URL Produksi

- App: https://trading-jurnal-sfp.vercel.app
- Spreadsheet: https://docs.google.com/spreadsheets/d/14hJPibd0zVGUzJeMAxxcbGWVz98QPQCBwPKPjbpY_u8/edit
- Script IDE: https://script.google.com/d/1vPgSOS14kCk-61kKYbAWHWbAumUw8vMsBaxZF19w3JxSGyGT4YB2I23_/edit

## Environment Variables (Vercel)

Diatur di Vercel Project → Settings → Environment Variables (Production/Preview/Development):

| Nama | Keterangan |
|------|------------|
| `JOURNAL_API_URL` | URL Web App GAS `/exec` |
| `JOURNAL_API_TOKEN` | Token API (samakan dengan `API_TOKEN` di GAS) |
| `JOURNAL_PASSWORD` | Password login aplikasi |
| `AUTH_SECRET` | Kunci penandatangan cookie (acak, min 32 char) |

## Secrets GitHub (Actions)

Repo → Settings → Secrets and variables → Actions:

| Secret | Nilai |
|--------|-------|
| `VERCEL_TOKEN` | Buat di https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `team_099XpjXZblULoemFTJkm5AB3` |
| `VERCEL_PROJECT_ID` | `prj_s03PX5ZzRLsNsJhGOJMRDqOQnYb7` |
| `CLASPRC_JSON` | Isi file `~/.clasprc.json` (hasil `clasp login`) |
| `SCRIPT_ID` | `1vPgSOS14kCk-61kKYbAWHWbAumUw8vMsBaxZF19w3JxSGyGT4YB2I23_` |
| `SPREADSHEET_ID` | `14hJPibd0zVGUzJeMAxxcbGWVz98QPQCBwPKPjbpY_u8` |
| `API_TOKEN` | Token API GAS |
| `DEPLOYMENT_ID` | `AKfycby6xVNAOS50iLvU7P461sndyO6017NhYv7DGf5HnPCr1LmuiqxsTrmmJ1BXdRMc0qFN` |

`deploy-output.json` (berisi token & URL) **tidak** di-commit.

## CI/CD

- `.github/workflows/ci.yml` — typecheck + lint + build frontend (push & PR).
- `.github/workflows/frontend-deploy.yml` — deploy frontend ke Vercel produksi saat `frontend/**` berubah.
- `.github/workflows/backend-deploy.yml` — `clasp push` + deploy GAS saat `backend/**` berubah.

## Development Lokal

```bash
# Backend (butuh clasp login sekali)
cd backend
npm install
npm run deploy        # push + deploy + setup

# Frontend (proxy + auth via Vercel Functions)
cd ../frontend
npm install
# Set env server untuk dev (ambil dari Vercel):
#   vercel env pull .env.local
npm run dev:vercel    # http://localhost:3000
```

`npm run dev` (Vite murni) tidak menjalankan `/api/*`; gunakan `npm run dev:vercel`.

## Operasional

- **Rotasi token GAS:** ganti `API_TOKEN` di backend & Vercel (samakan) → redeploy backend.
- **Ganti password login:** ubah `JOURNAL_PASSWORD` di Vercel → redeploy (atau promote).
- **Backup data:** Google Sheets → File → Version history, atau salin spreadsheet.
- **Rollback frontend:** Vercel → Deployments → Promote deployment sebelumnya.
- **Rollback backend:** `clasp deploy -V <version>` atau jalankan workflow manual dari commit sebelumnya.

## Troubleshooting

- **401 "Sesi tidak valid"** → login ulang (cookie 30 hari).
- **"Server belum dikonfigurasi"** → env Vercel belum lengkap.
- **"Respons tidak valid / Bad Gateway"** → cold start GAS; proxy sudah retry otomatis. Cek Script IDE > Executions.
- **Deploy GAS gagal "Apps Script API"** → aktifkan di https://script.google.com/home/usersettings.
