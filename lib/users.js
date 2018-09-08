/*
*   Users handler module
*
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const handlers = require('./handlers');
const _tokens = require('./tokens');

// Container for the users submethods
let _users = {};

// Users - post
// Required data: firstName, lastName, email, street, city, state, zip, password, tosAgreement
// Optional data: none
_users.post = (data, callback) => {
    // Check that all fields are filled out
    let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    let email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.trim().includes('@') ? data.payload.email.trim() : false;

    let street = typeof (data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street : false;

    let city = typeof (data.payload.city) == 'string' && data.payload.city.trim().length > 0 ? data.payload.city : false;

    let state = typeof (data.payload.state) == 'string' && data.payload.state.trim().length === 2 ? data.payload.state : false;

    let zip = typeof (data.payload.zip) == 'number' && data.payload.zip.toString().length === 5 ? data.payload.zip : false;

    let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    let tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && email && street && city && state && zip && password && tosAgreement) {
        // Make sure the user doesn't already exist
        _data.read('users', email, (err, data) => {
            if (err) {
                //Hash the password
                let hashedPassword = helpers.hash(password);
                // Create the user object
                if (hashedPassword) {
                    let userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'email': email,
                        'street': street,
                        'city': city,
                        'state': state,
                        'zip': zip,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    }

                    _data.create('users', email, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback('500', { 'Error': 'Could not create the new user' });
                        }
                    });
                } else {
                    callback(500, { 'Error': 'Could not hash the user\'s password' });
                }
            } else {
                //User already exists
                callback(400, { 'Error': 'A user with that email address already exists' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

// Users - get
// Required data: email
// Optional data: none
_users.get = (data, callback) => {
    let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.trim().includes('@') ? data.queryStringObject.email.trim() : false;
    if (email) {
        // Get the token from the headers
        let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;
        // Verify that the given token is valid for the email
        _tokens.verifyToken(token, email, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', email, (err, data) => {
                    if (!err && data) {
                        // Remove hashed password from user Object before returning the object to the requester
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404, { 'Error': 'User does not exist' });
                    }
                });
            } else {
                callback(404, { 'Error': 'Missing required token in header, or token is invalid' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, street, city, state, zip, password (at least one must be specified)

_users.put = (data, callback) => {
    // Check for the required field
    let email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.trim().includes('@') ? data.payload.email.trim() : false;

    // Check for the optional fields
    let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    let street = typeof (data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street : false;

    let city = typeof (data.payload.city) == 'string' && data.payload.city.trim().length > 0 ? data.payload.city : false;

    let state = typeof (data.payload.state) == 'string' && data.payload.state.trim().length === 2 ? data.payload.state : false;

    let zip = typeof (data.payload.zip) == 'number' && data.payload.zip.toString().length === 5 ? data.payload.zip : false;

    let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if email is invalid
    if (email) {
        if (firstName || lastName || street || city || state || zip || password) {
            // Get the token from the headers
            let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid for the email address
            _tokens.verifyToken(token, email, (tokenIsValid) => {
                if (tokenIsValid) {
                    // Lookup the user
                    _data.read('users', email, (err, userData) => {
                        if (!err && userData) {
                            // Update the necessary fields
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (street) {
                                userData.street = street;
                            }
                            if (city) {
                                userData.city = city;
                            }
                            if (state) {
                                userData.state = state;
                            }
                            if (zip) {
                                userData.zip = zip;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the updates and persist them to disk
                            _data.update('users', email, userData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'Error': 'Could not update the user - Error message: ' + err });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'The specified user does not exist' });
                        }
                    });
                } else {
                    callback(403, { 'Error': 'Missing required token in header, or token is invalid' });
                }
            });

        } else {
            callback(400, { 'Error': 'Missing fields to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

// Users - delete
// Required data: email
// Optional data: none
// TODO: Cleanup (delete) any other data files associated with this user
_users.delete = (data, callback) => {
    // Check that the email is valid
    let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.trim().includes('@') ? data.queryStringObject.email.trim() : false;

    if (email) {
        // Get the token from the headers
        let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the email address
        _tokens.verifyToken(token, email, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', email, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', email, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': 'Could not delete the specified user' });
                            }
                        });
                    } else {
                        callback(404, { 'Error': 'Could not find the specified user' });
                    }
                });
            } else {
                callback(403, { 'Error': 'Missing required token in header, or token is invalid' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

// Export module

module.exports = _users;
