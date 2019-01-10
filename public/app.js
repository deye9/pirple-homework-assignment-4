/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  'sessionToken' : false,
  'cartAmountItems': 0
};

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(headers,path,method,queryStringObject,payload,callback){

  // Set defaults
  headers = typeof(headers) == 'object' && headers !== null ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !== null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;


  // For each query string parameter sent, add it to the path
  var requestUrl = path+'?';
  var counter = 0;
  for(var queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++;
       // If at least one query string parameter has already been added, preprend new ones with an ampersand
       if(counter > 1){
         requestUrl+='&';
       }
       // Add the key and value
       requestUrl+=queryKey+'='+queryStringObject[queryKey];
     }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for(var headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey]);
     }
  }

  // If there is a current session token set, add that as a header
  if(app.config.sessionToken){
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;

        // Callback if requested
        if(callback){
          try{
            var parsedResponse = JSON.parse(responseReturned);
            callback(statusCode,parsedResponse);
          } catch(e){
            callback(statusCode,false, false);
          }

        }
      }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

// Bind the logout button
app.bindLogoutButton = function(){
  document.getElementById("logoutButton").addEventListener("click", function(e){

    // Stop it from redirecting anywhere
    e.preventDefault();

    // Log the user out
    app.logUserOut();
  });
};

// Log the user out then redirect them
app.logUserOut = function(redirectUser){

  // Set redirectUser to default to true
  redirectUser = typeof(redirectUser) == 'boolean' ? redirectUser : true;

  // Get the current token id
  var tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    'id' : tokenId
  };
  app.client.request(undefined,'api/logout','DELETE',queryStringObject,undefined,function(statusCode,responsePayload){
    // Set the app.config token as false
    app.setSessionToken(false);

    // Send the user to the logged out page
    if(redirectUser){
      window.location = '/session/deleted';
    }

  });
};

