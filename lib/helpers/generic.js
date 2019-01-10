/*
 * Helpers for various tasks
 *
 */

 // Dependencies
 var crypto = require('crypto');
 var config = require('../config');
 var https = require('https');
 var http = require('http');
 var querystring = require('querystring');
 var path = require('path');
 var fs = require('fs');
 // Container for all the Helpers
 var helpers = {};

 // Create a SHA256 hash
 helpers.hash = function(str){
   if(typeof(str) == 'string' && str.length > 0){
     var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
     return hash;
   } else {
     return false;
   }
 };

 // Parse a JSON string to an object in all cases, without throwing
 helpers.parseJsonToObject = function(str){

   try{
      var obj = JSON.parse(str);
      return obj;
   }catch(e){
     return {};
   }
 };

 // Create a string of random alphanumeric characters, of a given length
 helpers.createRandomString = function(strLength){
   strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
   if(strLength){
     // Define all the possible characters that could go into a string
     var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

     // Start the final string
     var str = '';
     for(i = 1; i <= strLength; i++){
       // Get a random character from the possibleCharacters string
       var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

       // Append this character to the final string
       str += randomCharacter;
     }

     // Return the final string
     return str;

   } else {
     return false;
   }
 };

 // Send an SMS message via Twilio
 helpers.sendTwilioSms = function(phone, msg, callback){
   // Validate parameters
   phone = typeof(phone) == 'string' && phone.trim().length == 9 ? phone.trim() : false;
   msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim().length : false;

   if(phone && msg){
     // Configure the request payload
     var payload = {
       'From': config.twilio.fromPhone,
       'To': '+27' + phone,
       'Body': msg
     };

     // Stringify the payload
     var stringPayload = querystring.stringify(payload);

     // Configure the request details
     var requestDetails = {
       'protocol': 'https:',
       'hostname': 'api.twilio.com',
       'method': 'POST',
       'path': '/2010-04-01/Accounts/' + config.twilio.accountSid+'/Messages.json',
       'auth': config.twilio.accountSid+':'+config.twilio.authToken,
       'headers': {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': Buffer.byteLength(stringPayload)
       }
     };

     // Instantiate the request object
     var req = https.request(requestDetails, function(res){
        // Grab the status of the sent request
        var status = res.statusCode;

        // Callback successfully if the request went through
        if(status == 200 || status == 201){
          callback(false);
        } else {
          callback('Status code returned was ' + status);
        }
     });

     // Bind to the error event so it doesn't get thrown
     req.on('error', function(e){
       callback(e);
     });

     // Add the payload
     req.write(stringPayload);

     // End the request
     req.end();

   } else {
     callback('Given parameters were missing or invalid');
   }
 };

 helpers.sendRequest = function(protocol, port, hostname, method, path, contentType, auth, timeoutSeconds, postData, callback){
   var stringPayload = querystring.stringify(postData);

   // Construct the request
   var requestDetails = {
     'hostname' : hostname,
     'port': port,
     'method' : method,
     'timeout' : timeoutSeconds * 1000,
     'path' : path
   };

   // Instantiate the request object (using either the http or https module)
   var _moduleToUse = protocol == 'http' ? http : https;
   var req = _moduleToUse.request(requestDetails, function(res){
     res.on('data', (d) => {
       if(res.statusCode == 200){
        callback(false);
       }else{
         console.log(res.statusCode);
         callback(true);
       }
     });
   });

   req.setHeader('Authorization', auth);
   req.setHeader('Content-Type', contentType);
   req.setHeader('Content-Length', Buffer.byteLength(stringPayload));

   // Add the payload
   req.write(stringPayload);

   // Bind to the error event so it doesn't get thrown
   req.on('error',function(e){
     console.log(e);
     callback(true, {'Error': e});
   });

   // Bind to the timeout event
   req.on('timeout',function(){
     console.log('timeout');
     callback(true, {'Error': 'The request took much time and got timeout.'})
   });

   // End the request
   req.end();
 };

 // Get the string content of a template
  helpers.getTemplate = function(templateName, data, callback){
    if(templateName){
      templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
      data = typeof(data) == 'object' && data != null ? data : {};
      var templatesDir = path.join(__dirname, '../../templates/');
      fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err, str){
        if(!err && str && str.length > 0){
          // Do the interpolation on the string
          var finalString = helpers.interpolate(str, data);

          callback(false, finalString);
        } else {
          callback('No template could be found');
        }
      });
    } else {
      callback('A valid template name was not specified');
    }
  };

  // Add the universal header and footer to a string, and pass provided data object to the header and footer for interpolation
  helpers.addUniversalTemplates = function(str, data, callback){
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data != null ? data : {};

    // Get the header
    helpers.getTemplate('_header', data, function(err, headerString){
      if(!err && headerString){
        // Get the footer
        helpers.getTemplate('_footer', data, function(err, footerString){
          if(!err && footerString){
            var fullString = headerString + str + footerString;
            callback(false, fullString);
          } else {
            callback('Could not find the footer template');
          }
        });
      } else {
        callback('Could not find the header template');
      }
    });

    // Get the footer


  };

  // Take a given string and a data object and find/replace all the keys within in
  helpers.interpolate = function(str, data){
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data != null ? data : {};

    // Add the templateGlobals to the data object, prepending their key name with "global"
    for(var keyName in config.templateGlobals){
      if(config.templateGlobals.hasOwnProperty(keyName)){
        data['global.'+keyName] = config.templateGlobals[keyName];
      }
    }

    // For each key in the data object, insert its value into the string at the corresponding placeholder
    for(var key in data){
      if(data.hasOwnProperty(key) && typeof(data[key]) == 'string'){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find, replace);
      }
    }

    return str;
  };

  // Get the contents of a static (public) asset
  helpers.getStaticAsset = function(fileName, callback){
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if(fileName){
      var publicDir = path.join(__dirname, '../../public/');
      fs.readFile(publicDir+fileName, function(err, data){
        if(!err, data){
          callback(false, data);
        } else {
          callback('No file could be found');
        }
      })
    } else {
      callback('A valid file name was not specified');
    }
  };

 // Export the module
 module.exports = helpers;
