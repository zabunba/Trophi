# If you can read this, well you are indeed a programmer, i still cant understand shit at this late time, i will check later if this works properly

# Fetches the file and gets the specify products - DONE 
# Filters to remove the no name ones - DONE
# Filters the data and removes the noise - DONE
# Database & Recipes - DONE

import json
import re
import os
import sqlite3


# Config of file path during the process
OPENFOODFACTS = "openfoodfacts-products.jsonl"
RECIPES_FILE = "recipes_output.jsonl" 
OUTPUT_FETCH = "pt_expanded.jsonl"
OUTPUT_FILTER = "filter_pt_expanded.jsonl"
OUTPUT_SLIM = "slim_filter_pt_expanded.jsonl"
DATABASE_SLIM = "openfoodfacts-pt-slim.db"

# Country selected
TARGET_COUNTRY = {
    "en:portugal"
}

# Stores selected
TARGET_STORES = {
    "lidl", "continente", "auchan", "pingo-doce", "intermarche", "aldi",
    "mercadona", "minipreco", "meu-super", "amanhecer", "spar", "coviran",
    "e-leclerc", "leclerc", "el-corte-ingles", "supercor", "froiz",
    "apolonia", "makro", "recheio"
}

# In-APP Categories
APP_CATEGORIES = [
    "Proteins", "Dairy", "Vegetables", "Fruits", "Carbs", "Legumes", 
    "Canned", "Frozen", "Condiments", "Snacks", "Drinks", "Prepared Meals", 
    "Breakfast & Sweets", "Other"
]

# Recipes ingredients mapping
RECIPE_INGREDIENT_TYPE_MAPPING = [
    ("Yogurt", ["YOGURT", "YOGHURT"]),
    ("Cheese", ["CHEESE", "COTTAGE CHEESE", "MOZZARELLA", "PARMESAN", "CHEDDAR"]),
    ("Butter", ["BUTTER", "MARGARINE"]),
    ("Cream", ["CREAM", "SOUR CREAM", "HEAVY CREAM"]),
    ("Milk", ["MILK", "EVAPORATED MILK", "CONDENSED MILK"]),
    ("Ketchup", ["KETCHUP"]),
    ("Mayonnaise", ["MAYONNAISE", "MAYO"]),
    ("Mustard", ["MUSTARD"]),
    ("Sauce", ["SAUCE"]),
    ("Chicken", ["CHICKEN"]),
    ("Beef", ["BEEF", "GROUND BEEF", "STEAK"]),
    ("Pork", ["PORK"]),
    ("Bacon", ["BACON"]),
    ("Sausage", ["SAUSAGE", "PEPPERONI"]),
    ("Tuna", ["TUNA"]),
    ("Salmon", ["SALMON"]),
    ("Shrimp", ["SHRIMP"]),
    ("Fish", ["FISH"]),
    ("Egg", ["EGG", "EGGS"]),
    ("Meat", ["MEAT"]),
    ("Tomato", ["TOMATO", "TOMATOES"]),
    ("Onion", ["ONION", "ONIONS"]),
    ("Garlic", ["GARLIC"]),
    ("Carrot", ["CARROT", "CARROTS"]),
    ("Potato", ["POTATO", "POTATOES"]),
    ("Celery", ["CELERY"]),
    ("Pepper", ["PEPPER", "BELL PEPPER"]),
    ("Broccoli", ["BROCCOLI"]),
    ("Spinach", ["SPINACH"]),
    ("Lettuce", ["LETTUCE"]),
    ("Cucumber", ["CUCUMBER"]),
    ("Mushroom", ["MUSHROOM"]),
    ("Cabbage", ["CABBAGE"]),
    ("Zucchini", ["ZUCCHINI", "SQUASH"]),
    ("Corn", ["CORN"]),
    ("Peas", ["PEAS"]),
    ("Apple", ["APPLE"]),
    ("Banana", ["BANANA"]),
    ("Lemon", ["LEMON"]),
    ("Orange", ["ORANGE"]),
    ("Strawberry", ["STRAWBERRY"]),
    ("Blueberry", ["BLUEBERRY"]),
    ("Pineapple", ["PINEAPPLE"]),
    ("Peach", ["PEACH"]),
    ("Cranberry", ["CRANBERRY"]),
    ("Raisin", ["RAISIN"]),
    ("Berry", ["BERRY", "BERRIES"]),
    ("Bread", ["BREAD"]),
    ("Flour", ["FLOUR"]),
    ("Rice", ["RICE"]),
    ("Pasta", ["PASTA", "SPAGHETTI", "MACARONI", "NOODLE"]),
    ("Oat", ["OAT"]),
    ("Cereal", ["CEREAL"]),
    ("Oil", ["OIL"]),
    ("Salt", ["SALT"]),
    ("Sugar", ["SUGAR"]),
    ("Vinegar", ["VINEGAR"]),
    ("Vanilla", ["VANILLA"]),
    ("Honey", ["HONEY"]),
    ("Syrup", ["SYRUP"]),
    ("Spice", ["SPICE"]),
]


