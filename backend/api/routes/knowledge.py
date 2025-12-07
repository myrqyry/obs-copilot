from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import ValidationError
from typing import List
import os, uuid, re
from pathlib import Path
from ..models import KnowledgeCreateRequest, KnowledgeSnippetResponse
from ...auth import get_api_key
from ...utils.error_handlers import create_error_response, ErrorCode, ErrorDetail, log_error, get_request_id
from ...services import gemini_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

KB_DIR = Path.cwd() / 'memory_bank'
KB_DIR.mkdir(parents=True, exist_ok=True)

def slugify_title(title: str) -> str:
    if not title or not isinstance(title, str):
        logger.warning(f"Invalid title provided for slugify: {title!r}")
        return str(uuid.uuid4())

    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9]+", '-', s).strip('-')
    if not s:
        s = str(uuid.uuid4())
    if len(s) > 200:
        s = s[:200].rstrip('-')
    return s

def read_markdown(file_path: Path):
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        return None

    try:
        text = file_path.read_text(encoding='utf-8')
    except (UnicodeDecodeError, PermissionError) as e:
        logger.error(f"Error reading file {file_path}: {e}")
        return None

    match = re.match(r'^---\n([\s\S]*?)\n---\n([\s\S]*)$', text)
    if match:
        front = match.group(1)
        content = match.group(2)
        title_match = re.search(r"title:\s*['\"]?(.*?)['\"]?$", front, flags=re.M)
        tags_match = re.search(r"tags:\s*\[([^\]]+)\]", front)
        title = title_match.group(1).strip() if title_match else file_path.stem
        tags = None
        if tags_match:
            try:
                tags = [t.strip().strip('"').strip("'") for t in tags_match.group(1).split(',') if t.strip()]
            except Exception as e:
                logger.warning(f"Failed to parse tags in {file_path}: {e}")
        return {'text': content.strip(), 'title': title, 'tags': tags}

    return {'text': text.strip(), 'title': file_path.stem}


def save_knowledge_entry(title: str, content: str, tags: List[str] | None = None) -> str:
    slug = slugify_title(title)
    p = KB_DIR / f"{slug}.md"
    if p.exists():
        p = KB_DIR / f"{slug}-{uuid.uuid4().hex[:8]}.md"
    tags_line = f"tags: [{', '.join([repr(t) for t in tags])}]\n" if tags else ''
    front = f"---\ntitle: {repr(title)}\n{tags_line}---\n\n"
    try:
        p.write_text(front + content, encoding='utf-8')
    except PermissionError as e:
        logger.error(f"Permission denied writing file {p}: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to save knowledge entry to {p}: {e}")
        raise
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


@router.post('', response_model=KnowledgeSnippetResponse, status_code=201)
async def create_knowledge(request: Request, payload: KnowledgeCreateRequest, api_key: str = Depends(get_api_key)):
    """Create a new knowledge entry by writing a markdown file.

    The function slugifies the title and writes the content as a file into the memory bank.
    Returns a KnowledgeSnippetResponse containing the stored filename and snippet.
    """
    request_id = get_request_id(request)
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
        # Optionally publish create event here (SSE/Redis) - TODO
        return KnowledgeSnippetResponse(source=str(path.name), title=payload.title, content=extract_snippet(payload.content, payload.title), relevance=1.0)
    except Exception as e:
        await log_error(
            request=request,
            error_type=type(e).__name__,
            message=f"Error creating knowledge entry: {e}",
            status_code=500,
            exc_info=e,
        )
        return create_error_response(
            status_code=500,
            detail='An unexpected error occurred while creating knowledge entry.',
            code=ErrorCode.INTERNAL_ERROR,
            request_id=request_id,
        )


