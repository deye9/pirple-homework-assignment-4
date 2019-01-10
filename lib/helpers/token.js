/*
 * Helper for tokens
 * Shepherd Gwasita
 */

// Dependencies
var _data = require('../data');
var helpers = require('../helpers/generic');

// Define the tokenHandler
var tokenHandler = {};

// Get token of existent user
tokenHandler.getTokenOfUser = function(userId, callback){
  //Iterate through the existent tokens
  _data.list('tokens', function(err, data){
    if(!err && data && data.length > 0){
      checkUserToken(data, userId, function(err, userToken){
        if(!err && userToken){
          callback(false, userToken);
        } else {
          callback(true, 'Couldn\'t find the token for the user.');
        }
      });
    } else {
      callback(true, err);
    }
  });
};

var checkUserToken = function(tokenList, userId, callback){
  const listOfTokenData = Promise.all(
     tokenList.map(
         tokenId => new Promise((resolve, reject) => {
           _data.read('tokens', tokenId, (err, tokenData) => {
             if(err){
               resolve(null);
             } else {
               resolve(tokenData);
             }
           });
         })
       )
     );
  listOfTokenData.then((tokenArray) => {
    var tokenFound = null;
    for(var i=0; i < tokenArray.length; i++){
      if(tokenArray[i] && tokenArray[i].hasOwnProperty('userIdentifier') && tokenArray[i]['userIdentifier'] == userId){
        return callback(false, tokenArray[i]);
      }
    }
    return callback(true, null);
  });
};

// Verify if a given tokenId exist in our system.
tokenHandler.getTokenData = function(tokenId, callback){
  _data.read('tokens', tokenId, function(err, data){
    if(!err && data){
      callback(false, data);
    } else {
      callback(true);
    }
  });
};

// Verify if a given token id is currently valid for a given user.
tokenHandler.verifyToken = function(tokenId, userIdentifier, callback){
  // Lookup the token
  _data.read('tokens', tokenId, function(err,tokenData){
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired
      if(tokenData.userIdentifier == userIdentifier && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false)
    }
  });
};

// Creates a given token in the system.
tokenHandler.createToken = function(userIdentifier, callback){
  // If valid, create a new token with the user identifier. Set expiration date 1 hour in the future.
  var tokenId = helpers.createRandomString(20);
  var expires = Date.now() + 1000 * 60 * 61;

  var tokenObject = {
      'userIdentifier': userIdentifier,
      'id': tokenId,
      'expires' : expires
  };

  _data.create('tokens', tokenId, tokenObject, function(err){
    if(!err){
      callback(false, tokenObject);
    } else {
      callback(true, {'Error': 'Could not create the new token'});
    }
  });
};

// Deletes a given token from the system.
tokenHandler.deleteToken = function(tokenId, callback){
  _data.delete('tokens', tokenId, function(err){
    if(!err){
      callback(false);
    } else {
      callback(500, {'Error' : 'Could not delete the specified token'});
    }
  });
};


module.exports = tokenHandler;
