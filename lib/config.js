/*
* Create and export configuration variables
*
*/

// Auth Dependencies
const auths = require('../env/config');

let environments = {};

environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxCarts': 1,
    'stripePublishKey': auths.stripePublishKey,
    'stripeSecretKey': auths.stripeSecretKey,
    'mailgunApiKey': auths.mailgunApiKey,
    'mailgunDomain': auths.mailgunDomain
}

environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'staging',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxCarts': 1,
    'stripePublishKey': 'pk_test_HhmEOMZPyJAZv7epAS1aH7fA',
    'stripeSecretKey': 'sk_test_PWLuGlCJeM2Zok21AIGIxzhr'
}

// Determine which environment was passed as an argument
let currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to staging
let environmentToExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;