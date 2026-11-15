import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const PLIST_LABEL = 'com.hesam.easytrader-bridge';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`);
const CLI_PATH = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'bin', 'cli.js');
const NODE_PATH = process.execPath;
const LOG_PATH = path.join(os.homedir(), '.easytrader-bridge.log');

const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_PATH}</string>
        <string>${CLI_PATH}</string>
        <string>bridge</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>${path.dirname(NODE_PATH)}:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_PATH}</string>
    <key>StandardErrorPath</key>
    <string>${LOG_PATH}</string>
</dict>
</plist>
`;

try {
  // 1. Unload existing if loaded
  try {
    execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null`);
  } catch {}

  // 2. Write plist file
  fs.writeFileSync(PLIST_PATH, plistContent, 'utf-8');
  console.log(`✅ LaunchAgent plist written to: ${PLIST_PATH}`);

  // 3. Load service via launchctl
  execSync(`launchctl load "${PLIST_PATH}"`);
  console.log('🚀 EasyTrader Auth Bridge daemon successfully installed and started in background!');
  console.log(`Port: http://127.0.0.1:4821`);
  console.log(`Logs: ${LOG_PATH}`);
} catch (err) {
  console.error('❌ Failed to install LaunchAgent daemon:', err.message);
  process.exit(1);
}
