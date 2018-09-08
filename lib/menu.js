/*
*  Menu items module
*
*/

// Menu is a list of possible Pizza options
// Menu is used to validate user-submitted pizza options
// Menu can give a logged-in user the list of all pizza options

// Instantiate menu object
let _menu = {};

// Constants for acceptable options for a pizza.
_menu.acceptableSizes = [
    'personal',
    'medium',
    'large'
];
_menu.acceptableSauces = [
    'white',
    'red'
];
_menu.acceptableToppings = [
    'pepperoni',
    'sausage',
    'blackOlive',
    'onion',
    'greenPepper',
    'mushroom',
    'extraCheese'
];

// function to aggregate all the options into one list to return to the user
// TODO: only let logged in users access listOptions method
_menu.listOptions = () => {
    let options = [];
    _menu.acceptableSizes.forEach((size)=>{
        options.push(size+' size');
    });
    _menu.acceptableSauces.forEach((sauce)=>{
        options.push(sauce+' sauce');
    });
    _menu.acceptableToppings.forEach((topping)=>{
        options.push(topping);
    });
    let jsonOptions = {};
    for(i = 0; i <= options.length; i++){
        jsonOptions[i] = options[i];
    }
    return jsonOptions;
}

module.exports = _menu;