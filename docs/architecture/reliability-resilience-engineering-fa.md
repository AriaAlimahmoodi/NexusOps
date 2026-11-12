# NexusOps — مهندسی قابلیت اطمینان و تاب‌آوری

## هدف و مرز تغییر

این بسته پنج محور Fault Injection، جداسازی هم‌زمانی، Retry/Recovery، صحت عددی و Release Gate را در یک تغییر معماری یکپارچه می‌کند. موتور تحلیل، قرارداد ابزارهای MCP، مدل محلی Ollama و توپولوژی فعلی n8n بازنویسی نمی‌شوند؛ تغییرات روی مرزهای اجرایی، اعتبارسنجی خروجی، آزمون‌ها و فرایند پذیرش متمرکز هستند.

وضعیت مبنا:
- MCP Runtime Acceptance: شش سناریو موفق.
- Agentic E2E Acceptance: چهار سناریو موفق.
- Agent workflow: ۲۸ Node و ۲۷ Connection.
- ابزارهای تحلیلی فقط خواندنی هستند؛ Retry فعلی برای عملیات read-only تعریف شده است.

## نمای معماری

~~~text
n8n Chat Trigger
      |
      v
Ollama Planner / Answer Writer
      |
      v
MCP Streamable HTTP Client
  | request correlation
  | bounded retry / fresh session
  | strict result validation
      |
      v
NexusOps MCP Server
  | bounded semaphore
  | asyncio.to_thread
  | isolated Elasticsearch client per operation
      |
      v
Analytics Engine
  | request validation
  | field resolution
  | query execution
  | numerical result validation
      |
      v
Elasticsearch
~~~

## ۱. Fault Injection

Fault injection فقط در لایه آزمون انجام می‌شود و به endpoint عملیاتی برای تزریق خطا نیاز ندارد. آزمون‌ها transport failure، cancellation، پاسخ protocol error و ساختار داده نامعتبر را با fake transport/session کنترل‌شده تزریق می‌کنند.

| تزریق | رفتار الزامی |
|---|---|
| خطای موقت اتصال | تلاش مجدد با session تازه |
| timeout / exhaustion | توقف در سقف retry و پاسخ failure صریح |
| cancellation | انتشار cancellation؛ بدون تلاش مجدد ناخواسته |
| MCP protocol error | شکست بسته؛ بدون تبدیل به نتیجه خالی |
| پاسخ با schema نامعتبر | رد پاسخ و جلوگیری از ثبت آن به‌عنوان evidence |
| خطای application/validation | بدون retry کور |

هیچ fault injection در داده واقعی Elasticsearch انجام نمی‌شود و هیچ write یا delete عملیاتی برای این آزمون‌ها اجرا نمی‌شود.

## ۲. جداسازی هم‌زمانی

- درخواست‌های یک conversation ID با قفل همان مکالمه serialize می‌شوند تا ترتیب turn و حافظه حفظ شود.
- conversation IDهای متفاوت state مستقل دارند و می‌توانند هم‌زمان اجرا شوند.
- عملیات blocking در MCP با semaphore مشترک محدود می‌شوند و در worker thread اجرا می‌شوند.
- ظرفیت semaphore تا پایان واقعی worker thread آزاد نمی‌شود؛ cancellation درخواست نباید باعث آزادسازی زودهنگام ظرفیت شود.
- state مکالمه process-local است؛ این پیاده‌سازی distributed session store نیست و برای چند replica به backend اشتراکی نیاز خواهد داشت.

پوشش خودکار در pytest جداسازی state و ترتیب turnها را در لایه Python client بررسی می‌کند. اسکریپت live نیز سه درخواست مستقل را هم‌زمان به Chat Trigger واقعی n8n ارسال می‌کند و جداسازی بین sessionهای n8n را می‌سنجد؛ این اسکریپت ادعای آزمون ترتیب درخواست‌های هم‌زمان در یک session از n8n را ندارد.

## ۳. Retry و Recovery

سیاست MCP:
- هر تلاش، Streamable HTTP session مستقل و تازه باز می‌کند.
- فقط transport errors و timeoutها retry می‌شوند.
- validation error، application error، protocol error و cancellation retry نمی‌شوند.
- سقف تنظیم‌پذیر تلاش‌ها ۱ تا ۵ است؛ مقدار پیش‌فرض فعلی ۲ است.
- تأخیر retry از backoff نمایی با base قابل تنظیم پیروی می‌کند.
- پس از اتمام بودجه retry، نتیجه failure است و هرگز به empty result تبدیل نمی‌شود.

