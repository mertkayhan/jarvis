import pandas as pd


def process_csv(src_path: str, target_path: str):
    df = pd.read_csv(src_path)
    df.to_markdown(target_path)
    return None, None
