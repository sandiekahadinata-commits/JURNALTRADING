/**
 * Setup.gs
 * Inisialisasi spreadsheet, trigger, dan data dummy.
 */

function setupSpreadsheet() {
  initializeSheets_();
  installTriggers_();
  refreshAll_();
  return true;
}

/** RNG deterministik sederhana. */
function makeRandom_(seed) {
  var state = seed >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

var DEMO_SYMBOLS = [
  { symbol: 'BTC/USDT', base: 68000 },
  { symbol: 'ETH/USDT', base: 3500 },
  { symbol: 'SOL/USDT', base: 165 },
  { symbol: 'BNB/USDT', base: 580 },
  { symbol: 'XRP/USDT', base: 0.62 },
  { symbol: 'AVAX/USDT', base: 38 }
];
var DEMO_TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W'];
var DEMO_SESSIONS = ['Asia', 'London', 'New York', 'Overlap'];
var DEMO_WIN_RATES = [0.25, 0.3, 0.34, 0.42, 0.5, 0.55];

function seedDemoData_() {
  var rand = makeRandom_(20260912);
  var config = getConfig_();
  if (!config.setupTags || !config.setupTags.length) config.setupTags = DEFAULT_SETUP_TAGS;

  var now = new Date();
  var refYear = now.getFullYear();
  var refMonth = now.getMonth();

  var rows = [];
  var counter = 1;

  for (var offset = 5; offset >= 0; offset--) {
    var d = new Date(refYear, refMonth - offset, 1);
    var year = d.getFullYear();
    var monthIndex = d.getMonth();
    var winRate = DEMO_WIN_RATES[5 - offset];
    var count = 8 + Math.floor(rand() * 5);

    for (var i = 0; i < count; i++) {
      var sym = DEMO_SYMBOLS[Math.floor(rand() * DEMO_SYMBOLS.length)];
      var direction = rand() < 0.5 ? 'Long' : 'Short';
      var timeframe = DEMO_TIMEFRAMES[Math.floor(rand() * DEMO_TIMEFRAMES.length)];
      var session = DEMO_SESSIONS[Math.floor(rand() * DEMO_SESSIONS.length)];
      var entryPrice = round_(sym.base * (1 + (rand() - 0.5) * 0.1), 4);
      var riskDistance = entryPrice * 0.02;
      var stopLoss = round_(direction === 'Long' ? entryPrice - riskDistance : entryPrice + riskDistance, 4);
      var takeProfit = round_(direction === 'Long' ? entryPrice + riskDistance * 3 : entryPrice - riskDistance * 3, 4);
      var positionSize = Math.round((200 + rand() * 800) / 50) * 50;

      var roll = rand();
      var result = roll < winRate ? 'Win' : roll < 0.92 ? 'Loss' : 'Break Even';
      var rMultiple = result === 'Win' ? 3 : result === 'Loss' ? -1 : round_(rand() * 0.2 - 0.1, 2);
      var riskPerTrade = (riskDistance * positionSize) / entryPrice;
      var pnl = round_(riskPerTrade * rMultiple, 2);
      var exitPrice = result === 'Win' ? takeProfit : result === 'Loss' ? stopLoss : entryPrice;

      var exitDay = 3 + Math.floor(rand() * 25);
      var entryDay = Math.max(1, exitDay - (1 + Math.floor(rand() * 3)));
      var setupTag = config.setupTags[Math.floor(rand() * config.setupTags.length)];

      var entryDate = year + '-' + pad2_(monthIndex + 1) + '-' + pad2_(entryDay);
      var exitDate = year + '-' + pad2_(monthIndex + 1) + '-' + pad2_(exitDay);

      var trade = buildTrade_('TRD-' + ('000' + counter).slice(-3), {
        entryDate: entryDate,
        exitDate: exitDate,
        symbol: sym.symbol,
        direction: direction,
        timeframe: timeframe,
        entryPrice: entryPrice,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        positionSize: positionSize,
        result: result,
        exitPrice: exitPrice,
        pnl: pnl,
        setupTag: setupTag,
        session: session,
        notes: result === 'Win' ? 'Setup ' + setupTag + ' valid.' : result === 'Loss' ? 'Setup ' + setupTag + ' gagal, SL kena.' : 'Ditutup BE.',
        screenshotUrl: ''
      });
      rows.push(tradeToRow_(trade));
      counter += 1;
    }
  }

  clearDataRows_(SHEET_TRADE_LOG);
  if (rows.length) {
    getSheet_(SHEET_TRADE_LOG).getRange(2, 1, rows.length, TRADE_LOG_HEADERS.length).setValues(rows);
    getSheet_(SHEET_TRADE_LOG).getRange(2, 2, rows.length, 2).setNumberFormat('dd/mm/yyyy');
  }
  return rows.length;
}