// Bind the forms
app.bindForms = function(){
  if(document.querySelector("form")){
    var allForms = document.querySelectorAll("form");

    for(var i = 0; i < allForms.length; i++){
        allForms[i].addEventListener("submit", function(e){

        // Stop it from submitting
        e.preventDefault();

        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#"+formId+" .formError").style.display = 'none';

        // Hide the success message (if it's currently shown due to a previous error)
        if(document.querySelector("#"+formId+" .formSuccess")){
          document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
        }


        // Turn the inputs into a payload
        var payload = {};
        var elements = this.elements;
        for(var i = 0; i < elements.length; i++){
          if(elements[i].type !== 'submit'){
            // Determine class of element and set value accordingly
            var classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
            var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
            var elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            var nameOfElement = elements[i].name;
            if(nameOfElement == '_method'){
              method = valueOfElement;
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if(nameOfElement == 'httpmethod'){
                nameOfElement = 'method';
              }
              // Create an payload field named "id" if the elements name is actually uid
              if(nameOfElement == 'uid'){
                nameOfElement = 'id';
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if(classOfElement.indexOf('multiselect') > -1){
                if(elementIsChecked){
                  payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }

            }
          }
        }

        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == 'DELETE' ? payload : {};

        // Call the API
        app.client.request(undefined,path,method,queryStringObject,payload,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode !== 200){
            if(statusCode == 403 && (path.indexOf('api/login') < 0 )){
              // log the user out
              app.logUserOut();

            } else {

              // Try to get the error from the api, or set a default error message
              var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

              // Set the formError field with the error text
              document.querySelector("#"+formId+" .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId,payload,responsePayload);
          }

        });
      });
    }
  }
};

// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
  var functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if(formId == 'accountCreate'){
    // Take the phone and password, and use it to log the user in
    var newPayload = {
      'emailAddress' : requestPayload.emailAddress,
      'password' : requestPayload.password
    };

    app.client.request(undefined,'api/login','POST',undefined,newPayload,function(newStatusCode,newResponsePayload){
      // Display an error on the form if needed
      if(newStatusCode !== 200){

        // Set the formError field with the error text
        document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        // Show (unhide) the form error field on the form
        document.querySelector("#"+formId+" .formError").style.display = 'block';

      } else {
        // If successful, set the token and redirect the user
        app.setSessionToken(newResponsePayload);

        // REDIRECT AFTER LOGIN
        window.location = '/menu';
      }
    });
  }
  // If login was successful, set the token in localstorage and redirect the user
  if(formId == 'sessionCreate'){
    app.setSessionToken(responsePayload);
    window.location = '/menu';
  }

  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','checksEdit1'];
  if(formsWithSuccessMessages.indexOf(formId) > -1){
    document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if(formId == 'accountEdit3'){
    app.logUserOut(false);
    window.location = '/account/deleted';
  }

  // If the user just checkout successfully, redirect back to the frontpage
  if(formId == 'checkoutStripe'){
    window.location = '/';
  }

  // // If the user just deleted a check, redirect them to the dashboard
  // if(formId == 'checksEdit2'){
  //   window.location = '/checks/all';
  // }

  if(formId.indexOf('cart_') > -1 ){

    var amountOfItems = responsePayload && responsePayload.shoppingcart instanceof Array && responsePayload.shoppingcart.length > -1 ? responsePayload.shoppingcart.length : 0;
    if(amountOfItems > -1){
      app.config.cartAmountItems = amountOfItems;
      app.updateShoppingCartAmount();
    }

    var userId = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
    if(userId){
      var headers = {
        'userid' : userId
      };
    }
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if(formId == 'cartDelete'){
    window.location = '/cart';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if(formId == 'cartOrder'){

    var tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;
    var userIdentifier = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
    var orderId = responsePayload.id

    if(tokenId && userIdentifier && orderId){
      window.location = '/checkout?userId=' + userIdentifier + '&orderId=' + orderId + '&tokenId=' + tokenId;
    } else {
      app.logUserOut();
    }
  }
};

// Function used to update the shopping cart amount of items based on the one configured at config
app.updateShoppingCartAmount = function(){
  document.querySelector("#shoppingCartAmount").innerHTML = app.config.cartAmountItems;
}

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function(){
  var tokenString = localStorage.getItem('token');
  if(typeof(tokenString) == 'string'){
    try{
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    }catch(e){
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token',tokenString);
  if(typeof(token) == 'object'){
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Renew the token
app.renewToken = function(callback){
  var currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
  if(currentToken){
    // Update the token with a new expiration
    var payload = {
      'id' : currentToken.id,
      'extend' : true,
    };
    app.client.request(undefined,'api/token','PUT',undefined,payload,function(statusCode,responsePayload){
      // Display an error on the form if needed
      if(statusCode == 200){
        // Get the new token details
        var queryStringObject = {'id' : currentToken.id};
        app.client.request(undefined,'api/token','GET',queryStringObject,undefined,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Load data on the page
app.loadDataOnPage = function(){
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for account settings page
  if(primaryClass == 'accountEdit'){
    app.loadAccountEditPage();
  }

  // Logic for shopping cart page
  if(primaryClass == 'cartEdit'){
    app.loadCartEditPage();
  }

  // Logic for shopping cart page
  if(primaryClass == 'cartDelete'){
    app.loadCartDeletePage();
  }

  // Logic for menu page
  if(primaryClass == 'menuList'){
    app.loadMenuPage();
  }

  if(primaryClass == 'ordersList'){
    app.loadOrdersListPage();
  }

  if(primaryClass == 'checkoutError' || primaryClass == 'checkoutSuccess'){
    setTimeout(function(){
      window.location = '/';
    }, 5000);
  }
};

// Load the shopping cart edit page specifically
app.loadCartEditPage = function(){

  var userId = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
  if(userId){

    var headers = {
      'userid' : userId
    };

    app.client.request(headers,'api/cart','GET',undefined,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
        var shoppingCartItems =  responsePayload instanceof Array && responsePayload.length > 0 ? responsePayload : [];
        if(shoppingCartItems.length > 0){
          // Show each shopping cart item as a new row in the table
          shoppingCartItems.forEach(function(shoppingCartItemName){
            // Get the data for the menu item
            var newQueryStringObject = {
              'name' : shoppingCartItemName
            };

            app.client.request(headers,'api/item','GET',newQueryStringObject,undefined,function(statusCode,responsePayload){
              if(statusCode == 200){
                // Make the item data into a table row
                var table = document.getElementById("itemsListTable");
                var tr = table.insertRow(-1);
                var td0 = tr.insertCell(0);
                var td1 = tr.insertCell(1);
                var td2 = tr.insertCell(2);
                var td3 = tr.insertCell(3);
                td0.innerHTML = responsePayload.displayName;
                td1.innerHTML = responsePayload.price;
                td2.innerHTML = responsePayload.description;
                td3.innerHTML = '<a href="/cart/delete?item='+responsePayload.name+'">Delete</a>';
              } else {
                console.log("Error trying to load item name: ", shoppingCartItemName);
              }
            });
          });

          app.client.request(headers,'api/cart/total','GET',undefined,undefined,function(statusCode, responsePayload){
            if(statusCode == 200){

              // Make the check data into a table row
              var totalShoppingCart = document.getElementById("shoppingCartTotal");
              totalShoppingCart.innerHTML = "Total Amount: " + responsePayload.total.toFixed(2).toString();
              document.getElementById("totalAmountCTA").style.display = 'block';

            } else {
              console.log("Error trying to load the shopping cart total amount");
            }
          });
        } else{
          // Show 'you have no checks' message
          document.getElementById("noItemsOnShoppingCartMessage").style.display = 'table-row';

          // Show the createCheck CTA
          document.getElementById("moveToMenuCTA").style.display = 'block';
        }

      } else {
        app.logUserOut();
      }
    });

    var hiddenUserInputs = document.querySelectorAll("input.hiddenUserIdInput");
    for(var i = 0; i < hiddenUserInputs.length; i++){
        hiddenUserInputs[i].value = userId;
    }

  } else {
    app.logUserOut();
  }
};

app.loadOrdersListPage = function(){
  var userId = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
  if(userId){

    var queryStringObject = {
      'id' : userId
    };

    app.client.request(undefined,'api/users','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
          var userOrders =  typeof(responsePayload) == 'object' && responsePayload.orders instanceof Array ? responsePayload.orders : [];
          if(userOrders.length > 0){
            userOrders.forEach(function(orderId){
              var headers = {
                'userid' : userId
              };

              var newQueryStringObject = {
                'id' : orderId
              };

              // Get the data for the menu item
              app.client.request(headers,'api/order','GET',newQueryStringObject,undefined,function(statusCode,responsePayload){
                if(statusCode == 200){
                  // Make the item data into a table row
                  var table = document.getElementById("ordersListTable");
                  var tr = table.insertRow(-1);
                  var td0 = tr.insertCell(0);
                  var td1 = tr.insertCell(1);
                  var td2 = tr.insertCell(2);
                  var td3 = tr.insertCell(3);
                  var td4 = tr.insertCell(4);
                  td0.innerHTML = responsePayload.id;
                  td1.innerHTML = responsePayload.mail_sent;
                  td2.innerHTML = responsePayload.payed;
                  td3.innerHTML = responsePayload.totalPrice;
                  td4.innerHTML = responsePayload.items.length;
                } else {
                  console.log("Error trying to load order id: ", orderId);
                }
              });
            });
          } else{
            // Show 'you have no checks' message
            document.getElementById("noOrdersMessage").style.display = 'table-row';

            // Show the createCheck CTA
            document.getElementById("moveToCartCTA").style.display = 'block';
          }
        } else {
            app.logUserOut();
        }
      });
    } else {
      app.logUserOut();
    }
};

// Load the cart delete page specifically
app.loadCartDeletePage = function(){
  var userId = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
  if(userId){
    // Put the hidden userId into all forms
    var hiddenUserInputs = document.querySelectorAll("input.hiddenUserIdInput");
    for(var i = 0; i < hiddenUserInputs.length; i++){
        hiddenUserInputs[i].value = userId;
    }
  } else {
    app.logUserOut();
  }
}

// Load the account edit page specifically
app.loadMenuPage = function(){
  var userId = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
  if(userId){
    // Put the hidden userId into all forms
    var hiddenUserInputs = document.querySelectorAll("input.hiddenUserIdInput");
    for(var i = 0; i < hiddenUserInputs.length; i++){
        hiddenUserInputs[i].value = userId;
    }
  } else {
    app.logUserOut();
  }
}

// Load the account edit page specifically
app.loadAccountEditPage = function(){
  // Get the phone number from the current token, or log the user out if none is there
  var userId = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
  if(userId){
    // Fetch the user data
    var queryStringObject = {
      'id' : userId
    };
    app.client.request(undefined,'api/users','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
        // Put the data into the forms as values where needed
        document.querySelector("#accountEdit1 .nameInput").value = responsePayload.name;
        document.querySelector("#accountEdit1 .streetAddressInput").value = responsePayload.streetAddress;
        document.querySelector("#accountEdit1 .displayEmailAddressInput").value = responsePayload.emailAddress;

        // Put the hidden phone field into both forms
        var hiddenPhoneInputs = document.querySelectorAll("input.hiddenUserIdInput");
        for(var i = 0; i < hiddenPhoneInputs.length; i++){
            hiddenPhoneInputs[i].value = responsePayload.id;
        }

      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

// Load the checks edit page specifically
app.loadShoppingCartAmount = function(){
  var userId = typeof(app.config.sessionToken.userIdentifier) == 'string' ? app.config.sessionToken.userIdentifier : false;
  if(userId){

    var queryStringObject = {
      'id' : userId
    };

    app.client.request(undefined,'api/users','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
        var amountItems = responsePayload && responsePayload.shoppingcart instanceof Array ? responsePayload.shoppingcart.length : false;
        if(amountItems){
          app.config.cartAmountItems = amountItems;
        } else {
          app.config.cartAmountItems = 0;
        }
        app.updateShoppingCartAmount();
      } else {
        app.logUserOut();
      }
    });
  }
};

// Loop to renew token often
app.tokenRenewalLoop = function(){
  setInterval(function(){
    app.renewToken(function(err){
      if(!err){
        console.log("Token renewed successfully @ "+Date.now());
      }
    });
  },1000 * 60);
};

// Init (bootstrapping)
app.init = function(){

  // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  // Load data on page
  app.loadDataOnPage();

  // Update shopping cart value based on api users to get user's shopping cart
  app.loadShoppingCartAmount();

  // Update the shopping cart amount in DOM
  app.updateShoppingCartAmount();

};

// Call the init processes after the window loads
window.onload = function(){
  app.init();
};
