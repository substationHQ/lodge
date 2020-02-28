(function() {
    'use strict';
    var vv = window.lodge;

    /***************************************************************************************
     *
     * window.lodge.braintree (object)
     * Handle Braintree payment token generation
     *
     * PUBLIC-ISH FUNCTIONS
     * window.lodge.stripe.generateToken(string key, target source)
     *
     ***************************************************************************************/
    vv.braintree = {
      eventAttached: false,

      generateToken: function(options,source) {
        var vv = window.lodge;
        if (vv.embedded) {
          //vv.events.fire(vv,'stripetokenrequested',params);
        } else {  
          // load the markup template, make any needed edits, and return
          vv.getTemplate('checkout',function(t) {
            var container = document.createElement('div');
            container.innerHTML = t;
            container.className = 'ccform-wrapper';

            // show the container while braintree API injects hosted fields
            vv.overlay.reveal(container);

            // grab the bits we care about
            var form = document.querySelector('#braintree-token-form');
            var submit = document.querySelector('#button-pay');

            // do highlights for focused name/email
            var inputs = document.querySelectorAll('#braintree-token-form input');
            var len = inputs.length;
            for (var i=0;i<len;i++) {  
              vv.events.add(inputs[i],'focus',function(e) {
                vv.styles.addClass(e.target.parentNode,'braintree-hosted-fields-focused'); 
              });

              vv.events.add(inputs[i],'blur',function(e) {
                vv.styles.removeClass(e.target.parentNode,'braintree-hosted-fields-focused'); 
              });
            }

            submit.disabled = true;

            braintree.client.create({
              authorization: options.braintree
            }, function (err, clientInstance) {
              if (err) {
                console.error(err);
                return;
              }
              
              // Create input fields and add text styles  
              var d = new Date(); // need this in the call below to customize exp date
              
              braintree.hostedFields.create({
                client: clientInstance,
                styles: {
                  'input': {
                    'color': '#282c37',
                    'font-size': '16px',
                    'transition': 'color 0.1s',
                    'line-height': '3'
                  },
                  // Style the text of an invalid input
                  'input.invalid': {
                    'color': '#E53A40'
                  },
                  // placeholder styles need to be individually adjusted
                  '::-webkit-input-placeholder': {
                    'color': 'rgba(0,0,0,0.4)'
                  },
                  ':-moz-placeholder': {
                    'color': 'rgba(0,0,0,0.4)'
                  },
                  '::-moz-placeholder': {
                    'color': 'rgba(0,0,0,0.4)'
                  },
                  ':-ms-input-placeholder': {
                    'color': 'rgba(0,0,0,0.4)'
                  }

                },
                // Add information for individual fields
                fields: {
                  number: {
                    selector: '#card-number',
                    placeholder: '0000 0000 0000 0000'
                  },
                  cvv: {
                    selector: '#cvv',
                    placeholder: '123'
                  },
                  expirationDate: {
                    selector: '#expiration-date',
                    placeholder: d.getMonth() + ' / ' + (d.getFullYear() + 1)
                  }
                }
              }, function (err, hostedFieldsInstance) {
                if (err) {
                  console.error(err);
                  return;
                }

                function doValidation() {
                  var state = hostedFieldsInstance.getState();
                  var formValid = Object.keys(state.fields).every(function (key) {
                    return state.fields[key].isValid;
                  });

                  // Now we're checking the email field, outside of the Braintree validation.
                  // If the email isn't valid, the form is always not valid so we mark it false.
                  // If the email is valid we do nothing and the original Braintree validation
                  // stands as-is.
                  if (document.querySelector('#email').value && !vv.validate.email(document.querySelector('#email').value)) {
                    vv.styles.addClass(document.querySelector('#email-wrapper'),'invalid'); 
                    formValid = false;
                  } else {
                    vv.styles.removeClass(document.querySelector('#email-wrapper'),'invalid'); 
                  }

                  if (formValid) {
                    vv.styles.addClass(submit,'show-button'); 
                    submit.disabled = false;
                  } else {
                    vv.styles.removeClass(submit,'show-button'); 
                    submit.disabled = true;
                  }
                }

                hostedFieldsInstance.on('validityChange', doValidation);

                vv.events.add(document.querySelector('#email'),'keyup',function(e) {
                  if(document.querySelector('#email').value.length > 4) {
                    doValidation();
                  }
                });

                hostedFieldsInstance.on('empty', function (event) {
                  document.querySelector('#card-image').className = '';
                  form.className = '';
                });

                hostedFieldsInstance.on('cardTypeChange', function (event) {
                  // Change card bg depending on card type
                  if (event.cards.length === 1) {
                    form.className = '';
                    vv.styles.addClass(form,event.cards[0].type); 
                    document.querySelector('#card-image').className = '';
                    vv.styles.addClass(document.querySelector('#card-image'),event.cards[0].type); 

                    // Change the CVV length for AmericanExpress cards
                    if (event.cards[0].code.size === 4) {
                      hostedFieldsInstance.setAttribute({
                        field: 'cvv',
                        attribute: 'placeholder',
                        value: '1234'
                      });
                    } 
                  } else {
                    hostedFieldsInstance.setAttribute({
                      field: 'cvv',
                      attribute: 'placeholder',
                      value: '123'
                    });
                  }
                });

                submit.addEventListener('click', function (event) {
                  event.preventDefault();
                  vv.overlay.showLoading();

                  hostedFieldsInstance.tokenize(function (err, payload) {
                    if (err) {
                      console.error(err);
                      return;
                    } else {
                      var poststring = 'email='+document.querySelector('#email').value+'&firstName='+document.querySelector('#first-name').value+'&lastName='+document.querySelector('#last-name').value+'&amount='+options.amount+'&nonce='+payload.nonce;
                      vv.ajax.send(options.endpoint, poststring, function(r) {
                        if (r == 'OK') {
                          vv.overlay.reveal('<h2 class="vv-checkout-success">'+options.successMsg+'</h2>');
                        } else {
                          vv.overlay.reveal('<h2 class="vv-checkout-error">'+options.errorMsg+'</h2>');
                        }
                      });
                    }
                  });
                }, false);
              });
            });            
          },false);
        }
      }
    };



    /***************************************************************************************
     *
     * window.lodge.checkout (object)
     * start the checkout flow for multiple payments in a controlled overlay
     *
     * PUBLIC FUNCTIONS
     * window.lodge.checkout.begin(obj options, target source)
     *
     * EXAMPLE
     vv.checkout.begin({
		 		"braintree"  : "pk_test_wh4t3ver", // false OR public stripe key
		 		"paypal"     : true, // boolean for "should we have paypal as an option"
		 		"endpoint"   : for AJAX calls on submit
	 		});
     *
     ***************************************************************************************/
    vv.checkout = {
      prepped: false,

      prep: function () {
        if (!vv.checkout.prepped) {
          // add in styles
          vv.loadScript('https://js.braintreegateway.com/web/3.46.0/js/client.min.js', function() {
            vv.loadScript('https://js.braintreegateway.com/web/3.46.0/js/hosted-fields.min.js', function() {
              vv.styles.injectCSS(vv.path + '/templates/checkout.css',false,true);
              vv.checkout.prepped = true;
            });
          });
        }
      },

      begin: function (options,source) {
        if (vv.embedded) {
          vv.events.fire(vv,'begincheckout',options);
        } else {
          vv.checkout.prep();
          // set up the empty object we'll populate in the return
          var defaultOptions = {
              'braintree'  :false,
              'paypal'     :false,
              'currency'   :false,
              'firstName'  :false,
              'lastName'   :false,
              'email'      :false,
              'recurring'  :false,
              'amount'	   :false,
              'endpoint'   :"",
              'successMsg' :"Success.",
              'errorMsg'   :"There was a problem."
          };
          
          var finalOptions = Object.assign(defaultOptions, options);
          vv.checkout.initiatepayment(finalOptions,source);
        }
      },

      initiatepayment: function (options,source) {
          // just starts the payment flow and does the steps needed based on
          // the options passed in...
          // BT only
          if (options.braintree && !options.paypal) {
            vv.braintree.generateToken(options,source);
          }
          // Paypal only
          else if (!options.braintree && options.paypal) {
            vv.events.fire(vv,'checkoutdata',options,source);
            vv.overlay.reveal('<div class="vv-loading"></div>');
          }
          // Stripe and Paypal
          else if (options.braintree && options.paypal) {
            // Create HTML elements to use as selectors
            var container = document.createElement("div");
            container.className = "vv-checkout-choose";

            var ppspan = document.createElement("span");
            var stspan = document.createElement("span");

            ppspan.innerHTML = 'Pay with PayPal';
            ppspan.className = 'pay-pp';
            stspan.innerHTML = 'Pay with a credit card';
            stspan.className = 'pay-cc';

            // Create a special event to detect Paypal chosen
            vv.events.add(ppspan,'click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              vv.events.fire(vv,'checkoutdata',options,source);
              vv.overlay.showLoading();
            });

            // Create a special event to detect Stripe chosen
            vv.events.add(stspan,'click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              vv.braintree.generateToken(options.braintree,source);
            });

            container.appendChild(ppspan);
            container.appendChild(stspan);

            vv.overlay.reveal(container);
          }
          // No available payment types, by options or SSL limits on Stripe
          else {
              vv.checkout.showerror();
          }
      },

      showerror: function (type) {
        vv.overlay.reveal('<div class="vv-checkout-error">There are no valid payment types. Please add a payment connection. Check to make sure your site supports SSL (https) if you are using Braintree.</div>');
      },
    }

}()); // END
