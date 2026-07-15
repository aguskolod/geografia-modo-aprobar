import json
import re
from pathlib import Path

from docx import Document


ROOT = Path(__file__).parent
SOURCE = ROOT / "Resumen final geografia.docx"
OUTPUT = ROOT / "material-data.js"

ids = [
    "conceptos", "argentina", "nea", "noa", "cuyo", "patagonia",
    "buenos-aires", "america-norte", "caribe", "america-sur", "cordoba",
]

document = Document(SOURCE)
sections = []
current = None

for paragraph in document.paragraphs:
    text = re.sub(r"\s+", " ", paragraph.text).strip()
    if not text:
        continue
    if paragraph.style.name == "Title":
        current = {
            "id": ids[len(sections)],
            "title": text.replace("📍", "").strip().rstrip(":."),
            "paragraphs": [],
        }
        sections.append(current)
    elif current:
        current["paragraphs"].append(text)

payload = json.dumps(sections, ensure_ascii=False, separators=(",", ":"))
OUTPUT.write_text(f"window.GEO_MATERIAL = {payload};\n", encoding="utf-8")
print(f"Generated {OUTPUT.name}: {len(sections)} sections, {sum(len(s['paragraphs']) for s in sections)} paragraphs")
