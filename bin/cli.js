#!/usr/bin/env node

import { runServer } from '../src/index.js';
import { runLoginFlow } from '../src/auth-login.js';

const isLogin = process.argv.includes('login') || process.argv.includes('--login');

if (isLogin) {
  runLoginFlow().catch((err) => {
    console.error('Fatal error during EasyTrader login flow:', err);
    process.exit(1);
  });
} else {
  runServer().catch((error) => {
    console.error('Fatal error running EasyTrader MCP Server:', error);
    process.exit(1);
  });
}

