const express = require('express');
const cors = require('cors');
const sensorsRoutes = require('./routes/sensors.routes');
const aiRoutes = require('./routes/ai.routes');  // ✅ NOUVEAU

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sensors', sensorsRoutes);
app.use('/api/ai', aiRoutes);  // ✅ NOUVELLE ROUTE IA

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'Haské Énergie API',
    version: '2.0',
    endpoints: {
      sensors: '/api/sensors',
      ai: '/api/ai'  // ✅ NOUVEAU
    }
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

module.exports = app;