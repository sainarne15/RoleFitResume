"""
Resume enhancement routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()


class EnhanceRequest(BaseModel):
    resume: str
    job_description: str
    provider: str  # 'openai', 'claude', 'openrouter'
    model: str
    api_key: str


@router.post("/")
async def enhance_resume(request: EnhanceRequest):
    """Enhance resume using specified LLM provider"""

    result = llm_service.enhance_resume(
        resume=request.resume,
        job_description=request.job_description,
        provider=request.provider,
        model=request.model,
        api_key=request.api_key
    )

    if not result['success']:
        raise HTTPException(status_code=500, detail=result.get('error', 'Enhancement failed'))

    return result