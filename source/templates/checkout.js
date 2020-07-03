// Full template appears in the multiline comment
// The callback value strips newlines and extra spaces

/*
  <form id="braintree-token-form" class="scale-down">
    <div id="checkout-customer">
      <div class="cardinfo-wrapper">
        <div class="cardinfo-first-name cardinfo-multiple">
          <label class="cardinfo-label" for="first-name">First Name</label>
          <div class="input-wrapper"><input type="text" class="form-control" id="first-name" placeholder="" required="true"></div>
        </div>
        
        <div class="cardinfo-multiple">
          <label class="cardinfo-label" for="last-name">Last Name</label>
          <div class="input-wrapper"><input type="text" class="form-control" id="last-name" placeholder="" required="true"></div>
        </div>
      </div>
      
      <label class="cardinfo-label" for="email">Email Address</label>
      <div class="input-wrapper" id="email-wrapper"><input type="email" class="form-control" id="email" placeholder="you@youremail.com"></div>
    </div>
    <div id="checkout-ccandsubmit">
      <div class="cardinfo-card-number">
        <label class="cardinfo-label" for="card-number">Card Number</label>
        <div class="input-wrapper" id="card-number"></div>
        <div id="card-image"></div>
      </div>

      <div class="cardinfo-wrapper">
        <div class="cardinfo-exp-date cardinfo-multiple">
          <label class="cardinfo-label" for="expiration-date">Exp Date</label>
          <div class="input-wrapper" id="expiration-date"></div>
        </div>

        <div class="cardinfo-cvv cardinfo-multiple">
          <label class="cardinfo-label" for="cvv">CVV</label>
          <div class="input-wrapper" id="cvv"></div>
        </div>
      </div>
      <input id="button-pay" type="submit" value="Subscribe now" />
    </div>
  </form>
*/
// eslint-disable-next-line no-undef
lodgecheckoutCallback({
  template:
    '<form id="braintree-token-form" class="scale-down"> <div id="checkout-customer"> <div class="cardinfo-wrapper"> <div class="cardinfo-first-name cardinfo-multiple"> <label class="cardinfo-label" for="first-name">First Name</label> <div class="input-wrapper"><input type="text" class="form-control" id="first-name" placeholder="" required="true"></div> </div> <div class="cardinfo-multiple"> <label class="cardinfo-label" for="last-name">Last Name</label> <div class="input-wrapper"><input type="text" class="form-control" id="last-name" placeholder="" required="true"></div> </div> </div> <label class="cardinfo-label" for="email">Email Address</label> <div class="input-wrapper" id="email-wrapper"><input type="email" class="form-control" id="email" placeholder="you@youremail.com"></div> </div> <div id="checkout-ccandsubmit"> <div class="cardinfo-card-number"> <label class="cardinfo-label" for="card-number">Card Number</label> <div class="input-wrapper" id="card-number"></div> <div id="card-image"></div> </div> <div class="cardinfo-wrapper"> <div class="cardinfo-exp-date cardinfo-multiple"> <label class="cardinfo-label" for="expiration-date">Exp Date</label> <div class="input-wrapper" id="expiration-date"></div> </div> <div class="cardinfo-cvv cardinfo-multiple"> <label class="cardinfo-label" for="cvv">CVV</label> <div class="input-wrapper" id="cvv"></div> </div> </div> <input id="button-pay" type="submit" value="Subscribe now" /> </div> </form>',
});