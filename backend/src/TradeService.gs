/**
 * TradeService.gs
 * CRUD trade + perhitungan field turunan.
 */

function buildTrade_(id, input) {
  var entryPrice = toNumber_(input.entryPrice);
  var stopLoss = toNumber_(input.stopLoss);
  var positionSize = toNumber_(input.positionSize);
  var pnl = toNumber_(input.pnl);

  var riskPerTrade = entryPrice ? (Math.abs(entryPrice - stopLoss) * positionSize) / entryPrice : 0;
  var rMultiple = riskPerTrade ? pnl / riskPerTrade : 0;
  var exitDate = toDateString_(input.exitDate);

  return {
    id: id,
    entryDate: toDateString_(input.entryDate),
    exitDate: exitDate,
    symbol: safeString_(input.symbol).trim().toUpperCase(),
    direction: safeString_(input.direction) || 'Long',
    timeframe: safeString_(input.timeframe) || '1H',
    entryPrice: entryPrice,
    stopLoss: stopLoss,
    takeProfit: toNumber_(input.takeProfit),
    positionSize: positionSize,
    riskPerTrade: round_(riskPerTrade, 2),
    result: safeString_(input.result) || 'Win',
    exitPrice: toNumber_(input.exitPrice),
    pnl: round_(pnl, 2),
    setupTag: safeString_(input.setupTag),
    session: safeString_(input.session),
    notes: safeString_(input.notes),
    screenshotUrl: safeString_(input.screenshotUrl),
    rMultiple: round_(rMultiple, 2),
    month: exitDate ? exitDate.slice(0, 7) : ''
  };
}

function rowToTrade_(obj) {
  return buildTrade_(safeString_(obj['Trade ID']), {
    entryDate: obj['Tanggal Entry'],
    exitDate: obj['Tanggal Exit'],
    symbol: obj['Symbol'],
    direction: obj['Arah'],
    timeframe: obj['Timeframe'],
    entryPrice: obj['Entry Price'],
    stopLoss: obj['Stop Loss'],
    takeProfit: obj['Take Profit'],
    positionSize: obj['Ukuran Posisi'],
    result: obj['Hasil'],
    exitPrice: obj['Harga Exit Aktual'],
    pnl: obj['P&L Aktual'],
    setupTag: obj['Setup Tag'],
    session: obj['Sesi Pasar'],
    notes: obj['Catatan'],
    screenshotUrl: obj['Screenshot URL']
  });
}

function tradeToRow_(trade) {
  return [
    trade.id,
    parseDateCell_(trade.entryDate),
    parseDateCell_(trade.exitDate),
    trade.symbol,
    trade.direction,
    trade.timeframe,
    trade.entryPrice,
    trade.stopLoss,
    trade.takeProfit,
    trade.positionSize,
    trade.riskPerTrade,
    trade.result,
    trade.exitPrice,
    trade.pnl,
    trade.setupTag,
    trade.session,
    trade.notes,
    trade.screenshotUrl,
    trade.rMultiple,
    trade.month
  ];
}

function nextTradeId_(objects) {
  var max = 0;
  for (var i = 0; i < objects.length; i++) {
    var id = safeString_(objects[i]['Trade ID']);
    var match = /^TRD-(\d+)$/.exec(id);
    if (match) {
      var n = Number(match[1]);
      if (n > max) max = n;
    }
  }
  return 'TRD-' + ('000' + (max + 1)).slice(-3);
}

function listTrades_(filters) {
  filters = filters || {};
  var sheet = getSheet_(SHEET_TRADE_LOG);
  var objects = readObjects_(SHEET_TRADE_LOG);
  var trades = [];
  var search = safeString_(filters.search).trim().toLowerCase();

  for (var i = 0; i < objects.length; i++) {
    var trade = rowToTrade_(objects[i]);
    if (!trade.id) continue;
    if (filters.month && filters.month !== 'all' && trade.month !== filters.month) continue;
    if (filters.symbol && filters.symbol !== 'all' && trade.symbol !== filters.symbol) continue;
    if (filters.result && filters.result !== 'all' && trade.result !== filters.result) continue;
    if (search) {
      var haystack = (trade.symbol + ' ' + trade.setupTag + ' ' + trade.notes).toLowerCase();
      if (haystack.indexOf(search) === -1) continue;
    }
    trades.push(trade);
  }

  trades.sort(function (a, b) {
    return b.exitDate < a.exitDate ? -1 : b.exitDate > a.exitDate ? 1 : 0;
  });
  return trades;
}

function getTrade_(id) {
  var objects = readObjects_(SHEET_TRADE_LOG);
  for (var i = 0; i < objects.length; i++) {
    if (safeString_(objects[i]['Trade ID']) === id) {
      return rowToTrade_(objects[i]);
    }
  }
  return null;
}

