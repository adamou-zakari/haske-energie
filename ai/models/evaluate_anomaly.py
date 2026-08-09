import pandas as pd, numpy as np, joblib
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

df     = pd.read_csv("../preprocessing/clean_data.csv")
model  = joblib.load("anomaly_model.pkl")
scaler = joblib.load("anomaly_scaler.pkl")
feats  = joblib.load("anomaly_model_info.pkl")["features"]

# --- RÈGLES CORRIGÉES : ne juger "faible production" / "rendement faible"
#     que quand il y a VRAIMENT du soleil (sinon on attrape juste du bruit) ---
jour_fort = df["IRRADIATION"] > 0.4          # plein soleil = production attendue ÉLEVÉE
nuit      = df["IRRADIATION"] < 0.05

prod_fort = df.loc[jour_fort, "AC_POWER"]
eff_fort  = df.loc[jour_fort, "EFFICIENCY"]

faible_prod = jour_fort & (df["AC_POWER"]   < prod_fort.quantile(0.10))   # sous-prod MALGRÉ le soleil
eff_basse   = jour_fort & (df["EFFICIENCY"] < eff_fort.quantile(0.10))   # rendement faible au soleil
nocturne    = nuit & (df["AC_POWER"] > 5)                                 # vraie prod la nuit (pas du bruit)
surchauffe  = df["AMBIENT_TEMPERATURE"] > df["AMBIENT_TEMPERATURE"].quantile(0.99)

df["label"] = (faible_prod | nocturne | surchauffe | eff_basse).astype(int)

print(f"Vérité terrain : {df['label'].sum()} anomalies ({100*df['label'].mean():.1f}%)")
print(f"  faible_prod={int(faible_prod.sum())} | nocturne={int(nocturne.sum())} "
      f"| surchauffe={int(surchauffe.sum())} | eff_basse={int(eff_basse.sum())}")

# --- Prédictions du modèle ---
pred = (model.predict(scaler.transform(df[feats])) == -1).astype(int)
print(f"Modèle : {pred.sum()} anomalies ({100*pred.mean():.1f}%)")

print("\n=== MÉTRIQUES RÉELLES (modèle vs règles) ===")
print(f"Précision : {100*precision_score(df['label'],pred,zero_division=0):.1f}%")
print(f"Rappel    : {100*recall_score(df['label'],pred,zero_division=0):.1f}%")
print(f"F1-score  : {100*f1_score(df['label'],pred,zero_division=0):.1f}%")
print("Confusion [[VN FP][FN VP]] :\n", confusion_matrix(df['label'],pred))