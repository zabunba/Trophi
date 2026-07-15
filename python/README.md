# README

## Before Readin

Before reading this please check `SPECS.MD`, its a crucial file to understand what hardware and versions were used along this program

## Description

Yeah so this is basically a pipeline that takes a giant Open Food Facts dump & a recipes csv, filters out all the junk, keeps only the Portugal products, and dumps it all into one SQLite database, so that the app can actually query something small instead of the raw 10GB monster file or use AI as a fucking bloat ;(

## Scripts Description

- **`download.sh`** — grabs the OFF products from openfoodfacts.org, downloads the `.gz`, then it automatically unzips and then grabs RecipeNLG csv from huggingface, saves them as `openfoodfacts-products.jsonl` and `RecipeNLG.csv`, then run this first if you dont already have the raw files 
- **`run.sh`** — sets up a venv if it doesnt exist yet and installs whats in `requirements.txt`, doesnt actually run the python scripts itself, that part's commented out, so you still gotta run those by hand after :(, i mean it had ahmm multiple bugs, bazzite is immutable and just doesnt cooperate
- **`recipe.py`** — reads `RecipeNLG.csv`, parses out the necessary from the messy strings, guesses a "junk score" per ingredient (sugar/butter/oil bad, veggies/water good), gives each recipe an A-F nutriscore letter, and writes it all to `recipes_output.jsonl`, runs after the download, before `final.py`, fun fact: this is not nutriscore i calle this ENUTRISCORE, yeah :D
- **`final.py`** — the big one, 4 stages, fetches products from the raw OFF dump, filters out nameless ones, slims & categorizes & types everything, then builds the final SQLite database


## How to run in order

1. `./download.sh`
2. `./run.sh`
3. `source test-env/bin/activate`
4. `python recipe.py`
5. `python final.py`

Like this, well if you use Linux OFC: 

```
chmod +x ./download.sh
chmod +x ./run.sh
./download.sh
./run.sh
source test-env/bin/activate
python recipe.py
python final.py
```

## Notes and Conclusion / Reviewed or whatever

- `python3`, the `venv` module, and `curl` are needed, so please be sure to check up everything, i dont use windows, so buckle up
- No manual renaming needed
- Dont forget to `source test-env/bin/activate` and run `recipe.py` / `final.py` manually after
- Run order matters, Backwards = empty recipes table, no crash, just sad
- The gram/points values used for nutriscoring are sugar and oiled based, good enough for a rough letter grade, not medical advice :D
- Intermediate files `pt_expanded.jsonl`, `filter_pt_expanded.jsonl`, `slim_filter_pt_expanded.jsonl`, `recipes_output.jsonl` can be deleted after, only `openfoodfacts-pt-slim.db` actually matters ;)
- If something breaks, its probably a missing/misnamed input file, check the error message