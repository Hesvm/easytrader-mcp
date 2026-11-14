import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const SESSION_FILE_PATH = path.join(os.homedir(), '.easytrader-session.json');

/**
 * Get active Bearer token for EasyTrader API.
 * Priority:
 * 1. EASYTRADER_TOKEN / EASYTRADER_SESSION_TOKEN environment variable
 * 2. ~/.easytrader-session.json local config
 */
export function getSessionToken() {
  if (process.env.EASYTRADER_TOKEN) {
    return process.env.EASYTRADER_TOKEN.trim();
  }
  if (process.env.EASYTRADER_SESSION_TOKEN) {
    return process.env.EASYTRADER_SESSION_TOKEN.trim();
  }

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

  return null;
}

/**
 * Dynamically save a new session token without restarting server
 */
export function updateSession(token) {
  if (!token) {
    throw new Error('Token cannot be empty');
  }

  const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token.trim()}`;
  const payload = {
    token: cleanToken,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  return {
    success: true,
    message: 'EasyTrader session token updated successfully.',
    updatedAt: payload.updatedAt
  };
}
