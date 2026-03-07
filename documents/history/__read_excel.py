import pandas as pd
import os

file_path = r'c:\Users\tioak\Documents\Games\自作\MagicCrystal\Documents\history\catfish.xlsx'

if os.path.exists(file_path):
    # すべてのシートを読み込む
    xls = pd.ExcelFile(file_path)
    print(f"Sheet names: {xls.sheet_names}")

    if '変数' in xls.sheet_names:
        print(f"\n--- Full Content: 変数 ---")
        df_var = pd.read_excel(xls, sheet_name='変数')
        print(df_var.fillna("").to_string())

    if 'リスト' in xls.sheet_names:
        print(f"\n--- Search in: リスト ---")
        df_list = pd.read_excel(xls, sheet_name='リスト')
        # 各行の全列を結合して文字列検索を容易にする
        list_lines = df_list.astype(str).apply(lambda x: ' '.join(x), axis=1)
        
        keywords = ['ES=', 'JS=', 'DS=', 'TM=', 'ST=', 'STRIG']
        for kw in keywords:
            print(f"\nMatches for '{kw}':")
            matches = list_lines[list_lines.str.contains(kw, case=False, na=False)]
            print(matches.head(10).to_string())
else:
    print(f"File not found: {file_path}")
