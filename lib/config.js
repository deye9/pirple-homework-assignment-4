/*
 * Create and export configuration variables
 * Author: Shepherd Gwasira
 */

 // Container of all the environments
 var environments = {};

 // Staging (default) environment
 environments.staging = {
   'httpPort': 3000,
   'httpsPort': 3001,
   'envName': 'staging',
   'hashingSecret': 'thisIsASecret',
   'maxChecks': 5,
   'twilio' : {
     'accountSid' : 'accountSid',
     'authToken': 'authToken',
     'fromPhone': '+277187263563'
   },
   'stripe': {
     'secretApiKeyTest':'stripekey',
     'public_key': 'publicKey'
   },
   'mailgun': {
     'ApiKeyTest':'mailgunKey',
     'boundary': '------------------------69b2c2b9c464731d',
     'domain':'sandbox8238909cf6344016bcbab728aa5e402b.mailgun.org'
   },
   'templateGlobals':{
     'appName': 'Pizza Shop',
     'companyName' : 'WebCoodes Pizza, Inc, SA',
     'yearCreated': '2018',
     'baseUrl': 'http://localhost:3000/'
   }
 };

 // Production environments
 environments.production = {
   'httpPort': 5000,
   'httpsPort': 5001,
   'envName': 'production',
   'hashingSecret': 'thisIsAlsoASecret',
   'maxChecks': 5,
   'twilio' : {
     'accountSid' : 'accountSid',
     'authToken': 'authToken',
     'fromPhone': '+277187263563'
   },
   'stripe': {
     'secretApiKeyTest':'stripekey'
   },
   'mailgun': {
     'ApiKeyTest':'mailgunkey',
     'boundary': '------------------------69b2c2b9c464731d',
     'domain':'sandbox8238909cf6344016bcbab728aa5e402b.mailgun.org'
   },
   'templateGlobals':{
    'appName': 'Pizza Shop',
    'companyName' : 'WebCoodes Pizza, Inc, SA',
    'yearCreated': '2018',
    'baseUrl': 'http://localhost:5000/'
  }
 };

 // Determine which environment was passed as a command-line argument
 var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

 // Check that the current environment is one of the environments above, if not, default to staging
 var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

 // Export the module
 module.exports = environmentToExport;
