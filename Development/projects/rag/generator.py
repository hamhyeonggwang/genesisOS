"""
Korean-language answer generation via Ollama streaming.
"""

import sys
from pathlib import Path
from typing import Iterator

sys.path.insert(0, str(Path(__file__).parent))
import config

import ollama

try:
    import anthropic
except ImportError:  # SDK 미설치 시 ollama 경로만 동작
    anthropic = None

_anthropic_client = None


def _get_anthropic():
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic()  # ANTHROPIC_API_KEY 환경변수 사용
    return _anthropic_client


SYSTEM_PROMPT = """\
당신은 작업치료, ICF(국제기능장애건강분류), AI·sLLM을 전문으로 하는 지식 도우미입니다.
아래 [참고 문서]를 근거로 질문에 한국어로 정확하고 구체적으로 답변하세요.

규칙:
- 답변은 반드시 [참고 문서]에 있는 내용을 중심으로 작성하세요.
- 참고 문서에 없는 내용을 추론할 경우 "(추론)" 이라고 명시하세요.
- 관련 ICF 코드가 있으면 b/s/d/e 코드를 함께 제시하세요.
- 답변 마지막에 출처 문서명을 간략히 나열하세요.
"""


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        header = f"[{i}] {c.get('doc_title', '')} — {c.get('section', '')} ({c.get('source', '')})"
        parts.append(f"{header}\n{c['content']}")
    return "\n\n---\n\n".join(parts)


def stream_answer(
    query: str,
    chunks: list[dict],
    model: str = config.LLM_MODEL,
) -> Iterator[str]:
    """Yield response tokens. claude-* → Anthropic API, 그 외 → 로컬 Ollama."""
    context = _build_context(chunks)

    if model.startswith("claude"):
        yield from _stream_claude(query, context, model)
        return

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"[참고 문서]\n{context}\n\n[질문]\n{query}",
        },
    ]

    stream = ollama.chat(
        model=model,
        messages=messages,
        stream=True,
        options={"num_predict": 400, "temperature": 0.3},
    )
    for chunk in stream:
        token = chunk.message.content
        if token:
            yield token


def _stream_claude(query: str, context: str, model: str) -> Iterator[str]:
    """Claude API로 답변 스트리밍 (vault 근거 기반)."""
    if anthropic is None:
        raise RuntimeError("anthropic SDK 미설치 — pip install anthropic")
    client = _get_anthropic()
    user = f"[참고 문서]\n{context}\n\n[질문]\n{query}"
    with client.messages.stream(
        model=model,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        for text in stream.text_stream:
            yield text


def list_models() -> list[str]:
    """Return names of locally available Ollama models."""
    try:
        return [m.model for m in ollama.list().models]
    except Exception:
        return []
