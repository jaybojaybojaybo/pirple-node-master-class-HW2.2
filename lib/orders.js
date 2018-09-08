/*
*  Orders module
*
*/

// Orders are a permanent record and are persisted to disk
// Token is required to create or get Orders
// Orders are passed a order and proceed to ask for payment
// When payment is received for the order, a confirmation email is sent to the user's email

// Dependencies
const _data = require('./data');
const config = require('./config');
const helpers = require('./helpers');
const _tokens = require('./tokens');

// API Dependencies
const stripe = require('./stripeAPI');
const mailgun = require('./mailgunAPI');

// Container for all the orders methods
_orders = {};

// Orders - post
// Required data: cartId
// Optional data: none
_orders.post = (data, callback) => {
    // Validate inputs
    let tokenId = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    let cartId = typeof (data.payload.cartId) == 'string' && data.payload.cartId.trim().length == 20 ? data.payload.cartId : false;

    // Verify token

    if (tokenId && cartId) {
        // Lookup the user by reading the token
        _data.read('tokens', tokenId, (err, tokenData) => {
            if (!err && tokenData) {
                let userEmail = tokenData.email;
                // Lookup the user data
                _data.read('users', userEmail, (err, userData) => {
                    if (!err && userData) {
                        // Instantiate user orders (if there is one) as a variable
                        let userOrders = typeof (userData.orders) == 'object' ? userData.orders : [];
                        // Use Cart Id to get Cart Data
                        _data.read('carts', cartId, (err, cartData) => {
                            if (!err && cartData) {
                                // Create a random id for the order
                                let orderId = helpers.createRandomString(20);
                                // Create a token for payment via stripe
                                let stripeAmount = cartData.cartTotal;
                                let stripeToken = 'tok_visa';
                                
                                // Create a stripe payment charge
                                let stripeCharge = stripe.charges(
                                    stripeAmount, 
                                    'usd',
                                    orderId,
                                    stripeToken
                                );
                                // Create the order object, and include the user's email

                                // Stripe charges are formatted as promises, so this one section follows Promise syntax while the rest uses callbacks
                                stripeCharge.then((stripeOrderData) => {
                                    let orderObject = {
                                        'tokenId': tokenId,
                                        'orderId': orderId,
                                        'orderDate': Date.now(),
                                        'email': userEmail,
                                        'orderDetails': cartData,
                                        'orderTotal': cartData.cartTotal,
                                        'payment': JSON.parse(stripeOrderData)
                                    }
                                    // Save the order object to file
                                    _data.create('orders', orderId, orderObject, (err) => {
                                        if (!err) {
                                            // Add the order id to the user's object
                                            userData.orders = userOrders;
                                            userData.orders.push(orderId);
                                            // Create the mailgun confirmation email message data
                                            let mailgunData = {
                                                from: 'postmaster@sandboxa03f7c57d9294136a03a478670ccfac9.mailgun.org',
                                                to: userEmail,
                                                subject: 'Order Confirmed',
                                                text: 'Your order,' + orderObject.orderId + ', has been created and is being processed!'
                                            }
                                            // Send the confirmation email
                                            mailgun.messages().send(mailgunData, (error, body) => {
                                                console.log("confirmation message: ", body);
                                            })
                                            // Save the new user data
                                            _data.update('users', userEmail, userData, (err) => {
                                                if (!err) {
                                                    // Delete the cart data 
                                                    _data.delete('carts', cartId, (err) => {
                                                        if (!err) {
                                                            // Lookup the user
                                                            _data.read('users', cartData.email, (err, userData) => {
                                                                if (!err && userData) {
                                                                    // Get user carts
                                                                    let userCarts = typeof (userData.carts) == 'object' && userData.carts instanceof Array ? userData.carts : [];
    
                                                                    // Remove the deleted cart from their list of carts
                                                                    let cartPosition = userCarts.indexOf(cartId);
                                                                    if (cartPosition > -1) {
                                                                        userCarts.splice(cartPosition, 1);
                                                                        // Re-save the user's data
                                                                        _data.update('users', cartData.email, userData, (err) => {
                                                                            if (!err) {
                                                                                // Return the data about the new order
                                                                                callback(200, orderObject);
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
                                                    callback(500, { 'Error': 'Could not update the user with the new order' });
                                                }
                                            });
                                        } else {
                                            callback(500, { 'Error': 'Could not create the new order' });
                                        }
                                    });
                                 }, (error) => {
                                    // Stripe did not return a charge object, ie could not validate payment
                                    callback(500, error);
                                });
                            } else {
                                callback(403, { 'Error': 'Cart does not exist' });
                            }
                        });
                    } else {
                        callback(403, { 'Error': 'User does not exist or is not authorized' });
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

// Orders - get
// Require data : id
// Optional data : none
// TODO: write get method to return one order by id
_orders.get = (data, callback) => {
    // Get the order id
    let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the order
        _data.read('orders', id, (err, orderData) => {
            if (!err && orderData) {
                // Get the token from the headers
                let tokenId = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;
                console.log(tokenId)
                // Verify that the given token is valid and belongs to the user who created the order by verifying the email
                _tokens.verifyToken(tokenId, orderData.email, (tokenIsValid) => {
                    console.log(tokenIsValid);
                    if (tokenIsValid) {
                        // Return the order data
                        callback(200, orderData);
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

module.exports = _orders;