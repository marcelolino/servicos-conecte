// Test script to find correct issuer for Elo cards
const fetch = require('node-fetch');

async function getEloIssuers() {
  const publicKey = 'TEST-27ced349-dab5-48bb-99bb-4519e58f30d8';
  const bin = '506776'; // Elo card BIN
  
  try {
    // Get payment methods for this BIN
    const pmResponse = await fetch(`https://api.mercadopago.com/v1/payment_methods/search?bin=${bin}&public_key=${publicKey}`);
    const pmData = await pmResponse.json();
    
    console.log('Payment methods for Elo BIN:', JSON.stringify(pmData, null, 2));
    
    if (pmData.results && pmData.results.length > 0) {
      const paymentMethodId = pmData.results[0].id;
      
      // Get issuers for this payment method
      const issuerResponse = await fetch(`https://api.mercadopago.com/v1/payment_methods/card_issuers?payment_method_id=${paymentMethodId}&bin=${bin}&public_key=${publicKey}`);
      const issuerData = await issuerResponse.json();
      
      console.log('Issuers for Elo:', JSON.stringify(issuerData, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getEloIssuers();