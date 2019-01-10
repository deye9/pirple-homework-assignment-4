/*
 * Specific handler for order actions
 * Shepherd Gwasira
 */

 // Dependencies
 var _data = require('../data');
 var config = require('../config');
 var tokenHelper = require('../helpers/token');
 var genericHelper = require('../helpers/generic');

 // Define the orderHandler
 var orderHandler = {};

 // Order
 orderHandler.order = function(data, callback){
   var acceptableMethods = ['post', 'get'];
   if(acceptableMethods.indexOf(data.method) > -1){
     orderHandler._order[data.method](data,callback);
   } else {
     callback(405);
   }
 }

 // Container for the order submethods
 orderHandler._order = {};

 // Order - get
 // Required data on header: token, userIdentifier
 // Required data on querystring: orderId
 // Optional data: none
 orderHandler._order.get = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.headers.userid) == 'string' ? data.headers.userid : false;

   if(token && userIdentifier){
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
         // Check that the order id is valid
         var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
         if(id){
           //Lookup the order
           _data.read('orders', id, function(err,data){
             if(!err && data){
               callback(200, data);
             }else{
               callback(404);
             }
           });
         } else {
           callback(400, {'Error': 'Missing required id field'})
         }
       } else {
         callback(403, {'Error': 'Missing required token in header, or token is invalid. Please try to login again.'});
       }
     });
   } else {
     callback(403, {'Error': 'Missing required token in header or userIdentifer. Please try again.'});
   }
 };


 // Order - post
 // Required data on header: token, userIdentifier
 // Required data on payload: none
 // Optional data: none
 orderHandler._order.post = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.payload.userid) == 'string' ? data.payload.userid : false;

   if(token && userIdentifier){
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
           _data.read('users', userIdentifier, function(err, userData){

             if(!err && userData && userData.shoppingcart.length > 0){
               // Let's save the current items in the shopping cart on a new variable to be added later on the order object itself.
               var orderItems = userData.shoppingcart;
               orderHandler.calculateOrderTotalAmount(orderItems, function(err, totalPrice){
                 if(!err && totalPrice){
                   var orderId = genericHelper.createRandomString(20);
                   var orderObject = {
                    'id': orderId,
                    'userId': userIdentifier,
                    'payed': false,
                    'mail_sent': false,
                    'totalPrice': totalPrice,
                    'items': orderItems
                   };
                   _data.create('orders', orderId, orderObject, function(err){
                      if(!err){
                        // Since order was placed let's clear the user shoppingcart
                        userData.shoppingcart = [];
                        userData.orders = userData.orders && userData.orders instanceof Array && userData.orders.length > 0 ? userData.orders : [];
                        userData.orders.push(orderId);
                        _data.update('users', userIdentifier, userData, function(err){
                          if(!err)
                          {
                            callback(200, {'id': orderId});
                          } else{
                            callback(500, {'Error': 'There was an error updating the user\'s shopping cart.'});
                          }
                        });

                      } else {
                        callback(500, {'Error': 'There was a problem creating an order in the system'});
                      }
                   });
                } else {
                  callback(500, {'Error': 'There was a problem calculating the order total price.'});
                }
               });
             } else {
                callback(400, {'Error': 'In order to make an order you need to add items on the shopping cart.'});
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


 orderHandler.calculateOrderTotalAmount = function(shoppingcart, callback){
   const promiseOfPrices = Promise.all(
      shoppingcart.map(
          itemName => new Promise((resolve, reject) => {
            _data.read('menuitems', itemName, (err, itemData) => {
                if(err)
                  reject(err);
                else
                  resolve(itemData.price);
            });
          })
        )
   );

   const promiseOfTotal = promiseOfPrices.then(
      arrayOfCartItemPrices => arrayOfCartItemPrices.reduce(
          (sum, itemPrice) => sum + itemPrice,
          0
      )
   );

   promiseOfTotal.then(
     result => callback(false, result),
     error => callback(error, null)
   );
}

module.exports = orderHandler;