# The list is sequencial so the product could be more precisely corrected
TAG_TYPE_MAPPING = [
    ("Yogurt",     ["yogurt", "yogurts", "iogurte", "iogurtes"]),
    ("Cheese",     ["cheese", "cheeses", "queijo", "queijos"]),
    ("Butter",     ["butter", "butters", "manteiga", "margarine", "margarina"]),
    ("Cream",      ["cream", "creams", "nata", "natas"]),
    ("Milk",       ["milk", "milks", "leite"]),
    ("Ketchup",    ["ketchup", "ketchups"]),
    ("Mayonnaise", ["mayonnaise", "mayonnaises", "maionese"]),
    ("Mustard",    ["mustard", "mustards", "mostarda"]),
    ("Sauce",      ["sauce", "sauces", "dressing", "dressings", "molho", "molhos"]),
    ("Tomato",     ["tomato", "tomatoes", "tomate", "tomates"]),
    ("Bread",      ["bread", "breads", "pao", "paes"]),
    ("Egg",        ["egg", "eggs", "ovo", "ovos"]),
    ("Sugar",      ["sugar", "sugars", "acucar"]),
    ("Apple",      ["apple", "apples", "maca", "macas"]),
    ("Potato",     ["potato", "potatoes", "batata", "batatas"]),
    ("Pasta",      ["pasta", "pastas", "massa", "massas", "esparguete"]),
    ("Rice",       ["rice", "arroz"]),
    ("Chicken",    ["chicken", "frango"]),
    ("Beef",       ["beef", "vaca", "bovino"]),
    ("Pork",       ["pork", "porco"]),
    ("Fish",       ["fish", "peixe", "atum", "bacalhau"]),
    ("Water",      ["water", "waters", "agua", "aguas"]),
    ("Juice",      ["juice", "juices", "sumo", "sumos"]),
    ("Coffee",     ["coffee", "coffees", "cafe", "cafes"]),
    ("Tea",        ["tea", "teas", "cha", "chas"]),
    ("Chocolate",  ["chocolate", "chocolates", "cacau"]),
    ("Biscuit",    ["biscuit", "biscuits", "cookie", "cookies", "bolacha", "bolachas"]),
    ("Oil",        ["oil", "oils", "azeite", "oleo"]),
    ("Beer",       ["beer", "beers", "cerveja", "cervejas"]),
    ("Wine",       ["wine", "wines", "vinho", "vinhos"]),
]


# Cleans the tags, if theres none return an empty array
def tagCleaner(tags):
    cArray = []
    if isinstance(tags, list):
        for t in tags:
            if isinstance(t, str):
                cArray.append(t.split(":")[-1].replace("-", " "))
        return cArray
    else:
        return cArray


# Check if its from the portugal or from the store
def isProductCorrect(p):
    country = set(p.get("countries_tags") or [])
    store = set(p.get("stores_tags") or [])
    isBool = False
    if country.intersection(TARGET_COUNTRY): isBool = True
    if store.intersection(TARGET_STORES): isBool = True
    return isBool

