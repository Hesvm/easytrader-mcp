import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import http from 'http';
import { getProfile } from './api-client.js';

const SESSION_FILE = path.join(os.homedir(), '.easytrader-session.json');

function saveToken(token) {
  const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token.trim()}`;
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ token: cleanToken, updatedAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
  return cleanToken;
}

function parseTokenInput(input) {
  const trimmed = input.trim();
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.access_token) return obj.access_token;
      if (obj.token) return obj.token;
    } catch {}
  }
  return trimmed;
}

// ---------------------------------------------------------
// Tier 1: Automated Playwright Browser Login
// ---------------------------------------------------------
async function tryPlaywrightLogin() {
  console.log('\n🚀 [Tier 1] Launching Automated Browser Login...');
  let playwright;
  try {
    playwright = await import('playwright');
  } catch (err) {
    console.log('⚠️  Playwright package not available, falling back...');
    return null;
  }

  const { chromium } = playwright;
  let browser = null;

  // Try channels: system chrome -> msedge -> default chromium
  const launchOptions = [
    { channel: 'chrome', headless: false },
    { channel: 'msedge', headless: false },
    { headless: false }
  ];

  for (const opt of launchOptions) {
    try {
      browser = await chromium.launch({
        ...opt,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
      });
      break;
    } catch {}
  }

  if (!browser) {
    console.log('⚠️  Could not launch desktop browser, moving to Fallback...');
    return null;
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    let capturedToken = null;

    // Listen to network requests for Authorization header
    page.on('request', (req) => {
      const headers = req.headers();
      const auth = headers['authorization'] || headers['Authorization'];
      if (auth && auth.startsWith('Bearer eyJ') && !capturedToken) {
        capturedToken = auth;
      }
    });

    console.log('🌐 EasyTrader window opened (https://d.easytrader.ir).');
    console.log('👉 Please log into your Mofid account in the browser window.');
    console.log('⏳ Waiting for authentication...');

    await page.goto('https://d.easytrader.ir', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Poll for sessionStorage or captured network token
    const startTime = Date.now();
    while (Date.now() - startTime < 180000) { // 3 minutes timeout
      if (capturedToken) break;

      try {
        const token = await page.evaluate(() => {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.includes('oidc')) {
              try {
                const val = JSON.parse(sessionStorage.getItem(key));
                if (val && val.access_token) return val.access_token;
              } catch {}
            }
          }
          return null;
        });

        if (token) {
          capturedToken = token;
          break;
        }
      } catch {}

      await new Promise((r) => setTimeout(r, 1000));
    }

    if (capturedToken) {
      saveToken(capturedToken);
      await browser.close();
      return capturedToken;
    }

    await browser.close();
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.log(`⚠️  Browser login interrupted: ${err.message}`);
  }

  return null;
}

// ---------------------------------------------------------
// Tier 2: Localhost HTTP Bridge Fallback
// ---------------------------------------------------------
async function tryLocalBridgeLogin() {
  console.log('\n⚡ [Tier 2] Starting Local HTTP Bridge on http://127.0.0.1:4821 ...');

  return new Promise((resolve) => {
    let capturedToken = null;
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const parsed = parseTokenInput(body);
            if (parsed) {
              capturedToken = parsed;
              saveToken(capturedToken);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Token saved!' }));
              server.close();
              resolve(capturedToken);
              return;
            }
          } catch {}
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid token' }));
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(4821, '127.0.0.1', () => {
      console.log('📌 Run this 1-click command in your browser console to sync instantly:');
      console.log(`   fetch('http://127.0.0.1:4821', { method: 'POST', body: sessionStorage.getItem(Object.keys(sessionStorage).find(k=>k.includes('oidc'))) })`);
    });

    // 45 seconds timeout for bridge
    setTimeout(() => {
      if (!capturedToken) {
        server.close();
        resolve(null);
      }
    }, 45000);
  });
}

// ---------------------------------------------------------
// Tier 3: Interactive Terminal Input Fallback
// ---------------------------------------------------------
async function promptTerminalLogin() {
  console.log('\n📋 [Tier 3] Manual Paste Fallback:');
  console.log('1. Open https://d.easytrader.ir in your browser.');
  console.log('2. Open Console (F12 or Cmd+Option+I -> Console) and run:');
  console.log('   copy(sessionStorage.getItem(Object.keys(sessionStorage).find(k => k.includes("oidc"))))\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('👉 Paste your copied session/token here and press Enter:\n> ', (answer) => {
      rl.close();
      const parsed = parseTokenInput(answer);
      if (parsed) {
        saveToken(parsed);
        resolve(parsed);
      } else {
        resolve(null);
      }
    });
  });
}

// ---------------------------------------------------------
// Master Flow: Tier 1 -> Tier 2 -> Tier 3
// ---------------------------------------------------------
export async function runLoginFlow() {
  console.log('🔐 EasyTrader MCP Authentication Setup');
  console.log('====================================');

  // Tier 1: Playwright
  let token = await tryPlaywrightLogin();

  // Tier 2: Local HTTP Bridge
  if (!token) {
    console.log('⏩ Tier 1 skipped or failed. Proceeding to Tier 2...');
    token = await tryLocalBridgeLogin();
  }

  // Tier 3: Manual Terminal Prompt
  if (!token) {
    console.log('⏩ Tier 2 skipped or timed out. Proceeding to Tier 3...');
    token = await promptTerminalLogin();
  }

  if (!token) {
    console.error('\n❌ Authentication failed: No token received.');
    process.exit(1);
  }

  // Verify token
  console.log('\n🔍 Verifying token with EasyTrader API...');
  try {
    const profile = await getProfile();
    console.log('\n🎉 AUTHENTICATION SUCCESSFUL!');
    const name = profile.title || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    console.log(`👤 Name: ${name}`);
    console.log(`🆔 Customer Code / Trade Code: ${profile.tradeCode || profile.customerIsin || 'N/A'}`);
    console.log(`💾 Saved to: ${SESSION_FILE}`);
    console.log('🚀 EasyTrader MCP is now fully connected to your account!\n');
    process.exit(0);
  } catch (err) {
    console.warn(`⚠️ Token saved, but initial API verification returned: ${err.message}`);
    console.log(`💾 Saved to: ${SESSION_FILE}`);
    process.exit(0);
  }
}
