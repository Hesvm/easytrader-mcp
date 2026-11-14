import * as api from './api-client.js';

async function runExtendedTests() {
  console.log('🧪 Testing Extended EasyTrader Features...\n');

  try {
    const points = await api.getPointXBalance();
    console.log(`✅ PointX Balance: ${points.balance} Points`);
  } catch (e) {
    console.log(`❌ PointX Balance Error: ${e.message}`);
  }

  try {
    const packages = await api.getGrantableCreditPackages();
    console.log(`✅ Credit Packages Available: ${packages.grantablePackages?.length || 0} packages`);
    if (packages.grantablePackages?.length > 0) {
      console.log(`   Sample Package: ${packages.grantablePackages[0].title} (Value: ${packages.grantablePackages[0].value?.toLocaleString()} Rials)`);
    }
  } catch (e) {
    console.log(`❌ Credit Packages Error: ${e.message}`);
  }

  try {
    const card = await api.getMofidCardBalance();
    console.log(`✅ MofidCard Balance: ${card.balance?.toLocaleString()} Rials (${card.description})`);
  } catch (e) {
    console.log(`❌ MofidCard Balance Error: ${e.message}`);
  }

  try {
    const quotes = await api.getBatchQuotes(['IRO1TAMN0001', 'IRO1SAPA0001']);
    console.log(`✅ Batch Quotes Received: ${quotes.length} symbols`);
    quotes.forEach(q => {
      console.log(`   - ${q.symbolIsin}: Last ${q.lastTradedPrice} | Close ${q.closingPrice} (${q.priceVar}%)`);
    });
  } catch (e) {
    console.log(`❌ Batch Quotes Error: ${e.message}`);
  }

  try {
    const settings = await api.getClientAppSettings();
    console.log(`✅ Client App Settings: LightTheme=${settings.lightTheme}, BuyQty=${settings.buyQuantity}, SellQty=${settings.sellQuantity}`);
  } catch (e) {
    console.log(`❌ Client App Settings Error: ${e.message}`);
  }

  console.log('\n🎉 Extended Feature Tests Complete!');
}

runExtendedTests();
