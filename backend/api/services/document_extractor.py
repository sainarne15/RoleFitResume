"""
Enhanced document extraction with proper section ordering and structure preservation
"""
import pdfplumber
import PyPDF2
from docx import Document
import re
from typing import Dict, List, Tuple
from io import BytesIO


class DocumentExtractor:
    """Extract text from PDF/Word while preserving structure and order"""

    def __init__(self):
        self.section_order = ['header', 'summary', 'experience', 'skills', 'education', 'other']

    def extract_from_pdf(self, file_bytes: bytes) -> Dict:
        """Extract text from PDF with layout preservation"""
        try:
            # Try pdfplumber first (better layout preservation)
            pdf_file = BytesIO(file_bytes)
            text_lines = []

            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    # Extract with layout mode to preserve positioning
                    page_text = page.extract_text(
                        layout=True,
                        x_tolerance=3,
                        y_tolerance=3
                    )
                    if page_text:
                        text_lines.extend(page_text.split('\n'))

            full_text = '\n'.join(text_lines)

            # Parse into sections
            sections = self._parse_sections(full_text)

            return {
                'success': True,
                'text': full_text,
                'sections': sections,
                'lines': text_lines,
                'word_count': len(full_text.split()),
                'line_count': len([l for l in text_lines if l.strip()])
            }

        except Exception as e:
            # Fallback to PyPDF2
            try:
                pdf_file = BytesIO(file_bytes)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"

                sections = self._parse_sections(text)
                lines = text.split('\n')

                return {
                    'success': True,
                    'text': text,
                    'sections': sections,
                    'lines': lines,
                    'word_count': len(text.split()),
                    'line_count': len([l for l in lines if l.strip()])
                }
            except Exception as e2:
                return {
                    'success': False,
                    'error': f"PDF extraction failed: {str(e2)}"
                }

    def extract_from_word(self, file_bytes: bytes) -> Dict:
        """Extract text from Word document"""
        try:
            doc = Document(BytesIO(file_bytes))

            lines = []
            for paragraph in doc.paragraphs:
                lines.append(paragraph.text)

            # Extract from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            lines.append(cell.text)

            full_text = '\n'.join(lines)
            sections = self._parse_sections(full_text)

            return {
                'success': True,
                'text': full_text,
                'sections': sections,
                'lines': lines,
                'word_count': len(full_text.split()),
                'line_count': len([l for l in lines if l.strip()])
            }

        except Exception as e:
            return {
                'success': False,
                'error': f"Word extraction failed: {str(e)}"
            }

    def _parse_sections(self, text: str) -> Dict[str, Dict]:
        """Parse resume into structured sections maintaining order"""
        sections = {
            'header': {'content': '', 'lines': [], 'start_line': -1, 'end_line': -1},
            'summary': {'content': '', 'lines': [], 'start_line': -1, 'end_line': -1},
            'experience': {'content': '', 'lines': [], 'jobs': [], 'start_line': -1, 'end_line': -1},
            'skills': {'content': '', 'lines': [], 'start_line': -1, 'end_line': -1},
            'education': {'content': '', 'lines': [], 'start_line': -1, 'end_line': -1},
            'other': {'content': '', 'lines': [], 'start_line': -1, 'end_line': -1}
        }

        lines = text.split('\n')
        current_section = 'header'
        current_job = None
        line_idx = 0

        # First pass - identify section boundaries
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()

            # Skip empty lines in section detection
            if not line_lower:
                continue

            # Detect section headers
            if any(kw in line_lower for kw in ['summary', 'profile', 'objective', 'about']):
                if current_section == 'header' or i < 5:  # Summary usually at top
                    sections[current_section]['end_line'] = i - 1
                    current_section = 'summary'
                    sections[current_section]['start_line'] = i
                    continue

            elif any(
                    kw in line_lower for kw in ['experience', 'work history', 'employment', 'professional experience']):
                sections[current_section]['end_line'] = i - 1
                current_section = 'experience'
                sections[current_section]['start_line'] = i
                continue

            elif any(kw in line_lower for kw in ['skill', 'technical skill', 'competenc', 'proficienc', 'technolog']):
                sections[current_section]['end_line'] = i - 1
                current_section = 'skills'
                sections[current_section]['start_line'] = i
                continue

            elif any(kw in line_lower for kw in ['education', 'academic', 'degree', 'university', 'college']):
                sections[current_section]['end_line'] = i - 1
                current_section = 'education'
                sections[current_section]['start_line'] = i
                continue

            # Add line to current section
            sections[current_section]['lines'].append(line)

            # Detect job boundaries in experience section (look for dates and company names)
            if current_section == 'experience':
                # Job title pattern: usually followed by company name and dates
                if self._is_job_header(line, lines[i + 1] if i + 1 < len(lines) else ""):
                    if current_job:
                        sections['experience']['jobs'].append(current_job)
                    current_job = {
                        'title': line.strip(),
                        'lines': [line],
                        'bullets': []
                    }
                elif current_job:
                    current_job['lines'].append(line)
                    # Detect bullet points
                    if self._is_bullet_point(line):
                        current_job['bullets'].append(line.strip())

        # Add last job if exists
        if current_job:
            sections['experience']['jobs'].append(current_job)

        # Set end line for last section
        sections[current_section]['end_line'] = len(lines) - 1

        # Build content strings for each section
        for section_name, section_data in sections.items():
            section_data['content'] = '\n'.join(section_data['lines'])

        return sections

    def _is_job_header(self, line: str, next_line: str) -> bool:
        """Detect if line is a job title/header"""
        # Check for date patterns in the line or next line
        date_pattern = r'\d{4}|\d{1,2}/\d{4}|present|current'

        # Common job title indicators
        title_keywords = ['engineer', 'developer', 'manager', 'analyst', 'designer',
                          'consultant', 'specialist', 'lead', 'senior', 'junior', 'intern']

        line_lower = line.lower()
        has_title = any(kw in line_lower for kw in title_keywords)
        has_date = bool(re.search(date_pattern, line, re.IGNORECASE)) or \
                   bool(re.search(date_pattern, next_line, re.IGNORECASE))

        return has_title or has_date

    def _is_bullet_point(self, line: str) -> bool:
        """Check if line is a bullet point"""
        stripped = line.strip()

        # Check for bullet symbols
        if stripped.startswith(('•', '-', '●', '○', '*', '»', '→')):
            return True

        # Check for indentation (common for bullets without symbols)
        if line.startswith(('  ', '\t')) and len(stripped) > 20:
            return True

        # Check if starts with action verb (common for resume bullets)
        action_verbs = ['achieved', 'developed', 'created', 'managed', 'led', 'implemented',
                        'designed', 'built', 'improved', 'launched', 'delivered', 'collaborated',
                        'spearheaded', 'established', 'optimized', 'coordinated']

        first_word = stripped.split()[0].lower() if stripped else ""
        if first_word in action_verbs:
            return True

        return False

    def extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extract contact information from header"""
        contact = {
            'email': '',
            'phone': '',
            'linkedin': '',
            'location': ''
        }

        # Email pattern
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_match:
            contact['email'] = email_match.group()

        # Phone pattern
        phone_match = re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)
        if phone_match:
            contact['phone'] = phone_match.group()

        # LinkedIn pattern
        linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
        if linkedin_match:
            contact['linkedin'] = linkedin_match.group()

        return contact