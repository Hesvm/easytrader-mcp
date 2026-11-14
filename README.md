<div align="center">

<img src="./assets/banner.png" alt="EasyTrader MCP Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

# 📈 EasyTrader MCP Server
### مغز متفکر هوش مصنوعی برای معاملات بازار بورس ایران (کارگزاری مفید)
**AI-Powered Agentic Trading & Market Intelligence for Tehran Stock Exchange (TSE)**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Standard%202024--11--05-purple.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Hesvm/easytrader-mcp/pulls)

[ویژگی‌ها](#-چه-کارهایی-از-دستش-برمی‌آید) •
[نصب و راه‌اندازی](#-راه‌اندازی-در-۳۰-ثانیه) •
[ابزارها](#-لیست-کامل-ابزارها-tools) •
[امنیت](#-امنیت-و-حریم-خصوصی-خیالتان-راحت) •
[تنظیم در ایجنت‌ها](#-تنظیم-در-کلاینت‌های-مختلف)

</div>

---

## 💡 این پروژه چیه و به چه دردی می‌خوره؟

تا حالا شده دلت بخواد یک **دستیار تریدر اختصاصی و بدون خستگی** کنارت باشه که:
- به محض اینکه بازار باز شد، کل سهم‌ها و صنایع رو رصد کنه،
- ورود و خروج پول هوشمند (حقیقی/حقوقی) رو با دقت تحلیل کنه،
- سبد سهامت رو بسنجه و ببینه کدوم سهم به نقطه خروج رسیده،
- و بدون اینکه لازم باشه خودت مدام پشت مانیتور بنشینی، بهش بگی: *«حواست به والبر باشه، اگه صف خریدش ریخت برام بفروش»* یا *«فلان سهم رو برام پیش‌نویس کن»*؟

پروژه **EasyTrader MCP** پلی میان **هوش مصنوعی هوشمند (Antigravity، Claude Desktop، Cursor، Windsurf)** و **سامانه معاملاتی ایزی‌تریدر مفید (`d.easytrader.ir`)** است. این ابزار از طریق پروتکل رسمی **Model Context Protocol (MCP)** تمام امکانات پنل را بدون نیاز به کارهای دستی به ایجنت شما متصل می‌کند.

---

## ⚡ چه کارهایی از دستش برمی‌آید؟

- 💰 **کنترل حساب و قدرت خرید:** بررسی لحظه‌ای مانده ریالی، قدرت خرید T0/T1/T2، سود روزشمار حامی و وضعیت حساب‌های بانکی متصل.
- 📊 **تحلیل زنده پورتفوی:** مشاهده تعداد سهام، میانگین قیمت خرید، نقطه سربه‌سر، سود/زیان محقق‌شده و معاملات روزانه.
- 🔍 **اسکنر و نقشه بازار (Heatmap):** دسترسی به نقشه کل بازار، شاخص کل، ارزش کل معاملات بورس و فرابورس و غربالگری هوشمند با EasyFilter.
- 🔬 **آنالیز چندبعدی نمادها:** بررسی تابلو و Orderbook، نسبت P/E، سود نقدی DPS، رفتار حقیقی/حقوقی، روندهای تکنیکال و فاندامنتال و اطلاعیه‌های سامانه کدال.
- 🛒 **خرید و فروش واقعی (Read & Write):** ارسال سفارش خرید/فروش با اعتبار روز و معتبر تا لغو، ویرایش حجم/قیمت سفارش در صف، لغو سفارشات باز و مدیریت پیش‌نویس‌ها (Drafts).
- 🔔 **سیستم پیام‌های ناظر بازار:** دریافت پیام‌های ناظر، وقفه و بازگشایی نمادها به‌صورت لحظه‌ای.

---

## 🛠️ لیست کامل ابزارها (Tools)

<div dir="rtl">

| نام ابزار | نوع | کاربرد و توضیحات |
|---|---|---|
| `easytrader_auth_status` | 🟢 Read | بررسی اتصال سشن و مشاهده اطلاعات هویتی و کد بورسی |
| `easytrader_update_session` | 🔴 Write | تمدید فوری توکن سشن بدون نیاز به ری‌استارت سرور |
| `easytrader_get_account_balance` | 🟢 Read | نمایش قدرت خرید (T0 تا T2)، مانده حامی و حساب‌های بانکی |
| `easytrader_get_transactions` | 🟢 Read | گزارش گردش حساب، واریز، برداشت و اسناد حسابداری |
| `easytrader_get_portfolio` | 🟢 Read | دارایی‌های سبد، تعداد هر سهم، نقطه سربه‌سر و سود محقق‌شده |
| `easytrader_get_funds` | 🟢 Read | دارایی‌های صندوق‌های سرمایه‌گذاری و لیست تمام صندوق‌های مفید |
| `easytrader_get_market_overview` | 🟢 Read | خلاصه وضعیت روزانه بورس، تغییرات شاخص کل و ارزش معاملات |
| `easytrader_get_market_map` | 🟢 Read | نقشه حرارتی بازار و درصد تغییر قیمت تمام نمادها بر حسب صنعت |
| `easytrader_get_easyfilter_data` | 🟢 Read | دیتای فیلترهای استراتژیک برای شکار سهم‌های مستعد |
| `easytrader_get_symbol_details` | 🟢 Read | قیمت آخرین/پایانی، حجم مبنا، صف خرید/فروش و عمق ۵ مظنه (Orderbook) |
| `easytrader_get_symbol_analysis` | 🟢 Read | تحلیل تکنیکال، فاندامنتال، خرید/فروش حقیقی و حقوقی و کدال |
| `easytrader_get_orders` | 🟢 Read | لیست سفارشات فعال در هسته معاملات و گزارش تاریخچه سفارشات |
| `easytrader_send_order` | 🔴 Write | ارسال مستقیم سفارش خرید یا فروش با اعتبار روز یا معتبر تا تاریخ |
| `easytrader_update_order` | 🔴 Write | ویرایش آنی قیمت یا حجم سفارش در صف معاملات |
| `easytrader_cancel_order` | 🔴 Write | لغو و حذف سفارش باز از هسته معاملات با شناسه سفارش |
| `easytrader_get_drafts` | 🟢 Read | دریافت پیش‌نویس‌های آفلاین ذخیره‌شده |
| `easytrader_create_draft` | 🔴 Write | ثبت پیش‌نویس سفارش برای بررسی یا تایید دستی در پنل |
| `easytrader_get_notifications` | 🟢 Read | پایش پیام‌های ناظر بازار، توقف نمادها و اطلاعیه‌های مهم |

</div>

---

## 🚀 راه‌اندازی در ۳۰ ثانیه

### ۱. کلون و نصب پکیج
```bash
git clone https://github.com/Hesvm/easytrader-mcp.git
cd easytrader-mcp
npm install
```

### ۲. استخراج توکن (فقط یک‌بار)
1. وارد حساب خود در [d.easytrader.ir](https://d.easytrader.ir) شوید.
2. کلید `F12` (یا `Cmd + Option + I`) را بزنید و به تب **Network** بروید.
3. یک درخواست به `api-mts` پیدا کنید و از بخش **Request Headers** مقدار `Authorization` (که با `Bearer eyJ...` شروع می‌شود) را کپی کنید.
4. توکن را در فایل تنظیمات محلی ذخیره کنید:
```bash
echo '{"token": "Bearer YOUR_COPIED_TOKEN"}' > ~/.easytrader-session.json
```
*(البته هر زمان توکنتان منقضی شد، کافی است به هوش مصنوعی بگویید: «توکن جدیدم اینه: Bearer eyJ...» تا با ابزار `easytrader_update_session` خودش سشن را نو کند!)*

### ۳. تست اتصال زنده
```bash
npm test
```

---

## 🤖 تنظیم در کلاینت‌های مختلف

<details open>
<summary><b>Google Antigravity</b></summary>

در فایل `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```
</details>

<details>
<summary><b>Claude Desktop</b></summary>

در فایل `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```
</details>

<details>
<summary><b>Cursor</b></summary>

در فایل `.cursor/mcp.json` پروژه خود:
```json
{
  "mcpServers": {
    "easytrader": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Projects/easytrader-mcp/bin/cli.js"]
    }
  }
}
```
</details>

---

## 🔒 امنیت و حریم خصوصی؛ خیالتان راحت!

امنیت حساب و سرمایه شما اولویت شماره یک این معماری است:
1. **بدون ذخیره پسورد:** هیچ نام کاربری، پسورد یا کد ورود دومرحله‌ای ذخیره نمی‌شود.
2. **محلی و Local-First:** این سرور مستقیماً روی رایانه شما اجرا می‌شود؛ هیچ ترافیک، داده یا پروکسی واسطه‌ای در کار نیست و بسته‌ها مستقیماً با پروتکل رمزنگاری‌شده TLS به سرورهای مفید ارسال می‌شوند.
3. **عدم ریسک بن شدن:** تمام هدرها، User-Agent و شناسه‌های کلاینت دقیقاً شبیه به نسخه دسکتاپ مرورگر شما شبیه‌سازی شده‌اند.
4. **گیت تمیز و امن:** فایل سشن و لاگ‌ها در `.gitignore` قرار دارند تا حتی تصادفی هم توکن به گیت‌پوش نشود.

---

## 🤝 مشارکت و سلب مسئولیت

- **سلب مسئولیت:** این پروژه یک پروژه متن‌باز غیررسمی برای تسهیل ارتباط ایجنت‌های هوش مصنوعی با استانداردهای وب مدرن است و وابستگی مستقیمی به کارگزاری مفید ندارد. مسئولیت تحلیل، ارسال سفارش و استراتژی‌های معاملاتی بر عهده خود کاربر است.
- **مشارکت:** هرگونه پیشنهاد، بهینه‌سازی فیلترها یا Pull Request با روی باز پذیرفته می‌شود!

---

<div align="center">
ساخته‌شده با ❤️ برای تریدرها و مهندسان هوش مصنوعی ایران
</div>
