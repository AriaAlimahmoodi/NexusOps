# فاز ۹ — ورود عمومی، نرمال‌سازی و انتشار اتمیک داده واقعی

## اصل معماری

NexusOps یک سیستم مبتنی بر قراردادهای canonical است. Dataset Registry مرجع قطعی ساختار، نوع و نقش فیلدها و محدودیت‌های داده است. هر منبع خارجی باید با این قرارداد تطبیق داده شود؛ هیچ منبعی مجاز نیست Schema یا منطق تحلیلی پروژه را به‌صورت ضمنی تغییر دهد.

مسیر عمومی:

```text
External source
    |
    v
Source adapter (source-specific parsing and mapping)
    |
    v
Canonical record stream
    |
    v
Registry-driven normalization and validation
    |
    v
Private versioned staging index
    |
    v
Dataset-level validation
    |
    v
Atomic Elasticsearch alias switch
    |
    v
Stable Registry real_index alias
```

## اجزای پیاده‌سازی‌شده

### ۱. نرمال‌سازی canonical

ماژول `tools/data_normalization.py`:

- نوع داده را از Dataset Registry می‌خواند.
- رشته‌ها را trim می‌کند.
- مقادیر عددی متنی را به integer/float تبدیل می‌کند.
- Booleanهای متنی متعارف را نرمال می‌کند.
- فیلدهای خارج از قرارداد Dataset را با `UNKNOWN_DATASET_FIELD` رد می‌کند.
- محدوده‌های عددی ثبت‌شده در Registry را بررسی می‌کند.
- قرارداد provenance و timezone را کنترل می‌کند.
- فقط فیلدهای canonical و نشانگر `data_classification=real` را برمی‌گرداند.
- رکورد ورودی را تغییر نمی‌دهد.

این ماژول منبع‌محور نیست. Adapter هر منبع باید قبل از فراخوانی آن، نام و معنای فیلدهای منبع را به فیلدهای canonical نگاشت کند.

### ۲. انتشار اتمیک

ماژول `tools/atomic_data_publisher.py`:

1. Dataset و قرارداد manifest را بررسی می‌کند.
2. یک physical index نسخه‌ای و خصوصی ایجاد می‌کند.
3. اگر نسخه قبلی وجود داشته باشد، داده فعلی را به staging کپی می‌کند.
4. رکوردهای ورودی را به‌صورت batchهای محدود اعتبارسنجی و Bulk می‌کند.
5. در صورت هر خطای اعتبارسنجی یا Bulk، نسخه staging را منتشر نمی‌کند.
6. تعداد اسناد را بررسی می‌کند.
7. با یک درخواست `_aliases`، Alias پایدار Registry را از نسخه قبلی به نسخه جدید منتقل می‌کند.
8. نسخه قبلی را برای rollback نگه می‌دارد و خودکار حذف نمی‌کند.

Bulk API ذاتاً تراکنشی نیست. تضمین این طراحی، **اتمی بودن انتشار و مشاهده نسخه کامل** است: خواننده یا نسخه قبلی را می‌بیند یا نسخه جدید را، نه staging نیمه‌کاره را.

### ۳. قرارداد نام‌گذاری

نام `real_index` در Registry نام پایدار Alias باقی می‌ماند؛ physical indexها با الگوی زیر ساخته می‌شوند:

`<real_index>__v_<unique_version>`

در اولین انتشار، Alias ساخته می‌شود. اگر نام `*_real` از قبل یک concrete index باشد و Alias نباشد، Publisher متوقف می‌شود و مهاجرت یک‌باره باید جداگانه و با بررسی انجام شود؛ هیچ ایندکس موجودی خودکار حذف یا جایگزین نمی‌شود.

نسخه‌های قدیمی به‌صورت پیش‌فرض نگهداری می‌شوند. سیاست retention و حذف نسخه‌های قدیمی هنوز فعال نشده است.

### ۴. مسیرهای ورود

تابع عمومی `ingest_real_records` اکنون به Publisher اتمیک هدایت می‌شود. CLI موجود نیز در حالت `--apply` از انتشار اتمیک استفاده می‌کند. حالت بدون `--apply` همچنان فقط اعتبارسنجی می‌کند و چیزی نمی‌نویسد.

## محدودیت عملیاتی فعلی

- قفل Publisher درون یک process است. تا زمان اضافه شدن هماهنگی توزیع‌شده، برای هر Dataset فقط یک فرایند انتشار هم‌زمان اجرا شود.
- اگر نام `*_real` قبلاً concrete index باشد، مهاجرت به Alias لازم است؛ Publisher از انجام خودکار این تغییر حساس خودداری می‌کند.
- CLI فعلی JSON را در حافظه می‌خواند. برای فایل‌های بزرگ مانند CSV حدود ۳۹۲ مگابایتی JobVision، باید Adapter جریانی اضافه شود؛ نباید از بارگذاری کامل CSV در RAM استفاده شود.
- هیچ داده واقعی در نتیجه این تغییرات وارد Elasticsearch نشده است.

## JobVision و تطبیق معنایی

JobVision یک منبع آگهی شغلی در سطح هر آگهی است؛ در حالی که Dataset canonical فعلی `labor_market` تجمیع تقاضای مهارت را نگه می‌دارد. مبدل باید همه ردیف‌های منبع را پردازش کند و فقط اطلاعاتی را به مدل canonical تبدیل کند که معنای آن با فیلدهای ثبت‌شده سازگار است.

فیلدهایی مانند حقوق، استان و دورکاری در Schema فعلی `labor_market` نماینده مستقیم ندارند. نباید آن‌ها را با معنای نادرست در فیلدهای موجود قرار داد یا بی‌صدا به سند canonical افزود. همچنین JobVision فیلد مستقیم `demand_score` مطابق مقیاس ۰ تا ۵ پروژه ارائه نمی‌کند؛ تعریف فرمول مشتق‌شده باید پیش از Import نهایی و مستند شود. تا آن زمان Adapter نباید امتیاز ساختگی تولید کند.

مجوز منبع JobVision برابر CC BY-NC 4.0 است؛ استفاده باید غیرتجاری و همراه با انتساب مناسب باشد.

## تست‌های افزوده‌شده

- `tests/test_data_normalization.py`: تبدیل نوع، trim، فیلد ناشناخته، محدوده عددی، رد Boolean به‌عنوان عدد و عدم تغییر ورودی.
- `tests/test_atomic_data_publisher.py`: اولین انتشار، حفظ نسخه قبلی، رد رکورد نامعتبر، عدم انتشار پس از شکست Bulk و کلید مرکب.
- `tests/test_data_ingestion.py`: بررسی اینکه ورودی عمومی به Publisher اتمیک هدایت می‌شود.

## گام پذیرش محلی

پس از دریافت تغییرات روی شاخه `refactor/integration-foundation`:

```powershell
python -m py_compile tools/data_normalization.py tools/data_ingestion.py tools/atomic_data_publisher.py scripts/ingest_real_dataset.py
python -m pytest -q tests/test_data_normalization.py tests/test_atomic_data_publisher.py tests/test_data_ingestion.py
```

پس از موفقیت این مجموعه، تست کامل پروژه اجرا می‌شود. Import واقعی JobVision تا تکمیل Adapter جریانی و تعیین معنای معیار تقاضا متوقف می‌ماند.
