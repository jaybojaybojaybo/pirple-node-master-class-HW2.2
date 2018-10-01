/*
*
* Mailgun API module
*
*/

// Dependencies
const config = require('../env/config');
const https = require('https');
const qs = require('querystring');

// We just need to take in email data and structure it correctly, then send the email
// Container for Stripe object
let mailgun = {};

mailgun.send = (emailData) => {
    return new Promise((resolve, reject) => {
        // API options
        let auth = new Buffer("api:"+config.mailgunApiKey);
        const options = {
            "method": "POST",
            "protocol": "https:",
            "hostname": "api.mailgun.net",
            "path": "/v3/" + config.mailgunDomain + "/messages",
            "headers": {
              "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
              "content-type": "application/x-www-form-urlencoded",
              "cache-control": "no-cache",
              "Authorization": "Basic " + auth.toString('base64')
            },
        };
        
        // Create Mailgun options object
        mailgun.requestData = {
            "from":"Excited User <postmaster@sandboxa03f7c57d9294136a03a478670ccfac9.mailgun.org>",
            "to":emailData.email,
            "subject":"Hello",
            "text":emailData.orderData
        }
    
        // Http POST request for email
        const req = https.request(options, (res) => {
            let chunks = [];
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                let body = Buffer.concat(chunks);
                mailgun.responseBody = body.toString();
                console.log("Mailgun response:", mailgun.responseBody);
            });
        });
        
        // Http POST request error handling
        req.on('error', (e) => {
            mailgun.responseError = e.message;
        });
        

        req.write(qs.stringify(mailgun.requestData));
        req.end();
        if(mailgun.responseBody){
            resolve(mailgun.responseBody);
        } else if(mailgun.responseError) {
            reject(mailgun.responseError);
        }
    });
}

// email = {
//     "email":"jasun.feddema@gmail.com",
//     "orderData":"you bought a pony!"
// }

// mailgun.send(email);

module.exports = mailgun;