/*
*   Tokens handler module
*
*/ 

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Container for all the tokens methods
let _tokens = {};

// Tokens - post
// Required data: email, password
// Optional data: none
_tokens.post = (data, callback) => {
    _tokens.clean();
    let email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.trim().includes('@') ? data.payload.email.trim() : false;

    let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (email && password) {
        // Lookup the user who matches that email address
        _data.read('users', email, (err, userData) => {
            if (!err && userData) {
                // Hash the sent password, and compare it to the password stored in the user object
                let hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // If valid, create a new token with a random name. Set expiration date 1 hour in the future
                    let tokenId = helpers.createRandomString(20);
                    let createdAt = Date.now();
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        'email': email,
                        'id': tokenId,
                        'created': createdAt,
                        'expires': expires
                    }
                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'Error': 'Could not create the new token' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'Password did not match the specified user\'s stored password' });
                }
            } else {
                callback(400, { 'Error': 'Could not find the specified user' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field(s)' });
    }
}

// Tokens - get
// Required data: id
// Optional data: none
_tokens.get = (data, callback) => {
    _tokens.clean();
    // Check that the id is valid
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404,{'Error':'User does not exist'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required field'});
    }
}

// Tokens - put
// Required data: id, extend
// Optional data: none
_tokens.put = (data, callback) => {
    _tokens.clean();
    let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if (id && extend) {
        // Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // Check to make sure the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new updates
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500,{'Error':'Could not update the token\'s expiration'});
                        }
                    });
                } else {
                    callback(400,{'Error':'The token has already expired and cannot be extended'});
                }
            } else {
                callback(400,{'Error':'Specified token does not exist'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required field(s) or field(s) are invalid'});
    }
}

// Tokens - delete
// Required data: id
// Optional data: none
// Tokens will be deleted upon user logout
_tokens.delete = (data, callback) => {
    _tokens.clean();
    // Check that the id is valid
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500,{'Error':'Could not delete the specified token'});
                    }
                });
            } else {
                callback(404,{'Error':'Could not find the specified token'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required field'});
    }
};

// Verify if a given token id is currently valid for a given user
_tokens.verifyToken = function (id, email, callback) {
    _tokens.clean();
    // Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.email == email && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// TODO: Add token clean console updates to specific debug environmental variable
_tokens.clean = () => {
    // List all tokens
    _data.list('tokens', (err, tokens) => {
        if (!err && tokens && tokens.length > 0) {
            tokens.forEach((token) => {
                // Lookup the token
                _data.read('tokens', token, (err, tokenData) => {
                    if (!err && tokenData) {
                        // Check if the token has expired
                        if (tokenData.expires < Date.now()) {
                            _data.delete('tokens', tokenData.id, (err) => {
                                if (!err) {
                                    console.log('Clean successful!');
                                } else {
                                    console.log(err)
                                }
                            });
                        } else {
                            console.log("All tokens up to date");
                        }
                    } else {
                        console.log(err);
                    }
                });
            })
        } else {
            console.log('Error: Could not find any tokens to process. Error Message: '+err);
        }
    })
}

// Export module
module.exports = _tokens;