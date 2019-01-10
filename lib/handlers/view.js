/*
 * View handler
 * Shepherd Gwasira
 */
var genericHelper = require('../helpers/generic');
var _data = require('../data');
var config = require('../config');
var tokenHelper = require('../helpers/token');

var viewHandler = {};

// Public assets
viewHandler.public = function(data, callback){
 // Reject any request that isn't a GET
 if(data.method == 'get'){
   // Get the filename being requested
   var trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
   if(trimmedAssetName.length > 0)
   {
     // Read in the asset's data
     genericHelper.getStaticAsset(trimmedAssetName, function(err, data){
       if(!err && data){
         // Determine the content type (default to plain text)
         var contentType = 'plain';

         if(trimmedAssetName.indexOf('.css') > -1){
          contentType = 'css';
         }

         if(trimmedAssetName.indexOf('.png') > -1){
          contentType = 'png';
         }

         if(trimmedAssetName.indexOf('.jpg') > -1){
          contentType = 'jpg';
         }

         if(trimmedAssetName.indexOf('.ico') > -1){
          contentType = 'favicon';
         }

         callback(200, data, contentType);

       } else {
         callback(404);
       }
     });
   } else{
     callback(404);
   }
 } else {
   callback(405);
 }
};

 // Index handler
 viewHandler.index = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Pizza - Made Simple',
       'head.description':'When the very first Pizza Perfect base was tossed into the air, pizza had been already around for a very long time. ',
       'body.class': 'index'
     };

     // Read in a template as a string
     genericHelper.getTemplate('index', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 }

 // Checkout Success handler
 viewHandler.checkoutSuccess = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Payment page',
       'head.description':'Payment succeeded, When the very first Pizza Perfect base was tossed into the air, pizza had been already around for a very long time. ',
       'body.class': 'checkoutSuccess'
     };

     // Read in a template as a string
     genericHelper.getTemplate('checkoutSuccess', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 }

 // Checkout Success handler
 viewHandler.checkoutError = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Payment page',
       'head.description':'Payment error,When the very first Pizza Perfect base was tossed into the air, pizza had been already around for a very long time.',
       'body.class': 'checkoutError'
     };

     // Read in a template as a string
     genericHelper.getTemplate('checkoutError', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 }

 // Favicon
 viewHandler.favicon = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Read in the favicon's data
     genericHelper.getStaticAsset('favicon.ico' , function(err, data){
       if(!err && data){
         // Callback the data
         callback(200, data, 'favicon');
       } else {
         callback(500);
       }
     });
   } else {
     callback(405);
   }
 }

 // Create account
 viewHandler.accountCreate = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Create an Account',
       'head.description':'Signup is easy and only takes a few seconds. Pizza',
       'body.class': 'accountCreate'
     };

     // Read in a template as a string
     genericHelper.getTemplate('accountCreate', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Create New Session
 viewHandler.sessionCreate = function(data, callback){
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Login to your Account',
       'head.description':'Please enter your phone number and password to access your account.',
       'body.class': 'sessionCreate'
     };

     // Read in a template as a string
     genericHelper.getTemplate('sessionCreate', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Session has been deleted
 viewHandler.sessionDeleted = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Logged Out',
       'head.description':'You have been logged out of your account.',
       'body.class': 'sessionDeleted'
     };

     // Read in a template as a string
     genericHelper.getTemplate('sessionDeleted', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Edit your account
 viewHandler.accountEdit = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Account Settings',
       'body.class': 'accountEdit'
     };

     // Read in a template as a string
     genericHelper.getTemplate('accountEdit', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Account has been deleted
 viewHandler.accountDeleted = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Account Deleted',
       'head.description': 'Your account has been deleted: Pizza',
       'body.class': 'accountDeleted'
     };

     // Read in a template as a string
     genericHelper.getTemplate('accountDeleted', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Menu with available pizza to choose
 viewHandler.menuList = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){

     // First let's get all the menu item'ss names
     _data.list('menuitems', function(err, fileNames){
       if(!err && fileNames && fileNames.length > 0){

         // Now let's wait to have all the menu item data making a promise
         const menuList = Promise.all(fileNames.map(
            _fileName => new Promise(function(resolve, reject){
              _data.read('menuitems', _fileName , function(err, data){
                if(!err && data){
                  resolve(data);
                } else {
                  reject(err);
                }
              });
            })
         ));

         // Now that we have all the single item menu data let's do the interpolation, using a promise because reading the templates is async
         menuList.then(function(menuItemsArray){
           const menuItemsArrayPromise = Promise.all(menuItemsArray.map(
              _menuItemData => new Promise(function(resolve, reject){

                var itemTemplateData = {
                  'menuItem.displayName': _menuItemData.displayName,
                  'menuItem.description': _menuItemData.description,
                  'menuItem.price': _menuItemData.price.toString(),
                  'menuItem.name': _menuItemData.name,
                  'menuItem.imageSrc': _menuItemData.imageSrc,
                  'formid': ('cart_'+_menuItemData.name)
                };

                // Lets get the single item menu template and apply the required changes for interpolation
                genericHelper.getTemplate('menuItem', itemTemplateData, function(err, str){
                  if(!err && str){
                      resolve(str);
                  } else {
                      reject(err);
                  }
                });

              })
            ));

           // Now we apply the required logic using all the templates for all the menu items to present a good page
           menuItemsArrayPromise.then(function(menuItemArrayString){

             var str = "";
             var itemsCloseDivOnTwo = 0;
             var numItems = 0;
             for(var i = 0; i < menuItemArrayString.length; i++){
               if(numItems % 3 == 0){
                 str = str + "<div class='row'>";
               }

               str = str + menuItemArrayString[i];

               if(itemsCloseDivOnTwo == 2){
                 str = str + "</div>";
                 itemsCloseDivOnTwo = 0;
               } else {
                 itemsCloseDivOnTwo++;
               }

               numItems++;
             }

             // Prepare data for interpolation for the final html to send to user
             genericHelper.getTemplate('menuList', {'menulist.items': str}, function(err, str){
               if(!err && str){
                 var templateDataMenu = {
                   'head.title': 'Menu Choice',
                   'head.description': 'Choose Pizza from the menu available',
                   'body.class': 'menuList',
                   'shoppingcart.amount': "0"
                 };

                 genericHelper.addUniversalTemplates(str, templateDataMenu, function(err, str){
                   if(!err && str){
                     callback(200, str, 'html');
                   } else {
                     callback(500, undefined, 'html');
                   }
                 });

               } else {
                 callback(500, undefined, 'html');
               }
             });


           });
           menuItemsArrayPromise.catch(function(err){
             callback(500, undefined, 'html');
           });
         });
         menuList.catch(function(error){
           callback(500, undefined, 'html');
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Edit your current shopping cart
 viewHandler.cartEdit = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Edit Cart',
       'head.description': 'Edit your shopping cart',
       'body.class': 'cartEdit'
     };

     // Read in a template as a string
     genericHelper.getTemplate('cartEdit', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Edit your current shopping cart
 viewHandler.ordersList = function(data, callback){
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title': 'Orders List',
       'head.description': 'Your current pizza orders',
       'body.class': 'ordersList'
     };

     // Read in a template as a string
     genericHelper.getTemplate('ordersList', templateData, function(err, str){
       if(!err && str){
         // Add the universal header and footer
         genericHelper.addUniversalTemplates(str, templateData, function(err, str){
           if(!err && str){
             callback(200, str, 'html');
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Edit your current shopping cart
 viewHandler.cartDelete = function(data, callback){
   var item = typeof(data.queryStringObject.item) == 'string' && data.queryStringObject.item.trim().length > 0 ? data.queryStringObject.item.trim() : false;
   // Reject any request that isn't a GET and make sure item was passed on QueryString
   if(data.method == 'get' && item){

     _data.read('menuitems', item, function(err, data){
       if(!err && data){
         // Prepare data for interpolation
         var templateData = {
           'head.title': 'Cart Delete',
           'head.description': 'Delete pizza from your shopping cart',
           'body.class': 'cartDelete',
           'displayName': data.displayName,
           'name': data.name,
           'price': data.price.toString()
         };

         // Read in a template as a string
         genericHelper.getTemplate('cartDelete', templateData, function(err, str){
           if(!err && str){
             // Add the universal header and footer
             genericHelper.addUniversalTemplates(str, templateData, function(err, str){
               if(!err && str){
                 callback(200, str, 'html');
               } else {
                 callback(500, undefined, 'html');
               }
             });
           } else {
             callback(500, undefined, 'html');
           }
         });
       } else {
         callback(500, undefined, 'html');
       }
     });
   } else {
     callback(405, undefined, 'html');
   }
 };

 // Edit your current shopping cart
 viewHandler.checkout = function(data, callback){
   var userId = typeof(data.queryStringObject.userId) == 'string' && data.queryStringObject.userId.trim().length > 0 ? data.queryStringObject.userId.trim() : false;
   var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length > 0 ? data.queryStringObject.orderId.trim() : false;
   var tokenId = typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length > 0 ? data.queryStringObject.tokenId.trim() : false;

   tokenHelper.verifyToken(tokenId, userId, function(tokenIsValid){
     if(tokenIsValid){
       if(data.method == 'get' && userId && orderId && tokenId){

         _data.read('orders', orderId, function(err, data){

           var amountToCharge = data.totalPrice * 100;

           // Prepare data for interpolation
           var templateData = {
             'head.title': 'Checkout',
             'head.description': 'Checkout your current order',
             'body.class': 'checkout',
             'data_key': config.stripe.public_key,
             'data_amount': amountToCharge.toString(),
             'order': 'Order ('+data.id+')',
             'name': 'Pizza',
             'orderId': data.id,
             'userId': userId,
             'tokenId': tokenId
           };
           // Read in a template as a string
           genericHelper.getTemplate('checkout', templateData, function(err, str){
             if(!err && str){
               // Add the universal header and footer
               genericHelper.addUniversalTemplates(str, templateData, function(err, str){
                 if(!err && str){
                   callback(200, str, 'html');
                 } else {
                   callback(500, undefined, 'html');
                 }
               });
             } else {
               callback(500, undefined, 'html');
             }
           });
         });
       } else {
         callback(405, undefined, 'html');
       }
     } else {
       callback(403, undefined, 'html');
     }
   });
 };

// Export the module
module.exports = viewHandler;
