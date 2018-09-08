/*
*   Pizza class module
*
*/

// Pizza is a class that gets constructed by the user and placed into a cart.  
// Pizza never goes directly into the file system.  // Pizza is temporarily stored in a cart and once that cart is turned into an order, the pizza is permanently stored in an order (the cart gets deleted when turned into an order).

// Dependencies
const menu = require('./menu');
const helpers = require('./helpers');

// Pizza class
// TODO: format Pizzas as JSON objects
class Pizza {
    static get menu(){
        return menu;
    }
    // Pizza constructor
    constructor(size,sauce,toppings){  
        // Check if size is one of the acceptable sizes
        if(menu.acceptableSizes.indexOf(size) > -1){
            this.size = size;
        } else {
            console.log('this is not a size');
        }
        // Check if sauce is one of the acceptable sauces
        if(menu.acceptableSauces.indexOf(sauce) > -1){
            this.sauce = sauce;
        } else {
            console.log('this is not a sauce');
        }
        // Check if each topping is one of the acceptable toppings
        if(toppings.length > 0){
            let orderToppings = [];
            toppings.forEach((topping)=>{
                if(menu.acceptableToppings.indexOf(topping) > -1){
                    orderToppings.push(topping);
                }
            });
            this.toppings = orderToppings;
        } else {
            console.log('one of these toppings doesn\'t exist');
        }
        this.id = helpers.createRandomString(20);
    }
    // Getter to return the price of the pizza with the given parameters
    get price() {
        return this.calcPrice();
    }
    // function to calculate the price of the pizza with the given parameters
    // Stripe formats prices as integers so 17.50 would be 1750
    calcPrice() {
        let price = 0;
        if(this.size == 'personal'){
            price += 8.00;
        } else if(this.size == 'medium') {
            price += 14.00;
        } else if(this.size == 'large'){
            price += 18.00;
        } else {
            console.log('Size does not exist');
        }
        if(this.toppings.length > -1){
            price += (this.toppings.length) * 1.5;
        }
        return price*100;
    }
};

// let newPizza = new Pizza('medium','red',['onion','pepperoni']);
// console.log(newPizza);

module.exports = Pizza;