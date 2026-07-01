from fastapi import APIRouter


router = APIRouter()


@router.get("/meta")
async def meta() -> dict[str, object]:
    return {
        "name": "workos-vs-code",
        "backend": "fastapi",
        "frontend": "react-vite",
        "modules": ["systems", "intake-v6", "quote-preview", "quote-list"],
        "policy": {
            "commercial_truth": "backend_authoritative",
            "fake_totals": False,
            "systems_first": True,
        },
    }
