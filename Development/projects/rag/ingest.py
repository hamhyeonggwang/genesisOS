"""
Document ingestion: Markdown + PDF → chunks → embeddings → ChromaDB
Run directly:  python rag/ingest.py [--reset]
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import config

import chromadb
import ollama
import pypdfium2 as pdfium


# ── Markdown helpers ─────────────────────────────────────────────────────────

def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Return (meta_dict, body) from a markdown file with YAML frontmatter."""
    match = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    if not match:
        return {}, text

    meta: dict = {}
    for line in match.group(1).splitlines():
        if ":" in line and not line.startswith((" ", "-")):
            key, _, val = line.partition(":")
            meta[key.strip()] = val.strip()

    return meta, text[match.end():]


def _split_long(text: str) -> list[str]:
    """Split text longer than MAX_CHUNK_CHARS on paragraph boundaries."""
    if len(text) <= config.MAX_CHUNK_CHARS:
        return [text]

    parts, current = [], ""
    for para in text.split("\n\n"):
        if len(current) + len(para) <= config.MAX_CHUNK_CHARS:
            current = current + "\n\n" + para if current else para
        else:
            if current:
                parts.append(current)
            current = para
    if current:
        parts.append(current)
    return parts or [text]


def chunk_markdown(file_path: Path) -> list[dict]:
    text = file_path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)

    title = meta.get("title", file_path.stem)
    category = meta.get("category", "")
    tags = meta.get("tags", "")

    # Split by h2 (##) headers; keep header with its content
    sections = re.split(r"\n(?=## )", "\n" + body)
    sections = [s.strip() for s in sections if s.strip()]

    # Fallback: entire file as one chunk
    if not sections:
        sections = [body.strip()]

    chunks = []
    for sec_idx, section in enumerate(sections):
        first_line = section.split("\n")[0]
        section_title = re.sub(r"^#+\s*", "", first_line).strip() or "도입"

        for sub_idx, part in enumerate(_split_long(section)):
            if len(part) < config.MIN_CHUNK_CHARS:
                continue
            chunks.append({
                "chunk_id": f"md_{file_path.stem}_{sec_idx}_{sub_idx}",
                "content": part,
                "source": str(file_path.relative_to(config.VAULT_PATH)),
                "doc_title": title,
                "section": section_title,
                "category": category,
                "tags": tags,
                "doc_type": "markdown",
            })
    return chunks


# ── PDF helpers ───────────────────────────────────────────────────────────────

def chunk_pdf(file_path: Path) -> list[dict]:
    pdf = pdfium.PdfDocument(str(file_path))
    chunks = []
    for page_num in range(len(pdf)):
        text = pdf[page_num].get_textpage().get_text_range().strip()
        for sub_idx, part in enumerate(_split_long(text)):
            if len(part) < config.MIN_CHUNK_CHARS:
                continue
            chunks.append({
                "chunk_id": f"pdf_{file_path.stem}_p{page_num}_{sub_idx}",
                "content": part,
                "source": str(file_path.relative_to(config.VAULT_PATH)),
                "doc_title": file_path.stem,
                "section": f"p.{page_num + 1}",
                "category": "ICF",
                "tags": "ICF",
                "doc_type": "pdf",
            })
    return chunks


# ── ChromaDB helpers ──────────────────────────────────────────────────────────

def get_collection(reset: bool = False) -> chromadb.Collection:
    client = chromadb.PersistentClient(path=str(config.CHROMA_PATH))
    if reset:
        try:
            client.delete_collection(config.COLLECTION_NAME)
        except Exception:
            pass
    return client.get_or_create_collection(
        name=config.COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


# ── Main ingestion ────────────────────────────────────────────────────────────

def index_file(file_path) -> int:
    """단일 파일만 증분 인덱싱한다(저장 직후용). 추가된 청크 수 반환."""
    fp = Path(file_path)
    if fp.suffix == ".md":
        chunks = chunk_markdown(fp)
    elif fp.suffix == ".pdf":
        chunks = chunk_pdf(fp)
    else:
        return 0
    if not chunks:
        return 0

    config.CHROMA_PATH.mkdir(exist_ok=True)
    collection = get_collection(reset=False)
    existing = set(collection.get(include=[])["ids"])
    new = [c for c in chunks if c["chunk_id"] not in existing]
    if not new:
        return 0

    texts = [c["content"] for c in new]
    resp = ollama.embed(model=config.EMBED_MODEL, input=texts)
    collection.add(
        ids=[c["chunk_id"] for c in new],
        embeddings=resp.embeddings,
        documents=texts,
        metadatas=[
            {k: v for k, v in c.items() if k not in {"content", "chunk_id"}}
            for c in new
        ],
    )
    return len(new)


def run(reset: bool = False, progress_cb=None) -> int:
    """Ingest all Markdown + PDF files. Returns count of new chunks added."""
    config.CHROMA_PATH.mkdir(exist_ok=True)
    collection = get_collection(reset=reset)

    # Collect all candidate chunks
    all_chunks: list[dict] = []

    for md in config.VAULT_PATH.rglob("*.md"):
        if any(d in md.parts for d in config.EXCLUDE_DIRS):
            continue
        all_chunks.extend(chunk_markdown(md))

    for pdf in config.VAULT_PATH.rglob("*.pdf"):
        if any(d in pdf.parts for d in config.EXCLUDE_DIRS):
            continue
        all_chunks.extend(chunk_pdf(pdf))

    # Skip already-indexed chunks
    existing_ids = set(collection.get(include=[])["ids"])
    new_chunks = [c for c in all_chunks if c["chunk_id"] not in existing_ids]

    if not new_chunks:
        return 0

    # Embed + store in batches
    total = len(new_chunks)
    for i in range(0, total, config.BATCH_SIZE):
        batch = new_chunks[i : i + config.BATCH_SIZE]
        texts = [c["content"] for c in batch]

        resp = ollama.embed(model=config.EMBED_MODEL, input=texts)
        embeddings = resp.embeddings

        collection.add(
            ids=[c["chunk_id"] for c in batch],
            embeddings=embeddings,
            documents=texts,
            metadatas=[
                {k: v for k, v in c.items() if k not in {"content", "chunk_id"}}
                for c in batch
            ],
        )

        if progress_cb:
            progress_cb(min(i + config.BATCH_SIZE, total), total)

    return total


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    print(f"인덱싱 시작{'(초기화)' if reset else ''}...")

    def cli_progress(done, total):
        pct = done / total
        bar = "█" * int(pct * 30) + "░" * (30 - int(pct * 30))
        print(f"\r[{bar}] {done}/{total}", end="", flush=True)

    added = run(reset=reset, progress_cb=cli_progress)
    print(f"\n완료: {added}개 청크 추가됨")
