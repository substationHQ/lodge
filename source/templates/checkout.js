// Full template appears in the multiline comment
// The callback value strips newlines and extra spaces

/*
  <form class="lodge__form--braintree">
    <div class="lodge__form-row--columns">
      <div>
        <label for="lodge__braintree-first-name">First name</label>
        <div class="input-wrapper"><input type="text" class="lodge__braintree-first-name" name="lodge__braintree-first-name" placeholder="" required="true"></div>
      </div>
      <div>
        <label for="lodge__braintree-last-name">Last name</label>
        <div class="input-wrapper"><input type="text" class="lodge__braintree-last-name" name="lodge__braintree-last-name" placeholder="" required="true"></div>
      </div>
    </div>
    <div class="lodge__form-row">
      <label for="lodge__braintree-email">Email address</label>
      <div class="input-wrapper"><input type="text" class="lodge__braintree-email" name="lodge__braintree-email" placeholder="you@youremail.com" required="true"></div>
    </div>
    <div class="lodge__form-row">
      <label for="lodge__braintree-card-number">Card number</label>
      <div class="input-wrapper lodge__braintree-card-number"></div>
    </div>
    <div class="lodge__form-row--columns">
      <div>
        <label for="lodge__braintree-expiration-date">Exp Date</label>
        <div class="input-wrapper lodge__braintree-expiration-date"></div>
      </div>
      <div>
        <label for="lodge__braintree-cvv">CVV</label>
        <div class="input-wrapper lodge__braintree-cvv"></div>
      </div>
    </div>
    <div class="lodge__form-row button">
      <button class="lodge__button--braintree">Subscribe now</button>
    </div>
  </form>
*/
// eslint-disable-next-line no-undef
_checkoutCallback({
  template:
    '<form class="lodge__form--braintree"> <div class="lodge__form-row--columns"> <div> <label for="lodge__braintree-first-name">First name</label> <div class="input-wrapper"><input type="text" class="lodge__braintree-first-name" name="lodge__braintree-first-name" placeholder="" required="true"></div> </div> <div> <label for="lodge__braintree-last-name">Last name</label> <div class="input-wrapper"><input type="text" class="lodge__braintree-last-name" name="lodge__braintree-last-name" placeholder="" required="true"></div> </div> </div> <div class="lodge__form-row"> <label for="lodge__braintree-email">Email address</label> <div class="input-wrapper"><input type="text" class="lodge__braintree-email" name="lodge__braintree-email" placeholder="you@youremail.com" required="true"></div> </div> <div class="lodge__form-row"> <label for="lodge__braintree-card-number">Card number</label> <div class="input-wrapper lodge__braintree-card-number"></div> </div> <div class="lodge__form-row--columns"> <div> <label for="lodge__braintree-expiration-date">Exp Date</label> <div class="input-wrapper lodge__braintree-expiration-date"></div> </div> <div> <label for="lodge__braintree-cvv">CVV</label> <div class="input-wrapper lodge__braintree-cvv"></div> </div> </div> <div class="lodge__form-row button"> <button class="lodge__button--braintree">Subscribe now</button> </div> </form>',
});
