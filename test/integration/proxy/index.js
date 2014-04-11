var http   = require('http')
  , https  = require('https')
  , net    = require('net')
  , url    = require('url')
  ;

var createProxy = function (config) {
  config = config || {};

  var proxyHandler = function(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });

    res.end('');
  };

  var localProxy;

  if (!config.ssl) {
    localProxy = http.createServer(proxyHandler);
  } else {
    localProxy = https.createServer(config.ssl, proxyHandler);
  }

  localProxy.on('connect', function(req, clientSocket, head) {
    var remoteUrl = url.parse('https://' + req.url);
    var remoteSocket = net.connect(remoteUrl.port, remoteUrl.hostname, function() {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
        'Proxy-agent: Node-Proxy\r\n' +
        '\r\n');
      remoteSocket.write(head);
      remoteSocket.pipe(clientSocket);
      clientSocket.pipe(remoteSocket);
    });
  });

  return localProxy;
};

module.exports = createProxy;

