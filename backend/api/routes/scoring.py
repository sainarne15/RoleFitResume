"""
ATS scoring routes
"""
from fastapi import APIRouter
from pydantic import BaseModel
from api.services.ats_scorer import ATSScorer

router = APIRouter()
scorer = ATSScorer()


class ScoreRequest(BaseModel):
    resume: str
    job_description: str


@router.post("/calculate")
async def calculate_score(request: ScoreRequest):
    """Calculate ATS score for resume against job description"""

    result = scorer.calculate_score(request.resume, request.job_description)
    return result