/**
 * Jalankan operasi tulis di bawah script lock agar tidak ada request bersamaan
 * yang menghasilkan Trade ID duplikat.
 */
function withScriptLock_(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    throw new Error('Server sedang sibuk, silakan coba lagi.');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function createTrade_(input) {
  validateTradeInput_(input);
  return withScriptLock_(function () {
    var objects = readObjects_(SHEET_TRADE_LOG);
    var id = nextTradeId_(objects);
    var trade = buildTrade_(id, input);
    getSheet_(SHEET_TRADE_LOG).appendRow(tradeToRow_(trade));
    return trade;
  });
}

function updateTrade_(id, input) {
  if (!id) throw new Error('ID trade wajib diisi.');
  validateTradeInput_(input);
  return withScriptLock_(function () {
    var objects = readObjects_(SHEET_TRADE_LOG);
    for (var i = 0; i < objects.length; i++) {
      if (safeString_(objects[i]['Trade ID']) === id) {
        var trade = buildTrade_(id, input);
        getSheet_(SHEET_TRADE_LOG)
          .getRange(objects[i]._row, 1, 1, TRADE_LOG_HEADERS.length)
          .setValues([tradeToRow_(trade)]);
        return trade;
      }
    }
    throw new Error('Trade ' + id + ' tidak ditemukan.');
  });
}

function deleteTrade_(id) {
  if (!id) throw new Error('ID trade wajib diisi.');
  return withScriptLock_(function () {
    var objects = readObjects_(SHEET_TRADE_LOG);
    for (var i = 0; i < objects.length; i++) {
      if (safeString_(objects[i]['Trade ID']) === id) {
        getSheet_(SHEET_TRADE_LOG).deleteRow(objects[i]._row);
        return { deleted: id };
      }
    }
    throw new Error('Trade ' + id + ' tidak ditemukan.');
  });
}

/** Hapus semua baris data trade (header tetap). */
function clearAllTrades_() {
  return withScriptLock_(function () {
    var sheet = getSheet_(SHEET_TRADE_LOG);
    var lastRow = sheet.getLastRow();
    var deleted = lastRow >= 2 ? lastRow - 1 : 0;
    clearDataRows_(SHEET_TRADE_LOG);
    return { deleted: deleted };
  });
}

function validateTradeInput_(input) {
  if (!input) throw new Error('Payload trade kosong.');
  var required = ['entryDate', 'exitDate', 'symbol', 'entryPrice', 'stopLoss', 'takeProfit', 'positionSize', 'exitPrice'];
  for (var i = 0; i < required.length; i++) {
    var key = required[i];
    var value = input[key];
    if (value === undefined || value === null || value === '') {
      throw new Error('Field wajib tidak lengkap: ' + key);
    }
  }
  if (toDateString_(input.exitDate) < toDateString_(input.entryDate)) {
    throw new Error('Tanggal exit tidak boleh sebelum tanggal entry.');
  }
  return true;
}

/**
 * Validasi konsistensi TP terhadap RR 1:3 (toleransi 0.5%).
 */
function checkRR_(input) {
  var entryPrice = toNumber_(input.entryPrice);
  var stopLoss = toNumber_(input.stopLoss);
  var takeProfit = toNumber_(input.takeProfit);
  var direction = safeString_(input.direction) || 'Long';
  var risk = Math.abs(entryPrice - stopLoss);
  var expectedTp = direction === 'Long'
    ? entryPrice + RISK_REWARD_RATIO * risk
    : entryPrice - RISK_REWARD_RATIO * risk;

  if (!expectedTp) {
    return { valid: false, expectedTp: 0, deviationPct: 0 };
  }
  var deviationPct = Math.abs(takeProfit - expectedTp) / Math.abs(expectedTp);
  return {
    valid: deviationPct <= RR_TOLERANCE,
    expectedTp: round_(expectedTp, 4),
    deviationPct: round_(deviationPct * 100, 2)
  };
}

/** Scan semua trade dan kembalikan yang TP-nya tidak konsisten RR 1:3. */
function validateAllRR_() {
  var trades = listTrades_({});
  var invalid = [];
  for (var i = 0; i < trades.length; i++) {
    var check = checkRR_(trades[i]);
    if (!check.valid) {
      invalid.push({
        id: trades[i].id,
        symbol: trades[i].symbol,
        expectedTp: check.expectedTp,
        actualTp: trades[i].takeProfit,
        deviationPct: check.deviationPct
      });
    }
  }
  return { total: trades.length, invalidCount: invalid.length, invalid: invalid };
}
