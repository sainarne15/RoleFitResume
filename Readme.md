# Resume ATS Enhancer - Next.js + FastAPI

## What's Built So Far

### ✅ Backend (Python/FastAPI) - COMPLETE
- **Enhanced PDF/Word Extraction** - Preserves layout and structure
- **Section Detection** - Properly identifies Summary, Skills, Experience, Education
- **Job Boundary Detection** - Separates multiple jobs in experience section
- **ATS Scoring** - Honest scoring algorithm
- **LLM Service** - Supports OpenAI, Claude, OpenRouter with YOUR working prompts
- **API Routes** - Document upload, enhancement, scoring

### 🚧 Frontend (Next.js) - NEXT STEP
Will build:
1. Quick Enhance mode (side-by-side view)
2. Interactive Studio (Git diff-style editing)

## Project Structure

```
resume-ats-app/
├── backend/
│   ├── api/
│   │   ├── routes/          # API endpoints
│   │   │   ├── documents.py
│   │   │   ├── enhance.py
│   │   │   └── scoring.py
│   │   └── services/        # Business logic
│   │       ├── document_extractor.py  # Better PDF parsing
│   │       ├── ats_scorer.py          # Honest ATS scoring
│   │       └── llm_service.py         # All LLM providers
│   ├── main.py
│   └── requirements.txt
│
└── frontend/                # Next step
    ├── src/
    │   ├── app/
    │   ├── components/
    │   │   ├── QuickEnhance/
    │   │   └── InteractiveStudio/
    │   └── lib/
    └── package.json
```

## Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Install uvicorn directly
pip install uvicorn fastapi

# Run server
uvicorn main:app --reload --port 8000
```

## API Endpoints

### 1. Extract Document
```bash
POST /api/documents/extract
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "text": "full resume text",
  "sections": {
    "header": {...},
    "summary": {...},
    "experience": {
      "jobs": [
        {
          "title": "Software Engineer",
          "lines": [...],
          "bullets": [...]
        }
      ]
    },
    "skills": {...},
    "education": {...}
  },
  "word_count": 650,
  "line_count": 42
}
```

### 2. Enhance Resume
```bash
POST /api/enhance
{
  "resume": "original resume text",
  "job_description": "job description",
  "provider": "claude",  # or "openai", "openrouter"
  "model": "claude-sonnet-4-20250514",
  "api_key": "your-api-key"
}

Response:
{
  "success": true,
  "enhanced_resume": "enhanced text",
  "word_count": 655
}
```

### 3. Calculate ATS Score
```bash
POST /api/scoring/calculate
{
  "resume": "resume text",
  "job_description": "job description"
}

Response:
{
  "score": 67.5,
  "breakdown": {
    "keywords": {
      "score": 35.2,
      "matched": 28,
      "total": 40
    },
    "sections": {...},
    "action_verbs": {...},
    "metrics": {...},
    "length": {...}
  }
}
```

## Key Features of Backend

### 1. Enhanced PDF Extraction
- Uses `pdfplumber` for layout preservation
- Maintains exact line structure from PDF viewer
- Detects sections in correct order
- Separates multiple jobs in experience section
- Identifies bullet points accurately

### 2. Smart Section Detection
- Recognizes: Header, Summary, Experience, Skills, Education
- Detects job boundaries by dates and company names
- Extracts bullet points vs regular text
- Preserves section order as in original document

### 3. Your Original Prompts
- ±10 word limit
- Preserves strong bullet points
- Strategic keyword integration
- All your guardrails intact

### 4. Multiple LLM Support
All models from yesterday:
- **OpenAI**: gpt-4o, gpt-4o-mini, gpt-4-turbo, etc.
- **Claude**: claude-sonnet-4-20250514, claude-3-5-sonnet, etc.
- **OpenRouter**: Free and paid models

## Next Steps

### Phase 1: Quick Enhance Frontend (Now)
Build React component with:
- File upload (drag & drop)
- JD + Original resume on left
- Enhanced resume on right
- Highlight only new additions
- Download button
- Version history
- API key management

### Phase 2: Interactive Studio (Later)
Build Git diff-style editor with:
- Full resume on left with sections
- Each bullet point with slide control
- Accept/Reject/Edit per bullet
- Real-time word count tracking
- Visual feedback for changes
- Build final resume button

## Testing Backend

```bash
# Test document extraction
curl -X POST http://localhost:8000/api/documents/extract \
  -F "file=@your_resume.pdf"

# Test enhancement
curl -X POST http://localhost:8000/api/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "resume": "Your resume text...",
    "job_description": "Job description...",
    "provider": "claude",
    "model": "claude-sonnet-4-20250514",
    "api_key": "your-key"
  }'
```
