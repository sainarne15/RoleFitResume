"""
FastAPI Backend for Resume ATS Enhancer
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import documents, enhance, scoring

app = FastAPI(title="Resume ATS Enhancer API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(enhance.router, prefix="/api/enhance", tags=["enhance"])
app.include_router(scoring.router, prefix="/api/scoring", tags=["scoring"])

@app.get("/")
async def root():
    return {"message": "Resume ATS Enhancer API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}