/*
 * Specific handler for menu actions
 * Shepherd Gwasira
 */

 // Dependencies
 var _data = require('../data');
 var tokenHelper = require('../helpers/token');

 // Define the menuHandler
 var itemHandler = {};

 // Menu
 itemHandler.item = function(data, callback){
   var acceptableMethods = ['get'];
   if(acceptableMethods.indexOf(data.method) > -1){
     itemHandler._item[data.method](data,callback);
   } else {
     callback(405);
   }
 }

 // Container for the menu submethod
 itemHandler._item = {};

 // Menu - get
 // Required data on header: token, userIdentifier
 // Optional data: none
 itemHandler._item.get = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.headers.userid) == 'string' ? data.headers.userid : false;

   var name = typeof(data.queryStringObject.name) == 'string' && data.queryStringObject.name.trim().length > 0 ? data.queryStringObject.name.trim() : false;

   if(token && userIdentifier && name){
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
           _data.read('menuitems', name, function(err, menuItemData){
              if(!err && menuItemData){
                  callback(200, menuItemData);
              } else {
                  callback(500, {'Error': 'There was a error reading a single menu item.'});
              }
           });
       } else {
         callback(403, {'Error': 'Missing required token in header, or token is invalid. Please try to login again.'});
       }
     });
   } else {
     callback(403, {'Error': 'Missing required token in header or userIdentifer. Please try again.'});
   }
 };

 module.exports = itemHandler;
