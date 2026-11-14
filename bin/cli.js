#!/usr/bin/env node

import { runServer } from '../src/index.js';

runServer().catch((error) => {
  console.error('Fatal error running EasyTrader MCP Server:', error);
  process.exit(1);
});
