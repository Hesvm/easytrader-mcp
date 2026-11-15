import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { extractFromRunningBrowsers } from './browser-extractor.js';

dotenv.config();

const SESSION_FILE_PATH = path.join(os.homedir(), '.easytrader-session.json');

/**
 * Parses user input which can be:
 * - A raw JWT token (eyJ...)
 * - A Bearer token (Bearer eyJ...)
 * - A copied JSON object from sessionStorage (containing access_token or token)
 */
export function parseTokenInput(input) {
  if (!input || typeof input !== 'string') return null;
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

/**
 * Scans ~/Downloads for recent EasyTrader HAR traffic dumps
 */
export function extractFromDownloadsHar() {
  const downloadsDir = path.join(os.homedir(), 'Downloads');
  if (!fs.existsSync(downloadsDir)) return null;

  try {
    const files = fs.readdirSync(downloadsDir)
      .filter(f => f.toLowerCase().includes('easytrader') && f.endsWith('.har'))
      .sort((a, b) => {
        try {
          const statA = fs.statSync(path.join(downloadsDir, a));
          const statB = fs.statSync(path.join(downloadsDir, b));
          return statB.mtimeMs - statA.mtimeMs;
        } catch { return 0; }
      });

    for (const f of files) {
      const fullPath = path.join(downloadsDir, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      const match = content.match(/Bearer eyJhbGciOiJSUzI1Ni[a-zA-Z0-9_\-\.]+/);
      if (match) {
        console.error(`✨ [Auto-Auth] Found active EasyTrader session token in Downloads/${f}!`);
        return match[0];
      }
    }
  } catch (err) {
    // Silently continue
  }
  return null;
}

/**
 * Get active Bearer token for EasyTrader API.
 * Priority Waterfall:
 * 1. EASYTRADER_TOKEN / EASYTRADER_SESSION_TOKEN environment variable
 * 2. ~/.easytrader-session.json local config
 * 3. Zero-Click Automatic Browser Extraction (macOS Chrome/Brave/Edge)
 * 4. Automatic extraction from ~/Downloads/*.har archives
 */
export function getSessionToken() {
  // 1. Environment Variable
  if (process.env.EASYTRADER_TOKEN) {
    return process.env.EASYTRADER_TOKEN.trim();
  }
  if (process.env.EASYTRADER_SESSION_TOKEN) {
    return process.env.EASYTRADER_SESSION_TOKEN.trim();
  }

  // 2. Saved Session File
  try {
    if (fs.existsSync(SESSION_FILE_PATH)) {
      const data = fs.readFileSync(SESSION_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.token) {
        return parsed.token.trim();
      }
    }
  } catch (err) {
    console.error('Warning: Failed to read session file:', err.message);
  }

  // 3. Zero-Click Auto Browser Extraction (Running browser tabs)
  try {
    const extracted = extractFromRunningBrowsers();
    if (extracted && extracted.token) {
      console.error(`✨ [Auto-Auth] Extracted active EasyTrader session from ${extracted.browser}!`);
      updateSession(extracted.token);
      return extracted.token;
    }
  } catch (err) {
    // Silently continue to fallback
  }

  // 4. Zero-Click Auto Extraction from ~/Downloads HAR dumps
  try {
    const harToken = extractFromDownloadsHar();
    if (harToken) {
      updateSession(harToken);
      return harToken;
    }
  } catch (err) {
    // Silently continue
  }

  return null;
}

/**
 * Dynamically save a new session token without restarting server
 */
export function updateSession(token) {
  if (!token) {
    throw new Error('Token cannot be empty');
  }

  const parsed = parseTokenInput(token);
  const cleanToken = parsed.startsWith('Bearer ') ? parsed : `Bearer ${parsed.trim()}`;
  const payload = {
    token: cleanToken,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(payload, null, 2), { mode: 0o600 });
  return {
    success: true,
    message: 'EasyTrader session token updated successfully.',
    updatedAt: payload.updatedAt
  };
}

/**
 * Returns full session info metadata
 */
export function getSessionMetadata() {
  if (process.env.EASYTRADER_TOKEN) {
    return { source: 'environment', sessionFile: null, hasToken: true };
  }
  if (fs.existsSync(SESSION_FILE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf-8'));
      return {
        source: 'file',
        sessionFile: SESSION_FILE_PATH,
        updatedAt: data.updatedAt || null,
        hasToken: !!data.token
      };
    } catch {}
  }
  return { source: 'none', sessionFile: SESSION_FILE_PATH, hasToken: false };
}
