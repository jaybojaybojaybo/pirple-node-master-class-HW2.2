/*
*
* Stripe API module
*
*/

// Dependencies
const qs = require('querystring');
const https = require('https');

const config = require('./config');
// config.stripeSecretKey

// Container for Stripe object
let stripe = {};

stripe.charges = (amount, currency, description, stripeToken) => {
    return new Promise((resolve, reject) => {
        // API options
        const options = {
            "method": "POST",
            "protocol": "https:",
            "hostname": "api.stripe.com",
            "path":"/v1/charges",
            "headers": {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": "Bearer sk_test_PWLuGlCJeM2Zok21AIGIxzhr",
              "Cache-Control": "no-cache"
            }
        };
        
        // Create Stripe options object
        stripe.requestData = {
            'amount': amount,
            'currency': currency,
            'description': description,
            'source': stripeToken
        }
    
        // Http POST request for charge
        const req = https.request(options, (res) => {
            let chunks = [];
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                let body = Buffer.concat(chunks);
                stripe.responseBody = body.toString();
            });
        });
    
        req.on('error', (e) => {
            stripe.responseError = e.message;
        });
        
        req.write(qs.stringify(stripe.requestData));
        req.end();
        if(stripe.responseBody){
            resolve(stripe.responseBody);
        } else if(stripe.responseError) {
            reject(stripe.responseError);
        }
    });
}

module.exports = stripe;
