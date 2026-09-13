/**
 * Utils.gs
 * Helper umum: response JSON, auth token, parsing body, tanggal, angka.
 */

var MONTH_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
var MONTH_LONG_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function jsonOut_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return jsonOut_({ ok: true, data: data === undefined ? null : data });
}

function fail_(code, message) {
  return jsonOut_({ ok: false, error: { code: code, message: message } });
}

function handle_(fn) {
  try {
    return fn();
  } catch (err) {
    Logger.log(err && err.stack ? err.stack : err);
    return fail_('INTERNAL_ERROR', err && err.message ? err.message : String(err));
  }
}

function readJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    Logger.log('Body bukan JSON valid: ' + e.postData.contents);
    return null;
  }
}

function extractToken_(e, body) {
  if (body && body.token) return String(body.token);
  if (e && e.parameter && e.parameter.token) return String(e.parameter.token);
  return '';
}

function isAuthorized_(e, body) {
  var expected = getApiToken();
  if (!expected || expected.indexOf('__') === 0) return true;
  return extractToken_(e, body) === expected;
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

function toDateString_(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, TIMEZONE, 'yyyy-MM-dd');
  }
  return String(value).slice(0, 10);
}

function monthKeyFrom_(value) {
  var s = toDateString_(value);
  return s ? s.slice(0, 7) : '';
}

function parseDateCell_(value) {
  if (value instanceof Date) return value;
  if (!value) return null;
  var parts = String(value).slice(0, 10).split('-');
  if (parts.length !== 3) return null;
  var year = Number(parts[0]);
  var month = Number(parts[1]);
  var day = Number(parts[2]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toNumber_(value) {
  if (value === '' || value === null || value === undefined) return 0;
  var n = Number(value);
  return isNaN(n) ? 0 : n;
}

function round_(value, decimals) {
  var factor = Math.pow(10, decimals === undefined ? 2 : decimals);
  return Math.round(value * factor) / factor;
}

function formatDateID_(value) {
  var s = toDateString_(value);
  if (!s) return '';
  var parts = s.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function monthLabel_(monthKey, long) {
  if (!monthKey) return '';
  var parts = String(monthKey).split('-');
  var year = parts[0];
  var idx = Number(parts[1]) - 1;
  var names = long ? MONTH_LONG_ID : MONTH_SHORT_ID;
  return names[idx] + ' ' + year;
}

function monthLabelLongID_(monthKey) {
  return monthLabel_(monthKey, true);
}

function safeString_(value) {
  return value === null || value === undefined ? '' : String(value);
}

function now_() {
  return new Date();
}
