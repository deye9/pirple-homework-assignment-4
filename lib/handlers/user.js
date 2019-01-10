/*
 * Specific handler for users
 * Shepherd Gwasira
 */

// Dependencies
var _data = require('../data');
var genericHelper = require('../helpers/generic');
var config = require('../config');
var tokenHelper = require('../helpers/token');

// Define the userHandler
var userHandler = {};

// Users
userHandler.users = function(data, callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    userHandler._users[data.method](data,callback);
  } else {
    callback(405);
  }
}

// Container for the users submethods
userHandler._users = {};

// Users - post
// Required data: name, emailAddress, streetAddress
// Optional data: none
userHandler._users.post = function(data, callback){
  // Check that all required felds are filled out (and in case of emaiLAddress let's just check that contains the character '@')
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var emailAddress = typeof(data.payload.emailAddress) == 'string' && data.payload.emailAddress.trim().length > 0 && data.payload.emailAddress.indexOf('@') > -1 ? data.payload.emailAddress.trim() : false;
  var streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0  ? data.payload.streetAddress.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(name && emailAddress && streetAddress && password){
      // Let's create the variable that defines our unique id for user.
      var userIdentifier = genericHelper.hash(emailAddress);

      if(userIdentifier){
        // Make sure that the user doesnt already exist
        _data.read('users', userIdentifier , function(err, data){
          if(err){
            // Hash the password
            var hashedPassword = genericHelper.hash(password);

            if(hashedPassword){
              // Create the user object
              var userObject = {
                  'id': userIdentifier,
                  'name': name,
                  'emailAddress': emailAddress,
                  'streetAddress': streetAddress,
                  'hashedPassword' : hashedPassword,
                  'orders': [],
                  'shoppingcart': []
              };

              // Store the user
              _data.create('users', userIdentifier, userObject, function(err){
                  if(!err){
                    callback(200);
                  } else {
                    console.log(err);
                    callback(500, {'Error' : 'A user with that emaiL address already exists, please try again.'});
                  }
              });
            } else {
              console.log(err);
              callback(500, {'Error' : 'Could not hash the user\'s password'});
            }
          }else{
            //User alraedy exists
            callback(400, {'Error' : 'A user with that email already exists, please try again.'});
          }
        });
      } else {
        //User alraedy exists
        callback(500, {'Error' : 'There was a problem creating the new user, please try again.'});
      }
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }

};

// Users - get
// Required data: useridentifier
// Optional data: none
userHandler._users.get = function(data, callback){
  // Check that the id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  if(id){
      // Get the token from the headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      // Verify that the given token is valid for the phone number
      tokenHelper.verifyToken(token, id, function(tokenIsValid){
        if(tokenIsValid){
          //Lookup the user
          _data.read('users', id, function(err,data){
            if(!err && data){
              // Remove the hashed password from the user object before returning it to the requester.
              delete data.hashedPassword;
              callback(200, data);
            }else{
              callback(404);
            }
          });
        } else {
          callback(403, {'Error': 'Missing required token in header, or token is invalid'});
        }
      });
  } else {
    callback(400, {'Error': 'Missing required field'})
  }

};

// Users - put
// Required data: userIdentifier
// Optional data: name, streetAddress, password (at least one must be specified)
userHandler._users.put = function(data, callback){
  // Check for the required field
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;

  // Check for the optional fields
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the id is invalid
  if(id){
    // Error if nothing is sent to update
    if(name || streetAddress || password){
      // Get the token from the headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the phone number
      tokenHelper.verifyToken(token, id, function(tokenIsValid){
        if(tokenIsValid){
          // Lookup the user
          _data.read('users', id, function(err, userData){
            if(!err && userData){
              // Update the fields necessary
              if(name){
                userData.name = name;
              }
              if(streetAddress){
                userData.streetAddress = streetAddress;
              }
              if(password){
                userData.hashedPassword = genericHelper.hash(password);
              }

              // Store the new updates
              _data.update('users', id, userData, function(err){
                if(!err){
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error' : 'Could not update the user'});
                }
              });
            } else {
              callback(400, {'Error': 'The specified user does not exist'});
            }
          });
        } else {
          callback(403, {'Error': 'Missing required token in header, or token is invalid'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing the field(s) to update'});
    }
  } else {
    callback(400, {'Error': 'Missing required field'});
  }

};

// Users - delete
// Required field: phone
// @TODO Only let an authenticated user delete their object. Dont let them delete anyone else's.
// @TODO Cleanup (delete) any other data files associated with this user
userHandler._users.delete = function(data, callback){
  // Check that the id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the user identifier
    tokenHelper.verifyToken(token, id, function(tokenIsValid){
      if(tokenIsValid){
        //Lookup the user
        _data.read('users', id, function(err,data){
          if(!err && data){
            _data.delete('users', id, function(err){
              if(!err){
                  _data.delete('tokens', token, function(err){
                    if(!err){
                      callback(200);
                    } else {
                      callback(500, {'Error' : 'Errors encountered while deleting all the information of the user.'})
                    }
                  });
                } else {
                    callback(500, {'Error' : 'Could not delete the specified user'});
                }
            });
          }else{
            callback(400, {'Error': 'Could not find the specified user'});
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
};

module.exports = userHandler;
