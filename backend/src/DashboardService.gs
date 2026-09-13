/**
 * DashboardService.gs
 * Menulis ulang sheet DASHBOARD: KPI cards, 3 chart, streak, best/worst, last 5 trades.
 */

var TONE_STYLES = {
  positive: { bg: '#d1fae5', fg: '#065f46' },
  negative: { bg: '#fee2e2', fg: '#991b1b' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  neutral: { bg: '#dbeafe', fg: '#1e40af' }
};

function setCell_(sheet, row, col, value, options) {
  options = options || {};
  var range = sheet.getRange(row, col);
  range.setValue(value);
  if (options.bold) range.setFontWeight('bold');
  if (options.fontSize) range.setFontSize(options.fontSize);
  if (options.color) range.setFontColor(options.color);
  if (options.bg) range.setBackground(options.bg);
  if (options.align) range.setHorizontalAlignment(options.align);
  if (options.wrap) range.setWrap(true);
  return range;
}

function setKpi_(sheet, col, label, value, tone) {
  var style = TONE_STYLES[tone] || TONE_STYLES.neutral;

  var labelRange = sheet.getRange(5, col, 1, 2).merge();
  labelRange.setValue(label).setFontSize(9).setFontWeight('bold')
    .setFontColor('#374151').setHorizontalAlignment('center')
    .setBackground('#f3f4f6');

  var valueRange = sheet.getRange(6, col, 1, 2).merge();
  valueRange.setValue(value).setFontSize(16).setFontWeight('bold')
    .setFontColor(style.fg).setBackground(style.bg)
    .setHorizontalAlignment('center');
}

function winRateTone_(winRate) {
  if (winRate > 33) return 'positive';
  if (winRate >= BREAKEVEN_WIN_RATE) return 'warning';
  return 'negative';
}

function profitFactorTone_(pf) {
  if (!isFinite(pf) || pf > 1.5) return 'positive';
  if (pf >= 1) return 'warning';
  return 'negative';
}

function formatSignedR_(value) {
  var n = round_(toNumber_(value), 2);
  return (n >= 0 ? '+' : '') + n + 'R';
}

function formatSignedCurrency_(value) {
  var n = round_(toNumber_(value), 2);
  var abs = Math.abs(n);
  var parts = abs.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-$' : '+$') + parts.join('.');
}

function formatPercent_(value) {
  return round_(toNumber_(value), 1) + '%';
}

function writeChartData_(sheet, series) {
  var recent = lastN_(series, 6);
  sheet.getRange(2, 16, 60, 6).clearContent();
  for (var i = 0; i < recent.length; i++) {
    var m = recent[i];
    var row = i + 2;
    sheet.getRange(row, 16).setValue(monthLabel_(m.month, false));
    sheet.getRange(row, 17).setValue(m.netR > 0 ? m.netR : 0);
    sheet.getRange(row, 18).setValue(m.netR < 0 ? m.netR : 0);
    sheet.getRange(row, 19).setValue(m.totalPnl > 0 ? m.totalPnl : 0);
    sheet.getRange(row, 20).setValue(m.totalPnl < 0 ? m.totalPnl : 0);
    sheet.getRange(row, 21).setValue(m.winRate);
  }
  return recent.length;
}

function insertCharts_(sheet, count) {
  if (count < 1) return;

  var labelRange = sheet.getRange(2, 16, count, 1);
  var netRPos = sheet.getRange(2, 17, count, 1);
  var netRNeg = sheet.getRange(2, 18, count, 1);
  var pnlPos = sheet.getRange(2, 19, count, 1);
  var pnlNeg = sheet.getRange(2, 20, count, 1);

  var winRateChart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(labelRange)
    .addRange(sheet.getRange(2, 21, count, 1))
    .setPosition(10, 1, 0, 0)
    .setOption('title', 'Win Rate Trend (%)')
    .setOption('width', 640)
    .setOption('height', 300)
    .setOption('colors', ['#10b981'])
    .setOption('legend', { position: 'none' })
    .setOption('vAxis', { title: '%' })
    .build();
  sheet.insertChart(winRateChart);

  var netRChart = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(labelRange)
    .addRange(netRPos)
    .addRange(netRNeg)
    .setPosition(10, 9, 0, 0)
    .setOption('title', 'Net R per Bulan')
    .setOption('width', 640)
    .setOption('height', 300)
    .setOption('isStacked', true)
    .setOption('colors', ['#10b981', '#ef4444'])
    .setOption('vAxis', { title: 'R' })
    .build();
  sheet.insertChart(netRChart);

  var pnlChart = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(labelRange)
    .addRange(pnlPos)
    .addRange(pnlNeg)
    .setPosition(27, 1, 0, 0)
    .setOption('title', 'Total P&L per Bulan (USDT)')
    .setOption('width', 640)
    .setOption('height', 300)
    .setOption('isStacked', true)
    .setOption('colors', ['#10b981', '#ef4444'])
    .setOption('vAxis', { title: 'USDT' })
    .build();
  sheet.insertChart(pnlChart);
}

function buildDashboard_(trades, series, config) {
  var sheet = getSheet_(SHEET_DASHBOARD);

  var existingCharts = sheet.getCharts();
  for (var c = 0; c < existingCharts.length; c++) {
    sheet.removeChart(existingCharts[c]);
  }
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 60), 25).clearContent().clearFormat();

  var monthKeys = getMonthKeys_(trades);
  var currentMonth = monthKeys.length ? monthKeys[monthKeys.length - 1] : '';
  var current = currentMonth ? computeMonthlyMetrics_(currentMonth, groupTradesByMonth_(trades)[currentMonth] || []) : null;
  var previousMonth = monthKeys.length > 1 ? monthKeys[monthKeys.length - 2] : '';
  var previous = previousMonth ? computeMonthlyMetrics_(previousMonth, groupTradesByMonth_(trades)[previousMonth] || []) : null;
  var improve = computeImproveStatus_(current, previous);

  // Header
  var titleRange = sheet.getRange(1, 1, 1, 6).merge();
  titleRange.setValue(APP_NAME + ' — Dashboard')
    .setFontSize(16).setFontWeight('bold').setFontColor('#111827');
  setCell_(sheet, 2, 1, 'Bulan Aktif: ' + monthLabelLongID_(currentMonth), { bold: true, fontSize: 11 });
  var verdictTone = improve.verdict === 'IMPROVING' ? 'positive' : improve.verdict === 'DECLINING' ? 'negative' : 'warning';
  setCell_(sheet, 2, 4, 'Status: ' + improve.verdict, {
    bold: true, fontSize: 11,
    color: TONE_STYLES[verdictTone].fg,
    bg: TONE_STYLES[verdictTone].bg
  });
  setCell_(sheet, 3, 1, 'Target Win Rate: ' + config.targetWinRate + '%  |  Breakeven RR 1:3: ' + BREAKEVEN_WIN_RATE + '%', {
    fontSize: 10, color: '#6b7280'
  });

  // KPI cards
  setCell_(sheet, 4, 1, 'KPI BULAN INI', { bold: true, fontSize: 12, color: '#111827' });
  if (current) {
    var wrDelta = previous ? current.winRate - previous.winRate : null;
    var netRDelta = previous ? current.netR - previous.netR : null;
    var pnlDelta = previous ? current.totalPnl - previous.totalPnl : null;

    setKpi_(sheet, 1, 'WIN RATE', formatPercent_(current.winRate), winRateTone_(current.winRate));
    setKpi_(sheet, 3, 'NET R', formatSignedR_(current.netR), current.netR >= 0 ? 'positive' : 'negative');
    setKpi_(sheet, 5, 'P&L BULAN INI', formatSignedCurrency_(current.totalPnl), current.totalPnl >= 0 ? 'positive' : 'negative');
    setKpi_(sheet, 7, 'JUMLAH TRADE', current.totalTrades + ' trades', 'neutral');
    setKpi_(sheet, 9, 'PROFIT FACTOR', profitFactorText_(current.profitFactor), profitFactorTone_(current.profitFactor));
    setKpi_(sheet, 11, 'EXPECTED VALUE', formatSignedR_(current.expectedValue), current.expectedValue >= 0 ? 'positive' : 'negative');

    setCell_(sheet, 7, 1, wrDelta === null ? 'Belum ada bulan lalu' : (wrDelta >= 0 ? '+' : '') + round_(wrDelta, 1) + '% vs bulan lalu', { fontSize: 9, color: '#6b7280' });
    setCell_(sheet, 7, 3, netRDelta === null ? '-' : (netRDelta >= 0 ? '+' : '') + round_(netRDelta, 1) + 'R vs bulan lalu', { fontSize: 9, color: '#6b7280' });
    setCell_(sheet, 7, 5, pnlDelta === null ? '-' : formatSignedCurrency_(pnlDelta) + ' vs bulan lalu', { fontSize: 9, color: '#6b7280' });
  }

  // Charts data + insert
  var chartCount = writeChartData_(sheet, series);
  insertCharts_(sheet, chartCount);

  // Streak tracker
  var streak = computeStreaks_(trades);
  setCell_(sheet, 44, 1, 'STREAK TRACKER', { bold: true, fontSize: 12 });
  setCell_(sheet, 45, 1, 'Streak Saat Ini', { fontColor: '#6b7280', fontSize: 10 });
  setCell_(sheet, 45, 2, streak.type === 'None' ? 'Tidak ada' : streak.count + 'x ' + streak.type,
    { bold: true, color: streak.type === 'Loss' ? '#991b1b' : '#065f46' });
  setCell_(sheet, 45, 4, 'Max Win Streak', { fontColor: '#6b7280', fontSize: 10 });
  setCell_(sheet, 45, 5, streak.maxConsecutiveWin + 'x', { bold: true, color: '#065f46' });
  setCell_(sheet, 45, 7, 'Max Loss Streak', { fontColor: '#6b7280', fontSize: 10 });
  setCell_(sheet, 45, 8, streak.maxConsecutiveLoss + 'x', { bold: true, color: '#991b1b' });

  // Best / worst month
  var bw = computeBestWorstMonth_(trades);
  setCell_(sheet, 48, 1, 'BEST / WORST MONTH', { bold: true, fontSize: 12 });
  setCell_(sheet, 49, 1, 'Terbaik', { fontColor: '#6b7280', fontSize: 10 });
  setCell_(sheet, 49, 2, bw.best ? monthLabelLongID_(bw.best.month) + ' (' + formatSignedR_(bw.best.netR) + ')' : '-', { bold: true, color: '#065f46' });
  setCell_(sheet, 50, 1, 'Terburuk', { fontColor: '#6b7280', fontSize: 10 });
  setCell_(sheet, 50, 2, bw.worst ? monthLabelLongID_(bw.worst.month) + ' (' + formatSignedR_(bw.worst.netR) + ')' : '-', { bold: true, color: '#991b1b' });

  // Last 5 trades
  setCell_(sheet, 52, 1, 'LAST 5 TRADES', { bold: true, fontSize: 12 });
  var headers = ['Exit', 'Symbol', 'Arah', 'Setup', 'Hasil', 'R', 'P&L'];
  for (var h = 0; h < headers.length; h++) {
    setCell_(sheet, 53, h + 1, headers[h], { bold: true, fontSize: 10, fontColor: '#ffffff', bg: '#1f2937' });
  }
  var latest = listTrades_({});
  latest.sort(function (a, b) {
    return b.exitDate < a.exitDate ? -1 : b.exitDate > a.exitDate ? 1 : 0;
  });
  var top5 = lastN_(latest.slice().reverse(), 5).reverse();
  for (var t = 0; t < top5.length; t++) {
    var trade = top5[t];
    var row = 54 + t;
    setCell_(sheet, row, 1, formatDateID_(trade.exitDate), { fontSize: 10 });
    setCell_(sheet, row, 2, trade.symbol, { fontSize: 10 });
    setCell_(sheet, row, 3, trade.direction, { fontSize: 10 });
    setCell_(sheet, row, 4, trade.setupTag, { fontSize: 10 });
    setCell_(sheet, row, 5, trade.result, { fontSize: 10 });
    setCell_(sheet, row, 6, formatSignedR_(trade.rMultiple), { fontSize: 10, color: trade.rMultiple >= 0 ? '#065f46' : '#991b1b' });
    setCell_(sheet, row, 7, formatSignedCurrency_(trade.pnl), { fontSize: 10, color: trade.pnl >= 0 ? '#065f46' : '#991b1b' });
  }

  sheet.setColumnWidth(16, 90);
  return { current: current, previous: previous, improve: improve, streak: streak, bestWorst: bw, series: series };
}

/** Orkestrasi: hitung ulang MONTHLY lalu bangun DASHBOARD. */
function refreshAll_() {
  var trades = listTrades_({});
  var config = getConfig_();
  var series = recalcMonthly_(trades);
  buildDashboard_(trades, series, config);
  return { trades: trades.length, months: series.length };
}
