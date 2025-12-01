from starlette.middleware.base import BaseHTTPMiddleware
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.testclient import TestClient

class MW1(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        print("MW1 In")
        response = await call_next(request)
        print("MW1 Out")
        return response

class MW2(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        print("MW2 In")
        response = await call_next(request)
        print("MW2 Out")
        return response

app = Starlette()
app.add_middleware(MW1)
app.add_middleware(MW2)

@app.route("/")
def homepage(request):
    print("App")
    return JSONResponse({"hello": "world"})

client = TestClient(app)
client.get("/")
