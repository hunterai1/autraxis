import json
import logging
import uuid
from pathlib import Path

from security import utcnow

logger = logging.getLogger("autraxis.seeds")

SEED_PATH = Path(__file__).parent / "seed_content.json"

DEFAULT_SINGLETONS = {
    "home": {
        "eyebrow": "Enterprise Integration & AI Technology",
        "hero_lines": ["Intelligence.", "Integrated."],
        "subtitle": "AUTRAXIS connects the systems your business already runs on — ERP, partners, cloud, data — and makes the space between them intelligent. Remote-first. Engineering-grade. Explained in plain language.",
        "primary_cta": "Explore capabilities",
        "secondary_cta": "Talk to an engineer",
        "diagram_caption": "Reference architecture — select any node to inspect a payload",
    },
    "about": {
        "intro_title": "Remote-first by design, not by circumstance",
        "paragraphs": [
            "We work asynchronously across time zones, with writing as the default medium. That isn't a compromise — it's why our documentation is unusually good, our meetings are unusually rare, and our clients get senior engineers instead of whoever was geographically available.",
            "Engagements are scoped in writing, delivered iteratively, and reviewed against the scope — not against elapsed hours. You'll always know what shipped, what's next, and what changed.",
            "We're deliberately selective about claims: you'll find no invented client logos, fabricated metrics or borrowed testimonials on this site. Our work speaks through the architectures, demonstrations and articles we publish.",
        ],
    },
    "settings": {
        "brand_name": "AUTRAXIS",
        "legal_name": "AUTRAXIS Systems Inc.",
        "tagline": "Intelligence. Integrated.",
        "info_email": "info@autraxis.com",
        "careers_email": "careers@autraxis.com",
        "cta_text": "Start a conversation",
        "footer_text": "Intelligence. Integrated. — enterprise integration & AI technology, remote-first.",
        "copyright": "© {year} AUTRAXIS Systems Inc. All rights reserved.",
        "seo_title": "AUTRAXIS — Intelligence. Integrated.",
        "seo_description": "AUTRAXIS is a remote-first enterprise integration and AI technology practice: Dell Boomi iPaaS, SAP connectivity, B2B EDI, API engineering, cloud integration and intelligent automation.",
        "socials": [
            {"id": "facebook", "label": "Facebook", "url": "https://www.facebook.com/autraxis", "enabled": True, "placeholder": True, "order": 1},
            {"id": "x", "label": "X (Twitter)", "url": "https://x.com/autraxis", "enabled": True, "placeholder": True, "order": 2},
            {"id": "youtube", "label": "YouTube", "url": "https://www.youtube.com/@autraxis", "enabled": True, "placeholder": True, "order": 3},
            {"id": "instagram", "label": "Instagram", "url": "https://www.instagram.com/autraxis", "enabled": True, "placeholder": True, "order": 4},
            {"id": "linkedin", "label": "LinkedIn", "url": "https://www.linkedin.com/company/autraxis", "enabled": True, "placeholder": True, "order": 5},
            {"id": "xing", "label": "Xing", "url": "https://www.xing.com/pages/autraxis", "enabled": True, "placeholder": True, "order": 6},
            {"id": "github", "label": "GitHub", "url": "https://github.com/autraxis", "enabled": True, "placeholder": True, "order": 7},
        ],
    },
}


def _stamp(item: dict) -> dict:
    item.setdefault("id", str(uuid.uuid4()))
    item.setdefault("status", "published")
    item["created_by"] = "seed"
    item["updated_by"] = "seed"
    item["created_at"] = utcnow()
    item["updated_at"] = utcnow()
    return item


async def seed_all(db) -> None:
    data = json.loads(SEED_PATH.read_text())

    for key, value in DEFAULT_SINGLETONS.items():
        if not await db.content.find_one({"key": key}):
            await db.content.insert_one({
                "key": key, "published": value, "draft": None, "revisions": [],
                "updated_by": "seed", "updated_at": utcnow(),
            })
            logger.info(f"seeded content singleton: {key}")

    collections = {
        "services": data["services"],
        "solutions": data["solutions"],
        "projects": data["projects"],
        "insights": data["insights"],
    }
    for name, items in collections.items():
        coll = db[f"cms_{name}"]
        if await coll.count_documents({}) == 0:
            for item in items:
                item.pop("icon", None)
                await coll.insert_one(_stamp(item))
            logger.info(f"seeded cms_{name}: {len(items)} items")

    jobs_coll = db["jobs"]
    if await jobs_coll.count_documents({}) == 0:
        for role in data["roles"]:
            job = {
                "slug_source": role["id"],
                "title": role["title"],
                "department": "Engineering",
                "employment_type": role["type"],
                "location": role["location"],
                "description": role["summary"],
                "responsibilities": [],
                "requirements": role["musts"],
                "instructions": "Apply using the form on this page, or email careers@autraxis.com.",
                "closing_date": None,
                "status": "published",
            }
            await jobs_coll.insert_one(_stamp(job))
        logger.info(f"seeded jobs: {len(data['roles'])} items")
