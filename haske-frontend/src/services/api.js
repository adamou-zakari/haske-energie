import axios from 'axios';

// URL de base de l'API backend
const API_URL = 'http://localhost:5000/api';

// Créer une instance axios avec configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Intercepteur pour logger les erreurs
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erreur API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;