"""
ATS Scoring Service - Honest and realistic scoring
"""
import re
from collections import Counter
from typing import Dict


class ATSScorer:
    """Calculate honest ATS scores for resumes"""

    def calculate_score(self, resume_text: str, job_description: str) -> Dict:
        """Calculate comprehensive ATS score"""
        if not resume_text or not job_description:
            return {'score': 0, 'breakdown': {}}

        score = 0
        breakdown = {}
        resume_lower = resume_text.lower()
        jd_lower = job_description.lower()

        # 1. Keyword Matching (50 points) - STRICT
        keyword_result = self._score_keywords(resume_lower, jd_lower)
        score += keyword_result['score']
        breakdown['keywords'] = keyword_result

        # 2. Essential Sections (20 points)
        sections_result = self._score_sections(resume_lower)
        score += sections_result['score']
        breakdown['sections'] = sections_result

        # 3. Action Verbs (15 points)
        verbs_result = self._score_action_verbs(resume_lower)
        score += verbs_result['score']
        breakdown['action_verbs'] = verbs_result

        # 4. Quantifiable Achievements (10 points)
        metrics_result = self._score_metrics(resume_text)
        score += metrics_result['score']
        breakdown['metrics'] = metrics_result

        # 5. Resume Length (5 points)
        length_result = self._score_length(resume_text)
        score += length_result['score']
        breakdown['length'] = length_result

        return {
            'score': round(max(0, min(score, 100)), 1),
            'breakdown': breakdown
        }

    def _score_keywords(self, resume: str, jd: str) -> Dict:
        """Score keyword matching"""
        common_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'work', 'using', 'make', 'use', 'need', 'help', 'such'
        }

        jd_words = [word.strip('.,!?;:()[]{}') for word in jd.split()]
        jd_words = [word for word in jd_words if len(word) > 3 and word not in common_words]
        jd_word_freq = Counter(jd_words)

        top_keywords = [word for word, _ in jd_word_freq.most_common(40)]

        matched = []
        for kw in top_keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', resume):
                matched.append(kw)

        score = (len(matched) / len(top_keywords)) * 50 if top_keywords else 0

        return {
            'score': score,
            'matched': len(matched),
            'total': len(top_keywords),
            'keywords': matched[:10]  # Top 10 for display
        }

    def _score_sections(self, resume: str) -> Dict:
        """Score essential sections presence"""
        sections = {
            'experience': r'(experience|work history|employment)',
            'education': r'(education|degree|university|college)',
            'skills': r'(skills|technical skills|competencies)',
            'contact': r'(email|phone|linkedin|contact)'
        }

        found = []
        for name, pattern in sections.items():
            if re.search(pattern, resume):
                found.append(name)

        score = len(found) * 5

        return {
            'score': score,
            'found': found,
            'missing': [s for s in sections.keys() if s not in found]
        }

    def _score_action_verbs(self, resume: str) -> Dict:
        """Score action verb usage"""
        action_verbs = [
            'achieved', 'improved', 'developed', 'managed', 'led', 'created',
            'implemented', 'designed', 'built', 'increased', 'decreased', 'launched',
            'delivered', 'optimized', 'streamlined', 'coordinated', 'executed',
            'spearheaded', 'established', 'drove', 'generated', 'architected', 'engineered'
        ]

        found = [verb for verb in action_verbs if verb in resume]
        count = len(found)

        score = min(15, (count / 12) * 15)

        return {
            'score': score,
            'count': count,
            'verbs': found[:8]
        }

    def _score_metrics(self, resume: str) -> Dict:
        """Score quantifiable achievements"""
        patterns = [
            r'\d+%',
            r'\$\d+[kKmMbB]?',
            r'\d+\+',
            r'\d+ years',
            r'\d+ months',
            r'\d+x'
        ]

        metrics = []
        for pattern in patterns:
            metrics.extend(re.findall(pattern, resume))

        count = len(metrics)
        score = min(10, (count / 6) * 10)

        return {
            'score': score,
            'count': count,
            'examples': metrics[:5]
        }

    def _score_length(self, resume: str) -> Dict:
        """Score resume length appropriateness"""
        word_count = len(resume.split())

        if 450 <= word_count <= 750:
            score = 5
            feedback = "Optimal length"
        elif 350 <= word_count < 450 or 750 < word_count <= 900:
            score = 3
            feedback = "Acceptable length"
        else:
            score = 1
            feedback = "Too short" if word_count < 350 else "Too long"

        return {
            'score': score,
            'word_count': word_count,
            'feedback': feedback
        }