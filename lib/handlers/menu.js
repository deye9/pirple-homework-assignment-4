/*
 * Specific handler for menu actions
 * Shepherd Gwasira
 */

 // Dependencies
 var _data = require('../data');
 var tokenHelper = require('../helpers/token');

 // Define the menuHandler
 var menuHandler = {};

 // Menu
 menuHandler.menu = function(data, callback){
   var acceptableMethods = ['get'];
   if(acceptableMethods.indexOf(data.method) > -1){
     menuHandler._menu[data.method](data,callback);
   } else {
     callback(405);
   }
 }

 // Container for the menu submethod
 menuHandler._menu = {};

 // Menu - get
 // Required data on header: token, userIdentifier
 // Optional data: none
 menuHandler._menu.get = function(data, callback){
   // Get tokenId and userIdentifier from header
   var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
   var userIdentifier = typeof(data.headers.userid) == 'string' ? data.headers.userid : false;

   if(token && userIdentifier){
     tokenHelper.verifyToken(token, userIdentifier, function(tokenIsValid){
       if(tokenIsValid){
         _data.list('menuitems', function(err, fileNames){
           if(!err && fileNames && fileNames.length > 0){
             var menuItems = [];
             fileNames.forEach(function(fileName){
               _data.read('menuitems', fileName, function(err, menuItemData){
                  if(!err && menuItemData){
                    menuItems.push(menuItemData);
                    if(menuItems.length == fileNames.length){

                      menuItems.sort(function(a, b){return a.id-b.id});

                      callback(200, menuItems);
                    }
                  } else {
                      callback(500, {'Error': 'There was a error reading a single menu item.'});
                  }
               });
             });
           } else {
             callback(500, {'Error': 'There was a error reading the menu items.'});
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

 module.exports = menuHandler;
