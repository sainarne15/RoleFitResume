"""
LLM Enhancement Service - FOCUS ON ATS SCORE IMPROVEMENT
Supports OpenAI, Claude, and OpenRouter
"""
import openai
import anthropic
import requests
from typing import Dict, Optional


class LLMService:
    """Service to call various LLM providers for resume enhancement"""

    def __init__(self):
        self.providers = {
            'openai': self._call_openai,
            'claude': self._call_claude,
            'openrouter': self._call_openrouter
        }

    def enhance_resume(
        self,
        resume: str,
        job_description: str,
        provider: str,
        model: str,
        api_key: str
    ) -> Dict:
        """Enhance resume using specified LLM provider"""

        if provider not in self.providers:
            return {
                'success': False,
                'error': f'Unknown provider: {provider}'
            }

        try:
            result = self.providers[provider](resume, job_description, model, api_key)
            return {
                'success': True,
                'enhanced_resume': result,
                'word_count': len(result.split())
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _build_prompt(self, resume: str, job_desc: str) -> str:
        """Build the enhancement prompt - FOCUS ON ATS SCORE IMPROVEMENT"""
        original_word_count = len(resume.split())

        return f"""You are an expert ATS (Applicant Tracking System) optimizer. Your PRIMARY GOAL is to MAXIMIZE the ATS score by strategically matching the resume to the job description.

Job Description:
{job_desc}

Current Resume (Word count: {original_word_count}):
{resume}

PRIMARY OBJECTIVE: IMPROVE ATS SCORE
The ATS scoring system evaluates:
1. Keyword Matching (50 points) - Most important!
2. Essential Sections (20 points) - Experience, Education, Skills, Contact
3. Action Verbs (15 points) - Led, Developed, Achieved, etc.
4. Quantifiable Achievements (10 points) - Numbers, percentages, metrics
5. Resume Length (5 points) - Optimal: 450-750 words

YOUR MISSION: Add as many relevant keywords from the job description as possible while keeping the resume authentic and maintaining similar length.

CRITICAL ATS OPTIMIZATION STRATEGY:

1. EXTRACT ALL KEYWORDS FROM JOB DESCRIPTION:
   • Technologies: (Python, React, AWS, PostgreSQL, Docker, Kubernetes)
   • Tools & Frameworks: (Django, Flask, Next.js, TensorFlow)
   • Methodologies: (Agile, Scrum, CI/CD, DevOps, TDD)
   • Skills: (Leadership, Communication, Problem-solving)
   • Domain Terms: (Machine Learning, API Development, Cloud Architecture)
   • Certifications: (AWS Certified, PMP, etc.)

2. KEYWORD INTEGRATION (MAXIMIZE SCORE):
   A) Replace generic terms with JD-specific keywords:
      ❌ "worked with databases" 
      ✅ "developed applications using PostgreSQL, MongoDB, Redis"
      
   B) Add missing JD keywords naturally into existing bullets:
      ❌ "Led development team"
      ✅ "Led Agile development team using Scrum, CI/CD, Docker, Kubernetes"
      
   C) Use exact phrases from JD when possible:
      - If JD says "RESTful APIs" → use "RESTful APIs" not "REST API"
      - If JD says "AWS Lambda" → use "AWS Lambda" not "serverless functions"

3. ACTION VERBS (BOOST SCORE +15 points):
   Replace weak verbs with strong action verbs:
   ❌ worked, did, was responsible for, helped
   ✅ achieved, led, developed, implemented, optimized, delivered, spearheaded, architected

4. QUANTIFY EVERYTHING (BOOST SCORE +10 points):
   Add metrics wherever truthful:
   ❌ "Improved system performance"
   ✅ "Improved system performance by 40%, reducing response time from 2s to 1.2s"

5. LENGTH CONTROL:
   • Target: {original_word_count} ± 30 words
   • Current: {original_word_count} → Range: {original_word_count - 30} to {original_word_count + 30}
   • For every keyword you ADD, remove filler words ("various", "multiple", "different")
   • Keep ALL bullet points and job experiences

6. PRESERVE (CRITICAL):
   ✓ KEEP contact information (email, phone, LinkedIn) at the top - DO NOT REMOVE
   ✓ KEEP education and certifications exactly as written
   ✓ KEEP job titles, companies, and dates
   ✓ KEEP existing strong bullet points
   ✗ DO NOT fabricate experience

7. ATS SECTION HEADERS:
   Ensure these sections exist with standard headers:
   • Contact info at top (name, phone, email, LinkedIn)
   • EXPERIENCE or WORK EXPERIENCE
   • EDUCATION
   • SKILLS or TECHNICAL SKILLS
   • SUMMARY or PROFESSIONAL SUMMARY (if present)

EXAMPLE OF MAXIMUM ATS OPTIMIZATION:

BEFORE (Low ATS Score):
"Worked on web applications using various technologies. Helped team with projects."

AFTER (High ATS Score - added 10+ JD keywords):
"Developed scalable web applications using React, Next.js, TypeScript, Node.js, and PostgreSQL. Led Agile team implementing CI/CD pipelines with Docker, Kubernetes, AWS, improving deployment efficiency by 60%."

FINAL CHECKLIST BEFORE RETURNING:
✓ Added MAXIMUM number of JD keywords naturally?
✓ Replaced ALL weak verbs with action verbs?
✓ Added numbers/metrics where truthful?
✓ Used exact JD phrases when possible?
✓ Word count within ±30 words?
✓ Preserved contact information at top?
✓ Preserved ALL structure, education, job titles?
✓ Will this score HIGHER on ATS than original?

RESPONSE FORMAT:
Return ONLY the enhanced resume text. NO preamble, NO explanations, NO markdown - just the resume content with all formatting and contact information intact."""

    def _call_openai(self, resume: str, job_desc: str, model: str, api_key: str) -> str:
        """Call OpenAI API"""
        client = openai.OpenAI(api_key=api_key)
        prompt = self._build_prompt(resume, job_desc)

        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert ATS optimizer who maximizes keyword matching and scoring. Your goal is to make every resume score HIGHER on ATS systems."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=3000
        )

        return response.choices[0].message.content.strip()

    def _call_claude(self, resume: str, job_desc: str, model: str, api_key: str) -> str:
        """Call Claude API"""
        client = anthropic.Anthropic(api_key=api_key)
        prompt = self._build_prompt(resume, job_desc)

        response = client.messages.create(
            model=model,
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text.strip()

    def _call_openrouter(self, resume: str, job_desc: str, model: str, api_key: str) -> str:
        """Call OpenRouter API"""
        original_word_count = len(resume.split())

        # ATS-focused prompt for OpenRouter
        prompt = f"""MAXIMIZE ATS SCORE: Enhance this resume to match the job description below.

Job Description:
{job_desc}

Resume:
{resume}

INSTRUCTIONS:
1. Extract ALL keywords from job description (technologies, tools, skills)
2. Add as many JD keywords as possible into existing bullet points
3. Replace weak verbs with: achieved, led, developed, implemented, optimized
4. Add metrics/numbers where truthful
5. Keep word count within {original_word_count} ± 20 words
6. PRESERVE contact information at top (name, phone, email)
7. PRESERVE all job titles, companies, dates
8. PRESERVE education section

GOAL: Make ATS score go UP by adding maximum relevant keywords.

Return only the enhanced resume with all contact info intact."""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5,
            "max_tokens": 3000
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )

        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content'].strip()
        else:
            raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")