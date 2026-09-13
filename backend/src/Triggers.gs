/**
 * Triggers.gs
 * Custom menu, onEdit handler, dan trigger harian.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Trading Journal')
    .addItem('Refresh Dashboard', 'menuRefreshDashboard')
    .addItem('Recalculate All', 'menuRecalculateAll')
    .addItem('Export Bulan Ini', 'menuExportCurrentMonth')
    .addItem('Validasi Semua Trade', 'menuValidateAll')
    .addSeparator()
    .addItem('Setup / Inisialisasi', 'menuSetup')
    .addItem('Reset ke Data Dummy', 'menuResetDemo')
    .addToUi();
}

function menuRefreshDashboard() {
  runMenu_('Refresh Dashboard', function () {
    refreshAll_();
    return 'Dashboard diperbarui.';
  });
}

function menuRecalculateAll() {
  runMenu_('Recalculate All', function () {
    var result = refreshAll_();
    return 'Selesai. ' + result.trades + ' trade, ' + result.months + ' bulan.';
  });
}

function menuExportCurrentMonth() {
  runMenu_('Export Bulan Ini', function () {
    var trades = listTrades_({});
    var monthKeys = getMonthKeys_(trades);
    if (!monthKeys.length) return 'Belum ada data.';
    var current = monthKeys[monthKeys.length - 1];
    var name = 'Export ' + monthLabelLongID_(current);
    var ss = getSpreadsheet_();
    var existing = ss.getSheetByName(name);
    if (existing) ss.deleteSheet(existing);
    var sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, TRADE_LOG_HEADERS.length).setValues([TRADE_LOG_HEADERS]).setFontWeight('bold');
    var rows = [];
    for (var i = 0; i < trades.length; i++) {
      if (trades[i].month === current) rows.push(tradeToRow_(trades[i]));
    }
    if (rows.length) sheet.getRange(2, 1, rows.length, TRADE_LOG_HEADERS.length).setValues(rows);
    return 'Export selesai: ' + rows.length + ' trade ke sheet "' + name + '".';
  });
}

function menuValidateAll() {
  runMenu_('Validasi Semua Trade', function () {
    var result = validateAllRR_();
    if (result.invalidCount === 0) {
      return 'Semua ' + result.total + ' trade konsisten dengan RR 1:3.';
    }
    var lines = ['Ditemukan ' + result.invalidCount + ' trade dengan TP tidak konsisten:'];
    for (var i = 0; i < Math.min(result.invalid.length, 10); i++) {
      var item = result.invalid[i];
      lines.push('- ' + item.id + ' ' + item.symbol + ' (TP ' + item.actualTp + ', ideal ' + item.expectedTp + ')');
    }
    return lines.join('\n');
  });
}

function menuSetup() {
  runMenu_('Setup / Inisialisasi', function () {
    setupSpreadsheet();
    return 'Setup selesai. Sheet siap digunakan.';
  });
}

function menuResetDemo() {
  runMenu_('Reset ke Data Dummy', function () {
    seedDemoData_();
    refreshAll_();
    return 'Data dummy diisi ulang dan dashboard diperbarui.';
  });
}

function runMenu_(title, fn) {
  var ui = SpreadsheetApp.getUi();
  try {
    var message = fn();
    ui.alert(title, message, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert(title, 'Error: ' + (err && err.message ? err.message : err), ui.ButtonSet.OK);
  }
}

/**
 * Installable onEdit: memperbarui kolom turunan baris yang diedit,
 * lalu refresh MONTHLY & DASHBOARD.
 */
function onEditHandler(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_TRADE_LOG) return;

    var row = e.range.getRow();
    var col = e.range.getColumn();
    if (row < 2) return;
    if (col === 19 || col === 20) return; // abaikan kolom turunan

    var values = sheet.getRange(row, 1, 1, TRADE_LOG_HEADERS.length).getValues()[0];
    var input = {
      entryDate: values[1],
      exitDate: values[2],
      symbol: values[3],
      direction: values[4],
      timeframe: values[5],
      entryPrice: values[6],
      stopLoss: values[7],
      takeProfit: values[8],
      positionSize: values[9],
      result: values[11],
      exitPrice: values[12],
      pnl: values[13],
      setupTag: values[14],
      session: values[15],
      notes: values[16],
      screenshotUrl: values[17]
    };

    var id = safeString_(values[0]);
    if (!id) {
      var objects = readObjects_(SHEET_TRADE_LOG);
      id = nextTradeId_(objects);
      sheet.getRange(row, 1).setValue(id);
    }

    var trade = buildTrade_(id, input);
    sheet.getRange(row, 19, 1, 2).setValues([[trade.rMultiple, trade.month]]);

    refreshAll_();
  } catch (err) {
    Logger.log('onEditHandler error: ' + err);
  }
}

/** Trigger harian: hitung ulang agregasi. */
function dailyRecalc() {
  refreshAll_();
}

/** Hapus & buat ulang trigger yang dikelola aplikasi. */
function installTriggers_() {
  var ss = getSpreadsheet_();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var handler = triggers[i].getHandlerFunction();
    if (handler === 'onEditHandler' || handler === 'dailyRecalc') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('onEditHandler').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('dailyRecalc').timeBased().atHour(1).everyDays(1).create();
}
