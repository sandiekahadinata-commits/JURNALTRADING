/**
 * MonthlyService.gs
 * Menulis ulang sheet MONTHLY dari data TRADE LOG.
 */

function recalcMonthly_(trades) {
  trades = trades || listTrades_({});
  var series = computeMonthlySeries_(trades);
  var sheet = getSheet_(SHEET_MONTHLY);

  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, MONTHLY_HEADERS.length).clearContent().clearFormat();
  }

  if (series.length) {
    var rows = [];
    for (var i = 0; i < series.length; i++) {
      var m = series[i];
      var prev = i > 0 ? series[i - 1] : null;
      var improve = computeImproveStatus_(m, prev);
      rows.push([
        monthLabelLongID_(m.month),
        m.totalTrades,
        m.wins,
        m.losses,
        m.breakEvens,
        m.winRate,
        m.netR,
        profitFactorText_(m.profitFactor),
        m.expectedValue,
        m.totalPnl,
        m.maxConsecutiveLoss,
        m.maxConsecutiveWin,
        m.avgRMultiple,
        prev ? improve.verdict : 'Baseline'
      ]);
    }
    sheet.getRange(2, 1, rows.length, MONTHLY_HEADERS.length).setValues(rows);
    sheet.getRange(2, 6, rows.length, 1).setNumberFormat('0.0"%"');
    sheet.getRange(2, 7, rows.length, 1).setNumberFormat('+0.0;-0.0;0.0');
    sheet.getRange(2, 9, rows.length, 1).setNumberFormat('+0.00;-0.00;0.00');
    sheet.getRange(2, 10, rows.length, 1).setNumberFormat('+#,##0.00;-#,##0.00;0.00');
    sheet.getRange(2, 13, rows.length, 1).setNumberFormat('+0.00;-0.00;0.00');
  }

  sheet.autoResizeColumns(1, MONTHLY_HEADERS.length);
  return series;
}
