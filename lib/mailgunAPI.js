/*
*
* Mailgun API module
*
*/

// Dependencies


let mailgunData = {
    from: 'postmaster@sandboxa03f7c57d9294136a03a478670ccfac9.mailgun.org',
    to: userEmail,
    subject: 'Order Confirmed',
    text: 'Your order,' + orderObject.orderId + ', has been created and is being processed!'
}

mailgun.messages().send(mailgunData, (error, body) => {
    console.log("confirmation message: ", body);
})

({apiKey: config.mailgunApiKey, domain: config.mailgunDomain})