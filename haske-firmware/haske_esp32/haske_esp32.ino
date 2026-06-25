// =====================================================================
//  HASKÉ ÉNERGIE - Firmware ESP32-S3
//  Monitoring mini-centrale solaire (V / I / P / T / Batterie / Ensoleillement)
//
//  Hardware validé le 23/06/2026 :
//    - Diviseur tension 43k/4.7k -> GPIO1  (CAL_V=1.122, Vpin~1.063 V)
//    - ACS712-20A OUT direct     -> GPIO2  (OUT au repos = 2,51 V => offset auto)
//    - DS18B20 (OneWire)         -> GPIO4
//    - LDR (diviseur)            -> GPIO5  (lecture ~0,18)
//    - ESP alimenté par USB UNIQUEMENT (jamais par le buck)
//    - Masse commune unique (BAT- = GND buck = GND ESP = GND capteurs)
// =====================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ----- Réseau (À ADAPTER au hotspot + IP réelle du PC le jour J : ipconfig) -----
const char* WIFI_SSID     = "Iphone";
const char* WIFI_PASSWORD = "00000001";
const char* SERVER_URL    = "http://192.168.43.88:5000/api/sensors/data";

const unsigned long INTERVALLE_MS = 30000;
const float BATT_MAX_V = 12.7f;   // 100%
const float BATT_MIN_V = 10.5f;   // 0%

// ----- Broches (toutes sur ADC1 = compatible WiFi sur ESP32-S3) -----
#define TEMP_PIN 4      // DS18B20
#define VBAT_PIN 1      // tension batterie (diviseur 43k/4.7k)
#define ACS_PIN  2      // courant (ACS712 OUT direct)
#define LDR_PIN  5      // LDR (ensoleillement, proxy relatif)

// ----- Calibration TENSION (diviseur) -----
const float R1 = 43000.0f;
const float R2 = 4700.0f;
const float DIVIDER_V = (R1 + R2) / R2;
float CAL_V = 1.122f;          // recalibré le 23/06 (batterie réelle ~12,1 V, Vpin~1.063)

// ----- Calibration COURANT (ACS712-20A) -----
const float ACS_OUT_DIV = 1.0f;   // OUT branché direct (pas de diviseur sur OUT)
const float ACS_SENS    = 0.100f; // 20A : 100 mV/A  (mettre 0.185 si capteur 5A)
float ACS_OFFSET        = 2.50f;  // défaut ; AUTO-recalculé au boot (mesuré ~2,51 V)
                                  // => calibrer SANS charge au démarrage (boot, PUIS charge)

// ----- Calibration LDR (proxy, pas des W/m²) -----
int LDR_DARK   = 0;
int LDR_BRIGHT = 4095;   // max ADC 12 bits. (NB: si pleine lumière réelle ~3057,
                         // ajuster ici — attention, change l'entrée du modèle IA)

OneWire           oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

bool          ds18b20OK    = false;
unsigned long dernierEnvoi = 0;
float         battStable   = -1.0f;

void  connecterWifi();
void  envoyerDonnees(float, float, float, float, float, float);
float lireVoltage();
float lireCourant();
float lireTemperature();
float lireIrradiation();
float calculerBatterie(float, float);

void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  tempSensor.begin();
  if (tempSensor.getDeviceCount() > 0) {
    ds18b20OK = true;
    tempSensor.setResolution(12);
    Serial.println("[OK] DS18B20 pret");
  } else {
    Serial.println("[ERREUR] DS18B20 non detecte (verifier DATA->GPIO4 + pull-up 4.7k vers 3.3V)");
  }

  connecterWifi();

  // ----- Auto-calibration de l'offset ACS712 (DOIT se faire SANS courant) -----
  delay(2000);
  long s = 0;
  for (int i = 0; i < 300; i++) { s += analogReadMilliVolts(ACS_PIN); delay(2); }
  ACS_OFFSET = (s / 300.0f) / 1000.0f * ACS_OUT_DIV;
  Serial.printf("[CALIB] ACS_OFFSET auto = %.3f V  (attendu ~2,50 V)\n", ACS_OFFSET);
  if (ACS_OFFSET < 2.0f || ACS_OFFSET > 3.0f) {
    Serial.println("[ALERTE] Offset hors plage 2,0-3,0 V : verifier alim 5V du buck sur VCC ACS,");
    Serial.println("         masse commune, et que OUT n'est PAS court-circuite a VCC.");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connecterWifi();

  unsigned long maintenant = millis();
  if (maintenant - dernierEnvoi >= INTERVALLE_MS || dernierEnvoi == 0) {
    dernierEnvoi = maintenant;

    float voltage     = lireVoltage();
    float current     = lireCourant();
    float power       = voltage * current;
    float temperature = lireTemperature();
    float irradiation = lireIrradiation();
    float batterie    = calculerBatterie(voltage, current);

    Serial.printf("V=%.3f I=%.4f P=%.2f T=%.2f Irr=%.2f Bat=%.1f\n",
                  voltage, current, power, temperature, irradiation, batterie);

    envoyerDonnees(voltage, current, power, temperature, irradiation, batterie);
  }
  delay(100);
}

