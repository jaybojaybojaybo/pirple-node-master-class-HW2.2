/*
* Request Handlers module
*
*/

// Dependencies
const _users = require('./users');
const _tokens = require('./tokens');
const _menu = require('./menu');
const _carts = require('./carts');
const _orders = require('./orders');

// Initialize handlers
let handlers = {};

// Users Handler
handlers.users = (data,callback) => {
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        _users[data.method](data,callback);
    } else {
        callback(405);
    }
}

// Tokens Handler
handlers.tokens = (data,callback) => {
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        _tokens[data.method](data,callback);
    } else {
        callback(405);
    }
}

// Menu Handler
handlers.menu = (data,callback) => {
    // Callback a list of all pizza options
    let list = _menu.listOptions();
    callback(200,list);
}

// Carts handler
handlers.carts = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _carts[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Orders handler
handlers.orders = function (data, callback) {
    var acceptableMethods = ['post', 'get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _orders[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Hello Handler
handlers.hello = (data,callback) => {
    // Callback an HTTP status code and a payload object
    callback(200 ,{'name':'hello handler'});
};

// Not Found Handler
handlers.notFound = (data,callback) => {
    callback(404);
};

// Export the module
module.exports = handlers;
