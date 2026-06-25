// sensors.controller.js
// Haské Énergie — Adamou Zakari & Sallah Alkassoum
// CACHE MÉMOIRE COMPLET : Firestore n'est LU qu'une seule fois au démarrage.
// Ensuite : history / latest / stats / trend / alertes -> servis depuis la RAM.
// Firestore n'est plus qu'ÉCRIT (POST capteurs + création d'alertes).
//
// v3 — getHistoricalData accepte une PLAGE DE DATES (from/to en ms) en plus
// de la période relative (hours), pour le sélecteur "du ... au ..." côté frontend.

const { db } = require('../config/firebase');

const HISTORY_MAX = 2880; // ~24h de mesures à 30s

// ─── CACHE MÉMOIRE ───────────────────────────────────────────
const cache = {
  latestData: null,
  history: [],        // plus récent en tête ; chaque entrée a un champ _ts (ms)
  activeAlerts: [],   // alertes non résolues (en mémoire)
  allAlerts: [],      // 100 dernières alertes (toutes)
  seeded: false,
};
// ─────────────────────────────────────────────────────────────

function toMillis(t) {
  if (!t) return Date.now();
  if (typeof t.toMillis === 'function') return t.toMillis(); // Firestore Timestamp
  if (t instanceof Date) return t.getTime();
  const p = Date.parse(t);
  return isNaN(p) ? Date.now() : p;
}
function toDate(t) {
  if (!t) return new Date();
  if (typeof t.toDate === 'function') return t.toDate();
  if (t instanceof Date) return t;
  const d = new Date(t);
  return isNaN(d.getTime()) ? new Date() : d;
}

// Lit Firestore UNE SEULE FOIS pour remplir le cache (au démarrage).
async function seedCache() {
  if (cache.seeded) return;
  cache.seeded = true; // empêche toute relecture concurrente
  try {
    const snap = await db.collection('sensor_data')
      .orderBy('timestamp', 'desc').limit(HISTORY_MAX).get();
    cache.history = snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, timestamp: toDate(data.timestamp), _ts: toMillis(data.timestamp) };
    });
    cache.latestData = cache.history[0] || null;
    console.log(`[CACHE] ${cache.history.length} mesures chargees depuis Firestore`);
  } catch (e) {
    console.warn('[CACHE] seed sensor_data ignore :', e.message);
  }
  try {
    const all = await db.collection('alerts')
      .orderBy('timestamp', 'desc').limit(100).get();
    cache.allAlerts = all.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: toDate(d.data().timestamp) }));
    cache.activeAlerts = cache.allAlerts.filter((a) => a.resolved === false);
    console.log(`[CACHE] ${cache.allAlerts.length} alertes chargees (${cache.activeAlerts.length} actives)`);
  } catch (e) {
    console.warn('[CACHE] seed alerts ignore :', e.message);
  }
}
seedCache(); // lance au chargement du module

// ── Tendance batterie : calculee depuis le CACHE (0 lecture Firestore) ──
function getBatteryTrend() {
  const levels = cache.history.map((d) => d.battery_level).filter((v) => v != null);
  if (levels.length < 5) return null;
  const chrono = levels.slice().reverse(); // history = newest-first -> remettre en ordre chrono
  const first = chrono[0];
  const last = chrono[chrono.length - 1];
  const slope = (last - first) / chrono.length;
  return { first, last, slope, count: chrono.length };
}

// ── Alertes actives : verifiees en MEMOIRE (0 lecture Firestore) ──
function isAlertActive(type) {
  return cache.activeAlerts.some((a) => a.type === type);
}

async function createAlert({ type, severity, message, data = {} }) {
  const doc = { type, severity, message, data, resolved: false, timestamp: new Date() };
  const ref = await db.collection('alerts').add(doc); // ECRITURE seulement
  const withId = { id: ref.id, ...doc };
  cache.activeAlerts.unshift(withId);
  cache.allAlerts.unshift(withId);
  if (cache.allAlerts.length > 100) cache.allAlerts.length = 100;
  console.log(`[ALERTE ${severity.toUpperCase()}] ${message}`);
}

// ── Détection d'alertes : UNIQUEMENT sur signaux réels mesurés ──
async function checkAndCreateAlerts(data) {
  const { voltage, power, temperature, battery_level } = data;
  if (battery_level != null) {
    if (battery_level < 10 && !isAlertActive('battery_critical'))
      await createAlert({ type: 'battery_critical', severity: 'critical', message: `Batterie critique : ${battery_level}% — Risque de coupure imminente. Intervention urgente requise.`, data: { battery_level } });
    else if (battery_level < 20 && battery_level >= 10 && !isAlertActive('battery_low'))
      await createAlert({ type: 'battery_low', severity: 'high', message: `Batterie faible : ${battery_level}% — Surveiller la charge.`, data: { battery_level } });
    else if (battery_level < 35 && battery_level >= 20 && !isAlertActive('battery_medium'))
      await createAlert({ type: 'battery_medium', severity: 'medium', message: `Batterie à ${battery_level}% — Niveau bas. Vérification conseillée.`, data: { battery_level } });
  }
  if (temperature != null) {
    if (temperature > 65 && !isAlertActive('temp_critical'))
      await createAlert({ type: 'temp_critical', severity: 'critical', message: `Surchauffe critique : ${temperature}°C — Arrêt préventif recommandé.`, data: { temperature } });
    else if (temperature > 50 && temperature <= 65 && !isAlertActive('temp_high'))
      await createAlert({ type: 'temp_high', severity: 'high', message: `Température élevée : ${temperature}°C — Vérifier la ventilation.`, data: { temperature } });
  }
  if (voltage != null) {
    if (voltage < 10 && voltage > 0 && !isAlertActive('voltage_low'))
      await createAlert({ type: 'voltage_low', severity: 'high', message: `Tension anormalement basse : ${voltage}V — Possible défaillance.`, data: { voltage } });
    else if (voltage > 30 && !isAlertActive('voltage_high'))
      await createAlert({ type: 'voltage_high', severity: 'medium', message: `Tension élevée : ${voltage}V — Vérifier le régulateur.`, data: { voltage } });
  }

  // power_zero : seulement si voltage > 0 (panneau branche mais pas de production)
  if (power != null && power === 0 && voltage != null && voltage > 5 && temperature != null && temperature > 20 && !isAlertActive('power_zero'))
    await createAlert({ type: 'power_zero', severity: 'high', message: `Production nulle à ${temperature}°C — Vérifier les connexions.`, data: { power, temperature } });

  const trend = getBatteryTrend(); // depuis le cache, plus de lecture Firestore
  if (trend && trend.slope < -0.5 && !isAlertActive('battery_degradation_trend'))
    await createAlert({ type: 'battery_degradation_trend', severity: 'medium', message: `Batterie en baisse régulière (${trend.first.toFixed(0)}% → ${trend.last.toFixed(0)}%). Vérification conseillée.`, data: { first: trend.first, last: trend.last, slope: trend.slope, count: trend.count } });
}

