/*
 * Generic handler
 * Shepherd Gwasira
 */

var handlers = {};

// Not found handler
handlers.notFound = function(data, callback){
  callback(404);
};

// Export the module
module.exports = handlers;
