const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Timeout en ms para cada intento (30s para aguantar cold-start de Render Free Tier)
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

// Warm-up: despertar el servidor apenas carga la app (sin bloquear nada)
fetch(`${API_URL.replace('/api', '')}/api/health`, { method: 'GET', mode: 'cors' }).catch(() => {});

// Helper para obtener headers con token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Fetch con timeout y retry automatico (sobrevive cold-start de Render)
const fetchWithRetry = async (url, options = {}, attempt = 1) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError' || err.message?.includes('fetch') || err.message?.includes('Failed');
    if (isTimeout && attempt < MAX_RETRIES) {
      // Esperar progresivamente mas antes del siguiente intento (3s, 5s, 8s)
      const delay = attempt === 1 ? 3000 : attempt === 2 ? 5000 : 8000;
      console.log(`⏳ Reintentando conexión al servidor (intento ${attempt + 1}/${MAX_RETRIES})...`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, attempt + 1);
    }
    if (isTimeout) {
      throw new Error('El servidor esta iniciando. Esto puede tomar hasta 30 segundos en el primer acceso. Recarga la pagina e intenta de nuevo.');
    }
    throw new Error('Sin conexion. Verifica tu internet e intenta de nuevo.');
  }
};

// Helper para manejar respuestas
const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error('El servidor no esta disponible. Intente mas tarde.');
    }
    throw new Error('Respuesta inesperada del servidor');
  }

  if (!response.ok) {
    if (response.status === 401) {
      const isAuthEndpoint = response.url?.includes('/auth/') || response.url?.includes('/patients') ||
        response.url?.includes('/treatments') || response.url?.includes('/odontogram') ||
        response.url?.includes('/users') || response.url?.includes('/reports') ||
        response.url?.includes('/audit') || response.url?.includes('/ai/');
      const isReniecEndpoint = response.url?.includes('/reniec/');
      
      if (isAuthEndpoint && !isReniecEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error(data.error || 'Sesion expirada. Inicie sesion nuevamente.');
      }
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
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint, body) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (endpoint, body) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  patch: async (endpoint, body) => {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
};


// =============================================
// AUTH
// =============================================
export const authService = {
  login:          (username, password) => api.post('/auth/login', { username, password }),
  logout:         ()                   => api.post('/auth/logout', {}),
  loginWithGoogle:(token)              => api.post('/auth/google', { token }),
  getMe:          ()                   => api.get('/auth/me'),
  changePassword: (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password }),
  updateProfile:  (data)               => api.put('/auth/profile', data),
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

// =============================================
// AUDITORÍA
// =============================================
export const auditService = {
  getLogs: (params = {}) => {
    const { page = 1, limit = 30, action, entity, user_id, start_date, end_date } = params;
    const query = new URLSearchParams({ page, limit });
    if (action)     query.append('action', action);
    if (entity)     query.append('entity', entity);
    if (user_id)    query.append('user_id', user_id);
    if (start_date) query.append('start_date', start_date);
    if (end_date)   query.append('end_date', end_date);
    return api.get(`/audit?${query.toString()}`);
  },
};

// =============================================
// CITAS
// =============================================
export const appointmentService = {
  getAll:     (params = {}) => {
    const query = new URLSearchParams();
    if (params.date)       query.set('date',       params.date);
    if (params.status)     query.set('status',     params.status);
    if (params.dentist_id) query.set('dentist_id', params.dentist_id);
    if (params.patient_id) query.set('patient_id', params.patient_id);
    if (params.page)       query.set('page',       params.page);
    if (params.limit)      query.set('limit',      params.limit);
    return api.get(`/appointments?${query.toString()}`);
  },
  getToday:    ()                 => api.get('/appointments/today'),
  getUpcoming: ()                 => api.get('/appointments/upcoming'),
  getById:     (id)               => api.get(`/appointments/${id}`),
  create:      (data)             => api.post('/appointments', data),
  update:      (id, data)         => api.put(`/appointments/${id}`, data),
  cancel:      (id, reason = '')  => api.patch(`/appointments/${id}/cancel`, { reason }),
  complete:    (id)               => api.patch(`/appointments/${id}/complete`, {}),
};

export default api;
