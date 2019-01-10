/*
 * Server-related tasks
 * Shepherd Gwasira
 */

  // Dependencies
  var http = require('http');
  var https = require('https');
  var url = require('url');
  var StringDecoder = require('string_decoder').StringDecoder;
  var config = require('./config');
  var fs = require('fs');

  var genericHelper = require('./helpers/generic');

  var userHandler = require('./handlers/user');
  var accountHandler = require('./handlers/account');
  var menuHandler = require('./handlers/menu');
  var cartHandler = require('./handlers/cart');
  var orderHandler = require('./handlers/order');
  var itemHandler = require('./handlers/item');
  var checkoutHandler = require('./handlers/checkout');
  var tokenHandler = require('./handlers/token');
  var viewHandler = require('./handlers/view');
  var genericHandler = require('./handlers/generic');


  var path = require('path');
  var util = require('util');
  var debug = util.debuglog('server');

  // Instantiate the server module object
  var server = {};

  // We are instantiate the HTTP server
  server.httpServer = http.createServer(function (req, res){
      server.unifiedServer(req,res);
  });

  // Instantiate the HTTPS createServer
  server.httpsServerOptions = {
      'key': fs.readFileSync(path.join(__dirname, '../https/key.pem')),
      'cert': fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
  };

  server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res){
      server.unifiedServer(req,res);
  });

  // All the server logic for both the http and https server
  server.unifiedServer = function(req, res){
    // Get the url and parse it
    var parsedUrl = url.parse(req.url,true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    req.on('end', function(){
        buffer += decoder.end();
        // Choose the handler this request should go to. If one is not found, use the notFound handler.
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : genericHandler.notFound;
        // If the request is within the public directory, use the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? viewHandler.public : chosenHandler;
        // Construct the data object to send to the handler
        var data = {
          'trimmedPath' : trimmedPath,
          'queryStringObject' : queryStringObject,
          'method': method,
          'headers': headers,
          'payload': genericHelper.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload, contentType, cookies){
          // Determine the type of response (fallback to JSON)
          contentType = typeof(contentType) == 'string' ? contentType : 'json';

          // Use the status code called back by the handler , or default to 200
          statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

          // Return the response parts that are content-specific
          var payloadString = ''
          if(contentType == 'json'){
            //res.setHeader('Content-Type', 'application/json');
            payload = typeof(payload) == 'object' ? payload : {};
            payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
          }

          if(contentType == 'html'){
            res.setHeader('Content-Type', 'text/html');
            payloadString = typeof(payload) == 'string' ? payload : '';
          }

          if(contentType == 'favicon'){
            res.setHeader('Content-Type', 'image/x-icon');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }

          if(contentType == 'css'){
            res.setHeader('Content-Type', 'text/css');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }

          if(contentType == 'png'){
            res.setHeader('Content-Type', 'image/png');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }

          if(contentType == 'jpg'){
            res.setHeader('Content-Type', 'image/jpg');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }

          if(contentType == 'plain'){
            res.setHeader('Content-Type', 'text/plain');
            payloadString = typeof(payload) !== 'undefined' ? payload : '';
          }

          // Return the response-parts that are common to all content-types
          res.writeHead(statusCode);
          res.end(payloadString);

          // If the response is 200, print green otherwise print red
          if( statusCode == 200){
            //green
            debug('\x1b[32m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
          } else {
            //red
            debug('\x1b[31m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
          }
        });
    });
  };

  // Define a request router
  server.router = {
    '': viewHandler.index,
    'account/create': viewHandler.accountCreate,
    'account/edit': viewHandler.accountEdit,
    'account/deleted': viewHandler.accountDeleted,
    'session/create': viewHandler.sessionCreate,
    'session/deleted': viewHandler.sessionDeleted,
    'menu': viewHandler.menuList,
    'cart': viewHandler.cartEdit,
    'cart/delete': viewHandler.cartDelete,
    'orders': viewHandler.ordersList,
    'favicon.ico': viewHandler.favicon,
    'checkout': viewHandler.checkout,
    'checkout/success': viewHandler.checkoutSuccess,
    'checkout/error': viewHandler.checkoutError,
    'api/users': userHandler.users,
    'api/login': accountHandler.login,
    'api/logout': accountHandler.logout,
    'api/menu': menuHandler.menu,
    'api/cart': cartHandler.cart,
    'api/cart/total': cartHandler.cartTotal,
    'api/item': itemHandler.item,
    'api/order': orderHandler.order,
    'api/checkout': checkoutHandler.checkout,
    'api/token': tokenHandler.token
  }

  // Init script
  server.init = function(){
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function(){
      //blue
      console.log('\x1b[36m%s\x1b[0m',"The server ["+config.envName+"] is listening on port "+config.httpPort + " now");
    });

    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function(){
      //purple
      console.log('\x1b[35m%s\x1b[0m',"The server ["+config.envName+"] is listening on port "+config.httpsPort + " now");
    });
  };

  // Export the module
  module.exports = server;
