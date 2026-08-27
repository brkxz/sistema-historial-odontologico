const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper para obtener headers con token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper para manejar respuestas
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
};

// =============================================
// API GENERAL
// =============================================
const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint, body) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (endpoint, body) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// =============================================
// AUTH
// =============================================
export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
};

// =============================================
// PATIENTS
// =============================================
export const patientService = {
  getAll: (search = '', page = 1) => api.get(`/patients?search=${search}&page=${page}`),
  searchByDni: (dni) => api.get(`/patients/search/${dni}`),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
};

// =============================================
// TREATMENTS
// =============================================
export const treatmentService = {
  getByPatient: (patientId) => api.get(`/treatments/patient/${patientId}`),
  getById: (id) => api.get(`/treatments/${id}`),
  create: (data) => api.post('/treatments', data),
  update: (id, data) => api.put(`/treatments/${id}`, data),
};

// =============================================
// ODONTOGRAM
// =============================================
export const odontogramService = {
  getByPatient: (patientId) => api.get(`/odontogram/${patientId}`),
  update: (data) => api.post('/odontogram', data),
  bulkUpdate: (data) => api.post('/odontogram/bulk', data),
};

// =============================================
// USERS
// =============================================
export const userService = {
  getAll: () => api.get('/users'),
  getDentists: () => api.get('/users/dentists'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
};

// =============================================
// REPORTS
// =============================================
export const reportService = {
  getSummary: () => api.get('/reports/summary'),
  getTreatmentsByDate: (startDate, endDate) =>
    api.get(`/reports/treatments-by-date?start_date=${startDate || ''}&end_date=${endDate || ''}`),
  getTreatmentsByDentist: (startDate, endDate) =>
    api.get(`/reports/treatments-by-dentist?start_date=${startDate || ''}&end_date=${endDate || ''}`),
  getRecentTreatments: () => api.get('/reports/recent-treatments'),
};

// =============================================
// TEETH
// =============================================
export const teethService = {
  getAll: () => api.get('/teeth'),
};

// =============================================
// RENIEC - Consulta de DNI Peruano
// =============================================
export const reniecService = {
  consultarDni: (dni) => api.get(`/reniec/dni/${dni}`),
};

export default api;
