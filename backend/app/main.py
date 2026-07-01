from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.api.router import api_router


ALLOWED_ORIGINS = {
    "http://127.0.0.1:5173",
    "http://localhost:5173",
}


app = FastAPI(
    title="WorkOS API",
    version="0.2.0",
    description="Clean FastAPI backend scaffold for the next WorkOS iteration.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def local_dev_cors(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method == "OPTIONS" and origin in ALLOWED_ORIGINS:
        return Response(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": request.headers.get("access-control-request-method", "*"),
                "Access-Control-Allow-Headers": request.headers.get("access-control-request-headers", "*"),
                "Vary": "Origin",
            },
        )

    response = await call_next(request)
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
