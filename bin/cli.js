#!/usr/bin/env node

import { runServer } from '../src/index.js';
import { runLoginFlow } from '../src/auth-login.js';
import { startBridge } from '../src/bridge.js';

const args = process.argv.slice(2);

if (args.includes('login') || args.includes('--login')) {
  runLoginFlow().catch((err) => {
    console.error('Fatal error during EasyTrader login flow:', err);
    process.exit(1);
  });
} else if (args.includes('bridge') || args.includes('--bridge')) {
  console.log('====================================================');
  console.log('  ⚡ EasyTrader MCP - Local Auth Bridge Daemon');
  console.log('  Listening for 1-Click sync from Firefox / Chrome');
  console.log('  URL: http://127.0.0.1:4821');
  console.log('====================================================\n');

  startBridge({
    port: 4821,
    quiet: false,
    onSync: ({ profile }) => {
      if (profile) {
        console.log(`\n🎉 [Success] Authenticated as: ${profile.title || profile.firstName} (TradeCode: ${profile.tradeCode})`);
        console.log('Session saved to ~/.easytrader-session.json.\n');
      }
    }
  });

  console.log('Waiting for session sync from d.easytrader.ir...');
  console.log('(Press Ctrl+C to stop)\n');
} else {
  runServer().catch((error) => {
    console.error('Fatal error running EasyTrader MCP Server:', error);
    process.exit(1);
  });
}


