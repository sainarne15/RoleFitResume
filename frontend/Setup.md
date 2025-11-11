# Quick Enhance Frontend - Setup Guide

## ✅ What's Built

**Quick Enhance Mode with:**
- ✅ File upload (drag & drop) for PDF/DOCX
- ✅ Job Description on left side
- ✅ Original Resume on left side  
- ✅ Enhanced Resume on right side
- ✅ Highlighting ONLY new additions (not everything)
- ✅ All your models (OpenAI, Claude, OpenRouter)
- ✅ API key management with session storage
- ✅ Version history (restore previous versions)
- ✅ ATS score display with comparison
- ✅ Word count tracking (shows if within ±10)
- ✅ Download button

## 🚀 Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Frontend will run on: `http://localhost:3000`

**Make sure backend is running:**
```bash
cd ../backend
python -m uvicorn main:app --reload --port 8000
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main page (uses QuickEnhance)
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   └── QuickEnhance/
│   │       ├── index.tsx       # Main component (state management)
│   │       ├── FileUpload.tsx  # Drag & drop upload
│   │       ├── LeftPanel.tsx   # JD + Original resume
│   │       ├── RightPanel.tsx  # Enhanced resume with highlights
│   │       └── Settings.tsx    # API keys, models, history
│   ├── lib/
│   │   └── api.ts             # Backend API client
│   └── types/
│       └── index.ts           # TypeScript types
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 🎨 Features

### Left Panel
- Job Description textarea (top)
- Original Resume display (bottom)
- Shows word count and line count

### Right Panel  
- Enhanced Resume with toggle for highlights
- **Highlights only NEW words** (green background)
- Editable textarea when highlights off
- Word count with diff indicator (green if ±10, orange if more)
- Download button

### Settings (Top Bar)
- Provider dropdown (OpenAI, Claude, OpenRouter)
- Model dropdown (updates based on provider)
- API key input (stored per session)
- Version history (click to restore)

## 🔧 How It Works

1. **Upload Resume**: Drag & drop or click to upload PDF/DOCX
2. **Backend extracts text** preserving structure
3. **Paste Job Description** in textarea
4. **ATS Score calculated** automatically
5. **Click "Enhance"**: Sends to backend with your API key
6. **See results**: Original on left, Enhanced on right
7. **Green highlights**: Only shows newly added words
8. **Download**: Get enhanced resume as .txt file

## 🎯 Key Differences from Streamlit

### ✅ Better UX
- Real side-by-side view (no scrolling needed)
- Smooth interactions (no page reloads)
- Better highlighting (only additions, not everything)
- Proper drag & drop

### ✅ Better Performance
- API calls don't reload entire page
- State management with React
- Instant UI updates

### ⚠️ Note on PDF Display
Currently shows extracted text, not actual PDF viewer. To show PDF as-is:
- Would need PDF.js library
- Adds complexity
- Text extraction is more practical for editing

## 🧪 Testing

1. Start backend: `cd backend && python -m uvicorn main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Open: `http://localhost:3000`
4. Upload a resume PDF/DOCX
5. Paste job description
6. Add API key for your chosen provider
7. Click "Enhance Resume"

## 🐛 Common Issues

### "Cannot connect to backend"
- Make sure backend is running on port 8000
- Check CORS settings in backend/main.py

### "API key error"
- Make sure you've entered API key in Settings
- Check key is valid for selected provider

### "File upload fails"
- Check file is PDF or DOCX
- Make sure backend document extractor is working

## ➡️ Next Steps

After Quick Enhance works:
1. Build Interactive Studio mode
2. Add better PDF viewer (PDF.js)
3. Add more export options (DOCX, not just TXT)
4. Add A/B testing for multiple versions

Ready to test? Let me know if you hit any issues!