exports.receiveSensorData = async (req, res) => {
  try {
    await seedCache();
    const { voltage, current, power, temperature, battery_level, irradiation } = req.body;
    if (voltage == null && power == null && battery_level == null)
      return res.status(400).json({ success: false, message: 'Données capteur insuffisantes.' });

    const sensorData = {
      voltage: voltage ?? 0,
      current: current ?? 0,
      power: power ?? 0,
      temperature: temperature ?? null,
      battery_level: battery_level ?? 0,
      irradiation: irradiation ?? null,
      timestamp: new Date(),
    };

    const docRef = await db.collection('sensor_data').add(sensorData); // ECRITURE

    const entry = { id: docRef.id, ...sensorData, _ts: Date.now() };
    cache.latestData = entry;
    cache.history = [entry, ...cache.history].slice(0, HISTORY_MAX);

    // Alertes sur seuils RÉELS uniquement (aucun appel IA, aucune irradiation inventée)
    await checkAndCreateAlerts(sensorData);

    return res.status(201).json({ success: true, message: 'Données reçues.', id: docRef.id });
  } catch (err) {
    console.error('[POST /sensors/data]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.getLatestData = async (req, res) => {
  await seedCache();
  return res.json({ success: true, data: cache.latestData ? [cache.latestData] : [] });
};

exports.getHistoricalData = async (req, res) => {
  await seedCache();
  const { from, to, hours } = req.query;
  let lo, hi;
  if (from != null || to != null) {
    // Plage de dates précise (sélecteur "du ... au ..." en ms epoch)
    lo = from != null ? parseInt(from) : 0;
    hi = to   != null ? parseInt(to)   : Date.now();
  } else {
    // Période relative (boutons 6h / 24h / 7j / 30j)
    const h = parseInt(hours) || 24;
    lo = Date.now() - h * 60 * 60 * 1000;
    hi = Date.now();
  }
  const data = cache.history
    .filter((d) => {
      const t = d._ts ?? toMillis(d.timestamp);
      return t >= lo && t <= hi;
    })
    .slice()
    .reverse(); // ordre chronologique (ancien -> recent) pour les graphes
  return res.json({ success: true, count: data.length, data });
};

exports.getStats = async (req, res) => {
  await seedCache();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const data = cache.history.filter((d) => (d._ts ?? toMillis(d.timestamp)) >= cutoff);
  if (data.length === 0) return res.json({ success: true, stats: null, message: 'Pas de données sur 24h.' });
  const vals = (f) => data.map((d) => d[f]).filter((v) => v != null);
  const avg = (f) => { const v = vals(f); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const min = (f) => { const v = vals(f); return v.length ? Math.min(...v) : null; };
  const max = (f) => { const v = vals(f); return v.length ? Math.max(...v) : null; };
  return res.json({ success: true, stats: {
    period_hours: 24, count: data.length,
    voltage: { avg: avg('voltage'), min: min('voltage'), max: max('voltage') },
    current: { avg: avg('current'), min: min('current'), max: max('current') },
    power: { avg: avg('power'), min: min('power'), max: max('power') },
    temperature: { avg: avg('temperature'), min: min('temperature'), max: max('temperature') },
    battery_level: { avg: avg('battery_level'), min: min('battery_level'), max: max('battery_level') },
  } });
};

exports.getAlerts = async (req, res) => {
  await seedCache();
  return res.json({ success: true, count: cache.activeAlerts.length, alerts: cache.activeAlerts });
};

exports.getAllAlerts = async (req, res) => {
  await seedCache();
  return res.json({ success: true, count: cache.allAlerts.length, alerts: cache.allAlerts });
};

exports.resolveAlert = async (req, res) => {
  const { id } = req.params;

  // 1) Toujours résoudre côté mémoire (le bouton marche même si le doc Firestore n'existe plus)
  cache.activeAlerts = cache.activeAlerts.filter((a) => a.id !== id);
  const idx = cache.allAlerts.findIndex((a) => a.id === id);
  if (idx !== -1) cache.allAlerts[idx] = { ...cache.allAlerts[idx], resolved: true };

  // 2) Mettre à jour Firestore seulement si le document existe encore (sans planter sinon)
  try {
    const ref = db.collection('alerts').doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({ resolved: true, resolvedAt: new Date() });
    }
  } catch (err) {
    console.warn('[PUT /alerts/:id/resolve] Firestore ignoré :', err.message);
  }

  return res.json({ success: true, message: 'Alerte résolue.' });
};