import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const PLIST_LABEL = 'com.hesam.easytrader-bridge';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`);

try {
  try {
    execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null`);
  } catch {}

  if (fs.existsSync(PLIST_PATH)) {
    fs.unlinkSync(PLIST_PATH);
  }
  console.log('🛑 EasyTrader Auth Bridge daemon stopped and uninstalled successfully.');
} catch (err) {
  console.error('Failed to uninstall LaunchAgent daemon:', err.message);
  process.exit(1);
}
