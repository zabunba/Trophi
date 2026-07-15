#!/bin/bash

# Download of the ziped of OFF
curl -L -o openfoodfacts-products.jsonl.gz https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz

# Unzip it so we get openfoodfacts-products.jsonl like the scripts expect
echo "[LOG] Unzipping OFF dataset..."
gunzip -f openfoodfacts-products.jsonl.gz

# Download the recipes from huggingface
curl -L -o RecipeNLG.csv "https://huggingface.co/datasets/SandhyaKilari/RecipeNLG_dataset/resolve/main/RecipeNLG_dataset.csv?download=true"

echo "[SUCCESS] Done! Got openfoodfacts-products.jsonl and RecipeNLG.csv"