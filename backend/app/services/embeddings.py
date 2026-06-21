"""Simple deterministic embedding for demo semantic search without external APIs."""

import hashlib
import math
import re

import numpy as np

from app.config import settings


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def embed_text(text: str, dimensions: int | None = None) -> list[float]:
    dims = dimensions or settings.embedding_dimensions
    vector = np.zeros(dims, dtype=np.float32)
    tokens = _tokenize(text)
    if not tokens:
        return vector.tolist()

    for token in tokens:
        digest = hashlib.sha256(token.encode()).digest()
        for i in range(0, min(len(digest), dims), 4):
            idx = i % dims
            value = int.from_bytes(digest[i : i + 4], "big", signed=False)
            vector[idx] += (value / 2**32) * 2 - 1

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector /= norm
    return vector.tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
