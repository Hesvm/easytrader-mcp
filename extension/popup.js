const BRIDGE_URL = 'http://127.0.0.1:4821';

const BOOKMARKLET_CODE = `javascript:(function(){try{var t=null;for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);if(k&&k.indexOf('oidc')!==-1){var v=JSON.parse(sessionStorage.getItem(k));if(v&&v.access_token){t=v.access_token;break;}}}if(!t)t=localStorage.getItem('token');if(!t){alert('❌ توکن ورود یافت نشد. لطفا ابتدا وارد d.easytrader.ir شوید.');return;}fetch('http://127.0.0.1:4821',{method:'POST',body:t,headers:{'Content-Type':'text/plain'}}).then(function(r){return r.json();}).then(function(d){var toast=document.createElement('div');toast.innerHTML='✨ <b>نشست کارگزاری مفید با Antigravity MCP همگام شد!</b>';toast.style.cssText='position:fixed;bottom:24px;left:24px;background:#10b981;color:#fff;padding:12px 20px;border-radius:10px;font-family:sans-serif;font-size:14px;direction:rtl;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.2);';document.body.appendChild(toast);setTimeout(function(){toast.remove();},3500);}).catch(function(e){alert('⚠️ پل ارتباطی MCP (پورت 4821) در دسترس نیست. سرور MCP را اجرا کنید.');});}catch(e){alert('خطا: '+e.message);}})();`;

async function checkBridgeHealth() {
  const bridgeStatus = document.getElementById('bridge-status');
  try {
    const res = await fetch(`${BRIDGE_URL}/health`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      bridgeStatus.innerHTML = '<span class="dot dot-green"></span> آنلاین و متصل';
      return true;
    }
  } catch (e) {
    // Bridge offline
  }
  bridgeStatus.innerHTML = '<span class="dot dot-red"></span> غیرفعال (پورت 4821)';
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  checkBridgeHealth();

  const btnSync = document.getElementById('btn-sync');
  const btnBookmarklet = document.getElementById('btn-copy-bookmarklet');
  const statusMsg = document.getElementById('status-msg');

  btnSync.addEventListener('click', async () => {
    btnSync.disabled = true;
    statusMsg.innerText = 'در حال ارسال به پل ارتباطی...';

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab || !currentTab.url || !currentTab.url.includes('easytrader.ir')) {
        statusMsg.innerText = '⚠️ ابتدا تب d.easytrader.ir را باز کنید و سپس کلیک نمایید.';
        btnSync.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(currentTab.id, { action: 'sync_now' }, (response) => {
        btnSync.disabled = false;
        if (chrome.runtime.lastError) {
          statusMsg.innerText = '⚠️ لطفاً صفحه ایزی‌تریدر را یک‌بار رفرش (F5) کنید.';
        } else {
          statusMsg.innerText = '✅ همگام‌سازی با موفقیت انجام شد!';
          checkBridgeHealth();
        }
      });
    } catch (err) {
      btnSync.disabled = false;
      statusMsg.innerText = 'خطا: ' + err.message;
    }
  });

  btnBookmarklet.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_CODE);
      const originalText = btnBookmarklet.innerHTML;
      btnBookmarklet.innerHTML = '<span>✅</span><span>کد در کلیپ‌بورد کپی شد!</span>';
      setTimeout(() => {
        btnBookmarklet.innerHTML = originalText;
      }, 2500);
    } catch (e) {
      alert('خطا در کپی: ' + e.message);
    }
  });
});
