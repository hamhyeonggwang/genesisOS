"""
OTwiki RAG — Streamlit chat interface
Run: streamlit run rag/app.py   (from OTwiki/ root)
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import config
import ingest
import retriever
import generator

import streamlit as st

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="OTwiki RAG",
    page_icon="🧠",
    layout="wide",
)

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("⚙️ 설정")

    available_models = generator.list_models()
    if not available_models:
        st.error("Ollama가 실행되지 않았습니다.\n\n`ollama serve` 를 실행하세요.")
        st.stop()

    model = st.selectbox(
        "LLM 모델",
        available_models,
        index=available_models.index(config.LLM_MODEL)
        if config.LLM_MODEL in available_models
        else 0,
    )

    top_k = st.slider("검색 청크 수 (top-k)", 1, 10, config.TOP_K)

    categories = ["전체", "ICF", "Occupational_Therapy", "AI_sLLM", "Research", "Lecture"]
    cat_label = st.selectbox("카테고리 필터", categories)
    category_filter = None if cat_label == "전체" else cat_label

    st.divider()
    st.subheader("📊 인덱스 현황")

    stats = retriever.collection_stats()
    st.metric("총 청크 수", stats["total"])
    if stats["categories"]:
        for cat, cnt in stats["categories"].items():
            st.caption(f"  {cat}: {cnt}개")

    st.divider()
    st.subheader("🔄 문서 인덱싱")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("새 문서 추가", use_container_width=True):
            with st.spinner("인덱싱 중..."):
                progress_bar = st.progress(0.0)

                def _progress(done, total):
                    progress_bar.progress(done / total)

                added = ingest.run(reset=False, progress_cb=_progress)
            st.success(f"{added}개 청크 추가됨")
            st.rerun()

    with col2:
        if st.button("전체 재인덱싱", use_container_width=True, type="secondary"):
            with st.spinner("초기화 후 인덱싱 중..."):
                progress_bar = st.progress(0.0)

                def _progress(done, total):
                    progress_bar.progress(done / total)

                added = ingest.run(reset=True, progress_cb=_progress)
            st.success(f"{added}개 청크 완료")
            st.rerun()

    if stats["total"] == 0:
        st.warning("인덱스가 비어있습니다. 먼저 '새 문서 추가'를 실행하세요.")

    st.divider()
    st.caption("**필요 모델 설치:**")
    st.code("ollama pull nomic-embed-text\nollama pull llama3.2:3b", language="bash")

# ── Main chat area ────────────────────────────────────────────────────────────
st.title("🧠 OTwiki RAG")
st.caption("작업치료 · ICF · AI 지식 기반 Q&A 시스템")

if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if "sources" in msg and msg["sources"]:
            with st.expander(f"📚 참고 문서 ({len(msg['sources'])}건)", expanded=False):
                for hit in msg["sources"]:
                    score_pct = int(hit["score"] * 100)
                    st.markdown(
                        f"**{hit.get('doc_title', '')}** — *{hit.get('section', '')}*  "
                        f"`{hit.get('source', '')}` · 유사도 {score_pct}%"
                    )
                    st.markdown(
                        f"> {hit['content'][:300]}{'…' if len(hit['content']) > 300 else ''}"
                    )
                    st.divider()

# Empty index guard
if stats["total"] == 0:
    st.info("왼쪽 사이드바에서 **새 문서 추가**를 눌러 Wiki를 인덱싱하세요.")
    st.stop()

# Chat input
if prompt := st.chat_input("질문을 입력하세요 (예: ICF에서 활동과 참여의 차이는?)"):
    # User message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Retrieve
    with st.spinner("관련 문서 검색 중..."):
        hits = retriever.search(prompt, k=top_k, category=category_filter)

    if not hits:
        with st.chat_message("assistant"):
            st.warning("관련 문서를 찾지 못했습니다. 다른 키워드로 시도해보세요.")
        st.session_state.messages.append({
            "role": "assistant",
            "content": "관련 문서를 찾지 못했습니다.",
            "sources": [],
        })
    else:
        # Stream response
        with st.chat_message("assistant"):
            response = st.write_stream(
                generator.stream_answer(prompt, hits, model=model)
            )
            with st.expander(f"📚 참고 문서 ({len(hits)}건)", expanded=True):
                for hit in hits:
                    score_pct = int(hit["score"] * 100)
                    st.markdown(
                        f"**{hit.get('doc_title', '')}** — *{hit.get('section', '')}*  "
                        f"`{hit.get('source', '')}` · 유사도 {score_pct}%"
                    )
                    st.markdown(
                        f"> {hit['content'][:300]}{'…' if len(hit['content']) > 300 else ''}"
                    )
                    st.divider()

        st.session_state.messages.append({
            "role": "assistant",
            "content": response,
            "sources": hits,
        })
