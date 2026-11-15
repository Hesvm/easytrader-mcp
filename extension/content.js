/**
 * EasyTrader AI Sync - Content Script
 * Automatically detects active session in d.easytrader.ir and synchronizes with local MCP Bridge
 */

(function () {
  let lastSyncedToken = null;
  const BRIDGE_URL = 'http://127.0.0.1:4821';

  function findEasyTraderToken() {
    try {
      // 1. Primary: OIDC Storage in sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('oidc.user') || key.includes('oidc'))) {
          try {
            const data = JSON.parse(sessionStorage.getItem(key));
            if (data && data.access_token) {
              return data.access_token;
            }
          } catch {}
        }
      }

      // 2. Secondary: localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('token') || key.includes('oidc'))) {
          try {
            const val = localStorage.getItem(key);
            if (val && val.startsWith('eyJ')) return val;
            const data = JSON.parse(val);
            if (data && data.access_token) return data.access_token;
          } catch {}
        }
      }
    } catch (e) {
      console.warn('[EasyTrader AI Sync] Error scanning storage:', e);
    }
    return null;
  }

  function showToast(message, isSuccess = true) {
    const existing = document.getElementById('easytrader-ai-sync-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'easytrader-ai-sync-toast';
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">${isSuccess ? '⚡' : '⚠️'}</span>
        <div>
          <div style="font-weight:700;font-size:13px;line-height:1.4;">${isSuccess ? 'هماهنگ شد با Antigravity MCP' : 'خطا در ارتباط با پل MCP'}</div>
          <div style="font-size:11px;opacity:0.9;line-height:1.3;">${message}</div>
        </div>
      </div>
    `;

    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${isSuccess ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'};
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      direction: rtl;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      z-index: 9999999;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(15px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  async function syncToken(force = false) {
    const token = findEasyTraderToken();
    if (!token) {
      if (force) showToast('توکن فعالی در مرورگر یافت نشد. لطفا وارد حساب شوید.', false);
      return;
    }

    if (!force && token === lastSyncedToken) {
      return; // Already up to date
    }

    try {
      const res = await fetch(`${BRIDGE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token }),
        signal: AbortSignal.timeout(3000)
      });

      if (res.ok) {
        lastSyncedToken = token;
        const data = await res.json().catch(() => ({}));
        const name = data.user?.name ? `کاربر: ${data.user.name}` : 'نشست با موفقیت ثبت شد.';
        showToast(name, true);
        console.log('[EasyTrader AI Sync] Successfully synchronized session with local MCP server.');
      } else {
        if (force) showToast('پاسخ نامعتبر از سرور لوکال', false);
      }
    } catch (err) {
      if (force) {
        showToast('پل ارتباطی در پورت 4821 فعال نیست. (سرور MCP را باز کنید)', false);
      }
      // Silently fail on background periodic attempt so we never bother the user
    }
  }

  // Initial sync attempt after 1.5s (allow page app to mount and populate sessionStorage)
  setTimeout(() => syncToken(false), 1500);

  // Periodic background check every 60s
  setInterval(() => syncToken(false), 60000);

  // Listen for manual trigger from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'sync_now') {
        syncToken(true).then(() => {
          sendResponse({ status: 'done', tokenFound: !!findEasyTraderToken() });
        });
        return true; // async response
      }
    });
  }
})();
