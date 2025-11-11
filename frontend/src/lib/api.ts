import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Extract text from uploaded document
  extractDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/documents/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Calculate ATS score
  calculateScore: async (resume: string, jobDescription: string) => {
    const response = await apiClient.post('/scoring/calculate', {
      resume,
      job_description: jobDescription,
    });
    return response.data;
  },

  // Enhance resume
  enhanceResume: async (
    resume: string,
    jobDescription: string,
    provider: string,
    model: string,
    apiKey: string
  ) => {
    const response = await apiClient.post('/enhance', {
      resume,
      job_description: jobDescription,
      provider,
      model,
      api_key: apiKey,
    });
    return response.data;
  },
};

export default api;