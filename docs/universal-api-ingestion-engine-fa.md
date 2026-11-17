# موتور عمومی دریافت API در NexusOps

## هدف و مرز مسئولیت
این موتور یک دریافت‌کننده HTTP API مبتنی بر پیکربندی است. APIهای متعارف
REST و GraphQL مبتنی بر POST/JSON با تعریف فایل منبع قابل دریافت‌اند؛ برای
هر منبع جدید به Client اختصاصی Python نیاز نیست.

موتور فقط پاسخ خام را ذخیره می‌کند. هیچ نرمال‌سازی canonical، نگاشت معنایی،
پروفایل‌سازی، اعتبارسنجی Dataset Registry یا نوشتن در Elasticsearch انجام
نمی‌دهد. مسیرهای موجود Profiling، Source Mapping، Preflight، Governance و
Atomic Publisher مستقل باقی می‌مانند.

## اجزا
- tools/source_engine/config.py: بارگذاری و اعتبارسنجی پیکربندی JSON.
- tools/source_engine/runner.py: درخواست HTTP و مدیریت صفحه‌بندی.
- tools/source_engine/checkpoint.py: نوشتن اتمیک Checkpoint و Manifest.
- scripts/acquire_api_source.py: رابط خط فرمان عمومی.
- tools/adapters/configured_api_adapter.py: اتصال پیکربندی API به Adapter Registry موجود با قالب api_config؛ صفحه‌های خام ذخیره‌شده را دوباره می‌خواند و به‌صورت iterator در اختیار مسیر ingest_source و preflight قرار می‌دهد.
- configs/sources/: پیکربندی مستقل هر API.

## پیکربندی
هر فایل منبع شامل id، request، response و pagination است؛ reliability و
storage اختیاری‌اند. کلیدهای ناشناخته رد می‌شوند. Secretها با الگوی
${ENV:VARIABLE_NAME} از Environment خوانده می‌شوند.

درخواست GET یا POST با Header، Query، JSON Body، Content-Type و Timeout
قابل تنظیم است. پاسخ فعلی JSON است و records_path محل آرایه رکوردها را
مشخص می‌کند. برای پاسخ‌هایی مانند HAL که رکوردها در مقادیر یک object هستند،
record_key_mode برابر object_values قرار می‌گیرد.

روش‌های صفحه‌بندی:
- none: یک درخواست.
- page: افزایش شماره صفحه و توقف در صفحه کوتاه‌تر از page_size.
- offset: افزایش offset فقط به تعداد رکوردهای استخراج‌شده؛ total_path اختیاری.
- cursor: خواندن Cursor بعدی از response.next_cursor_path و رد Cursor تکراری.
- next_url: خواندن URL بعدی از response.next_url_path و محدودکردن آن به Origin اولیه.

حداکثر صفحات از حلقه بی‌نهایت جلوگیری می‌کند. رسیدن به سقف وضعیت partial
می‌سازد و اجرای بعدی از Checkpoint ادامه می‌یابد.

## قابلیت اطمینان و ذخیره
Retry برای کدهای وضعیت پیکربندی‌شده انجام می‌شود؛ پیش‌فرض 429 و 502/503/504
است و HTTP 500 عمداً پیش‌فرض Retry نمی‌شود. Backoff نمایی، Retry-After و
فاصله درخواست‌ها پشتیبانی می‌شوند.

هر پاسخ صفحه ابتدا در فایل موقت نوشته و اتمیک جایگزین می‌شود؛ سپس Checkpoint
به‌روزرسانی می‌شود. در صورت خطا پیش از ثبت Checkpoint، وضعیت صفحه به آخرین
صفحه commitشده بازگردانده می‌شود؛ Offset یا Cursor حدسی جلو نمی‌رود.
Manifest شامل SHA-256 صفحه‌های خام است.

فرمان:
python -m scripts.acquire_api_source --config configs/sources/my_api.json

خروجی در data/raw/api_sources/<source-id>/ ذخیره می‌شود. موتور هیچ اتصال Elasticsearch ندارد و هیچ Index یا Alias موجودی را تغییر نمی‌دهد.
برای اتصال به مسیر موجود Adapter Registry، format_name برابر api_config و
SourceSpec.uri برابر مسیر فایل پیکربندی است. Adapter تا کامل‌شدن دریافت، ورود
canonical را متوقف می‌کند؛ اجازه استفاده از دریافت partial فقط با گزینه صریح
allow_partial امکان‌پذیر است.

## پیکربندی‌های ESCO
دو فایل esco_skills.json و esco_occupations.json نمونه‌های واقعی پیکربندی
منبع‌اند و مسیر API و Schemeهای قبلاً بررسی‌شده را ثبت می‌کنند. این فایل‌ها
برای بازطراحی موتور اضافه شده‌اند؛ به معنی شروع یا تأیید دریافت مجدد ESCO
نیستند. با توجه به خطای HTTP 500 مشاهده‌شده، اجرای آن‌ها فعلاً متوقف است.

## محدودیت
پشتیبانی فعلی HTTP JSON است: REST و GraphQL مبتنی بر JSON POST. XML/SOAP،
WebSocket، OAuth تعاملی، امضای اختصاصی درخواست، فایل باینری و پروتکل‌های
ضدربات به Extension نیاز دارند. هدف، حذف کدنویسی اختصاصی برای APIهای
متعارف و قابل توصیف در پیکربندی است؛ نه ادعای پشتیبانی از هر پروتکل ممکن.
