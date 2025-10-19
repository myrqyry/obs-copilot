from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio
import json
from api.models import StreamRequest, PublishRequest
from auth import get_api_key

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
async def stream(request_params: StreamRequest = Depends(), api_key: str = Depends(get_api_key)):
    """SSE endpoint that streams chat messages for a channel."""
    channel = request_params.channel
    q = _get_queue_for_channel(channel)

    async def event_generator():
        try:
            while True:
                # Note: is_disconnected() needs the original Request; for simplicity, use timeout-based check
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    yield ':\n\n'  # keepalive
                    continue
                data = json.dumps(msg)
                yield f'data: {data}\n\n'
        finally:
            _remove_queue(channel, q)

    return StreamingResponse(event_generator(), media_type='text/event-stream')


@router.post('/publish')
async def publish(request: PublishRequest, api_key: str = Depends(get_api_key)):
    """Publish a message to overlays. Payload must include channel and message data."""
    channel = request.channel
    msg = request.message or request.data or request.dict(exclude={'channel'})
    queues = _channels.get(channel, [])
    for q in list(queues):
        try:
            q.put_nowait(msg)
        except Exception:
            # ignore full/closed queues
            pass
    return JSONResponse({'ok': True, 'delivered': len(queues)})
