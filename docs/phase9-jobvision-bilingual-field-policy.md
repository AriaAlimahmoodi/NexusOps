# JobVision bilingual field policy — read-only decision

## Scope

This document records the current source-to-canonical policy for the ten bilingual column pairs in `JobVision_Jobposts_Dataset.csv`.

The decision is based on:
- the bilingual structural/content audit and its final assessment;
- the current `labor_market` Dataset Registry profile;
- the source-independent canonical normalizer and ingestion contract;
- the current search field allowlist.

This is a source-to-canonical projection decision. It is not permission to modify the CSV, delete source columns, alter the Registry, or ingest JobVision.

## Governing contract

The current `labor_market` profile defines these fields:

- `market_record_id`
- `job_title`
- `job_field`
- `skill`
- `demand_score`
- `frequency`
- `experience_level`
- `source_type`

The analytical dimensions and metrics are defined by the Registry. The generic normalizer projects records onto registered canonical fields and supported provenance metadata; unsupported source attributes are discarded from canonical documents. Source adapters must perform semantic mapping before normalization.

The current search allowlist also uses canonical field names and contains no JobVision bilingual source-column names.

## Pair-by-pair decision

| Source columns | Assessment | Canonical target decision | Reason |
|---|---|---|---|
| `Company_ActivityTypeFa` / `Company_ActivityTypeEn` | Equivalent; translation good | Exclude both from `labor_market` | Company activity type has no direct field in the current target contract. |
| `Company_CityFa` / `Company_CityEn` | Equivalent; translation good | Exclude both | Company city is not represented in the current target contract. |
| `Company_IndustryFa` / `Company_IndustryEn` | Partial; material translation issues | Exclude both | Company industry is not the same concept as a job's `job_field`; observed translation mismatch also prevents treating the pair as interchangeable. |
| `Company_ProvinceFa` / `Company_ProvinceEn` | Equivalent; translation good | Exclude both | Company province has no direct field in the current target contract. |
| `Company_SizeFa` / `Company_SizeEn` | Partial; material translation issue | Exclude both | Company size has no target field; the observed upper-bound wording differs. |
| `Jobpost_BenefitFa` / `Jobpost_BenefitEn` | Equivalent; minor translation issue | Exclude both | Benefits have no direct field in the current target contract. |
| `Jobpost_IndustryFa` / `Jobpost_IndustryEn` | Partial; material translation issues | Exclude both | Industry classification is not established as equivalent to `job_field`; observed entries include broader, shortened, and misspelled translations. |
| `Jobpost_ProvinceFa` / `Jobpost_ProvinceEn` | Equivalent; translation good | Exclude both | Job-post province has no direct field in the current target contract. |
| `Jobpost_WorkTypeFa` / `Jobpost_WorkTypeEn` | Partial; material translation issue | Exclude both | Work arrangement is not `experience_level`; the English value omits the contract aspect of the Persian value. |
| `Comany_CompanyOwnershipTypesFa` / `Company_CompanyOwnershipTypesEn` | Equivalent; translation good | Exclude both | Company ownership type has no direct field in the current target contract. |

## Retention and language policy

1. Keep the original source CSV unchanged as the audit/source artifact. Both language columns remain present there.
2. Do not choose Persian or English as a canonical language for these ten pairs at this stage. There is no target field that requires either representation.
3. Do not copy either column from these pairs into canonical `labor_market` documents.
4. Do not delete, rename, merge, translate, or overwrite source columns.
5. If a future, separately approved raw-source archive is introduced, preserve both original values and their source column names. That is distinct from the canonical analytical dataset.
6. Any future mapping to a new or existing canonical field requires a separate semantic review against the Registry contract. Name similarity or bilingual structural alignment is insufficient.

## Evidence limitations

- Structural alignment means row/null/token structure aligned; it does not prove translation correctness.
- The semantic-equivalence and translation-quality labels are human-reviewed judgments from the current assessment catalog. They are not an exhaustive manual review of every distinct bilingual value, especially for the high-cardinality benefit and company-industry pairs.
- The pair assessments do not establish a source-column deletion decision.
- The source profile reports 364,838 rows and 43 columns. This policy does not change that profile or the source file.

## Change and ingestion status

This document is policy documentation only.

- Source data mutation: **not performed**
- Dataset Registry / schema mutation: **not performed**
- Mapping approval: **not performed**
- Elasticsearch writes or ingestion: **not performed**
- Source-column deletion: **not performed**
- n8n workflow changes: **not performed**

JobVision ingestion remains blocked pending a separate review of the non-bilingual candidate fields, a source-specific streaming adapter, and a defensible definition for the canonical `demand_score`.
