/*
 * CLI-related tasks
 *
 */

 // Dependencies
 var readline = require('readline');
 var util = require('util');
 var debug = util.debuglog('cli');
 var events = require('events');
 class _events extends events{};
 var e = new _events();
 var os = require('os');
 var v8 = require('v8');
 var _data = require('./data');
 
 // Instantiate the cli module object
 var cli = {};

 // Input handlers
 e.on('man',function(str){
    cli.responders.help();
  });
  
  e.on('help',function(str){
    cli.responders.help();
  });

  e.on('exit',function(str){
    cli.responders.exit();
  });
 
  e.on('menu',function(str){
    cli.responders.menu();
  });

  e.on('stats',function(str){
    cli.responders.stats();
  });
 
  e.on('orders',function(str){
    cli.responders.orders();
  });
 
  e.on('more order info',function(str){
    cli.responders.moreOrderInfo(str);
  });

  e.on('users',function(str){
    cli.responders.users(str);
  });

  e.on('more user info',function(str){
    cli.responders.moreUserInfo(str);
  });

  // Responders object
  cli.responders = {};

    // Help / Man
    cli.responders.help = function(){
      // Codify the commands and their explanations
  var commands = {
    'exit' : 'Kill the CLI (and the rest of the application)',
    'man' : 'Show this help page',
    'help' : 'Alias of the "man" command',
    'stats':'Configuratoin',
    'menu' : 'Get all menu items',
    'orders' : 'Show a list of all the orders in the system for the last 24 hours',
    'More order info --{orderId}' : 'Show details of a specified order',
    'users' : 'Show a list of all the active users in the system, Users that signed up inthe the last 24 hours."',
    'More user info --{UserID}' : 'Show details of a specified user, using the UserID',
    
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for(var key in commands){
     if(commands.hasOwnProperty(key)){
        var value = commands[key];
        var line = '      \x1b[33m '+key+'      \x1b[0m';
        var padding = 60 - line.length;
        for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+=value;
        console.log(line);
        cli.verticalSpace();
     }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
    };
  
  // Create a vertical space
cli.verticalSpace = function(lines){
    lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
    for (i = 0; i < lines; i++) {
        console.log('');
    }
  };
  
  // Create a horizontal line across the screen
  cli.horizontalLine = function(){
  
    // Get the available screen size
    var width = process.stdout.columns;
  
    // Put in enough dashes to go across the screen
    var line = '';
    for (i = 0; i < width; i++) {
        line+='-';
    }
    console.log(line);
  
  
  };
  
  // Create centered text on the screen
  cli.centered = function(str){
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';
  
    // Get the available screen size
    var width = process.stdout.columns;
  
    // Calculate the left padding there should be
    var leftPadding = Math.floor((width - str.length) / 2);
  
    // Put in left padded spaces before the string itself
    var line = '';
    for (i = 0; i < leftPadding; i++) {
        line+=' ';
    }
    line+= str;
    console.log(line);
  };

    // Exit
    cli.responders.exit = function(){
        process.exit(0);
    };

    //Stats
cli.responders.stats =function(){
  // Compile an object of stats
var stats = {
  'Load Average' : os.loadavg().join(' '),
  'CPU Count' : os.cpus().length,
  'Free Memory' : os.freemem(),
  'Current Malloced Memory' : v8.getHeapStatistics().malloced_memory,
  'Peak Malloced Memory' : v8.getHeapStatistics().peak_malloced_memory,
  'Allocated Heap Used (%)' : Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
  'Available Heap Allocated (%)' : Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
  'Uptime' : os.uptime()+' Seconds'
};
  // Create a header for the stats
  cli.horizontalLine();
  cli.centered('SYSTEM STATISTICS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log out each stat
  for(var key in stats){
     if(stats.hasOwnProperty(key)){
        var value = stats[key];
        var line = '      \x1b[33m '+key+'      \x1b[0m';
        var padding = 60 - line.length;
        for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+=value;
        console.log(line);
        cli.verticalSpace();
     }
  }

  // Create a footer for the stats
  cli.verticalSpace();
  cli.horizontalLine();

};
    //Menu 
    cli.responders.menu = function(){
      _data.list('menuitems',function(err,menuitemsIds){
        if(!err && menuitemsIds && menuitemsIds.length > 0){
          cli.verticalSpace();
          menuitemsIds.forEach(function(menuitemsId){
            _data.read('menuitems',menuitemsId,function(err,menuitemsData){
              if(!err && menuitemsData){
                var line = 'Name: '+menuitemsData.displayName+', Price: '+menuitemsData.price;
                console.log(line);
                cli.verticalSpace();
              }
            });
          });
        }
      });
    };

    //Orders
    cli.responders.orders = function(){
      _data.list('orders',function(err,ordersIds){
        if(!err && ordersIds && ordersIds.length > 0){
          cli.verticalSpace();
          ordersIds.forEach(function(ordersId){
            _data.read('orders',ordersIds,function(err,orderData){
              if(!err && orderData){
                  var line = 'ORDER ID: '+orderData.id+', ITEMS :'+orderData.items+', ORDER TOTAL PRICE :'+orderData.totalPrice;
                  console.log(line);
                  cli.verticalSpace();
                
              }
            });
          });
        }
      });  
    };

     //more order info
     cli.responders.moreOrderInfo = function(str){
        // Get ID from string
        var arr = str.split('--');
        var orderId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
        if(orderId){
          // Lookup the order
          _data.read('orders',orderId,function(err,orderData){
            if(!err && orderData){
              // Print their JSON object with text highlighting
              cli.verticalSpace();
              console.dir(orderData,{'colors' : true});
              cli.verticalSpace();
            }
          });
        }
       }; 
       
    //Users
    cli.responders.users = function(){
      _data.list('tokens',function(err,tokenIds){
      if(!err && tokenIds){
          tokenIds.forEach(function(tokenId){
               _data.read('tokens',tokenId,function(err,tokenData){
                  if(!err && tokenData){
                      var currentTime=Date.now()-1000*24*60*60;
                      var validTime=tokenData.expires-currentTime>0 ? 1: 0;
                      console.log(validTime)
                      if(validTime){
                          var userId=tokenData.userIdentifier;
                           //Get the details of the users
                           _data.read('users',userId,function(err,userData){
                            if(!err && userData){       
                                var line='NAME: '+userData.name +' '+ 'EMAIL: '+userData.emailAddress+', USER ID:'+userData.id+'  '+' Cart: '+userData.shoppingcart;
                                console.log(line);
                                cli.verticalSpace();
                           }
                        });
                     }
                   }
               });
            });
          }
      });
    };

    //more user info
    cli.responders.moreUserInfo = function(str){
                // Get ID from string
                var arr = str.split('--');
                var userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
                if(userId){
                  // Lookup the user
                  _data.read('users',userId,function(err,userData){
                    if(!err && userData){
                      // Remove the hashed password
                      delete userData.hashedPassword;

                      // Print their JSON object with text highlighting
                      cli.verticalSpace();
                      console.dir(userData,{'colors' : true});
                      cli.verticalSpace();
                    }
                  });
                }  
       }; 

 // Input processor
 cli.processInput = function(str){
   str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
   // Only process the input if the user actually wrote something, otherwise ignore it
   if(str){
     // Codify the unique strings that identify the different unique questions allowed be the asked
     var uniqueInputs = [
       'man',
       'help',
       'exit',
       'stats',
       'menu',
       'orders',
       'more order info',
       'users',
       'more user info'
     ];
 
     // Go through the possible inputs, emit event when a match is found
     var matchFound = false;
     var counter = 0;
     uniqueInputs.some(function(input){
       if(str.toLowerCase().indexOf(input) > -1){
         matchFound = true;
         // Emit event matching the unique input, and include the full string given
         e.emit(input,str);
         return true;
       }
     });
 
     // If no match is found, tell the user to try again
     if(!matchFound){
       console.log("Sorry, try again");
     }
 
   }
 };
 
 // Init script
cli.init = function(){

  // Send to console, in dark blue
  console.log('\x1b[34m%s\x1b[0m','The CLI is running');

  // Start the interface
  var _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input separately
  _interface.on('line', function(str){

    // Send to the input processor
    cli.processInput(str);

    // Re-initialize the prompt afterwards
    _interface.prompt();
  });

  // If the user stops the CLI, kill the associated process
  _interface.on('close', function(){
    process.exit(0);
  });

};
  // Export the module
  module.exports = cli;