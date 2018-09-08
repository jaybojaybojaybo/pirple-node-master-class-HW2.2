# pirple-node-master-class-HW2
#### Pirple Node.js Master Class Homework Assignment #2 - RESTful API

# Directions: 
### Clone repo to your local machine
### Navigate to the folder in your command line program
### Within this folder, find the env folder and edit the 'configTemplate.js' file with your own Stripe and Mailgun credentials
### Rename 'configTemplate.js' to 'config.js'
### While within the top project folder, run the command 'node index.js' (servers will be running on localhost:3000 and localhost:3001)
### In POSTMAN, make the following requests to the following domains: 

    1. At localhost:3000/users, POST with the following body format and fill in your own information except for email and tosAgreement
       (email is on an approved email list and tosAgreement should always be set to true): 
      {
          "firstName": "your first name",
          "lastName": "your last name",
          "email": "you@youremail.com",
          "street": "1234 Your Street",
          "city": "Your City",
          "state": "Your State",
          "zip": Your Zip as a number,
          "password": "your password",
          "tosAgreement": true
      }
    2. At localhost:3000/tokens, POST with the following body format:
      {
          "email":"you@youremail.com",
          "password":"your password"
      }
      A token id will be provided, which will be used in the header of the cart request below.
    3. At localhost:3000/carts, in the Headers tab, set the Key to 'token' and the Value to the token id that you received from the above POST request. POST with the following body format:
      {
        "pizza": {"size":"medium","sauce":"red","toppings":["pepperoni", "onion"]}
      }
      A cart will be created, use the cartId in the body of the order request below.
    4. At localhost:3000/orders, in the Headers tab, set the Key to 'token' and the Value to the same token id you used previously. 
    POST with the following body format:
      {
        "cartId": "the cartId you received from the previous request" 
      }
      A full order object will be returned and confirmation of an email being sent will be logged in the console.
      
# Extra Info

### Separation of logic was a focus of mine, the handlers.js file is importing from other libraries which handle all the logic for their respective routes
#### the config file with respective API keys for the services above are private and require the user to input their own credentials for the API POST calls to the orders route to work.
#### I wrote my Stripe API as a promise, so broke from the callback pattern established in the lessons
### Full CRUD is available for users, tokens, and carts
### The orders.js file only contains a post method for orders and a TODO for a get method.