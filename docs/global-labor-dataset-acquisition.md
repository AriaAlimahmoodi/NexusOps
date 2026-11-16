# دریافت دیتاست‌های واقعی ESCO و Remotive

این مرحله فقط دریافت و آرشیو خام است. هیچ نرمال‌سازی، استخراج مهارت، deduplication یا نوشتن در Elasticsearch انجام نمی‌شود.

## محدوده نسخه اول

- ESCO v1.2.1، زبان انگلیسی، طبقه‌بندی مهارت‌ها و مشاغل.
- Remotive، تمام آگهی‌های فعال موجود در پاسخ عمومی API در زمان دریافت.
- حفظ پاسخ خام هر صفحه، زمان دریافت، نسخه، URI طبقه‌بندی، checksum و منشأ داده.

نسخه فعلی ESCO و قالب‌های رسمی دانلود در وب‌سایت کمیسیون اروپا معرفی شده‌اند. برای استفاده برنامه‌ای، این پروژه از endpointهای صفحه‌بندی‌شده Web Service استفاده می‌کند.

## اجرای دریافت

از ریشه پروژه و با محیط مجازی فعال:

دریافت کامل ESCO:
```powershell
python -m scripts.acquire_global_labor_datasets --source esco
```

دریافت Remotive:
```powershell
python -m scripts.acquire_global_labor_datasets --source remotive
```

هر دو منبع:
```powershell
python -m scripts.acquire_global_labor_datasets --source all
```

تست محدود اولیه ESCO (فقط دو صفحه برای هر طبقه‌بندی):
```powershell
python -m scripts.acquire_global_labor_datasets --source esco --max-pages 2
```

پس از تست محدود، برای تکمیل ESCO همان دستور بدون `--max-pages` را اجرا کنید. صفحه‌های موجود دوباره دانلود نمی‌شوند و دریافت از صفحه بعد ادامه می‌یابد.

Remotive در صورت وجود فایل snapshot قبلی، آن را استفاده می‌کند و API را دوباره فراخوانی نمی‌کند. برای دریافت snapshot تازه، فقط در صورت نیاز و با رعایت سقف توصیه‌شده ارائه‌دهنده:
```powershell
python -m scripts.acquire_global_labor_datasets --source remotive --refresh-remotive
```

## ساختار فایل‌های خام

```text
data/raw/
  esco/
    v1.2.1/
      en/
        skills/
          page_00000.json
          page_00001.json
          manifest.json
        occupations/
          page_00000.json
          manifest.json
  remotive/
    remote_jobs.json
    manifest.json
  global_labor_acquisition_manifest.json
```

فایل‌های ESCO، پاسخ‌های خام HAL هر صفحه هستند؛ فایل‌های Remotive نیز پاسخ خام کامل API هستند. هیچ فیلدی از پاسخ منبع حذف یا تغییر داده نمی‌شود.

## نکات عملیاتی و حقوقی

- مستند ESCO می‌گوید `offset` شماره صفحه است، نه تعداد رکوردهای ردشده؛ بنابراین در هر درخواست یک واحد افزایش می‌یابد.
- مسیرهای typed ESCO عبارت‌اند از `/resource/skill` و `/resource/occupation`.
- Remotive فقط آگهی‌های فعال را ارائه می‌کند و آرشیو تاریخی یا کل بازار جهانی نیست.
- Remotive حداکثر چهار درخواست در روز را توصیه می‌کند. دریافت اولیه فقط یک درخواست بدون فیلتر می‌زند؛ اجرای مجدد به‌صورت پیش‌فرض snapshot موجود را بازاستفاده می‌کند.
- در هر استفاده بعدی از آگهی‌ها، Remotive باید به‌عنوان منبع ذکر شود و URL اصلی آگهی حفظ شود. آگهی‌ها نباید به سایت‌های تجمیع‌کننده شغلی ثالث ارسال شوند.
- داده‌های خام را به Git commit نکنید؛ حجم، تغییرپذیری و شرایط منبع، محل مناسب آن‌ها را در `data/raw` محلی نگه می‌دارد.
- اگر شکل پاسخ ESCO با HAL Collection مورد انتظار متفاوت باشد، اسکریپت با خطای صریح متوقف می‌شود و فایل خام همان صفحه را برای بررسی حفظ می‌کند.

## اعتبارسنجی پس از دریافت

خلاصه نهایی در `data/raw/global_labor_acquisition_manifest.json` ذخیره می‌شود. مقدار `complete` برای هر بخش ESCO باید `true` باشد. سپس تعداد رکوردها، URIهای تکراری، فیلدهای اجباری و ارتباطات مهارت-شغل در مرحله پروفایل‌سازی بررسی خواهند شد.
