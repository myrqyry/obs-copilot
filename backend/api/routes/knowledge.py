from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import ValidationError
from typing import List
import os, uuid, re
from pathlib import Path
from ..models import KnowledgeCreateRequest, KnowledgeSnippetResponse
from backend.auth import get_api_key
from utils.error_handlers import create_error_response, ErrorCode
from fastapi import Request
from services import gemini_service

router = APIRouter()

KB_DIR = Path.cwd() / 'memory_bank'
KB_DIR.mkdir(parents=True, exist_ok=True)

def slugify_title(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", '-', s).strip('-')
    if not s:
        s = str(uuid.uuid4())
    return s

def read_markdown(file_path: Path):
    try:
        text = file_path.read_text(encoding='utf-8')
        match = re.match(r'^---\n([\s\S]*?)\n---\n([\s\S]*)$', text)
        if match:
            front = match.group(1)
            content = match.group(2)
            title_match = re.search(r"title:\s*['\"]?(.*?)['\"]?$", front, flags=re.M)
            tags_match = re.search(r"tags:\s*\[([^\]]+)\]", front)
            title = title_match.group(1) if title_match else file_path.stem
            tags = [t.strip().strip('"').strip("'") for t in tags_match.group(1).split(',')] if tags_match else None
            return { 'text': content, 'title': title, 'tags': tags }
        return { 'text': text, 'title': file_path.stem }
    except Exception:
        return None


def save_knowledge_entry(title: str, content: str, tags: List[str] | None = None) -> str:
    slug = slugify_title(title)
    p = KB_DIR / f"{slug}.md"
    if p.exists():
        p = KB_DIR / f"{slug}-{uuid.uuid4().hex[:8]}.md"
    tags_line = f"tags: [{', '.join([repr(t) for t in tags])}]\n" if tags else ''
    front = f"---\ntitle: {repr(title)}\n{tags_line}---\n\n"
    p.write_text(front + content, encoding='utf-8')
    return str(p.name)

def calculate_relevance(content: dict, query: str) -> float:
    terms = [t for t in query.lower().split() if len(t) > 2]
    if not terms:
        return 0.0
    text = content.get('text', '').lower()
    score = 0
    for t in terms:
        matches = re.findall(re.escape(t), text)
        score += len(matches)
    if content.get('tags'):
        for t in terms:
            if t in content['tags']:
                score += 5
    return min(score / max(len(terms), 1), 10) / 10

def extract_snippet(content: str, query: str) -> str:
    paras = content.split('\n\n')
    best = ''
    best_score = 0
    terms = query.lower().split()
    for p in paras:
        s = sum(1 for t in terms if t in p.lower())
        if s > best_score:
            best_score = s
            best = p
    return ' '.join(best.split()[:200])


@router.post('/', response_model=KnowledgeSnippetResponse, status_code=201)
async def create_knowledge(payload: KnowledgeCreateRequest, api_key: str = Depends(get_api_key)):
    try:
        # Create file
        slug = slugify_title(payload.title)
        path = KB_DIR / f"{slug}.md"
        if path.exists():
            # Make unique
            path = KB_DIR / f"{slug}-{uuid.uuid4().hex[:8]}.md"
        tags_line = f"tags: [{', '.join([repr(t) for t in payload.tags])}]\n" if payload.tags else ''
        front = f"---\ntitle: {repr(payload.title)}\n{tags_line}---\n\n"
        path.write_text(front + payload.content, encoding='utf-8')
        return KnowledgeSnippetResponse(source=str(path.name), title=payload.title, content=extract_snippet(payload.content, payload.title), relevance=1.0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/search', response_model=List[KnowledgeSnippetResponse])
async def search_knowledge(query: str = Query(..., min_length=1), limit: int = Query(3, ge=1, le=50)):
    try:
        results = []
        for p in KB_DIR.glob('**/*.md'):
            content = read_markdown(p)
            if not content: continue
            relevance = calculate_relevance(content, query)
            if relevance > 0:
                results.append({
                    'source': p.name,
                    'title': content.get('title') or p.stem,
                    'content': extract_snippet(content.get('text', ''), query),
                    'relevance': relevance,
                })
        sorted_results = sorted(results, key=lambda x: x['relevance'], reverse=True)[:limit]
        return sorted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/{filename}', response_model=KnowledgeSnippetResponse)
async def get_knowledge(filename: str):
    try:
        p = KB_DIR / filename
        if not p.exists():
            raise HTTPException(status_code=404, detail='Not found')
        content = read_markdown(p)
        if not content:
            raise HTTPException(status_code=500, detail='Failed to parse file')
        return KnowledgeSnippetResponse(source=filename, title=content.get('title', p.stem), content=content.get('text', ''), relevance=1.0)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
