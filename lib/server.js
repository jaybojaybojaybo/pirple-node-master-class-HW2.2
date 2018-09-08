/*
*   Server-related tasks
*
*/

// Dependencies
// Node modules
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');
// My modules
const config = require('./config');
const helpers = require('./helpers');
const handlers = require('./handlers');

let server = {};

// HTTP:
// Instantiate Http Server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

// HTTPS:
// Instantiate Https Server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req,res) => {
    server.unifiedServer(req,res);
})


// The server should respond to all requests with a string
server.unifiedServer = (req, res) => {
    // Get url and parse it
    let parsedUrl = url.parse(req.url, true);
    // Get the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');
    // Get the HTTP method
    let method = req.method.toLowerCase();
    // Get the query string as an object
    let queryStringObject = parsedUrl.query;
    // Get the headers as an object
    let headers = req.headers;
    // Get the payload, if any
    let decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();
        // Choose the handler this request should go to, if not found use notFound handler
        let chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
        // Construct the data object to send to the handler
        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        }
        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            // Use the payload called back by the handler or default to an empty object
            payload = typeof (payload) == 'object' ? payload : {};
            // Get payload string
            let payloadString = JSON.stringify(payload);
            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            // Log the req path
            console.log("This response: ", statusCode, payloadString);
        });
    });
};

server.init = () => {
    // Start the server, and have it listen on port 3000
    server.httpServer.listen(config.httpPort, () => {
        console.log("The server is listening on port " + config.httpPort);
    });

    server.httpsServer.listen(config.httpsPort, () => {
        console.log("The server is listening on port " + config.httpsPort);
    })
};

// Define a request router
server.router = {
    'hello': handlers.hello,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'menu': handlers.menu,
    'carts': handlers.carts,
    'orders': handlers.orders
}

module.exports = server;