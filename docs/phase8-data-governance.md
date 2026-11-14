# فاز ۸ — حاکمیت داده و جداسازی داده مصنوعی/واقعی

## تصمیم معماری

NexusOps دو طبقه مستقل داده دارد:

| طبقه | ایندکس | کاربرد |
|---|---|---|
| Synthetic | پنج ایندکس فعلی بدون تغییر | توسعه، آزمایش، benchmark و regression |
| Real | پسوند \`_real\` برای هر Dataset | شواهد واقعی با منشأ قابل ردیابی |

پنج ایندکس فعلی \`university_graduates\`، \`university_courses\`، \`course_graduate_records\`، \`labor_market\` و \`skill_mapping\` مصنوعی/آزمایشی باقی می‌مانند. هیچ سندی برای تکمیل ظاهری provenance بازنویسی نمی‌شود. طبقه‌بندی در metadata پروفایل Registry ثبت می‌شود، نه با تزریق فیلد به اسناد legacy.

ایندکس‌های داده واقعی:

- \`university_graduates_real\`
- \`university_courses_real\`
- \`course_graduate_records_real\`
- \`labor_market_real\`
- \`skill_mapping_real\`

در این مرحله هیچ ایندکس واقعی ساخته یا پر نشده است؛ فقط مسیر اعتبارسنجی و ورود کنترل‌شده آماده شده است.

## قرارداد provenance رکورد واقعی

فیلدهای الزامی:

| فیلد | معنا |
|---|---|
| \`source\` | شناسه یا نشانی قابل ردیابی منبع |
| \`observed_at\` | زمان دریافت/مشاهده با timezone |
| \`collection_batch\` | شناسه batch |
| \`time_granularity\` | دانه‌بندی زمانی مانند daily، weekly، monthly یا event |

فیلدهای اختیاری:

- \`published_at\`: تاریخ انتشار منبع؛ نباید بعد از \`observed_at\` باشد.
- \`valid_from\` و \`valid_until\`: باید با هم ارائه شوند و بازه معکوس نباشد.

همه timestampها باید ISO-8601 و timezone-aware باشند. زمان اعتبار داده با زمان گردآوری آن یکسان نیست.

## قرارداد manifest هر batch

هر فایل ورودی باید یک \`manifest\` و آرایه \`records\` داشته باشد. manifest باید شامل این موارد باشد:

- \`collection_batch\`
- \`source_name\`
- \`source_url\`
- \`publisher\`
- \`retrieved_at\`
- \`geographic_scope\`
- \`license\`
- \`collection_method\`
- \`limitations\`

شناسه batch در تمام رکوردهای همان فراخوانی باید با manifest یکسان باشد. هر فراخوانی ingestion یک batch مستقل است. batchهای متعدد را می‌توان جداگانه وارد و با حفظ شناسه batch مقایسه کرد.

## مسیر ورود داده

\`tools/data_ingestion.py\` پیش از هر نوشتن:
1. Dataset ID را در Registry بررسی می‌کند.
2. فیلدهای اجباری دامنه و کلید اصلی را کنترل می‌کند.
3. provenance و سازگاری timestampها را بررسی می‌کند.
4. یکتایی کلید اصلی در همان batch را بررسی می‌کند.
5. manifest و تطابق collection_batch را اعتبارسنجی می‌کند.
6. کل batch را پیش از عملیات bulk رد یا قبول می‌کند.
7. فقط داده پذیرفته‌شده را به ایندکس \`*_real\` می‌فرستد و \`data_classification=real\` ثبت می‌کند.

ماژول ingestion هیچ مسیر نوشتنی به ایندکس‌های synthetic ندارد. CLI به‌صورت پیش‌فرض فقط اعتبارسنجی می‌کند؛ نوشتن فقط با \`--apply\` صریح انجام می‌شود.

## قالب ورودی JSON

\`\`\`json
{
  "manifest": {
    "collection_batch": "batch-2026-11-14-001",
    "source_name": "نام مجموعه داده",
    "source_url": "https://example.org/dataset",
    "publisher": "ناشر",
    "retrieved_at": "2026-11-14T00:00:00Z",
    "geographic_scope": "دامنه جغرافیایی",
    "license": "مجوز",
    "collection_method": "روش گردآوری",
    "limitations": "محدودیت‌های پوشش"
  },
  "records": [
    {
      "market_record_id": "شناسه واقعی رکورد",
      "skill": "نام مهارت",
      "demand_score": 4.2,
      "frequency": 120,
      "source": "https://example.org/source-record",
      "observed_at": "2026-11-14T00:00:00Z",
      "collection_batch": "batch-2026-11-14-001",
      "time_granularity": "daily"
    }
  ]
}
\`\`\`

این نمونه فقط قالب است و داده واقعی محسوب نمی‌شود.

## CLI

اعتبارسنجی بدون نوشتن:

\`\`\`powershell
python -m scripts.ingest_real_dataset --dataset labor_market --input data/real/labor_market_batch.json
\`\`\`

نوشتن صریح پس از بررسی منبع و فایل:

\`\`\`powershell
python -m scripts.ingest_real_dataset --dataset labor_market --input data/real/labor_market_batch.json --apply
\`\`\`

بدون \`--apply\` هیچ سندی در Elasticsearch نوشته نمی‌شود. چون هنوز منبع یا batch واقعی انتخاب و مستند نشده، فعلاً فقط مسیر اعتبارسنجی و تست را اجرا می‌کنیم.

## ممیزی

\`scripts/audit_phase8_data.py\` ایندکس‌های synthetic را با طبقه‌بندی synthetic گزارش می‌کند و فقط در صورت وجود ایندکس \`*_real\` آن را می‌خواند. داده مصنوعی به‌اشتباه verified یا unverified واقعی شمرده نمی‌شود. Provenance فقط برای طبقه real ارزیابی می‌شود.

گزارش شامل شمار رکوردهای synthetic، verified، unverified و invalid و اعتبار نگاشت‌های synthetic و real (در صورت وجود هر سه ایندکس مرجع real) است. ممیزی read-only باقی می‌ماند.

## محدوده و عدم تغییر

- Workflow اصلی \`workflows/nexusops-agentic-workflow.json\` تغییر نمی‌کند.
- فایل‌های workflow تست و runnerها تغییر نمی‌کنند.
- ایندکس‌های فعلی و ۳۸۰ رکورد آن‌ها بازنویسی یا حذف نمی‌شوند.
- هیچ منبع، مجوز، تاریخ یا رکورد واقعی جعل نمی‌شود.
- داده‌های real تا زمان اتصال مستقل به لایه تحلیل، در ایندکس‌های جدا نگهداری می‌شوند.

## معیار پذیرش

- ۱۰۰٪ رکوردهای جدید real از مسیر validator عبور کنند.
- هیچ batch نامعتبر به Elasticsearch نوشته نشود.
- هیچ ingestion به ایندکس synthetic انجام نشود.
- manifest و temporal validity قابل ممیزی باشند.
- داده‌های synthetic و real در گزارش‌ها جدا بمانند.
- تمام تست‌های موجود و تست‌های جدید عبور کنند.
