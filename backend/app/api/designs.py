import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db
from app.models.review import Design, Issue
from app.schemas import (
    AutoReviewRequest,
    AutoReviewResponse,
    DesignCreate,
    DesignResponse,
    IssueResponse,
    SimilarDesignResponse,
)
from app.services.embeddings import embed_text
from app.services.review_service import find_similar_designs, run_autoreview, search_lessons

router = APIRouter(prefix="/designs", tags=["designs"])


@router.get("", response_model=list[DesignResponse])
async def list_designs(db: AsyncSession = Depends(get_db)) -> list[Design]:
    result = await db.execute(select(Design).order_by(Design.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
async def create_design(payload: DesignCreate, db: AsyncSession = Depends(get_db)) -> Design:
    design = Design(
        name=payload.name,
        description=payload.description,
        embedding=embed_text(f"{payload.name} {payload.description or ''}"),
    )
    db.add(design)
    await db.commit()
    await db.refresh(design)
    return design


@router.get("/{design_id}", response_model=DesignResponse)
async def get_design(design_id: int, db: AsyncSession = Depends(get_db)) -> Design:
    design = await db.get(Design, design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return design


@router.get("/{design_id}/mesh")
async def get_design_mesh(design_id: int, db: AsyncSession = Depends(get_db)) -> FileResponse:
    design = await db.get(Design, design_id)
    if not design or not design.file_path:
        raise HTTPException(status_code=404, detail="Mesh file not found")

    path = Path(design.file_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Mesh file not found on disk")

    media_types = {
        "stl": "model/stl",
        "obj": "model/obj",
        "ply": "application/octet-stream",
        "glb": "model/gltf-binary",
        "gltf": "model/gltf+json",
    }
    media_type = media_types.get(design.file_type or "", "application/octet-stream")
    return FileResponse(path, media_type=media_type, filename=path.name)


@router.post("/{design_id}/upload", response_model=DesignResponse)
async def upload_design_file(
    design_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Design:
    design = await db.get(Design, design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "model.stl").suffix.lower()
    allowed = {".stl", ".obj", ".ply", ".glb", ".gltf"}
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(sorted(allowed))}")

    dest = upload_dir / f"design_{design_id}{suffix}"
    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    design.file_path = str(dest)
    design.file_type = suffix.lstrip(".")
    await db.commit()
    await db.refresh(design)
    return design


@router.post("/{design_id}/autoreview", response_model=AutoReviewResponse)
async def autoreview_design(
    design_id: int,
    payload: AutoReviewRequest,
    db: AsyncSession = Depends(get_db),
) -> AutoReviewResponse:
    design = await db.get(Design, design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    summary, issues, llm_insights = await run_autoreview(db, design, payload)
    return AutoReviewResponse(
        design_id=design_id,
        issues_found=len(issues),
        issues=[IssueResponse.model_validate(i) for i in issues],
        geometry_summary=summary,
        llm_insights=llm_insights,
    )


@router.get("/{design_id}/issues", response_model=list[IssueResponse])
async def list_design_issues(design_id: int, db: AsyncSession = Depends(get_db)) -> list[Issue]:
    result = await db.execute(select(Issue).where(Issue.design_id == design_id).order_by(Issue.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{design_id}/similar", response_model=list[SimilarDesignResponse])
async def similar_designs(
    design_id: int,
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
) -> list[SimilarDesignResponse]:
    design = await db.get(Design, design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    matches = await find_similar_designs(db, design, limit=limit)
    return [
        SimilarDesignResponse(
            design=DesignResponse.model_validate(match),
            similarity=round(score, 4),
        )
        for match, score in matches
    ]
