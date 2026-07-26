from pathlib import Path

VAULT_PATH = Path(__file__).parent.parent
CHROMA_PATH = Path(__file__).parent / ".chroma"
COLLECTION_NAME = "otwiki"

# Ollama models — pull nomic-embed-text first:  ollama pull nomic-embed-text
# For better Korean, pull:                       ollama pull llama3.2:3b
EMBED_MODEL = "nomic-embed-text"
LLM_MODEL = "qwen2.5:7b"

TOP_K = 5
BATCH_SIZE = 16
MAX_CHUNK_CHARS = 1200
MIN_CHUNK_CHARS = 80

EXCLUDE_DIRS = {".obsidian", ".git", "rag", "__pycache__"}
