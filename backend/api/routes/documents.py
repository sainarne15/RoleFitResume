"""
Document handling routes
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from api.services.document_extractor import DocumentExtractor

router = APIRouter()
extractor = DocumentExtractor()


@router.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    """Extract text and structure from PDF or Word document"""

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_bytes = await file.read()
    file_extension = file.filename.split('.')[-1].lower()

    if file_extension == 'pdf':
        result = extractor.extract_from_pdf(file_bytes)
    elif file_extension in ['docx', 'doc']:
        result = extractor.extract_from_word(file_bytes)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_extension}"
        )

    if not result['success']:
        raise HTTPException(status_code=500, detail=result.get('error', 'Extraction failed'))

    # Extract contact info
    contact = extractor.extract_contact_info(result['text'])
    result['contact'] = contact

    return result