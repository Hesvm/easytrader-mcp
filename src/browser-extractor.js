import { execFileSync } from 'child_process';
import http from 'http';

/**
 * Universal Zero-Click Browser Session Extractor for EasyTrader
 * Attempts to automatically locate and extract the active JWT/OIDC session
 * from open browser tabs (Google Chrome, Brave, Edge, Arc) or CDP.
 */

export function extractFromRunningBrowsers() {
  if (process.platform !== 'darwin') {
    return null;
  }

  // JXA script to safely scan running browsers without filesystem TCC violations
  const script = `
function run() {
  const se = Application("System Events");
  const procs = se.processes.name();
  const browsers = ["Google Chrome", "Brave Browser", "Microsoft Edge", "Arc"];
  
  for (let i = 0; i < browsers.length; i++) {
    const bName = browsers[i];
    if (procs.indexOf(bName) !== -1) {
      try {
        const app = Application(bName);
        const wins = app.windows();
        for (let w = 0; w < wins.length; w++) {
          const tabs = wins[w].tabs();
          for (let t = 0; t < tabs.length; t++) {
            const url = tabs[t].url();
            if (url && (url.indexOf("easytrader.ir") !== -1 || url.indexOf("emofid.com") !== -1)) {
              try {
                const token = tabs[t].execute({
                  javascript: "(function() { try { for (var i = 0; i < sessionStorage.length; i++) { var k = sessionStorage.key(i); if (k && k.indexOf('oidc') !== -1) { var val = JSON.parse(sessionStorage.getItem(k)); if (val && val.access_token) return val.access_token; } } return localStorage.getItem('token') || ''; } catch(e) { return ''; } })()"
                });
                if (token && token.length > 20) {
                  return JSON.stringify({ browser: bName, token: token, url: url });
                }
              } catch(e) {}
            }
          }
        }
      } catch(e) {}
    }
  }
  return null;
}
`;

  try {
    const output = execFileSync('osascript', ['-l', 'JavaScript'], {
      input: script,
      encoding: 'utf-8',
      timeout: 3000
    }).trim();

    if (output && output !== 'null') {
      const parsed = JSON.parse(output);
      if (parsed && parsed.token) {
        return parsed;
      }
    }
  } catch (err) {
    // Silently ignore if Apple Events permission dialog was dismissed or browser not running
  }

  return null;
}

/**
 * Checks if local Chrome DevTools Protocol port is active and extracts from it
 */
export async function extractFromCDP(ports = [9222, 9223, 9224]) {
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const tabs = await res.json();
        const easyTab = tabs.find(t => t.url && t.url.includes('easytrader.ir'));
        if (easyTab && easyTab.webSocketDebuggerUrl) {
          // Found open debuggable tab
          return { port, tabUrl: easyTab.url };
        }
      }
    } catch {}
  }
  return null;
}
