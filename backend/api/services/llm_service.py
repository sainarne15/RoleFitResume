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
        """Build the enhancement prompt - STRICT LENGTH CONTROL"""
        original_word_count = len(resume.split())

        return f"""You are an expert resume writer and ATS optimization specialist. Your goal is to make STRATEGIC, TARGETED enhancements while preserving the resume's core structure and strong existing content.

Job Description:
{job_desc}

Current Resume (Word count: {original_word_count}):
{resume}

CRITICAL LENGTH REQUIREMENT:
• Target word count: {original_word_count} words (±30 words acceptable)
• Current: {original_word_count} words → Target range: {original_word_count - 30} to {original_word_count + 30} words
• Prefer staying closer to original, but ±30 is acceptable
• DO NOT remove bullet points or job experiences
• If you add keywords, compensate by being more concise elsewhere

ENHANCEMENT STRATEGY:

1. ANALYZE THE JOB DESCRIPTION - Extract Keywords:
   • Identify key technologies, tools, frameworks, libraries from JD
   • Note methodologies (Agile, TDD, CI/CD, DevOps)
   • Find required soft skills and domain knowledge
   • Identify industry-specific terminology

2. STRATEGIC ENHANCEMENTS (What to Change):
   A) Replace vague words with JD-specific keywords:
      - "databases" → specific DB names from JD
      - "worked on" → specific action verb + technology
      - "various projects" → name actual project types from JD
   
   B) Add missing JD keywords naturally:
      - Weave into existing bullet points
      - Don't create new bullet points
      - Replace generic terms with specific ones
   
   C) Quantify where possible:
      - Add metrics to vague statements
      - Add scale/impact to existing points

3. PRESERVATION RULES (What NOT to Change):
   ✗ DO NOT remove bullet points
   ✗ DO NOT remove job experiences
   ✗ DO NOT shorten sections significantly
   ✗ DO NOT change structure, job titles, dates, company names
   ✗ DO NOT remove strong achievements
   ✗ Keep ALL contact information unchanged
   ✗ Keep ALL education, certifications exactly as written

4. LENGTH DISCIPLINE (CRITICAL):
   For EVERY word you ADD, you MUST:
   • Remove filler words ("various", "multiple", "different")
   • Remove redundant phrases ("in order to" → "to")
   • Combine similar points if absolutely needed
   • Make language more concise
   
   Example of length-neutral enhancement:
   BEFORE (10 words): "Worked on various projects using different databases and tools"
   AFTER (10 words): "Developed applications using PostgreSQL, MongoDB, Redis, Docker"
   
   Example of WRONG approach (reduced words):
   BEFORE (10 words): "Worked on various projects using different databases and tools"  
   AFTER (5 words): "Developed database applications" ← WRONG! Too short!

5. AUTHENTICITY:
   • Every enhancement must be truthful
   • Only add keywords that fit the actual experience
   • If JD keyword doesn't fit, don't force it

FINAL VERIFICATION BEFORE RETURNING:
❗ Word count within {original_word_count} ± 30 words? (Count the words!)
❗ Did I preserve ALL bullet points?
❗ Did I preserve ALL job experiences?
❗ Did I enhance weak points with JD keywords?
❗ Are changes truthful and based on existing experience?

RESPONSE FORMAT:
Return ONLY the enhanced resume text maintaining EXACT same structure and line breaks.
NO preamble, NO explanations, NO markdown - just the resume content.
Keep all bullet points, headers, and formatting intact.

CRITICAL - DO NOT ADD ANY ANNOTATIONS:
❌ DO NOT add phrases like "added from JD", "enhanced", "[keyword]", or any meta-commentary
❌ DO NOT add brackets, parentheses, or notes about what was changed
❌ Return ONLY the actual resume text as it should appear
❌ NO explanatory text before or after the resume content
✅ The output should look like a real, polished resume - not a marked-up draft"""

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