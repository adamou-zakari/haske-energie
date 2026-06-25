import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erreur API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

/**
 * Routes capteurs / alertes (voir haske-backend-firebase/src/routes/sensors.routes.js)
 * Préfixe Express : app.use('/api/sensors', sensorsRoutes)
 */
api.getLatestData = async (limit = 10) => {
  const { data } = await api.get('/sensors/latest', {
    params: { limit },
  });
  return data;
};

api.getHistoricalData = async (hours = 24) => {
  const { data } = await api.get('/sensors/history', {
    params: { hours },
  });
  return data;
};

api.getAlerts = async () => {
  const { data } = await api.get('/sensors/alerts');
  return data;
};

api.resolveAlert = async (id) => {
  const { data } = await api.put(`/sensors/alerts/${id}/resolve`);
  return data;
};

export default api;