float lireVoltage() {
  long sum = 0;
  for (int i = 0; i < 20; i++) { sum += analogReadMilliVolts(VBAT_PIN); delay(2); }
  float vpin = (sum / 20.0f) / 1000.0f;
  float vbat = vpin * DIVIDER_V * CAL_V;
  Serial.printf("[DEBUG-V] Vpin=%.3f V -> Vbat=%.3f V\n", vpin, vbat);
  return vbat;
}

float lireCourant() {
  long sum = 0;
  for (int i = 0; i < 30; i++) { sum += analogReadMilliVolts(ACS_PIN); delay(2); }
  float vpin    = (sum / 30.0f) / 1000.0f;
  float vout    = vpin * ACS_OUT_DIV;
  float current = (vout - ACS_OFFSET) / ACS_SENS;
  Serial.printf("[DEBUG-I] Vout=%.3f V -> I=%.3f A\n", vout, current);
  return fabsf(current);   // sens unique (courant de charge) -> valeur absolue
}

float lireTemperature() {
  if (!ds18b20OK) return -99.0f;
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  return (t == DEVICE_DISCONNECTED_C || isnan(t)) ? -99.0f : t;
}

float lireIrradiation() {
  long sum = 0;
  for (int i = 0; i < 20; i++) { sum += analogRead(LDR_PIN); delay(2); }
  int lraw = sum / 20;
  float irr = (float)(lraw - LDR_DARK) / (float)(LDR_BRIGHT - LDR_DARK);
  if (irr < 0)     irr = 0;
  if (irr > 1.0f)  irr = 1.0f;
  Serial.printf("[DEBUG-L] Lraw=%d -> irr=%.2f\n", lraw, irr);
  return irr;
}

float calculerBatterie(float tension, float courant) {
  // % figé sous charge (>0.3A) : la tension chute sous charge et fausse la SoC
  if (battStable >= 0 && fabsf(courant) > 0.3f) return battStable;
  if (tension <= 0) return (battStable >= 0) ? battStable : 0.0f;

  float pct = (tension - BATT_MIN_V) / (BATT_MAX_V - BATT_MIN_V) * 100.0f;
  pct = constrain(pct, 0.0f, 100.0f);

  if (battStable < 0) battStable = pct;                            // 1re lecture
  else                battStable = battStable * 0.8f + pct * 0.2f; // lissage
  return battStable;
}

void envoyerDonnees(float voltage, float current, float power,
                    float temperature, float irradiation, float battery_level) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["voltage"]       = roundf(voltage * 1000.0f) / 1000.0f;
  doc["current"]       = roundf(current * 1000.0f) / 1000.0f;
  doc["power"]         = roundf(power * 100.0f) / 100.0f;
  doc["battery_level"] = roundf(battery_level * 10.0f) / 10.0f;
  doc["irradiation"]   = roundf(irradiation * 1000.0f) / 1000.0f;
  if (temperature != -99.0f)
    doc["temperature"] = roundf(temperature * 100.0f) / 100.0f;

  String body;
  serializeJson(doc, body);
  Serial.println("[HTTP] -> " + body);

  int code = http.POST(body);
  if (code == 201) Serial.println("[HTTP] OK");
  else             Serial.printf("[HTTP] Erreur : %d  (serveur Node arrete ? mauvaise IP dans SERVER_URL ?)\n", code);

  http.end();
}

void connecterWifi() {
  Serial.printf("[WiFi] Connexion a %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setAutoReconnect(true);

  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 30) { delay(500); Serial.print("."); t++; }

  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\n[WiFi] Connecte ! IP : %s\n", WiFi.localIP().toString().c_str());
  else
    Serial.println("\n[WiFi] Echec connexion");
}
