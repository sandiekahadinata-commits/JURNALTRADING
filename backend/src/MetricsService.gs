/**
 * MetricsService.gs
 * Perhitungan metrik performa (paritas dengan frontend).
 */

function profits_(trades) {
  var grossProfit = 0;
  var grossLoss = 0;
  for (var i = 0; i < trades.length; i++) {
    var pnl = toNumber_(trades[i].pnl);
    if (pnl > 0) grossProfit += pnl;
    else if (pnl < 0) grossLoss += Math.abs(pnl);
  }
  return { grossProfit: grossProfit, grossLoss: grossLoss };
}

function maxConsecutive_(trades, target) {
  var max = 0;
  var current = 0;
  for (var i = 0; i < trades.length; i++) {
    if (trades[i].result === target) {
      current += 1;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

function sortChronological_(trades) {
  var copy = trades.slice();
  copy.sort(function (a, b) {
    return a.exitDate < b.exitDate ? -1 : a.exitDate > b.exitDate ? 1 : 0;
  });
  return copy;
}

function computeMonthlyMetrics_(month, trades) {
  var totalTrades = trades.length;
  var wins = 0;
  var losses = 0;
  var breakEvens = 0;
  var totalPnl = 0;
  var rSum = 0;

  for (var i = 0; i < trades.length; i++) {
    if (trades[i].result === 'Win') wins += 1;
    else if (trades[i].result === 'Loss') losses += 1;
    else breakEvens += 1;
    totalPnl += toNumber_(trades[i].pnl);
    rSum += toNumber_(trades[i].rMultiple);
  }

  var winRate = totalTrades === 0 ? 0 : (wins / totalTrades) * 100;
  var netR = wins * RISK_REWARD_RATIO - losses;

  var pl = profits_(trades);
  var profitFactor;
  if (pl.grossLoss === 0) {
    profitFactor = pl.grossProfit > 0 ? Infinity : 0;
  } else {
    profitFactor = pl.grossProfit / pl.grossLoss;
  }

  var winRateFraction = wins / (totalTrades || 1);
  var lossRateFraction = losses / (totalTrades || 1);
  var expectedValue = winRateFraction * RISK_REWARD_RATIO - lossRateFraction;
  var avgRMultiple = totalTrades === 0 ? 0 : rSum / totalTrades;
  var chronological = sortChronological_(trades);

  return {
    month: month,
    totalTrades: totalTrades,
    wins: wins,
    losses: losses,
    breakEvens: breakEvens,
    winRate: round_(winRate, 2),
    netR: round_(netR, 2),
    profitFactor: profitFactor,
    expectedValue: round_(expectedValue, 2),
    totalPnl: round_(totalPnl, 2),
    maxConsecutiveLoss: maxConsecutive_(chronological, 'Loss'),
    maxConsecutiveWin: maxConsecutive_(chronological, 'Win'),
    avgRMultiple: round_(avgRMultiple, 2)
  };
}

function groupTradesByMonth_(trades) {
  var groups = {};
  for (var i = 0; i < trades.length; i++) {
    var key = trades[i].month;
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(trades[i]);
  }
  return groups;
}

function getMonthKeys_(trades) {
  var seen = {};
  var keys = [];
  for (var i = 0; i < trades.length; i++) {
    var key = trades[i].month;
    if (key && !seen[key]) {
      seen[key] = true;
      keys.push(key);
    }
  }
  keys.sort();
  return keys;
}

function computeMonthlySeries_(trades) {
  var groups = groupTradesByMonth_(trades);
  var keys = getMonthKeys_(trades);
  var series = [];
  for (var i = 0; i < keys.length; i++) {
    series.push(computeMonthlyMetrics_(keys[i], groups[keys[i]] || []));
  }
  return series;
}

function computeImproveStatus_(current, previous) {
  if (!current || !previous) {
    return { verdict: 'NEEDS ATTENTION', dimensions: [], improvedCount: 0 };
  }

  var winRateDelta = current.winRate - previous.winRate;

  var pfDelta;
  if (!isFinite(current.profitFactor) && !isFinite(previous.profitFactor)) pfDelta = 0;
  else if (!isFinite(current.profitFactor)) pfDelta = Infinity;
  else if (!isFinite(previous.profitFactor)) pfDelta = -Infinity;
  else pfDelta = current.profitFactor - previous.profitFactor;

  var netRImproved = current.netR > previous.netR && current.netR > 0;

  var dimensions = [
    {
      label: 'Profitabilitas',
      improved: winRateDelta >= IMPROVE_WIN_RATE_DELTA,
      detail: 'Win Rate ' + (winRateDelta >= 0 ? '+' : '') + round_(winRateDelta, 1) + '% (min +' + IMPROVE_WIN_RATE_DELTA + '%)'
    },
    {
      label: 'Efisiensi',
      improved: pfDelta >= IMPROVE_PROFIT_FACTOR_DELTA,
      detail: 'Profit Factor ' + (isFinite(pfDelta) && pfDelta !== 0 ? (pfDelta >= 0 ? '+' : '') + round_(pfDelta, 2) : profitFactorText_(current.profitFactor) + ' vs ' + profitFactorText_(previous.profitFactor))
    },
    {
      label: 'Konsistensi',
      improved: netRImproved,
      detail: 'Net R ' + (current.netR >= 0 ? '+' : '') + current.netR + 'R vs ' + (previous.netR >= 0 ? '+' : '') + previous.netR + 'R'
    }
  ];

  var improvedCount = 0;
  for (var i = 0; i < dimensions.length; i++) {
    if (dimensions[i].improved) improvedCount += 1;
  }

  var verdict = improvedCount >= 2 ? 'IMPROVING' : improvedCount === 1 ? 'NEEDS ATTENTION' : 'DECLINING';
  return { verdict: verdict, dimensions: dimensions, improvedCount: improvedCount };
}

function profitFactorText_(value) {
  if (!isFinite(value)) return value > 0 ? '∞' : '0.00x';
  return round_(value, 2) + 'x';
}

function computeStreaks_(trades) {
  var chronological = sortChronological_(trades);
  var maxWin = maxConsecutive_(chronological, 'Win');
  var maxLoss = maxConsecutive_(chronological, 'Loss');

  var type = 'None';
  var count = 0;
  for (var i = chronological.length - 1; i >= 0; i--) {
    var result = chronological[i].result;
    if (result === 'Break Even') break;
    if (type === 'None') type = result;
    if (result !== type) break;
    count += 1;
  }

  return {
    type: type,
    count: count,
    maxConsecutiveWin: maxWin,
    maxConsecutiveLoss: maxLoss
  };
}

function computeBestWorstMonth_(trades) {
  var series = computeMonthlySeries_(trades);
  if (!series.length) return { best: null, worst: null };
  var best = series[0];
  var worst = series[0];
  for (var i = 1; i < series.length; i++) {
    if (series[i].netR > best.netR) best = series[i];
    if (series[i].netR < worst.netR) worst = series[i];
  }
  return { best: best, worst: worst };
}

/** Konversi metrik ke bentuk aman JSON (Infinity -> null) + label. */
function metricsDto_(metrics) {
  if (!metrics) return null;
  var pf = isFinite(metrics.profitFactor) ? round_(metrics.profitFactor, 2) : null;
  return {
    month: metrics.month,
    monthLabel: monthLabelLongID_(metrics.month),
    totalTrades: metrics.totalTrades,
    wins: metrics.wins,
    losses: metrics.losses,
    breakEvens: metrics.breakEvens,
    winRate: metrics.winRate,
    netR: metrics.netR,
    profitFactor: pf,
    profitFactorText: profitFactorText_(metrics.profitFactor),
    expectedValue: metrics.expectedValue,
    totalPnl: metrics.totalPnl,
    maxConsecutiveLoss: metrics.maxConsecutiveLoss,
    maxConsecutiveWin: metrics.maxConsecutiveWin,
    avgRMultiple: metrics.avgRMultiple
  };
}

function lastN_(array, n) {
  if (array.length <= n) return array.slice();
  return array.slice(array.length - n);
}

/** Data lengkap untuk endpoint /dashboard. */
function getDashboardData_(trades) {
  trades = trades || listTrades_({});
  var groups = groupTradesByMonth_(trades);
  var keys = getMonthKeys_(trades);

  var currentMonth = keys.length ? keys[keys.length - 1] : '';
  var previousMonth = keys.length > 1 ? keys[keys.length - 2] : '';

  var current = currentMonth ? computeMonthlyMetrics_(currentMonth, groups[currentMonth] || []) : null;
  var previous = previousMonth ? computeMonthlyMetrics_(previousMonth, groups[previousMonth] || []) : null;
  var series = computeMonthlySeries_(trades);
  var bw = computeBestWorstMonth_(trades);

  var latest = trades.slice();
  latest.sort(function (a, b) {
    return b.exitDate < a.exitDate ? -1 : b.exitDate > a.exitDate ? 1 : 0;
  });

  return {
    currentMonth: currentMonth,
    current: metricsDto_(current),
    previous: metricsDto_(previous),
    improve: computeImproveStatus_(current, previous),
    series: series.map(metricsDto_),
    recentSeries: lastN_(series, 6).map(metricsDto_),
    streaks: computeStreaks_(trades),
    bestWorst: { best: metricsDto_(bw.best), worst: metricsDto_(bw.worst) },
    lastTrades: latest.slice(0, 5),
    config: getConfig_(),
    totals: {
      trades: trades.length,
      months: series.length
    }
  };
}

