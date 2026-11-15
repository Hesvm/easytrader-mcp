import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { updateSession, getSessionMetadata } from './auth.js';
import * as api from './api-client.js';

const DEFAULT_PORT = 4821;

/**
 * Creates and starts the local loopback HTTP Auth Bridge
 * Listens on 127.0.0.1:4821 for tokens pushed from WebExtension or Bookmarklet
 */
export function startBridge(options = {}) {
  const port = options.port || DEFAULT_PORT;
  const quiet = options.quiet ?? false;
  const onSync = options.onSync || null;

  const server = http.createServer(async (req, res) => {
    // CORS headers to permit requests from browser extensions and d.easytrader.ir
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://127.0.0.1:${port}`);

    // Health check endpoint
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      const meta = getSessionMetadata();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'online',
        service: 'EasyTrader AI Auth Bridge',
        port: port,
        hasToken: meta.hasToken,
        updatedAt: meta.updatedAt
      }, null, 2));
      return;
    }

    // Token sync endpoint
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 50000) req.destroy(); // Protect against payload abuse
      });

      req.on('end', async () => {
        try {
          let tokenToSave = null;
          const trimmed = body.trim();

          if (trimmed.startsWith('{')) {
            const data = JSON.parse(trimmed);
            tokenToSave = data.token || data.access_token || data.tokenInput;
          } else {
            tokenToSave = trimmed;
          }

          if (tokenToSave && tokenToSave.length > 20) {
            updateSession(tokenToSave);
            
            let profile = null;
            try {
              profile = await api.getProfile();
            } catch (err) {
              // Token saved but profile call might have minor network hiccup
            }

            if (!quiet) {
              const name = profile ? (profile.title || `${profile.firstName} ${profile.lastName}`) : 'User';
              const tradeCode = profile?.tradeCode || 'N/A';
              console.error(`\n🟢 [EasyTrader Bridge] Received token successfully! Profile: ${name} (${tradeCode})`);
            }

            if (onSync) onSync({ token: tokenToSave, profile });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'نشست کارگزاری مفید با موفقیت در ابزار هوش مصنوعی ذخیره شد!',
              user: profile ? {
                name: profile.title || `${profile.firstName} ${profile.lastName}`,
                tradeCode: profile.tradeCode
              } : null
            }));
            return;
          }
        } catch (err) {
          if (!quiet) console.error('Bridge error processing token:', err.message);
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or missing token payload' }));
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (!quiet) console.error(`ℹ️ [EasyTrader Bridge] Port ${port} is already in use by another instance. Using existing bridge.`);
    } else {
      if (!quiet) console.error(`⚠️ [EasyTrader Bridge] Server error:`, err.message);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    if (!quiet) {
      console.error(`⚡ [EasyTrader Bridge] Listening on http://127.0.0.1:${port}`);
    }
  });

  // unref server only if explicitly requested (e.g. embedded inside background MCP)
  if (options.unref && server.unref) {
    server.unref();
  }

  return server;
}
