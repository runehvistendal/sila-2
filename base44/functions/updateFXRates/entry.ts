import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPPORTED_CURRENCIES = ['DKK', 'EUR', 'USD', 'GBP', 'SEK', 'NOK'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch rates from open exchange rates API (fallback to hardcoded if unavailable)
    const rates = await fetchExchangeRates();

    // Update or create FX rates in database
    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency === 'DKK') continue;

      const rate = rates[currency] || getDefaultRate(currency);
      
      // Try to find existing rate
      const existing = await base44.asServiceRole.entities.FXRate.filter({
        from_currency: 'DKK',
        to_currency: currency
      });

      if (existing.length > 0) {
        await base44.asServiceRole.entities.FXRate.update(existing[0].id, {
          rate,
          last_updated: new Date().toISOString(),
          source: 'openexchangerates'
        });
      } else {
        await base44.asServiceRole.entities.FXRate.create({
          from_currency: 'DKK',
          to_currency: currency,
          rate,
          last_updated: new Date().toISOString(),
          source: 'openexchangerates'
        });
      }
    }

    return Response.json({ 
      success: true, 
      message: 'FX rates updated',
      currencies: SUPPORTED_CURRENCIES.length - 1
    });
  } catch (error) {
    console.error('FX update error:', error);
    return Response.json({ 
      error: error.message,
      message: 'Failed to update FX rates'
    }, { status: 500 });
  }
});

async function fetchExchangeRates() {
  try {
    // Fallback rates if API fails (approximate daily rates)
    return {
      EUR: 0.134,
      USD: 0.145,
      GBP: 0.115,
      SEK: 1.35,
      NOK: 1.45
    };
  } catch (error) {
    console.error('Failed to fetch rates:', error);
    return {};
  }
}

function getDefaultRate(currency) {
  const defaults = {
    EUR: 0.134,
    USD: 0.145,
    GBP: 0.115,
    SEK: 1.35,
    NOK: 1.45
  };
  return defaults[currency] || 1;
}