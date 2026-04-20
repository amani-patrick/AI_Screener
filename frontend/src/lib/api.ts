import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for AI screening
});

// Health
export const healthCheck = () => apiClient.get('/health');

// Dashboard
export const getDashboardStats = () => apiClient.get('/api/jobs/stats');

// Jobs
export const listJobs = (params?: { page?: number; pageSize?: number; search?: string; experienceLevel?: string }) =>
  apiClient.get('/api/jobs', { params });
export const getJob = (id: string) => apiClient.get(`/api/jobs/${id}`);
export const createJob = (data: any) => apiClient.post('/api/jobs', data, { headers: { 'x-user-id': 'demo-recruiter' } });
export const updateJob = (id: string, data: any) => apiClient.put(`/api/jobs/${id}`, data);
export const deleteJob = (id: string) => apiClient.delete(`/api/jobs/${id}`);

// Applicants
export const listApplicants = (params?: { page?: number; pageSize?: number; search?: string; country?: string }) =>
  apiClient.get('/api/applicants', { params });
export const getApplicant = (id: string) => apiClient.get(`/api/applicants/${id}`);
export const createApplicant = (data: any) => apiClient.post('/api/applicants', data);
export const updateApplicant = (id: string, data: any) => apiClient.put(`/api/applicants/${id}`, data);
export const deleteApplicant = (id: string) => apiClient.delete(`/api/applicants/${id}`);

// Screenings
export const listScreenings = () => apiClient.get('/api/screenings');
export const createScreening = (data: { jobId: string; applicantIds?: string[]; shortlistSize?: number }) =>
  apiClient.post('/api/screenings', data);
export const getScreeningResult = (id: string) => apiClient.get(`/api/screenings/${id}`);
export const getScreeningMetrics = (screeningRequestId: string, topK?: number) =>
  apiClient.get('/api/screenings/metrics/evaluate', { params: { screeningRequestId, topK } });
export const uploadCSV = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/api/screenings/upload/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
