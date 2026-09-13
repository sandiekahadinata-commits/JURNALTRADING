/**
 * SheetService.gs
 * Akses spreadsheet, inisialisasi sheet, baca/tulis baris sebagai object.
 */

function getSpreadsheet_() {
  var id = getSpreadsheetId();
  if (!id || id.indexOf('__') === 0) {
    throw new Error('SPREADSHEET_ID belum di-set. Jalankan deploy atau isi Script Properties.');
  }
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) {
    sheet = getSpreadsheet_().insertSheet(name);
  }
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  var current = sheet.getRange(1, 1, 1, Math.max(headers.length, 1)).getValues()[0];
  var needsWrite = false;
  for (var i = 0; i < headers.length; i++) {
    if (safeString_(current[i]) !== headers[i]) {
      needsWrite = true;
      break;
    }
  }
  if (needsWrite) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1f2937')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

/**
 * Guard murah: inisialisasi berat hanya dijalankan sekali (disimpan di Script Properties).
 */
function ensureInitialized_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('INITIALIZED') === 'true') return true;
  return initializeSheets_();
}

/**
 * Inisialisasi seluruh sheet. Idempotent — aman dipanggil berkali-kali.
 */
function initializeSheets_() {
  var ss = getSpreadsheet_();

  // Pastikan DASHBOARD menjadi tab pertama.
  var dashboard = ss.getSheetByName(SHEET_DASHBOARD);
  if (!dashboard) {
    dashboard = ss.insertSheet(SHEET_DASHBOARD, 0);
  } else {
    ss.setActiveSheet(dashboard);
    ss.moveActiveSheet(1);
  }

  var tradeLog = getSheet_(SHEET_TRADE_LOG);
  ensureHeaders_(tradeLog, TRADE_LOG_HEADERS);
  setupTradeLogValidations_(tradeLog);
  setupTradeLogFormats_(tradeLog);

  var monthly = getSheet_(SHEET_MONTHLY);
  ensureHeaders_(monthly, MONTHLY_HEADERS);
  protectSheet_(monthly, 'MONTHLY auto-generated');
  protectSheet_(dashboard, 'DASHBOARD auto-generated');

  getSheet_(SHEET_CONFIG);
  ensureConfigDefaults_();

  // Rapikan default grid DASHBOARD.
  if (dashboard.getLastRow() === 0) {
    dashboard.getRange('A1').setValue(APP_NAME);
  }

  PropertiesService.getScriptProperties().setProperty('INITIALIZED', 'true');
  return true;
}

function setupTradeLogValidations_(sheet) {
  var lastRow = sheet.getMaxRows();
  var setupTags = getSetupTags_();
  applyValidation_(sheet, 5, lastRow, DIRECTIONS); // Arah (E)
  applyValidation_(sheet, 6, lastRow, TIMEFRAMES); // Timeframe (F)
  applyValidation_(sheet, 12, lastRow, TRADE_RESULTS); // Hasil (L)
  applyValidation_(sheet, 15, lastRow, setupTags); // Setup Tag (O)
  applyValidation_(sheet, 16, lastRow, MARKET_SESSIONS); // Sesi (P)
}

function applyValidation_(sheet, column, lastRow, list) {
  if (!list || !list.length || lastRow < 2) return;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(list, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, column, lastRow - 1, 1).setDataValidation(rule);
}

function setupTradeLogFormats_(sheet) {
  var lastRow = sheet.getMaxRows();
  if (lastRow < 2) return;
  sheet.getRange(2, 2, lastRow - 1, 2).setNumberFormat('dd/mm/yyyy'); // B,C
  sheet.getRange(2, 7, lastRow - 1, 5).setNumberFormat('#,##0.########'); // G-K
  sheet.getRange(2, 13, lastRow - 1, 2).setNumberFormat('#,##0.00'); // M,N
  sheet.getRange(2, 19, lastRow - 1, 1).setNumberFormat('#,##0.00'); // R-Multiple

  // Lindungi kolom turunan R-Multiple & Bulan (S,T).
  var protection = sheet.getRange(2, 19, lastRow - 1, 2).protect();
  protection.setDescription('Kolom otomatis (R-Multiple & Bulan)');
}

function protectSheet_(sheet, description) {
  var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (var i = 0; i < protections.length; i++) {
    if (protections[i].getDescription() === description) return;
  }
  var protection = sheet.protect().setDescription(description);
  var editors = protection.getEditors();
  if (editors.length > 0) {
    protection.removeEditors(editors);
  }
}

/**
 * Baca seluruh baris data sebagai array object (header => nilai).
 * Menyisipkan properti `_row` (nomor baris absolut).
 */
function readObjects_(sheetName) {
  var sheet = getSheet_(sheetName);
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var objects = [];

  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var isBlank = true;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null) {
        isBlank = false;
        break;
      }
    }
    if (isBlank) continue;

    var obj = { _row: r + 2 };
    for (var col = 0; col < headers.length; col++) {
      obj[safeString_(headers[col])] = row[col];
    }
    objects.push(obj);
  }
  return objects;
}

function clearDataRows_(sheetName) {
  var sheet = getSheet_(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function getColumnIndex_(sheetName, header) {
  var sheet = getSheet_(sheetName);
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return -1;
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (safeString_(headers[i]) === header) return i + 1;
  }
  return -1;
}
