"""
OTwiki RAG — FastAPI backend
Run: python rag/server.py   (from OTwiki/ root)
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent))
import config
import ingest
import retriever
import generator

from fastapi import FastAPI
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="OTwiki RAG", docs_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_static = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(_static)), name="static")


# ── Models ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    model: str = config.LLM_MODEL
    top_k: int = config.TOP_K
    category: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    top_k: int = config.TOP_K
    category: Optional[str] = None


class NoteRequest(BaseModel):
    title: str = ""
    content: str


# ── Routes ────────────────────────────────────────────────────────────────────

def _slim_hits(hits: list[dict]) -> list[dict]:
    return [
        {
            "doc_title": h.get("doc_title", ""),
            "section": h.get("section", ""),
            "source": h.get("source", ""),
            "category": h.get("category", ""),
            "score": h.get("score", 0),
            "content": h["content"][:400],
        }
        for h in hits
    ]


@app.post("/api/search")
async def search(req: SearchRequest):
    """검색 전용 — 생성 없이 의미검색 hits만 반환 (외부 연동용, 예: ORION)."""
    hits = retriever.search(
        req.query,
        k=req.top_k,
        category=req.category if req.category and req.category != "전체" else None,
    )
    return {"hits": _slim_hits(hits)}


@app.post("/api/note")
async def create_note(req: NoteRequest):
    """vault 00_Inbox에 노트(.md)를 저장한다 (외부 연동용, 예: ORION)."""
    inbox = config.VAULT_PATH / "00_Inbox"
    inbox.mkdir(exist_ok=True)
    ts = datetime.now()
    slug = re.sub(r"[^\w가-힣]+", "-", (req.title or "").strip())[:40].strip("-") or "note"
    fname = f"{ts:%Y-%m-%d-%H%M%S}-{slug}.md"
    path = inbox / fname
    title = req.title or "메모"
    body = (
        "---\n"
        f"title: {title}\n"
        f"created: {ts.isoformat()}\n"
        "source: ORION\n"
        "---\n\n"
        f"# {title}\n\n"
        f"{req.content}\n"
    )
    path.write_text(body, encoding="utf-8")
    # 저장 직후 증분 인덱싱 → 다음 검색에 바로 잡힘 (기억 루프)
    try:
        indexed = ingest.index_file(path)
    except Exception:
        indexed = 0
    return {
        "saved": True,
        "path": str(path.relative_to(config.VAULT_PATH)),
        "filename": fname,
        "indexed": indexed,
    }


@app.post("/api/answer")
async def answer(req: ChatRequest):
    """비스트리밍 답변 — 검색 + LLM 생성을 한 번에 반환 (외부 연동용, 예: ORION)."""
    hits = retriever.search(
        req.query,
        k=req.top_k,
        category=req.category if req.category and req.category != "전체" else None,
    )
    if not hits:
        return {"answer": "관련 문서를 찾지 못했습니다.", "hits": []}
    text = "".join(generator.stream_answer(req.query, hits, model=req.model))
    return {"answer": text, "hits": _slim_hits(hits)}

@app.get("/")
async def root():
    return FileResponse(str(_static / "index.html"))


@app.get("/api/models")
async def get_models():
    return {"models": generator.list_models()}


@app.get("/api/stats")
async def get_stats():
    return retriever.collection_stats()


@app.post("/api/ingest")
async def trigger_ingest(reset: bool = False):
    added = ingest.run(reset=reset)
    return {"added": added, **retriever.collection_stats()}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    hits = retriever.search(
        req.query,
        k=req.top_k,
        category=req.category if req.category and req.category != "전체" else None,
    )

    def stream():
        if not hits:
            msg = "관련 문서를 찾지 못했습니다. 다른 키워드로 시도해보세요."
            yield f"data: {json.dumps({'token': msg}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'done': True, 'sources': []})}\n\n"
            return

        for token in generator.stream_answer(req.query, hits, model=req.model):
            yield f"data: {json.dumps({'token': token}, ensure_ascii=False)}\n\n"

        sources = [
            {
                "doc_title": h.get("doc_title", ""),
                "section": h.get("section", ""),
                "source": h.get("source", ""),
                "score": h.get("score", 0),
                "content": h["content"][:400],
            }
            for h in hits
        ]
        yield f"data: {json.dumps({'done': True, 'sources': sources}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
