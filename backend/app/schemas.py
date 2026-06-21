from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ReviewStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class IssueSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class DesignCreate(BaseModel):
    name: str
    description: str | None = None


class DesignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    file_path: str | None
    file_type: str | None
    metadata_json: dict | None
    created_at: datetime


class ReviewCreate(BaseModel):
    design_id: int
    title: str
    reviewer_name: str = "Anonymous"


class ReviewUpdate(BaseModel):
    status: ReviewStatus | None = None
    summary: str | None = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    design_id: int
    title: str
    status: ReviewStatus
    reviewer_name: str
    summary: str | None
    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseModel):
    author_name: str
    body: str


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    review_id: int
    author_name: str
    body: str
    created_at: datetime


class AnnotationCreate(BaseModel):
    label: str
    position_x: float
    position_y: float
    position_z: float
    note: str | None = None
    severity: IssueSeverity = IssueSeverity.INFO
    source: str = "human"


class AnnotationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    review_id: int
    label: str
    position_x: float
    position_y: float
    position_z: float
    note: str | None
    severity: IssueSeverity
    source: str


class IssueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    design_id: int
    rule_id: str
    title: str
    description: str
    severity: IssueSeverity
    position: dict | None
    auto_detected: bool
    created_at: datetime


class AutoReviewRequest(BaseModel):
    include_llm: bool = True


class AutoReviewResponse(BaseModel):
    design_id: int
    issues_found: int
    issues: list[IssueResponse]
    geometry_summary: dict
    llm_insights: str | None = None


class LessonLearnedCreate(BaseModel):
    title: str
    category: str
    content: str
    source_design: str | None = None
    tags: list[str] = Field(default_factory=list)


class LessonLearnedResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    content: str
    source_design: str | None
    tags: list[str] | None
    created_at: datetime
    similarity: float | None = None


class SimilarDesignResponse(BaseModel):
    design: DesignResponse
    similarity: float


class SearchQuery(BaseModel):
    query: str
    limit: int = 5
