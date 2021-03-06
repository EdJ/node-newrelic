'use strict';

var path         = require('path')
  , fs           = require('fs')
  , test         = require('tap').test
  , proxy        = require('http-proxy')
  , configurator = require(path.join(__dirname, '..', '..', 'lib', 'config'))
  , Agent        = require(path.join(__dirname, '..', '..', 'lib', 'agent'))
  , CollectorAPI = require(path.join(__dirname, '..', '..', 'lib', 'collector', 'api.js'))
  , createProxy  = require('./proxy')
  ;
test("Collector API should connect to staging-collector.newrelic.com", function (t) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  var remoteHost = 'staging-collector.newrelic.com'
      , proxyPort = 9091
      , proxyKey  = fs.readFileSync('test/integration/certs/server-key.pem', 'utf-8')
      , proxyCert = fs.readFileSync('test/integration/certs/server-cert.pem', 'utf-8')
      , proxyCa   = fs.readFileSync('test/integration/certs/server-csr.pem', 'utf-8')
      , localProxy = createProxy({
          'ssl'   : {
              'key'   : proxyKey,
              'cert'  : proxyCert
          }
      })
      , config = configurator.initialize({
        'app_name'    : 'node.js Tests',
        'license_key' : 'd67afc830dab717fd163bfcb0b8b88423e9a1a3b',
        'host'        : remoteHost,
        'port'        : 443,
        'ssl'         : true,
        'proxy_host'  : 'localhost',
        'proxy_port'  : proxyPort,
        'proxy_ssl'   : true,
        'proxy_key'   : proxyKey,
        'proxy_cert'  : proxyCert,
        'proxy_ca'    : proxyCa,
        'logging'     : {
          'level' : 'trace'
        }
      })
    , agent = new Agent(config)
    , api   = new CollectorAPI(agent)
    ;

  localProxy.listen(proxyPort);

  t.plan(9);

  var checkProxyIsCalled = function (res) {
      t.ok(res, "got proxy response");

      // Proxy is used multiple times,
      // remove listener to ensure tap count is correct.
      localProxy.removeListener('connect', checkProxyIsCalled);
  };

  localProxy.on('connect', checkProxyIsCalled);

  api.connect(function (error, returned) {
    t.notOk(error, "connected without error");
    t.ok(returned, "got boot configuration");
    t.ok(returned.agent_run_id, "got run ID");
    t.ok(agent.config.run_id, "run ID set in configuration");

    api.shutdown(function (error, returned, json) {
      t.notOk(error, "should have shut down without issue");
      t.equal(returned, null, "collector explicitly returns null");
      t.deepEqual(json, {return_value : null}, "raw message looks right");
      t.notOk(agent.config.run_id, "run ID should have been cleared by shutdown");

      t.end();
    });
  });
});
