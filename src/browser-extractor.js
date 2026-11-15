import { execFileSync } from 'child_process';

/**
 * Universal Zero-Click Browser Session Extractor for EasyTrader
 * Attempts to automatically locate and extract the active JWT/OIDC session
 * from open browser tabs (Google Chrome, Brave, Edge, Arc) or CDP (Chrome / Firefox remote debugging).
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
 * Connects to a Chrome DevTools Protocol WebSocket target and executes extraction expression
 */
async function evaluateCDP(wsUrl) {
  if (typeof WebSocket === 'undefined') return null;

  return new Promise((resolve) => {
    let ws;
    const timer = setTimeout(() => {
      if (ws) {
        try { ws.close(); } catch {}
      }
      resolve(null);
    }, 2500);

    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        const payload = JSON.stringify({
          id: 101,
          method: 'Runtime.evaluate',
          params: {
            expression: `(function() {
              try {
                for (var i = 0; i < sessionStorage.length; i++) {
                  var k = sessionStorage.key(i);
                  if (k && k.indexOf('oidc') !== -1) {
                    var val = JSON.parse(sessionStorage.getItem(k));
                    if (val && val.access_token) return val.access_token;
                  }
                }
                return localStorage.getItem('token') || '';
              } catch(e) { return ''; }
            })()`,
            returnByValue: true
          }
        });
        ws.send(payload);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id === 101 && data.result?.result?.value) {
            clearTimeout(timer);
            try { ws.close(); } catch {}
            resolve(data.result.result.value);
            return;
          }
        } catch {}
        clearTimeout(timer);
        try { ws.close(); } catch {}
        resolve(null);
      };

      ws.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

/**
 * Checks if local Chrome DevTools Protocol port is active and extracts from it.
 * Works with both Chrome and Firefox running with --remote-debugging-port 9222.
 */
export async function extractFromCDP(ports = [9222, 9223, 9224]) {
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const tabs = await res.json();
        const easyTab = tabs.find(t => t.url && (t.url.includes('easytrader.ir') || t.url.includes('emofid.com')));
        if (easyTab && easyTab.webSocketDebuggerUrl) {
          const token = await evaluateCDP(easyTab.webSocketDebuggerUrl);
          if (token && token.length > 20) {
            return {
              browser: `Remote Debugging (Port ${port})`,
              token: token,
              url: easyTab.url
            };
          }
        }
      }
    } catch {}
  }
  return null;
}
