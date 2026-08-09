import pandas as pd, numpy as np, joblib

df     = pd.read_csv("../preprocessing/clean_data.csv")
model  = joblib.load("anomaly_model.pkl")
scaler = joblib.load("anomaly_scaler.pkl")
feats  = joblib.load("anomaly_model_info.pkl")["features"]

if "EFFICIENCY" not in df.columns:
    df["EFFICIENCY"] = np.where(df["IRRADIATION"] > 0.05, df["AC_POWER"]/df["IRRADIATION"], 0)

N = 200
ech = df.sample(n=N, random_state=42).copy()    # échantillon aléatoire reproductible
ech["id"] = ech.index

# Prédictions du modèle -> CACHÉES (pour ne pas te biaiser)
pred = (model.predict(scaler.transform(ech[feats])) == -1).astype(int)
pd.DataFrame({"id": ech["id"], "pred_modele": pred}).to_csv("_predictions_cachees.csv", index=False)

# Fichier à étiqueter (SANS la prédiction)
cols = ["id","DATE_TIME","PERIOD","HOUR","IRRADIATION","AC_POWER","AMBIENT_TEMPERATURE","EFFICIENCY"]
out = ech[[c for c in cols if c in ech.columns]].copy()
for c in ["IRRADIATION","AC_POWER","AMBIENT_TEMPERATURE","EFFICIENCY"]:
    if c in out: out[c] = out[c].round(2)
out["label_humain"] = ""        # <-- À REMPLIR : 1 = anomalie, 0 = normal
out.to_csv("a_etiqueter.csv", sep=";", index=False, encoding="utf-8-sig")
print(f"{N} lignes -> a_etiqueter.csv. Remplis la colonne label_humain, puis lance evaluer_manuel.py")