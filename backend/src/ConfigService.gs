/**
 * ConfigService.gs
 * Baca/tulis sheet CONFIG.
 *
 * Layout:
 *   A1 Account Balance (USDT) | B1 nilai
 *   A2 Risk per Trade (%)     | B2 nilai
 *   A3 Target Win Rate (%)    | B3 nilai
 *   A5 "Setup Tags"           | A6.. daftar tag
 */

var CONFIG_LABELS = [
  'Account Balance (USDT)',
  'Risk per Trade (%)',
  'Target Win Rate (%)'
];
var CONFIG_VALUE_CELL = 'B1';
var CONFIG_TAGS_HEADER_ROW = 5;
var CONFIG_TAGS_START_ROW = 6;
var CONFIG_TAGS_MAX_ROWS = 30;

function ensureConfigDefaults_() {
  var sheet = getSheet_(SHEET_CONFIG);

  sheet.getRange(1, 1, 3, 1).setValues([
    [CONFIG_LABELS[0]],
    [CONFIG_LABELS[1]],
    [CONFIG_LABELS[2]]
  ]);

  var values = sheet.getRange(1, 2, 3, 1).getValues();
  var defaults = [
    DEFAULT_CONFIG.accountBalance,
    DEFAULT_CONFIG.riskPercent,
    DEFAULT_CONFIG.targetWinRate
  ];
  for (var i = 0; i < 3; i++) {
    if (values[i][0] === '' || values[i][0] === null) {
      sheet.getRange(i + 1, 2).setValue(defaults[i]);
    }
  }

  sheet.getRange(CONFIG_TAGS_HEADER_ROW, 1).setValue('Setup Tags').setFontWeight('bold');
  var tagRange = sheet.getRange(CONFIG_TAGS_START_ROW, 1, CONFIG_TAGS_MAX_ROWS, 1);
  var existing = tagRange.getValues();
  var hasAny = false;
  for (var t = 0; t < existing.length; t++) {
    if (safeString_(existing[t][0]) !== '') {
      hasAny = true;
      break;
    }
  }
  if (!hasAny) {
    var rows = [];
    for (var k = 0; k < CONFIG_TAGS_MAX_ROWS; k++) {
      rows.push([k < DEFAULT_SETUP_TAGS.length ? DEFAULT_SETUP_TAGS[k] : '']);
    }
    tagRange.setValues(rows);
  }

  sheet.setColumnWidth(1, 220);
}

function getSetupTags_() {
  var sheet = getSheet_(SHEET_CONFIG);
  var values = sheet
    .getRange(CONFIG_TAGS_START_ROW, 1, CONFIG_TAGS_MAX_ROWS, 1)
    .getValues();
  var tags = [];
  for (var i = 0; i < values.length; i++) {
    var tag = safeString_(values[i][0]).trim();
    if (tag) tags.push(tag);
  }
  return tags.length ? tags : DEFAULT_SETUP_TAGS.slice();
}

function getConfig_() {
  var sheet = getSheet_(SHEET_CONFIG);
  var values = sheet.getRange(1, 2, 3, 1).getValues();
  return {
    accountBalance: toNumber_(values[0][0]),
    riskPercent: toNumber_(values[1][0]),
    targetWinRate: toNumber_(values[2][0]),
    setupTags: getSetupTags_()
  };
}

function updateConfig_(patch) {
  patch = patch || {};
  var sheet = getSheet_(SHEET_CONFIG);

  if (patch.accountBalance !== undefined) {
    sheet.getRange(1, 2).setValue(toNumber_(patch.accountBalance));
  }
  if (patch.riskPercent !== undefined) {
    sheet.getRange(2, 2).setValue(toNumber_(patch.riskPercent));
  }
  if (patch.targetWinRate !== undefined) {
    sheet.getRange(3, 2).setValue(toNumber_(patch.targetWinRate));
  }
  if (patch.setupTags !== undefined && patch.setupTags.length) {
    var rows = [];
    for (var i = 0; i < CONFIG_TAGS_MAX_ROWS; i++) {
      rows.push([i < patch.setupTags.length ? String(patch.setupTags[i]).trim() : '']);
    }
    sheet.getRange(CONFIG_TAGS_START_ROW, 1, CONFIG_TAGS_MAX_ROWS, 1).setValues(rows);
  }

  return getConfig_();
}
