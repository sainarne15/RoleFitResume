export interface Resume {
  text: string;
  sections: ResumeSection;
  word_count: number;
  line_count: number;
}

export interface ResumeSection {
  header: Section;
  summary: Section;
  experience: ExperienceSection;
  skills: Section;
  education: Section;
  other: Section;
}

export interface Section {
  content: string;
  lines: string[];
  start_line: number;
  end_line: number;
}

export interface ExperienceSection extends Section {
  jobs: Job[];
}

export interface Job {
  title: string;
  lines: string[];
  bullets: string[];
}

export interface ATSScore {
  score: number;
  breakdown: {
    keywords: KeywordScore;
    sections: SectionScore;
    action_verbs: VerbScore;
    metrics: MetricScore;
    length: LengthScore;
  };
}

export interface KeywordScore {
  score: number;
  matched: number;
  total: number;
  keywords: string[];
}

export interface SectionScore {
  score: number;
  found: string[];
  missing: string[];
}

export interface VerbScore {
  score: number;
  count: number;
  verbs: string[];
}

export interface MetricScore {
  score: number;
  count: number;
  examples: string[];
}

export interface LengthScore {
  score: number;
  word_count: number;
  feedback: string;
}

export interface VersionHistory {
  version: number;
  resume: string;
  ats_score: number;
  timestamp: string;
}

export interface LLMProvider {
  name: string;
  models: string[];
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    name: 'OpenAI',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ]
  },
  claude: {
    name: 'Claude',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-flash-1.5:free',
      'google/gemini-flash-1.5-8b:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.1-70b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'mistralai/mistral-nemo:free',
      'microsoft/phi-3-medium-128k-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-4-turbo',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-405b-instruct',
      'deepseek/deepseek-chat'
    ]
  }
};