/**
 * Api.gs
 * Web App router: doGet & doPost.
 *
 * Auth: shared token via query `token` (GET) atau body `token` (POST).
 * Envelope: { ok: true, data } / { ok: false, error: { code, message } }
 */

function doGet(e) {
  return handle_(function () {
    var action = e && e.parameter ? safeString_(e.parameter.action) : '';
    if (!action) action = 'ping';

    if (action !== 'ping' && !isAuthorized_(e, null)) {
      return fail_('UNAUTHORIZED', 'Token tidak valid.');
    }

    return route_(action, e, null);
  });
}

function doPost(e) {
  return handle_(function () {
    var body = readJsonBody_(e);
    var action = body && body.action ? safeString_(body.action) : (e && e.parameter ? safeString_(e.parameter.action) : '');
    if (!action) return fail_('BAD_REQUEST', 'Field action wajib diisi.');

    if (!isAuthorized_(e, body)) {
      return fail_('UNAUTHORIZED', 'Token tidak valid.');
    }

    return route_(action, e, body);
  });
}

function route_(action, e, body) {
  var payload = body && body.payload ? body.payload : body;

  switch (action) {
    case 'ping':
      return ok_({
        app: APP_NAME,
        time: new Date().toISOString(),
        timezone: TIMEZONE,
        configured: getSpreadsheetId().indexOf('__') !== 0
      });

    case 'setup':
      ensureInitialized_();
      installTriggers_();
      var setupResult = refreshAll_();
      return ok_({ initialized: true, trades: setupResult.trades, months: setupResult.months });

    case 'getConfig':
      ensureInitialized_();
      return ok_(getConfig_());

    case 'updateConfig':
      ensureInitialized_();
      return ok_(updateConfig_(payload || {}));

    case 'listTrades':
      ensureInitialized_();
      return ok_(listTrades_(extractFilters_(e, payload)));

    case 'getTrade':
      ensureInitialized_();
      var id = extractParam_(e, payload, 'id');
      var trade = getTrade_(id);
      return trade ? ok_(trade) : fail_('NOT_FOUND', 'Trade ' + id + ' tidak ditemukan.');

    case 'createTrade':
      ensureInitialized_();
      var created = createTrade_(payload || {});
      refreshAll_();
      return ok_(created);

    case 'updateTrade':
      ensureInitialized_();
      var updated = updateTrade_((payload || {}).id, (payload || {}).input || payload || {});
      refreshAll_();
      return ok_(updated);

    case 'deleteTrade':
      ensureInitialized_();
      var deleted = deleteTrade_(extractParam_(e, payload, 'id'));
      refreshAll_();
      return ok_(deleted);

    case 'clearAll':
      ensureInitialized_();
      var cleared = clearAllTrades_();
      refreshAll_();
      return ok_(cleared);

    case 'getMonthly':
      ensureInitialized_();
      return ok_(computeMonthlySeries_(listTrades_({})).map(metricsDto_));

    case 'getDashboard':
      ensureInitialized_();
      return ok_(getDashboardData_(listTrades_({})));

    case 'recalcAll':
      ensureInitialized_();
      return ok_(refreshAll_());

    case 'validateAll':
      ensureInitialized_();
      return ok_(validateAllRR_());

    case 'seedDemo':
      ensureInitialized_();
      var seeded = seedDemoData_();
      refreshAll_();
      return ok_({ inserted: seeded });

    default:
      return fail_('UNKNOWN_ACTION', 'Action tidak dikenal: ' + action);
  }
}

function extractParam_(e, payload, key) {
  if (payload && payload[key] !== undefined && payload[key] !== '') return safeString_(payload[key]);
  if (e && e.parameter && e.parameter[key]) return safeString_(e.parameter[key]);
  return '';
}

function extractFilters_(e, payload) {
  var filters = {};
  var keys = ['month', 'symbol', 'result', 'search'];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (payload && payload[key]) filters[key] = safeString_(payload[key]);
    else if (e && e.parameter && e.parameter[key]) filters[key] = safeString_(e.parameter[key]);
  }
  return filters;
}
