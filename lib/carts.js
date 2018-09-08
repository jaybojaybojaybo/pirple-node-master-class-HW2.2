/*
*  Shopping Cart module
*
*/

// Cart is a temporary holder of Pizza objects
// Cart is associated with a user via token
// Carts will persist to disk until one of the two following circumstances occur: if the token expires or the cart is turned into an order
// Only one pizza can be added at a time

// Dependencies
const _data = require('./data');
const config = require('./config');
const helpers = require('./helpers');
const Pizza = require('./pizza');
const _tokens = require('./tokens');

// Container for all the carts methods
_carts = {};

// Carts - post
// Required data: pizza
// Optional data: none
_carts.post = (data, callback) => {
    // Validate inputs
    let tokenId = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    let pizza = typeof(data.payload.pizza) == 'object' ? data.payload.pizza : false;

    if (tokenId && pizza) {
        // Lookup the user by reading the token
        _data.read('tokens', tokenId, (err, tokenData) => {
            if (!err && tokenData) {
                let userEmail = tokenData.email;
                // Lookup the user data
                _data.read('users', userEmail, (err, userData) => {
                    if (!err && userData) {
                        let userCarts = typeof (userData.carts) == 'object' ? userData.carts : [];
                        // Verify that the user has less than the number of max carts per user
                        if (userCarts.length <= config.maxCarts) {
                            // Create a random id for the cart
                            let cartId = helpers.createRandomString(20);

                            // Get the total price for the pizza
                            let addedPizza = new Pizza(pizza.size,pizza.sauce,pizza.toppings);
                            addedPizza.pizzaId = helpers.createRandomString(20);
                            addedPizza.total = addedPizza.price;

                            let total = addedPizza.total;

                            // Create the cart object, and include the user's phone
                            let cartObject = {
                                'tokenId': tokenId,
                                'cartId': cartId,
                                'email': userEmail,
                                'pizzas': [{[addedPizza.pizzaId] : addedPizza}],
                                'cartTotal': total
                            }

                            // Save the object
                            _data.create('carts', cartId, cartObject, (err) => {
                                if (!err) {
                                    // Add the cart id to the user's object
                                    userData.carts = userCarts;
                                    userData.carts.push(cartId);
                                    // Save the new user data
                                    _data.update('users', userEmail, userData, (err) => {
                                        if (!err) {
                                            // Return the data about the new cart
                                            callback(200, cartObject);
                                        } else {
                                            callback(500, { 'Error': 'Could not update the user with the new cart' });
                                        }
                                    });
                                } else {
                                    callback(500, { 'Error': 'Could not create the new cart' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'The user already has the maximum number of carts (' + config.maxCarts + ')' });
                        }
                    } else {
                        callback(403, { 'Error': 'Not Authorized' });
                    }
                });
            } else {
                callback(403, { 'Error': 'Not authorized' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
    }
};

// Carts - get
// Require data : id
// Optional data : none
_carts.get = (data, callback) => {
    // Get the cart id
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the cart
        _data.read('carts', id, (err, cartData) => {
            if (!err && cartData) {
                // Get the token from the headers
                let tokenId = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
                console.log(tokenId)
                // Verify that the given token is valid and belongs to the user who created the cart by verifying the email
                _tokens.verifyToken(tokenId, cartData.email, (tokenIsValid) => {
                    console.log(tokenIsValid);
                    if (tokenIsValid) {
                        // Return the cart data
                        callback(200, cartData);
                    } else {
                        callback(403, { 'Error': 'You got a 403' });
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

// Carts - put
// Required data: id, updateMethod (add or remove), pizza
// Optional data: none
_carts.put = (data, callback) => {
    // Check for the required field
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    let updateMethod = typeof (data.payload.updateMethod) == 'string' ? data.payload.updateMethod : false;

    let pizza = typeof(data.payload.pizza) == 'object' ? data.payload.pizza : false;

    //Error if cart id is invalid
    if (id) {
        // Check to make sure one or more optional fields have been sent
        if(pizza) {
            // Lookup the cart
            _data.read('carts', id, (err, cartData) => {
                if (!err && cartData) {
                    // Get the token from the headers
                    let tokenId = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;

                    // Verify that the given token is valid for the user email
                    _tokens.verifyToken(tokenId, cartData.email, (tokenIsValid) => {
                        if (tokenIsValid) {
                            // Update the cart where necessary
                            // Required data: pizza
                            if(updateMethod == 'add' && pizza){
                                // Instantiate the new pizza
                                let newPizza = new Pizza(pizza.size,pizza.sauce,pizza.toppings);
                                newPizza.pizzaId = helpers.createRandomString(20);
                                newPizza.total = newPizza.price;
                                // Get the total price for the pizza
                                let total = newPizza.total;
                                // Add new pizza to the shopping cart
                                cartData.pizzas.push({[newPizza.pizzaId]:newPizza});
                                // Calculate new cart total
                                cartData.cartTotal = cartData.cartTotal += newPizza.total;
                            } 
                            // Required data: pizzaId of specific pizza to be removed from cart
                            else if (updateMethod == 'remove' && pizza.pizzaId && cartData.pizzas.length > 0) {
                                delete cartData.pizzas[cartData.pizzas.indexOf(pizza.pizzaId)];
                            }

                            // Store the new updates
                            _data.update('carts', id, cartData, (err) => {
                                if(!err){
                                    callback(200,cartData);
                                } else {
                                    callback(500,{ 'Error': 'Could not update the cart' });
                                }
                            });
                        } else {
                            callback(403, { 'Error': 'Missing required token in header, or token is invalid' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Cart ID did not exist' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing fields to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
}


// Carts - delete
// Required data: id
// Optional data: none
_carts.delete = (data, callback) => {
    // Check that the id number is valid
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the cart
        _data.read('carts', id, (err, cartData) => {
            if (!err && cartData) {
                // Get the token from the headers
                let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;

                // Verify that the given token is valid for the email
                _tokens.verifyToken(token, cartData.email, (tokenIsValid) => {
                    if (tokenIsValid) {
                        // Delete the cart data
                        _data.delete('carts', id, (err) => {
                            if (!err) {
                                // Lookup the user
                                _data.read('users', cartData.email, (err, userData) => {
                                    if (!err && userData) {
                                        // Get user carts
                                        let userCarts = typeof (userData.carts) == 'object' && userData.carts instanceof Array ? userData.carts : [];

                                        // Remove the deleted cart from their list of carts
                                        let cartPosition = userCarts.indexOf(id);
                                        if (cartPosition > -1) {
                                            userCarts.splice(cartPosition, 1);
                                            // Re-save the user's data
                                            _data.update('users', cartData.email, userData, (err) => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'Error': 'Could not update the user' });
                                                }
                                            });
                                        } else {
                                            callback(500, { 'Error': 'Could not find the cart on the user\'s object, so could not remove it' });
                                        }
                                    } else {
                                        callback(404, { 'Error': 'Could not find the user who created this cart, so could not remove the cart from the list of carts in the user object' });
                                    }
                                });
                            } else {
                                callback(500, { 'Error': 'Could not delete the cart data' });
                            }
                        });
                    } else {
                        callback(403, { 'Error': 'Missing required token in header, or token is invalid' });
                    }
                });
            } else {
                callback(400, { 'Error': 'The specified cart ID does not exist' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

module.exports = _carts;