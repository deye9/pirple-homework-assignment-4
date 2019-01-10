/*
 * Specific handler for checkout actions
 * Shepherd Gwasira
 */

 // Dependencies
 var _data = require('../data');
 var config = require('../config');
 var tokenHelper = require('../helpers/token');
 var genericHelper = require('../helpers/generic');

 // Define the checkoutHandler
 var checkoutHandler = {};

 // Checkout
 checkoutHandler.checkout = function(data, callback){
   var acceptableMethods = ['post'];
   if(acceptableMethods.indexOf(data.method) > -1){
     checkoutHandler._checkout[data.method](data,callback);
   } else {
     callback(405);
   }
 }

 // Container for the checkout submethod
 checkoutHandler._checkout = {};

 // Checkout - post
 // Required data on header: token, userIdentifier
 // Required data on payload: token, orderId
 // Optional data: none
 checkoutHandler._checkout.post = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.payload.userId) == 'string' ? data.payload.userId : false;

   if(token && userIdentifier){
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
         // Let's get the order id that user wants to checkout
         var orderId = typeof(data.payload.orderId) == 'string' && data.payload.orderId.trim().length == 20 ? data.payload.orderId.trim() : false;
         // Let's get the stripe token from the body
         var stripeToken = typeof(data.payload.stripeToken) == 'string' && data.payload.stripeToken.trim().length > 0 ? data.payload.stripeToken : false;
         if(orderId && stripeToken){
           _data.read('orders', orderId, function(err, orderData){
              if(!err && orderData){
                if(orderData.userId == userIdentifier){
                  var stripeRequestObject = {
                      amount: (orderData.totalPrice*100),
                      currency: 'usd',
                      description: (userIdentifier+'_'+token+'_'+Date.now()),   //userData.name+'_'+Date.now(),
                      source: stripeToken
                  };
                  genericHelper.sendRequest('https', '443', 'api.stripe.com', 'POST', '/v1/charges',
                  'application/x-www-form-urlencoded', ('Bearer ' + config.stripe.secretApiKeyTest), 5, stripeRequestObject, function(err, data){
                    if(err && data){
                      //There was a problem placing the charge via stripe, let's alert the user via email the user and return server error.
                      orderData.payed = false;
                    } else {
                      //There wasn't any error and charge have been applied through stripe, now let's update the order status and send email to the user afterwards.
                      orderData.payed = true;
                    }

                    var textEmail = '';
                    if(orderData.payed){
                      textEmail = 'Dear user ('+userIdentifier+'), the order with a total amout of ' + orderData.totalPrice + ' has been placed and payed, thank you for your interest.';
                    } else {
                      textEmail = 'Dear user ('+userIdentifier+'), the order with a total amout of ' + orderData.totalPrice + ' has been placed, however the payment was not confirmed, please contact us.';
                    }

                    var emailRequestObject = {
                        'from': 'Shepherd Gwasira <info@'+config.mailgun.domain+'>',
                        'to': 'sgwasira@yahoo.com',
                        'subject': 'Order (' + orderData.id + ')',
                        'text': textEmail
                    };

                    genericHelper.sendRequest('https', '443', 'api.mailgun.net', 'POST', '/v3/sandbox8238909cf6344016bcbab728aa5e402b.mailgun.org/messages',
                    'application/x-www-form-urlencoded', ('Basic ' + Buffer.from(('api:'+ config.mailgun.ApiKeyTest)).toString('base64')), 5, emailRequestObject, function(err, data){
                      if(!err){
                        orderData.mail_sent = true;
                      } else {
                        console.log("There was an error sending the email to the user.");
                      }
                      _data.update('orders', orderId, orderData, function(err){
                        if(!err){
                          // Update succeeded
                          callback(200);
                        } else {
                          // Update failed
                          callback(500, {'Error': 'There was an error updating the user\'s order.'});
                        };
                      });
                    });
                  });
                } else {
                  callback(403, {'Error': 'The identified user is not authorized to perform this action.'});
                }
              } else {
                callback(500, {'Error': 'There was an error obtaining the data of the order.'});
              }
           });
         } else {
           callback(400, {'Error': 'Can\'t proceed the operation, there are missing fields, stripe token and/or orderId, please try again.'});
         }
       } else {
         callback(403, {'Error': 'Missing required token in header, or token is invalid. Please try to login again.'});
       }
     });
   } else {
     callback(403, {'Error': 'Missing required token or userIdentifer. Please try again.'});
   }
 };

 module.exports = checkoutHandler;
