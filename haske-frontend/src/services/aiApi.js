import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ai';

// Prédire la production solaire
export const predictPower = async (irradiation, temperature) => {
  try {
    const response = await axios.post(`${API_URL}/predict`, {
      irradiation,
      temperature
    });
    return response.data;
  } catch (error) {
    console.error('Erreur prédiction:', error);
    throw error;
  }
};

// Détecter les anomalies
export const detectAnomaly = async (voltage, current, temperature, power) => {
  try {
    const response = await axios.post(`${API_URL}/detect-anomaly`, {
      voltage,
      current,
      temperature,
      power
    });
    return response.data;
  } catch (error) {
    console.error('Erreur détection:', error);
    throw error;
  }
};