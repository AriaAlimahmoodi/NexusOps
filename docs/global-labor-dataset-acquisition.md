# دریافت دیتاست‌های واقعی ESCO و Remotive

این مرحله فقط دریافت و آرشیو خام است. هیچ نرمال‌سازی، استخراج مهارت، deduplication یا نوشتن در Elasticsearch انجام نمی‌شود.

## محدوده

- ESCO: طبقه‌بندی مهارت‌ها و مشاغل از Web Service API، با زبان انگلیسی و نسخه پیش‌فرض API.
- Remotive: تمام آگهی‌های فعال موجود در پاسخ عمومی API در زمان دریافت.
- حفظ پاسخ خام هر صفحه، زمان دریافت، پارامترهای منبع، checksum و منشأ داده.

**نکته نسخه ESCO:** درخواست‌های مشاهده‌شده با `selectedVersion=1.2.0` و `selectedVersion=1.2.1` خطای HTTP 500 برگرداندند؛ درخواست بدون این پارامتر موفق بود. بنابراین دریافت‌کننده فعلاً `selectedVersion` را ارسال نمی‌کند و داده را با برچسب `api-default` ذخیره می‌کند. تا زمانی که نسخه دقیق پاسخ API مستقلاً تأیید نشده، نباید آن را ESCO v1.2.1 نامید.

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

## قرارداد API و صفحه‌بندی ESCO

- مسیرهای typed عبارت‌اند از `/resource/skill` و `/resource/occupation`.
- دریافت مجموعه با پارامتر `isInScheme` انجام می‌شود؛ `uri` برای دریافت یک مفهوم یا مشخصات Scheme است.
- در پاسخ واقعی بررسی‌شده، `limit=5` و `offset=0` لینک صفحه بعد با `offset=5` تولید کردند. بنابراین offset تعداد رکوردهای ردشده است و باید به اندازه `page_size` افزایش یابد.
- پاسخ Collection دارای `total` و `_embedded` با ساختار نگاشت URI به شیء رکورد است؛ استخراج‌کننده هر دو ساختار URI-keyed و named-list را پشتیبانی می‌کند.
- کامل بودن دریافت با مقایسه `offset + تعداد رکوردهای صفحه` با `total` تعیین می‌شود.

## ساختار فایل‌های خام

```text
data/raw/
  esco/
    api-default/
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

فایل‌های ESCO پاسخ خام هر صفحه هستند؛ فایل Remotive نیز پاسخ خام کامل API است. هیچ فیلدی از پاسخ منبع حذف یا تغییر داده نمی‌شود.

## نکات عملیاتی و حقوقی

- Remotive فقط آگهی‌های فعال را ارائه می‌کند و آرشیو تاریخی یا کل بازار جهانی نیست.
- Remotive حداکثر چهار درخواست در روز را توصیه می‌کند. دریافت اولیه فقط یک درخواست بدون فیلتر می‌زند؛ اجرای مجدد به‌صورت پیش‌فرض snapshot موجود را بازاستفاده می‌کند.
- در هر استفاده بعدی از آگهی‌ها، Remotive باید به‌عنوان منبع ذکر شود و URL اصلی آگهی حفظ شود. آگهی‌ها نباید به سایت‌های تجمیع‌کننده شغلی ثالث ارسال شوند.
- داده‌های خام را به Git commit نکنید؛ آن‌ها در `data/raw` محلی نگهداری می‌شوند.
- اگر شکل پاسخ ESCO با ساختار مورد انتظار سازگار نباشد، اسکریپت متوقف می‌شود و فایل خام همان صفحه را برای بررسی حفظ می‌کند.

## اعتبارسنجی پس از دریافت

خلاصه نهایی در `data/raw/global_labor_acquisition_manifest.json` ذخیره می‌شود. مقدار `complete` برای هر بخش ESCO باید `true` باشد. سپس تعداد رکوردها، URIهای تکراری، فیلدهای اجباری و ارتباطات مهارت-شغل در مرحله پروفایل‌سازی بررسی خواهند شد.
