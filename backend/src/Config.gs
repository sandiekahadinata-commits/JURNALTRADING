/**
 * Config.gs
 * Konstanta global, nama sheet, header kolom, dan nilai yang di-inject saat deploy.
 *
 * Nilai __SPREADSHEET_ID__ dan __API_TOKEN__ akan diganti otomatis oleh
 * tools/deploy.mjs. Jangan mengubah manual kecuali untuk rotasi token.
 */

var APP_NAME = 'Crypto Trading Journal';
var TIMEZONE = 'Asia/Jakarta';

/** ID spreadsheet target (di-inject otomatis oleh deploy). */
var SPREADSHEET_ID = '__SPREADSHEET_ID__';

/** Shared token untuk API (di-inject otomatis oleh deploy). */
var API_TOKEN = '__API_TOKEN__';

/** Nama-nama tab sheet. */
var SHEET_DASHBOARD = 'DASHBOARD';
var SHEET_TRADE_LOG = 'TRADE LOG';
var SHEET_MONTHLY = 'MONTHLY';
var SHEET_CONFIG = 'CONFIG';

/** Business rules. */
var RISK_REWARD_RATIO = 3;
var RR_TOLERANCE = 0.005; // 0.5%
var BREAKEVEN_WIN_RATE = 25;
var IMPROVE_WIN_RATE_DELTA = 2; // poin persen
var IMPROVE_PROFIT_FACTOR_DELTA = 0.1;

/** Header sheet TRADE LOG (urutan kolom). */
var TRADE_LOG_HEADERS = [
  'Trade ID',
  'Tanggal Entry',
  'Tanggal Exit',
  'Symbol',
  'Arah',
  'Timeframe',
  'Entry Price',
  'Stop Loss',
  'Take Profit',
  'Ukuran Posisi',
  'Risk per Trade',
  'Hasil',
  'Harga Exit Aktual',
  'P&L Aktual',
  'Setup Tag',
  'Sesi Pasar',
  'Catatan',
  'Screenshot URL',
  'R-Multiple',
  'Bulan'
];

/** Header sheet MONTHLY. */
var MONTHLY_HEADERS = [
  'Bulan',
  'Total Trade',
  'Wins',
  'Losses',
  'Break Even',
  'Win Rate (%)',
  'Net R',
  'Profit Factor',
  'EV',
  'Total P&L (USDT)',
  'Max Consec Loss',
  'Max Consec Win',
  'Avg R-Multiple',
  'Status'
];

/** Pilihan dropdown. */
var DIRECTIONS = ['Long', 'Short'];
var TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W'];
var TRADE_RESULTS = ['Win', 'Loss', 'Break Even'];
var MARKET_SESSIONS = ['Asia', 'London', 'New York', 'Overlap'];
var DEFAULT_SETUP_TAGS = ['Breakout', 'Pullback', 'Range', 'OB', 'FVG'];

/** Nilai default CONFIG. */
var DEFAULT_CONFIG = {
  accountBalance: 10000,
  riskPercent: 1,
  targetWinRate: 50,
  setupTags: DEFAULT_SETUP_TAGS
};

/** Ambil ID spreadsheet (Script Properties menang atas konstanta). */
function getSpreadsheetId() {
  var override = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return override || SPREADSHEET_ID;
}

/** Ambil token API (Script Properties menang atas konstanta). */
function getApiToken() {
  var override = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  return override || API_TOKEN;
}
