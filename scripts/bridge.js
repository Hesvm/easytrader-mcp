#!/usr/bin/env node

import { startBridge } from '../src/bridge.js';

console.log('====================================================');
console.log('  ⚡ EasyTrader MCP - Local Auth Bridge Daemon');
console.log('  Listening for 1-Click sync from Extension/Bookmarklet');
console.log('  URL: http://127.0.0.1:4821');
console.log('====================================================\n');

startBridge({
  port: 4821,
  quiet: false,
  onSync: ({ profile }) => {
    if (profile) {
      console.log(`\n🎉 [Success] Authenticated as: ${profile.title || profile.firstName} (TradeCode: ${profile.tradeCode})`);
      console.log('You can now use EasyTrader tools in Antigravity or Claude Desktop!\n');
    }
  }
});

console.log('Waiting for authentication ping from your browser...');
console.log('(Press Ctrl+C to stop)\n');
