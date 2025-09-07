from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio
import json

router = APIRouter()

# In-memory pubsub: channel -> list of queues
_channels = {}

def _get_queue_for_channel(channel):
    q = asyncio.Queue()
    _channels.setdefault(channel, []).append(q)
    return q

def _remove_queue(channel, q):
    lst = _channels.get(channel)
    if not lst: return
    try:
        lst.remove(q)
    except ValueError:
        pass
    if not lst:
        _channels.pop(channel, None)


@router.get('/stream')
async def stream(channel: str, request: Request, token: str = None):
    """SSE endpoint that streams chat messages for a channel."""
    q = _get_queue_for_channel(channel)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    # send a comment to keep connection alive
                    yield ':\n\n'
                    continue
                data = json.dumps(msg)
                yield f'data: {data}\n\n'
        finally:
            _remove_queue(channel, q)

    return StreamingResponse(event_generator(), media_type='text/event-stream')


@router.post('/publish')
async def publish(payload: dict):
    """Publish a message to overlays. Payload must include channel and message data."""
    channel = payload.get('channel')
    if not channel:
        raise HTTPException(status_code=400, detail='channel required')
    msg = payload.get('message') or payload.get('data') or payload
    queues = _channels.get(channel, [])
    for q in list(queues):
        try:
            q.put_nowait(msg)
        except Exception:
            # ignore full/closed queues
            pass
    return JSONResponse({'ok': True, 'delivered': len(queues)})
