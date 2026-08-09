import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

def load(path):
    for sep in [";", ","]:
        d = pd.read_csv(path, sep=sep)
        if "label_humain" in d.columns and "id" in d.columns: return d
    raise ValueError("colonnes id/label_humain introuvables")

lab = load("a_etiqueter.csv")[["id","label_humain"]].dropna()
lab["label_humain"] = lab["label_humain"].astype(float).astype(int)
hid = pd.read_csv("_predictions_cachees.csv")
m = lab.merge(hid, on="id")

yt, yp = m["label_humain"], m["pred_modele"]
print(f"Étiquetées : {len(m)}/200 | anomalies humain : {yt.sum()} | anomalies modèle : {yp.sum()}")
print(f"Précision : {100*precision_score(yt,yp,zero_division=0):.1f}%")
print(f"Rappel    : {100*recall_score(yt,yp,zero_division=0):.1f}%")
print(f"F1-score  : {100*f1_score(yt,yp,zero_division=0):.1f}%")
print("Confusion [[VN FP][FN VP]] :\n", confusion_matrix(yt,yp))