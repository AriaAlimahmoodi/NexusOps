"""Deep, read-only profiling for the JobVision CSV before ingestion.

Run from the repository root:
    python scripts/profile_jobvision_deep.py

This script does not modify the source CSV, Elasticsearch, or project schemas.
"""
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

CSV_PATH = Path("data/raw/JobVision_Jobposts_Dataset.csv")
TOP_CATEGORIES = 20
TOP_SKILLS_PER_CATEGORY = 12


def clean(value):
    return (value or "").strip()


def parse_json_list(raw):
    if not clean(raw):
        return []
    value = json.loads(raw)
    if not isinstance(value, list):
        raise ValueError("JSON value is not a list")
    return value


def skill_name(item):
    if not isinstance(item, dict):
        return ""
    return clean(item.get("TitleEn")) or clean(item.get("TitleFa"))


def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV not found: {CSV_PATH.resolve()}")

    total = 0
    missing_category = 0
    missing_title = 0
    missing_month = 0
    posts_with_skills = 0
    posts_without_skills = 0
    malformed_skill_items = 0
    duplicate_skills_inside_post = 0
    invalid_software_json = 0
    invalid_language_json = 0

    category_posts = Counter()
    category_posts_with_skills = Counter()
    category_skill_frequency = defaultdict(Counter)
    overall_skill_frequency = Counter()
    skills_per_post = Counter()
    skill_level_counts = Counter()
    skill_json_key_counts = Counter()
    language_json_key_counts = Counter()
    software_item_types = Counter()
    language_item_types = Counter()
    publication_months = Counter()

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            total += 1

            category = clean(row.get("Jobpost_MainJobCategory"))
            title = clean(row.get("Jobpost_RawTitle"))
            month = clean(row.get("Jobpost_ActivationTime_YEAR_MONTH"))

            if not category:
                missing_category += 1
                category = "[بدون دسته‌بندی]"
            if not title:
                missing_title += 1
            if not month:
                missing_month += 1
            else:
                publication_months[month] += 1

            category_posts[category] += 1
            raw_skills = clean(row.get("Jobpost_SoftwareSkills"))
            skills_in_post = set()

            if raw_skills:
                try:
                    items = parse_json_list(raw_skills)
                except (json.JSONDecodeError, ValueError):
                    invalid_software_json += 1
                    items = []

                for item in items:
                    software_item_types[type(item).__name__] += 1
                    if not isinstance(item, dict):
                        malformed_skill_items += 1
                        continue

                    for key in item:
                        skill_json_key_counts[key] += 1

                    name = skill_name(item)
                    if not name:
                        continue

                    normalized_key = name.casefold()
                    if normalized_key in skills_in_post:
                        duplicate_skills_inside_post += 1
                    skills_in_post.add(normalized_key)

                    level = clean(item.get("Level")) or "[بدون سطح]"
                    skill_level_counts[level] += 1

            if skills_in_post:
                posts_with_skills += 1
                category_posts_with_skills[category] += 1
                skills_per_post[len(skills_in_post)] += 1

                for skill in skills_in_post:
                    overall_skill_frequency[skill] += 1
                    category_skill_frequency[category][skill] += 1
            else:
                posts_without_skills += 1
                skills_per_post[0] += 1

            raw_languages = clean(row.get("Jobpost_LanguageSkills"))
            if raw_languages:
                try:
                    language_items = parse_json_list(raw_languages)
                    for item in language_items:
                        language_item_types[type(item).__name__] += 1
                        if isinstance(item, dict):
                            for key in item:
                                language_json_key_counts[key] += 1
                except (json.JSONDecodeError, ValueError):
                    invalid_language_json += 1

    print("\n========== JOBVISION DEEP PROFILE ==========")
    print(f"Total records: {total:,}")
    if total:
        print(f"Records with software skills: {posts_with_skills:,} ({posts_with_skills / total:.1%})")
        print(f"Records without software skills: {posts_without_skills:,} ({posts_without_skills / total:.1%})")
    print(f"Invalid software JSON rows: {invalid_software_json:,}")
    print(f"Invalid language JSON rows: {invalid_language_json:,}")
    print(f"Malformed software skill items: {malformed_skill_items:,}")
    print(f"Duplicate skill mentions within same post: {duplicate_skills_inside_post:,}")
    print(f"Missing category/title/month: {missing_category:,} / {missing_title:,} / {missing_month:,}")

    print("\n--- SKILLS PER JOB POST (unique names within each post) ---")
    for count, rows in sorted(skills_per_post.items()):
        print(f"{count}: {rows:,}")

    print("\n--- CATEGORY COVERAGE: TOP 30 CATEGORIES ---")
    for category, count in category_posts.most_common(30):
        with_skills = category_posts_with_skills[category]
        ratio = with_skills / count if count else 0
        print(f"{category} | posts={count:,} | with_skills={with_skills:,} | coverage={ratio:.1%}")

    print(f"\n--- TOP {TOP_CATEGORIES} CATEGORIES: TOP {TOP_SKILLS_PER_CATEGORY} SKILLS EACH ---")
    for category, _ in category_posts.most_common(TOP_CATEGORIES):
        counter = category_skill_frequency[category]
        print(f"\n[{category}] posts={category_posts[category]:,}, posts_with_skills={category_posts_with_skills[category]:,}")
        for skill, count in counter.most_common(TOP_SKILLS_PER_CATEGORY):
            print(f"  {skill}: {count:,}")

    print("\n--- OVERALL TOP 40 SKILLS ---")
    for skill, count in overall_skill_frequency.most_common(40):
        print(f"{skill}: {count:,}")

    print("\n--- SKILL LEVEL COUNTS (skill occurrences, not job posts) ---")
    for level, count in skill_level_counts.most_common():
        print(f"{level}: {count:,}")

    print("\n--- SOFTWARE SKILL JSON KEYS ---")
    for key, count in skill_json_key_counts.most_common():
        print(f"{key}: {count:,}")

    print("\n--- LANGUAGE SKILL JSON KEYS ---")
    for key, count in language_json_key_counts.most_common():
        print(f"{key}: {count:,}")

    print("\n--- SOFTWARE/LANGUAGE JSON ITEM TYPES ---")
    print("Software:", dict(software_item_types))
    print("Language:", dict(language_item_types))

    print("\n--- PUBLICATION MONTHS (chronological) ---")
    for month, count in sorted(publication_months.items()):
        print(f"{month}: {count:,}")

    print("\n========== END OF PROFILE ==========")


if __name__ == "__main__":
    main()