@router.get('/search', response_model=List[KnowledgeSnippetResponse])
async def search_knowledge(request: Request, query: str = Query(..., min_length=1), limit: int = Query(3, ge=1, le=50)):
    """
    Search the knowledge base for a query.

    Returns a list of matching knowledge snippet objects sorted by relevance.
    """
    request_id = get_request_id(request)
    query = (query or '').strip()
    # Basic validation: disallow excessively long queries
    if len(query) > 200:
        return create_error_response(
            status_code=400,
            detail='Query too long',
            code=ErrorCode.VALIDATION_ERROR,
            request_id=request_id,
        )

    try:
        results = []
        # If the KB directory doesn't exist, return an empty list
        if not KB_DIR.exists():
            logger.info(f"Knowledge base directory doesn't exist: {KB_DIR}")
            return []

        files_processed = 0
        files_with_errors = 0
        for p in KB_DIR.glob('**/*.md'):
            try:
                files_processed += 1
                content = read_markdown(p)
                if not content:
                    files_with_errors += 1
                    continue
                relevance = calculate_relevance(content, query)
                if relevance > 0:
                    results.append({
                        'source': p.name,
                        'title': content.get('title') or p.stem,
                        'content': extract_snippet(content.get('text', ''), query),
                        'relevance': relevance,
                    })
            except Exception as e:
                files_with_errors += 1
                logger.warning(f"Error processing file {p}: {e}")
                continue
        sorted_results = sorted(results, key=lambda x: x['relevance'], reverse=True)[:limit]
        logger.info(
            f"Search query='{query}' processed {files_processed} files, {files_with_errors} errors, {len(sorted_results)} results"
        )
        return sorted_results
    except Exception as e:
        await log_error(
            request=request,
            error_type=type(e).__name__,
            message=f"Error searching knowledge base: {e}",
            status_code=500,
            exc_info=e,
        )
        return create_error_response(
            status_code=500,
            detail='An error occurred while searching knowledge base.',
            code=ErrorCode.INTERNAL_ERROR,
            request_id=get_request_id(request),
        )


@router.get('/{filename}', response_model=KnowledgeSnippetResponse)
async def get_knowledge(request: Request, filename: str):
    """
    Retrieve a knowledge entry by filename.

    This endpoint includes safeguards against path traversal and symlink attacks.
    """
    try:
        # Sanitize filename to base name to avoid trivial path traversal attempts
        safe_filename = Path(filename).name
        if safe_filename != filename:
            await log_error(
                request=request,
                error_type="SECURITY_ERROR",
                message=f"Path traversal attempt detected: {filename}",
                status_code=400,
            )
            return create_error_response(
                status_code=400,
                detail='Invalid filename',
                code=ErrorCode.VALIDATION_ERROR,
                request_id=get_request_id(request),
            )

        p = KB_DIR / safe_filename
        # Verify that resolved path remains within KB_DIR (protect against symlinks)
        try:
            if not p.resolve().is_relative_to(KB_DIR.resolve()):
                await log_error(
                    request=request,
                    error_type="SECURITY_ERROR",
                    message=f"Path escape attempt: {filename} -> {p.resolve()}",
                    status_code=403,
                )
                return create_error_response(
                    status_code=403,
                    detail='Access denied',
                    code=ErrorCode.AUTHENTICATION_ERROR,
                    request_id=get_request_id(request),
                )
        except AttributeError:
            # Python <3.9 - fallback to string comparison
            if not str(p.resolve()).startswith(str(KB_DIR.resolve())):
                await log_error(
                    request=request,
                    error_type="SECURITY_ERROR",
                    message=f"Path escape attempt: {filename} -> {p.resolve()}",
                    status_code=403,
                )
                return create_error_response(
                    status_code=403,
                    detail='Access denied',
                    code=ErrorCode.AUTHENTICATION_ERROR,
                    request_id=get_request_id(request),
                )
        if not p.exists():
            return create_error_response(
                status_code=404,
                detail=f"Knowledge entry '{filename}' not found",
                code=ErrorCode.HTTP_ERROR,
                request_id=get_request_id(request),
            )
        content = read_markdown(p)
        if not content:
            return create_error_response(
                status_code=500,
                detail='Failed to parse file',
                code=ErrorCode.INTERNAL_ERROR,
                request_id=get_request_id(request),
            )
        return KnowledgeSnippetResponse(source=filename, title=content.get('title', p.stem), content=content.get('text', ''), relevance=1.0)
    except HTTPException:
        raise
    except Exception as e:
        await log_error(
            request=request,
            error_type=type(e).__name__,
            message=f"Error retrieving knowledge entry {filename}: {e}",
            status_code=500,
            exc_info=e,
        )
        return create_error_response(
            status_code=500,
            detail='An error occurred while retrieving knowledge entry',
            code=ErrorCode.INTERNAL_ERROR,
            request_id=get_request_id(request),
        )
