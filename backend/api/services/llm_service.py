"""
LLM Enhancement Service - Using original working prompts
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
        """Build the enhancement prompt - YOUR ORIGINAL WORKING PROMPT"""
        original_word_count = len(resume.split())

        return f"""You are an expert resume writer and ATS optimization specialist. Your goal is to make STRATEGIC, TARGETED enhancements while preserving the resume's core structure and strong existing content.

Job Description:
{job_desc}

Current Resume (Word count: {original_word_count}):
{resume}

ENHANCEMENT STRATEGY (CRITICAL - FOLLOW EXACTLY):

1. ANALYZE THE JOB DESCRIPTION - Extract Keywords Dynamically:
   • Identify ALL key technologies, tools, frameworks, libraries mentioned in the JD
   • Note methodologies (e.g., Agile, TDD, CI/CD, DevOps)
   • Find required soft skills and domain knowledge
   • Identify industry-specific buzzwords and terminology
   • Look for process terms (SDLC, architecture standards, compliance, etc.)

2. COMPARE WITH RESUME - Find Enhancement Opportunities:
   • Which JD keywords are MISSING from the resume entirely?
   • Which are mentioned but could be emphasized more?
   • Which bullet points are generic and could incorporate JD language?
   • Which sections lack specificity or metrics?
   • IMPORTANT: Which bullet points are already strong and relevant? → LEAVE THESE UNCHANGED

3. STRATEGIC KEYWORD INTEGRATION:
   A) Summary Section:
      - Add 3-5 of the MOST IMPORTANT keywords from the JD that align with the candidate's experience
      - Only add if truthful based on existing work history

   B) Skills Section:
      - Add missing technologies/tools from JD that the candidate has likely used based on their experience
      - Group related skills (e.g., if they have Jest, add similar testing tools from JD)
      - DO NOT add skills with no basis in the experience section

   C) Experience Bullets:
      - Weave JD keywords naturally into existing accomplishments
      - Be specific with tech stacks mentioned in JD (e.g., instead of "databases" → name specific DBs from JD)
      - Add methodology keywords where they fit (e.g., if QA/testing mentioned, add testing methodologies from JD)
      - Replace vague terms with specific JD language

4. ENHANCEMENT RULES (What to Change):
   ✓ Generic statements → Add JD-specific details and metrics
   ✓ Vague tech mentions → Replace with specific tools/frameworks from JD
   ✓ Weak action verbs → Upgrade to power verbs
   ✓ Missing JD keywords → Integrate naturally into relevant bullets
   ✓ Bullets without metrics → Add quantifiable results where possible
   ✓ Process descriptions → Use JD's terminology (e.g., their SDLC language)

5. PRESERVATION RULES (What NOT to Change):
   ✗ DO NOT modify bullets that already have: strong metrics, JD-relevant keywords, specific achievements
   ✗ DO NOT change structure: same sections, job titles, dates, company names
   ✗ DO NOT add new experiences or fabricate achievements
   ✗ DO NOT modify education, certifications, or awards
   ✗ DO NOT add technologies that have no basis in experience

6. LENGTH DISCIPLINE:
   • Target: {original_word_count} words (±10 words maximum)
   • If adding keywords increases length, compensate by:
     - Removing filler words and redundancy
     - Condensing less relevant bullets
     - Combining related points
   • Prioritize: JD-relevant content stays/expands, less relevant content condenses

7. AUTHENTICITY CHECK:
   • Every enhancement must be truthful and based on existing experience
   • Keywords should align with work already described
   • If a JD keyword doesn't fit the candidate's background, DO NOT force it
   • Aim for 40-60% of content modified, leaving strong points unchanged

FINAL VERIFICATION:
- Did I preserve strong, relevant bullet points unchanged?
- Did I extract keywords FROM THE JD (not use generic examples)?
- Are all enhancements truthful and aligned with existing experience?
- Is word count within {original_word_count} ± 10 words?
- Does this resume now better match THIS SPECIFIC job description?

Return ONLY the enhanced resume text with the same format and structure. No preamble, no explanations."""

    def _call_openai(self, resume: str, job_desc: str, model: str, api_key: str) -> str:
        """Call OpenAI API"""
        client = openai.OpenAI(api_key=api_key)
        prompt = self._build_prompt(resume, job_desc)

        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert resume optimizer who extracts keywords from job descriptions and makes strategic, minimal enhancements while preserving authenticity."
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

        # Simplified prompt for OpenRouter free models
        prompt = f"""Enhance this resume for the job description below. Make strategic improvements while keeping word count within {original_word_count} ± 10 words.

Job Description:
{job_desc}

Resume:
{resume}

Focus on:
1. Adding relevant keywords from JD
2. Quantifying achievements
3. Enhancing weak bullet points
4. Preserving strong content

Return only the enhanced resume."""

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