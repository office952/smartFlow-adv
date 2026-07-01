from fastapi import APIRouter

from app.api.routes.intake_v6 import router as intake_v6_router
from app.api.routes.meta import router as meta_router
from app.api.routes.quotes import router as quotes_router


api_router = APIRouter()
api_router.include_router(meta_router, tags=["meta"])
api_router.include_router(intake_v6_router, prefix="/intake-v6", tags=["intake-v6"])
api_router.include_router(quotes_router, prefix="/quotes", tags=["quotes"])
