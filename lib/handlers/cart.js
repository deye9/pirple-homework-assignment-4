/*
 * Specific handler for shopping cart actions
 * Shepherd Gwasira
 */

 // Dependencies
 var orderHandler = require('./order');
 var _data = require('../data');
 var tokenHelper = require('../helpers/token');

 // Define the menuHandler
 var cartHandler = {};

 // Cart
 cartHandler.cart = function(data, callback){
   var acceptableMethods = ['get','put','delete'];
   if(acceptableMethods.indexOf(data.method) > -1){
     cartHandler._cart[data.method](data,callback);
   } else {
     callback(405);
   }
 }

 // Container for the cart submethod
 cartHandler._cart = {};

 // Cart - get
 // Required data on header: token, userIdentifier
 // Optional data: none
 cartHandler._cart.get = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.headers.userid) == 'string' ? data.headers.userid : false;

   if(token && userIdentifier){
     // Verify that the token is valid for the given user
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
           _data.read('users', userIdentifier, function(err, data){
             if(!err && data){
                var currentCart = typeof(data.shoppingcart) == 'object' && data.shoppingcart.length > 0 ? data.shoppingcart : [];
                callback(200, currentCart);
             } else {
               callback(500, {'Error': 'There was an error getting the shopping cart of the user'});
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

 // Cart - put
 // Required data on header: token, userIdentifier
 // Optional data: none
 cartHandler._cart.put = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.payload.userid) == 'string' ? data.payload.userid : false;

   if(token && userIdentifier){
     // Verify that the token is valid for the given user
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
         _data.list('menuitems', function(err, fileNames){
           if(!err && fileNames && fileNames.length > 0){
             var menuItemNameToAdd = typeof(data.payload.item) == 'string' && data.payload.item.trim().length > 0 && fileNames.indexOf(data.payload.item.trim()) > -1 ? data.payload.item.trim() : false;

             if(menuItemNameToAdd){
               // Lookup the user
               _data.read('users', userIdentifier, function(err, userData){
                 if(!err && userData){
                   // Update the fields necessary
                   if(userData.shoppingcart){
                     userData.shoppingcart.push(menuItemNameToAdd);
                   } else{
                     userData.shoppingcart = [];
                     userData.shoppingcart.push(menuItemNameToAdd);
                   }
                   // Store the new updates
                   _data.update('users', userIdentifier, userData, function(err){
                     if(!err){
                       callback(200, userData);
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
               callback(400, {'Error': 'There was an error adding the desired item to the shopping cart, please make sure it\'s a valid item.'});
             }
           } else {
             callback(500, {'Error': 'There was an error obtaining the current list of menu items'});
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

 // Cart - delete
 // Required data: token, userIdentifier
 // Optional data: none
 cartHandler._cart.delete = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.payload.userid) == 'string' ? data.payload.userid : false;

   if(token && userIdentifier){
     // Verify that the token is valid for the given user
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
         _data.list('menuitems', function(err, fileNames){
           if(!err && fileNames && fileNames.length > 0){
             var menuItemNameToRemove = typeof(data.queryStringObject.item) == 'string' && data.queryStringObject.item.trim().length > 0 && fileNames.indexOf(data.queryStringObject.item.trim()) > -1 ? data.queryStringObject.item.trim() : false;
             if(menuItemNameToRemove){
               // Lookup the user
               _data.read('users', userIdentifier, function(err, userData){
                 if(!err && userData){
                   // Update the fields necessary
                   if(userData.shoppingcart && userData.shoppingcart.length > 0){
                     var indexOfItemToRemove = userData.shoppingcart.indexOf(menuItemNameToRemove);
                     if(indexOfItemToRemove > -1){
                       userData.shoppingcart.splice(indexOfItemToRemove, 1);
                       // Store the new updates
                       _data.update('users', userIdentifier, userData, function(err){
                         if(!err){
                           callback(200, userData);
                         } else {
                           console.log(err);
                           callback(500, {'Error' : 'Could not update the user'});
                         }
                       });
                     } else {
                       callback(400, {'Error' : 'The selected pizza to be removed does not exist in the shopping cart.'});
                     }
                   } else {
                     callback(400, {'Error' : 'There isn\'t any pizza in the shopping cart to be removed.'});
                   }

                 } else {
                   callback(400, {'Error': 'The specified user does not exist'});
                 }
               });
             } else {
               callback(400, {'Error': 'There was an error removing the desired item to the shopping cart, please make sure it\'s a valid item.'});
             }
           } else {
             callback(500, {'Error': 'There was an error obtaining the current list of menu items'});
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

 // Cart Total
 cartHandler.cartTotal = function(data, callback){
   var acceptableMethods = ['get'];
   if(acceptableMethods.indexOf(data.method) > -1){
     cartHandler._cartTotal[data.method](data,callback);
   } else {
     callback(405);
   }
 }

 // Container for the cart total submethod
 cartHandler._cartTotal = {};

 // Cart - get
 // Required data on header: token, userIdentifier
 // Optional data: none
 cartHandler._cartTotal.get = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.headers.userid) == 'string' ? data.headers.userid : false;

   if(token && userIdentifier){
     // Verify that the token is valid for the given user
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
         _data.read('users', userIdentifier, function(err, userData){
           if(!err && userData && userData.shoppingcart.length > 0){

             var orderItems = userData.shoppingcart;
             orderHandler.calculateOrderTotalAmount(orderItems, function(err, totalPrice){
               callback(200, {'total': totalPrice});
             });
          } else {
            callback(500, {'Error': 'There was an error getting the total price of the current shopping cart of the user'});
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

 module.exports = cartHandler;
