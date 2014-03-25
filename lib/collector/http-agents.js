'use strict';

var path         = require('path')
  , HTTPAgent    = require('yakaa')
  , tunnel       = require('tunnel')
  , SSLAgent     = HTTPAgent.SSL
  , certificates = require(path.join(__dirname, 'ssl', 'certificates.js'))
  ;

var CIPHERS = "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:" +
              "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:" +
              "DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:" +
              "ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:" +
              "ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:" +
              "ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:" +
              "ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:" +
              "DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:" +
              "DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:" +
              "AES128-GCM-SHA256:AES256-GCM-SHA384:ECDHE-RSA-RC4-SHA:" +
              "ECDHE-ECDSA-RC4-SHA:AES128:AES256:RC4-SHA:HIGH:" +
              "!aNULL:!eNULL:!EXPORT:!DES:!3DES:!MD5:!PSK";

var existingTunnelAgent;

module.exports = {
  http        : new HTTPAgent({
    keepAlive             : true,
    keepAliveTimeoutMsecs : 500,
    maxSockets            : 1, // requests are serialized
  }),
  https       : new SSLAgent({
    keepAlive             : true,
    keepAliveTimeoutMsecs : 500,
    rejectUnauthorized    : true,
    ca                    : certificates,
    ciphers               : CIPHERS,
    maxSockets            : 1, // minimize TLS socket creation overhead
  }),
  https_proxy : function getHttpsProxy(config) {
    // Ensure we don't create more than 1 tunnelling agent.
    if (existingTunnelAgent) {
      return existingTunnelAgent;
    }

    existingTunnelAgent = tunnel.httpsOverHttps({
      maxSockets  : 1, // minimize socket creation overhead
      ca          : certificates,
      ciphers     : CIPHERS,
      proxy       : {
        host: config.proxy_host,
        port: config.proxy_port
      }
    });

    return existingTunnelAgent;
  }
};