# Checks every category for many languages found in the products where they could be in french, spanish, portuguese and english
def getCatg(main_cat, sub_cat, detailed_cats, food_groups, ingredients):
    main = str(main_cat).lower()
    sub = str(sub_cat).lower()
    detailed = " ".join(detailed_cats if isinstance(detailed_cats, list) else []).lower()
    groups = " ".join(food_groups if isinstance(food_groups, list) else []).lower()
    ingr = " ".join(ingredients if isinstance(ingredients, list) else []).lower()

    # One by one we get there
    if "frozen" in detailed or "surgelé" in detailed or "gelado" in detailed: return "Frozen"
    if "canned" in detailed or "conserve" in detailed or "enlatado" in detailed: return "Canned"
    if "snack" in main: return "Breakfast & Sweets" if ("pastries" in sub or "biscuit" in sub or "sweet" in sub) else "Snacks"
    if "beverage" in main or "drink" in detailed or "water" in detailed: return "Drinks"
    if "meat" in main or "fish" in main or "egg" in main or "poultry" in detailed: return "Proteins"
    if "dairy" in main or "milk" in main or "cheese" in sub or "yogurt" in sub: return "Dairy"
    if "cereals" in main or "potatoes" in main or "bread" in sub or "pasta" in detailed: return "Carbs"
    if "fat" in main or "sauce" in main or "condiment" in detailed or "spice" in detailed or "oil" in detailed: return "Condiments"
    if "composite" in main or "meal" in detailed or "pizza" in detailed or "salad" in detailed: return "Prepared Meals"
    if "fruits" in main or "vegetables" in main:
        if "fruit" in sub: return "Fruits"
        if "legume" in sub or "legume" in detailed: return "Legumes"
        return "Vegetables"
    if "breakfast" in detailed or "spread" in detailed or "tartiner" in detailed: return "Breakfast & Sweets"
    if "plant based foods" in detailed:
        if "fruit" in detailed: return "Fruits"
        if "vegetable" in detailed: return "Vegetables"
        if "cereal" in detailed: return "Carbs"
        if "legume" in detailed: return "Legumes"
    if "milk" in groups or "dairy" in groups: return "Dairy"
    if "fruits" in groups: return "Fruits"
    if "vegetables" in groups: return "Vegetables"
    if "legumes" in groups: return "Legumes"
    if "fish" in groups or "meat" in groups or "eggs" in groups: return "Proteins"
    if "cereals" in groups: return "Carbs"
    if "milk" in ingr or "dairy" in ingr or "cheese" in ingr or "yogurt" in ingr: return "Dairy"
    if "meat" in ingr or "fish" in ingr or "egg" in ingr: return "Proteins"

    # HUH SEEMS LIKE NO
    return "Other"


# Normalize the tag, remove the custom characters
def normalizer(t):
    return (t.replace("é", "e").replace("ã", "a").replace("ç", "c")
             .replace("á", "a").replace("ó", "o").replace("í", "i")
             .lower().strip())


# Gets a product typ+e
def getType(name, detailed_cats, sub_cat):
    if not isinstance(detailed_cats, list):
        raise TypeError("Not a list man ;(")
    

    tag_set = {normalizer(t) for t in detailed_cats}

    # Check the type wu wu
    for ptype, keywords in TAG_TYPE_MAPPING:
        for kw in keywords:
            if kw in tag_set:
                return ptype

    # my sweet fallback never makes me lose hope
    normanText = normalizer(str(name) + " " + " ".join(detailed_cats) + " " + str(sub_cat))
    for ptype, keywords in TAG_TYPE_MAPPING:
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', normanText):
                return ptype

    # IF THERES THEN IS, RAAAAAAAAA
    if sub_cat and str(sub_cat).lower() != "unknown" and str(sub_cat).strip():
        return str(sub_cat).title()

    # No subcat
    return "Unknown"

# It maps the recipe ingredient list
def getRecType(ingredient_name):
    for rtype, keywords in RECIPE_INGREDIENT_TYPE_MAPPING:
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', ingredient_name.upper()):
                return rtype

    # if cant find return nothing
    return None



