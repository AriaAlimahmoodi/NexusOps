# اتصال‌دهنده‌های منابع جهانی بازار کار

در این مرحله دو اتصال‌دهنده فقط‌خواندنی به NexusOps اضافه شده‌اند:

- **ESCO**: طبقه‌بندی ساختاریافته مشاغل و مهارت‌های کمیسیون اروپا.
- **Remotive**: آگهی‌های فعال مشاغل دورکار از پلتفرم Remotive.

این اتصال‌دهنده‌ها پاسخ خام API را برمی‌گردانند. در این مرحله هیچ داده‌ای نرمال‌سازی نمی‌شود، هیچ ایندکسی در Elasticsearch ساخته نمی‌شود و هیچ داده‌ای به Elasticsearch نوشته نمی‌شود. دریافت و ورود دیتاست‌ها مرحله‌ای مستقل است.

## ۱. ESCO

آدرس پایه پیش‌فرض:

`https://ec.europa.eu/esco/api`

ابزارهای MCP:

- `search_esco_concepts`: جست‌وجوی مفاهیم با عملیات مستندشده `GET /search`.
- `fetch_esco_concepts`: دریافت صفحه‌ای از مفاهیم با عملیات `GET /resource/concept` و شناسه صریح Concept Scheme.

نمونه آرگومان جست‌وجو:

```json
{
  "text": "Python",
  "language": "en",
  "concept_type": "Skill",
  "limit": 20,
  "offset": 0
}
```

برای دریافت صفحه‌ای مفاهیم، URI مربوط به Concept Scheme باید صریحاً ارسال شود:

- مهارت‌ها: `http://data.europa.eu/esco/concept-scheme/skills`
- مشاغل: `http://data.europa.eu/esco/concept-scheme/occupations`

**وضعیت تغییر API:** کمیسیون اروپا در ۱۷ سپتامبر ۲۰۲۶ اعلام کرده است که API به نسخه جدید مبتنی بر OpenAPI منتقل می‌شود و برای سرویس جدید API Key لازم خواهد بود. تا زمان انتشار قرارداد نهایی endpoint و روش احراز هویت، این پیاده‌سازی از عملیات مستندشده Web Service فعلی استفاده می‌کند. آدرس پایه از طریق `ESCO_API_BASE_URL` قابل تغییر است. هیچ هدر احراز هویت حدس زده یا جعل نشده است.

مستندات رسمی:

- https://esco.ec.europa.eu/en/use-esco/use-esco-services-api/esco-web-service-api
- https://ec.europa.eu/esco/api/doc/esco_api_doc.html
- https://esco.ec.europa.eu/en/news/upcoming-change-esco-api
- https://esco.ec.europa.eu/en/use-esco/download

## ۲. Remotive

آدرس پایه پیش‌فرض:

`https://remotive.com/api`

ابزار MCP:

- `fetch_remotive_jobs`: فراخوانی `GET /remote-jobs`.

فیلترهای اختیاری:

- `search`: جست‌وجوی متنی در عنوان و توضیحات آگهی.
- `category`: دسته‌بندی یا slug دسته‌بندی، مانند `software-dev`.
- `company_name`: فیلتر نام شرکت.
- `limit`: حداکثر تعداد آگهی‌های بازگشتی.

API عمومی مستندشده به API Key نیاز ندارد. پاسخ خام برگردانده می‌شود و باید آرایه `jobs` داشته باشد.

**محدودیت‌ها و شرایط ارائه‌دهنده:**

- آگهی‌ها با تأخیر ۲۴ ساعته ارائه می‌شوند.
- Remotive حداکثر چهار درخواست API در روز را توصیه می‌کند.
- در هر نمایش بعدی باید Remotive به‌عنوان منبع ذکر شود و لینک آگهی اصلی Remotive حفظ شود.
- ارسال آگهی‌های Remotive به وب‌سایت‌های تجمیع‌کننده شغلی ثالث طبق شرایط ارائه‌دهنده مجاز نیست.

هنگام طراحی لایه ورود داده باید شناسه آگهی، منبع، URL اصلی و زمان دریافت حفظ شوند. داده‌های Remotive به‌تنهایی نماینده کل بازار کار جهان نیستند و باید با عنوان «نمونه آگهی‌های دورکار Remotive» گزارش شوند.

مستندات رسمی:

- https://remotive.com/remote-jobs/api
- https://github.com/remotive-com/remote-jobs-api

## ۳. متغیرهای محیطی

مقادیر پیش‌فرض و قابل تغییر:

```dotenv
ESCO_API_BASE_URL=https://ec.europa.eu/esco/api
REMOTIVE_API_BASE_URL=https://remotive.com/api
```

برای endpointهای عمومی پیاده‌سازی‌شده در این مرحله، credential لازم نیست. هیچ کلید یا رمز عبوری نباید در Git ثبت شود.

## ۴. مرزهای اجرایی این مرحله

- این ابزارها فقط داده را دریافت می‌کنند و در Elasticsearch چیزی نمی‌نویسند.
- درخواست‌های Remotive باید با رعایت سقف توصیه‌شده چهار درخواست در روز انجام شوند.
- دریافت کامل طبقه‌بندی ESCO باید صفحه‌بندی‌شده و کنترل‌شده باشد.
- دانلود دیتاست، ذخیره‌سازی خام، نرمال‌سازی، استخراج مهارت از آگهی‌ها با Ollama و تطبیق با شناسه‌های ESCO در فاز بعدی انجام می‌شوند.
- داده خام و شواهد منشأ داده باید پیش از هرگونه تحلیل حفظ شوند.
