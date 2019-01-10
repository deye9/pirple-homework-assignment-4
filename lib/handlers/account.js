/*
 * Specific handler for account login & logout operations
 * Shepherd Gwasira
 */

// Dependencies
var _data = require('../data');
var genericHelper = require('../helpers/generic');
var tokenHelper = require('../helpers/token');

// Define the accountHandler
var accountHandler = {};

// Login operation
accountHandler.login = function(data, callback){
  var acceptableMethods = ['post'];
  if(acceptableMethods.indexOf(data.method) > -1){
    accountHandler._login[data.method](data,callback);
  } else {
    callback(405);
  }
}

// Container for the account sub methods
accountHandler._login = {};
accountHandler._logout = {};

// Login - post
// Required data: emailAddress, streetAddress
// Optional data: none
accountHandler._login.post = function(data, callback){
  // Check that all required felds are filled out
  var emailAddress = typeof(data.payload.emailAddress) == 'string' && data.payload.emailAddress.trim().length > 0 ? data.payload.emailAddress.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(emailAddress && password){
      // Make sure that the user already exist
      var userIdentifier = genericHelper.hash(emailAddress);
      if(userIdentifier){
        _data.read('users', userIdentifier, function(err, userData){
            if(!err && userData){
              var hashedPassword = genericHelper.hash(password);
              if(hashedPassword){
                if(hashedPassword == userData.hashedPassword){
                  // User exists in our system,
                  tokenHelper.getTokenOfUser(userIdentifier, function(err, dataExistentToken){
                    if(!err && dataExistentToken){
                      if(dataExistentToken['expires'] < Date.now()){
                          tokenHelper.deleteToken(dataExistentToken['id'], function(err, data){
                            if(!err){
                              tokenHelper.createToken(userIdentifier, function(err, dataNewToken){
                                if(!err && dataNewToken){
                                  callback(200, dataNewToken);
                                } else {
                                  callback(500, {'Error': 'There was a server error while attempting to login the user. Namely: creating the user\'s token.'});
                                }
                              });
                            } else {
                              callback(500, {'Error': 'There was a server error while attempting to login the user. Namely: deleting the current user\'s token.'});
                            }
                          });
                      } else {
                          callback(200, dataExistentToken);
                      }
                    } else {
                      tokenHelper.createToken(userIdentifier, function(err, dataNewToken){
                        if(!err && dataNewToken){
                          callback(200, dataNewToken);
                        } else {
                          callback(500, {'Error': 'There was a server error while attempting to login the user. Namely: creating the user\'s token.'});
                        }
                      });
                    }
                  });
                } else {
                    callback(403, {'Error': 'The credentials used to login are wrong, make sure the email address and password are correct.'});
                }
              } else {
                console.log(err);
                callback(500, {'Error' : 'There was a server error while attempting to login the user. Namely: hashing the user\'s password'});
              }
            } else {
              // User doesn't exist
              callback(403, {'Error' : 'There isn\'t any user with that email address registed in our system, please register yourself first.'});
            }
        });
      } else {
        callback(500, {'Error' : 'There was a server error while attempting to login the user. Namely: hashing the user\'s identifier'});
      }
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};


// logout operation
accountHandler.logout = function(data, callback){
  var acceptableMethods = ['delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    accountHandler._logout[data.method](data,callback);
  } else {
    callback(405);
  }
}

// Logout - post
// Required data: tokenId
// Optional data: none
accountHandler._logout.delete = function(data, callback){
  // Check that all required felds are filled out
  var token = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  if(token){
    tokenHelper.deleteToken(token, function(err, data){
      if(!err){
        callback(200, data);
      } else {
        callback(500, {'Error': 'There was a server error while attempting to login the user. Namely: deleting the current user\'s token.'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};



module.exports = accountHandler;