# Gets the data from the open food facts database that was downloaded and its the OPENFOODFACTS file, check README
def getOFFData():
    print(f"\n[STEP 1] Fetching Country & Target Store Products...")

    # Checks if theres the openfoodfacts database file
    if not os.path.exists(OPENFOODFACTS):
        print(f"\n[FAIL] Error: '{OPENFOODFACTS}' not found.")
        return False

    # Counters for a good interface mueheheh
    procProducts = 0 
    kProducts = 0

    # Crack this file, HACKERMAN
    with open(OPENFOODFACTS, "r", encoding="UTF-8") as ifile, open(OUTPUT_FETCH, "w", encoding="UTF-8") as ofile:
        for line in ifile:
            procProducts += 1
            try:
                product = json.loads(line)
                if isProductCorrect(product):
                    item = {
                        "name": product.get("product_name"),
                        "barcode": product.get("code"),
                        "nutriscore": product.get("nutrition_grades"),
                        "mainCategory": product.get("pnns_groups_1", "unknown"),
                        "subCategory": product.get("pnns_groups_2", "unknown"),
                        "detailedCategory": tagCleaner(product.get("categories_tags", [])),
                        "foodGroups": tagCleaner(product.get("food_groups_tags", [])),
                        "ingredients": tagCleaner(product.get("ingredients_tags", [])),
                    }
                    ofile.write(json.dumps(item, ensure_ascii=False) + "\n")
                    kProducts += 1
            except: continue
            if procProducts % 10000 == 0:
                print(f"\r -> Processed: {procProducts:,}| Kept: {kProducts:,}", end="", flush=True)

    # I need everything to filter later k?
    print(f"\r -> Processed: {procProducts:,}| Kept: {kProducts:,}")
    print("\n[SUCCESS][STEP 1] Complete!")
    return True

# Removes the products that have empty names
def filterer():
    print(f"\n[STEP 2] Filtering out nameless products...")

    # hmm counters
    procProducts = 0 
    kProducts = 0

    #Opens the file, and removes the fucking empty names cause idk why people so lazy at OFF
    with open(OUTPUT_FETCH, "r", encoding="utf-8") as fin, open(OUTPUT_FILTER, "w", encoding="utf-8") as fout:
        for line in fin:
            procProducts += 1
            try:
                product = json.loads(line)
                if product.get("name") and str(product.get("name")).strip():
                    fout.write(json.dumps(product, ensure_ascii=False) + "\n")
                    kProducts += 1
            except: continue
            if procProducts % 5000 == 0:
                print(f"\r -> Processed: {procProducts:,}| Kept: {kProducts:,}", end="", flush=True)
                
    print(f"\r -> Processed: {procProducts:,}| Kept: {kProducts:,}")
    print("\n[SUCCESS][STEP 2] Complete!")
    return True

# Slims down the data into a specific set of what it would be used, theres not need for noise and its better compressed
def slimmer():
    print(f"\n[STEP 3] Categorizing and slimming down to essential keys...")
    
    # hmm yeah, counter...
    slimProducts = 0

    # Opens the slimmer file to filter the data, why its slimed when could be slimed the one who was removed the name, stupidity at peakkkk
    with open(OUTPUT_FILTER, "r", encoding="utf-8") as fin, open(OUTPUT_SLIM, "w", encoding="utf-8") as fout:
        for line in fin:
            slimProducts += 1
            try:
                product = json.loads(line)
                app_cat = getCatg(product.get("mainCategory"), product.get("subCategory"), 
                                           product.get("detailedCategory"), product.get("foodGroups"), 
                                           product.get("ingredients"))
                product_type = getType(product.get("name"), product.get("detailedCategory"), product.get("subCategory"))
                
                slim_product = {
                    "name": product.get("name"),
                    "barcode": product.get("barcode"),
                    "nutriscore": product.get("nutriscore"),
                    "category": app_cat, # THIS IS THE MAIN CATEGORY
                    "type": product_type
                }
                fout.write(json.dumps(slim_product, ensure_ascii=False) + "\n")
            except: continue
            if slimProducts % 5000 == 0:
                print(f"\r -> Slimmed: {slimProducts:,} products", end="", flush=True)
                
    print(f"\r -> Slimmed: {slimProducts:,} products")
    print("\n[SUCCESS][STEP 3] Complete!")
    return True