برای عملیات read-only فعلی، retry transport-interrupted مجاز است. اگر ابزارهای تغییردهنده داده اضافه شوند، باید idempotency key و سیاست جداگانه طراحی شود؛ سیاست فعلی نباید برای mutationها کپی شود.

## ۴. صحت عددی و قرارداد خروجی

مرز خروجی Analytics موارد زیر را enforce می‌کند:
- COUNT باید integer واقعی، غیرمنفی و غیر-boolean باشد؛ ۳۰٫۰ یا true شمارش معتبر نیست.
- SELECT باید تعداد records بازگشتی را با طول records list منطبق کند.
- total_records نمی‌تواند از returned_records کمتر باشد.
- metricهای AGGREGATE باید عدد متناهی یا null باشند؛ NaN، Infinity، boolean و مقدار متنی پذیرفته نمی‌شوند.
- execution_time_ms نیز باید عدد متناهی و غیرمنفی باشد.
- خطای اجرا با نتیجه خالی یا count صفر اشتباه گرفته نمی‌شود.

آزمون‌های واحد قرارداد عددی را با مقادیر مرزی و ناسالم بررسی می‌کنند. برای پذیرش runtime، مقادیر زنده باید با query مستقل Kibana Dev Tools مطابق runbook تحلیل مقایسه شوند.

## ۵. Release Gate

اسکریپت واحد scripts/release_gate.py مراحل زیر را اجرا می‌کند:
1. Parse نحوی تمام فایل‌های Python پروژه، به‌جز محیط‌های مجازی و node_modules.
2. اجرای کامل pytest روی tests.
3. در صورت درخواست، اجرای runtime_preflight برای Elasticsearch، Ollama، MCP و n8n.
4. در صورت درخواست live concurrency، ارسال سه درخواست هم‌زمان به Production Chat Trigger با session ID مستقل.

دستورهای اجرا:

~~~powershell
python scripts/release_gate.py
python scripts/release_gate.py --with-runtime-preflight
python scripts/release_gate.py --with-live-concurrency
~~~

گزینه live concurrency به‌صورت خودکار preflight را نیز اجرا می‌کند. گزارش نهایی JSON است و وضعیت هر gate را جداگانه ثبت می‌کند. اگر preflight یا live concurrency اجرا نشده باشد، وضعیت آن NOT_RUN است و نباید به‌عنوان PASS گزارش شود.

Release Gate خودکار جایگزین دو پذیرش زیر نیست:
- اجرای workflow مستقل NexusOps Agentic E2E Acceptance Suite در n8n.
- مقایسه عددی خروجی‌های live با queryهای مستقل Elasticsearch در Kibana Dev Tools.

## ماتریس پوشش آزمون

| حوزه | آزمون خودکار | پذیرش runtime |
|---|---|---|
| Fault Injection | transport، cancellation، protocol error، schema mismatch | preflight و اجرای واقعی workflow پس از انتشار |
| Conversation isolation | serialize شدن turnهای هم‌مکالمه و اجرای موازی مکالمات مستقل | live concurrent Chat Trigger |
| Retry / Recovery | سقف تلاش، backoff، عدم retry خطاهای قطعی | مشاهده نتیجه واقعی MCP در سرویس محلی |
| Numerical integrity | count، totals، finite metrics و schema | مقایسه با query مستقل Kibana |
| Release Gate | syntax + pytest + گزارش machine-readable | preflight + live concurrency + Agentic E2E |

## محدودیت‌های صریح

- تست‌های Fault Injection، مرز کلاینت و قراردادهای MCP را با transport/session شبیه‌سازی‌شده می‌سنجند؛ این تست‌ها به‌تنهایی خرابی شبکه فیزیکی یا خرابی process را اثبات نمی‌کنند.
- live concurrency سه session مستقل را هم‌زمان آزمایش می‌کند؛ این تست اثبات‌کننده ترتیب درخواست‌های یک session در n8n نیست؛ آزمون قفل conversation فقط ترتیب turnها را در لایه Python client پوشش می‌دهد.
- preflight فقط readiness سرویس‌ها و registry ابزارها را می‌سنجد؛ موفقیت یک درخواست تحلیلی را اثبات نمی‌کند.
- Release Gate با گزینه پیش‌فرض فقط static + pytest است. وضعیت live در این حالت NOT_RUN می‌ماند.
- state مکالمه در حافظه همان process نگهداری می‌شود و در restart یا چند replica مشترک نیست.
