import pandas as pd

df = pd.read_csv('preprocessing/clean_data.csv')
jour = df[df.IRRADIATION > 0]

print(f"Moyenne AC_POWER de jour : {jour.AC_POWER.mean():.1f} W")
print(f"MAE relative (jour)      : {39.45 / jour.AC_POWER.mean() * 100:.1f} %")
print(f"MAE normalisee (etendue) : {39.45 / df.AC_POWER.max() * 100:.1f} %")