/*
 * Specific handler for api token actions
 * Shepherd Gwasira
 */

// Dependencies
var _data = require('../data');

var tokenHandler = {};

// Not found handler
// Users
tokenHandler.token = function(data, callback){
  var acceptableMethods = ['get','put'];
  if(acceptableMethods.indexOf(data.method) > -1){
    tokenHandler._token[data.method](data,callback);
  } else {
    callback(405);
  }
}

// Container for the users submethods
tokenHandler._token = {};

// Users - put
// Required data: tokenId, extend
// Optional data: none
tokenHandler._token.put = function(data, callback){
  // Check that all required felds are filled out
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' ? data.payload.extend : false;

  if(id && extend){
      // Let's create the variable that defines our unique id for user.
      _data.read('tokens', id, function(err, data){
            if(!err){
              data.expires =  Date.now() + 1000 * 60 * 60;
                // Update the current token
                _data.update('tokens', id, data, function(err){
                    if(!err){
                      callback(200);
                    } else {
                      callback(500, {'Error' : 'There was an error updating the token with the new expire data.'});
                    }
                });
            } else {
              callback(500, {'Error' : 'There was an error while reading the token'});
            }
        });
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }

};

// Users - get
// Required data: tokenId
// Optional data: none
tokenHandler._token.get = function(data, callback){
  // Check that the id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  if(id){
      _data.read('tokens', id, function(err,data){
        if(!err && data){
          callback(200, data);
        }else{
          callback(404);
        }
      });
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
};

// Export the module
module.exports = tokenHandler;