# Lets make this shit work on the database, or try??¿¿‽‽
def dbBuilder():
    print(f"\n[STEP 4] Building SQLite Database (Merging by Main Categories)...")

    # Yeah we dont want the data to be there already, fuck you old database
    if os.path.exists(DATABASE_SLIM): os.remove(DATABASE_SLIM)

    # Create thbe database
    conn = sqlite3.connect(DATABASE_SLIM)
    cursor = conn.cursor()
    cursor.execute('PRAGMA journal_mode = OFF')
    cursor.execute('PRAGMA synchronous = 0')
    cursor.execute('PRAGMA cache_size = 100000')

    cursor.execute('''CREATE TABLE products (
        barcode TEXT PRIMARY KEY, name TEXT, nutriscore TEXT, category TEXT, type TEXT)''')
    
    cursor.execute('''CREATE TABLE recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, enutriscore TEXT, total_points INTEGER, 
        ingredients TEXT, tutorial TEXT, ingredient_types TEXT)''')

    print(" -> Inserting Products into DB...")

    # hmm counter and batches
    batch = []
    total_products = 0
    
    # Inserts the data from the slimmed-extended-filteres-blah blah version
    with open(OUTPUT_SLIM, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)
            batch.append((data.get("barcode"), data.get("name"), data.get("nutriscore"), 
                          data.get("category"), data.get("type")))
            if len(batch) >= 25000:
                cursor.executemany('INSERT OR IGNORE INTO products VALUES (?, ?, ?, ?, ?)', batch)
                total_products += len(batch)
                batch = []
    if batch:
        cursor.executemany('INSERT OR IGNORE INTO products VALUES (?, ?, ?, ?, ?)', batch)
        total_products += len(batch)
    print(f"\r Inserted {total_products:,} products... Done!")

    # Its time for the 5K Recipes that idk 
    print(" -> Inserting Recipes & Merging by Main Categories...")
    if not os.path.exists(RECIPES_FILE):
        print(f"[FAIL] Error: '{RECIPES_FILE}' not found. Skipping recipes.")
    else:
        recipe_batch = []
        total_recipes = 0
        with open(RECIPES_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    r = json.loads(line)
                    
                    types_found = set()
                    for ing in r.get('ingredients', []):
                        ing_type = getRecType(ing)
                        if ing_type: 
                            types_found.add(ing_type)
                    
                    ingredient_types_string = ",".join(types_found) 
                    
                    recipe_batch.append((
                        r.get("recipe", r.get("recipe_name", "Unknown")),
                        r.get("enutriscore", r.get("e_nutriscore", "N/A")),
                        r.get("totalPoints", r.get("total_points", 0)),
                        json.dumps(r.get("ingredientsValues", r.get("ingredients_values", []))),
                        json.dumps(r.get("tutorial", [])),
                        ingredient_types_string
                    ))
                except: continue
                
        if recipe_batch:
            cursor.executemany('INSERT INTO recipes (name, enutriscore, total_points, ingredients, tutorial, ingredient_types) VALUES (?, ?, ?, ?, ?, ?)', recipe_batch)
            total_recipes = len(recipe_batch)
            print(f" Inserted {total_recipes:,} recipes... Done!")

    # Index
    print(" -> Creating Indexes...")
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_product_category ON products(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_product_barcode ON products(barcode)')
    
    # Commit this shit
    conn.commit()
    print(" -> Vacuuming Database (Optimizing Size)...")

    # I GOT A VAC BAN AHAHAHA
    cursor.execute('VACUUM')
    conn.close()
    print(f"\n[SUCCESS][STEP 4] Complete! Database saved as '{DATABASE_SLIM}'")


print("=== STARTING FULL PIPELINE ===")
if getOFFData(): # if true advance for stage 2
    if filterer(): # if true advance for stage 3
        if slimmer(): # if true advance for stage 4
            dbBuilder() # doesnt need to be true, its the final stage
print("\n=== PIPELINE FINISHED SUCCESSFULLY ===")
