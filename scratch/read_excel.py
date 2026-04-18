import pandas as pd
import json

try:
    df = pd.read_excel('AKUNTASI HARIAN 2026.xlsx')
    print(json.dumps({
        "columns": df.columns.tolist(),
        "head": df.head(10).to_dict(orient='records')
    }, default=str))
except Exception as e:
    print(f"Error: {e}")
