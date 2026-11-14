import { getProfile, getAccountMoney, getPortfolioPerformance, getActiveOrders, getMarketLive } from './api-client.js';

async function runSelfTest() {
  console.log('🚀 Running EasyTrader MCP Automated Self-Test...\n');

  try {
    console.log('1️⃣ Checking Profile Brief...');
    const profile = await getProfile();
    console.log(`   ✅ User: ${profile.title || profile.firstName} (TradeCode: ${profile.tradeCode})`);

    console.log('2️⃣ Checking Account Purchasing Power (Easy Money)...');
    const money = await getAccountMoney();
    console.log(`   ✅ T0 Balance: ${money.t0.toLocaleString()} Rials | BuyPower: ${money.buyPowerT0.toLocaleString()} Rials | Hami: ${money.hamiBalance.toLocaleString()} Rials`);

    console.log('3️⃣ Checking Portfolio Performance...');
    const portfolio = await getPortfolioPerformance();
    console.log(`   ✅ Holdings: ${portfolio.items?.length || 0} stocks in portfolio.`);
    if (portfolio.items?.length) {
      portfolio.items.slice(0, 3).forEach(item => {
        console.log(`      - ${item.symbolName}: ${item.asset} shares`);
      });
    }

    console.log('4️⃣ Checking Active Orders...');
    const orders = await getActiveOrders();
    console.log(`   ✅ Active Open Orders: ${orders.orders?.length || 0}`);

    console.log('5️⃣ Checking Market Live Summary...');
    const market = await getMarketLive();
    console.log(`   ✅ Market Trade Value: ${market.tradeValue?.toLocaleString() || 'N/A'}`);

    console.log('\n🎉 ALL EASYTRADER MCP TESTS PASSED SUCCESSFULLY! Ready for Production.\n');
  } catch (err) {
    console.error('\n❌ Self-test failed:', err.message);
    if (err.data) {
      console.error('Details:', err.data);
    }
    process.exit(1);
  }
}

runSelfTest();
