# hey sometime an ai can be helpful and yeah it helps a lot, lowkey

import pandas as pd  # panda is white and black
import json
import re # stackoverflow is the best to search up
import sqlite3  # my beloved
from fractions import Fraction

# idk, gemini told me this values are right ngl
UNIT_TO_GRAMS = {
    'c': 240, 'cup': 240, 'cups': 240, 'tbsp': 15, 'tablespoon': 15, 'tablespoons': 15,
    'tsp': 5, 'teaspoon': 5, 'teaspoons': 5, 'oz': 28, 'ounce': 28, 'ounces': 28,
    'lb': 454, 'pound': 454, 'pounds': 454, 'g': 1, 'gram': 1, 'grams': 1, 'kg': 1000,
    'can': 400, 'jar': 300, 'carton': 300, 'pkg': 250, 'box': 300, 'small': 150, 
    'medium': 200, 'large': 300, 'clove': 3, 'slice': 20, 'piece': 50, 'pinch': 0.5, 
    'dash': 0.5, 'bunch': 150, 'sprig': 5, 'head': 300, 'stalk': 50, 'unit': 100
}

# gets each key from the units to grams
RECOGNIZED_UNITS = set(UNIT_TO_GRAMS.keys())

# This is just making sugar and bad things look back on each recipes, yikes this hold to its life ahahah
INGREDIENT_POINTS = {
    'sugar': 100, 'brown sugar': 100, 'powdered sugar': 100, 'corn syrup': 100, 
    'honey': 80, 'maple syrup': 80, 'condensed milk': 80, 'oil': 90, 'vegetable oil': 90, 
    'olive oil': 80, 'butter': 85, 'margarine': 85, 'lard': 95, 'chocolate': 60, 'chocolate chips': 60,
    'cream': 50, 'heavy cream': 60, 'sour cream': 40, 'cream cheese': 50, 'bacon': 70, 
    'sausage': 60, 'pepperoni': 70, 'nuts': 65, 'pecans': 70, 'walnuts': 70, 'peanuts': 65, 
    'peanut butter': 60, 'cheese': 45, 'cheddar': 45, 'mozzarella': 40, 'parmesan': 50,
    'flour': 3.5, 'rice': 3.5, 'pasta': 3.5, 'noodles': 3.5, 'spaghetti': 3.5, 'bread': 3.0, 
    'breadcrumbs': 3.5, 'cereal': 3.5, 'biscuits': 3.5, 'potato': 2.5, 'potatoes': 2.5, 
    'sweet potato': 2.5, 'beef': 2.5, 'ground beef': 3.0, 'steak': 2.5, 'pork': 2.5, 
    'chicken': 2.0, 'turkey': 1.8, 'fish': 1.5, 'salmon': 2.5, 'shrimp': 1.5, 'egg': 1.5, 
    'eggs': 1.5, 'milk': 1.0, 'evaporated milk': 1.5, 'tomato': 0.5, 'tomatoes': 0.5, 
    'tomato paste': 1.5, 'tomato sauce': 1.0, 'onion': 0.4, 'onions': 0.4, 'garlic': 1.5, 
    'carrot': 0.4, 'carrots': 0.4, 'celery': 0.2, 'pepper': 0.3, 'bell pepper': 0.3, 
    'spinach': 0.2, 'lettuce': 0.2, 'broccoli': 0.3, 'cabbage': 0.3, 'mushroom': 0.3, 
    'apple': 0.5, 'banana': 0.7, 'berries': 0.3, 'orange': 0.5, 'lemon': 0.4, 'water': 0, 
    'broth': 0.1, 'stock': 0.1, 'vinegar': 0.1, 'vanilla': 0.5, 'salt': 0, 'spices': 0.5, 
    'cinnamon': 0.5, 'oregano': 0.5, 'default': 2.0 
}

def parseJsonList(data):
    if isinstance(data, list): 
        return data
    if isinstance(data, str):
        try: 
            return json.loads(data)
        except: pass
        try: 
            return json.loads(data.replace("'", '"'))
        except: pass
        matches = re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', data)
        if matches: 
            return matches
        if data.startswith('[') and data.endswith(']'):
            return [i.strip().strip('"\'') for i in data[1:-1].split(',') if i.strip()]
    return []

# parses the quant
def parseQuantUnit(stringIngredient):
    quantity = 1.0
    unit = None
    
    # float
    match = re.match(r'^\s*(\d+)\s+(\d+/\d+)|^\s*(\d+/\d+)|^\s*(\d*\.?\d+)', stringIngredient)
    if match:
        if match.group(1) and match.group(2): 
            quantity = float(match.group(1)) + float(Fraction(match.group(2)))
        elif match.group(3): 
            quantity = float(Fraction(match.group(3)))
        elif match.group(4): 
            quantity = float(match.group(4))
            
    words = stringIngredient.strip().split()
    for word in words:
        normalizedWord = word.strip('.,()').lower()
        if normalizedWord in RECOGNIZED_UNITS:
            unit = normalizedWord
            break
        if normalizedWord.endswith('s') and normalizedWord[:-1] in RECOGNIZED_UNITS:
            unit = normalizedWord[:-1]
            break
    return quantity, unit

# this is where i think i might cooked a bit
def getPointPerGram(ingredient_name):
    lowercaseName = ingredient_name.lower()
    sortedKeyPoint = sorted(INGREDIENT_POINTS.keys(), key=len, reverse=True) # sorted, right ya
    for key in sortedKeyPoint:
        if re.search(r'\b' + re.escape(key) + r'\b', lowercaseName): # lets see
            return INGREDIENT_POINTS[key]
    return INGREDIENT_POINTS['default']

def getNutriLetter(points):
    if points <= 5000: 
        return 'A' # A bit healthy in this cas
    if points <= 15000: 
        return 'B' # wow it gets worse
    if points <= 25000: 
        return 'C' # from this one you should be considering sugar ammounts
    if points <= 40000: 
        return 'D' # nope
    if points <= 60000: 
        return 'E' # im on diet so or A OR B ahahha
    return 'F' # just dont

# Here is where each recipe is filtered and processed
def processRecipe(row):

    # if a row has nothing then why going forware right?
    recipeName = str(row.get('title', 'Unknown Recipe')).upper()
    ingredientsList = parseJsonList(row.get('ingredients', []))
    directionsList = parseJsonList(row.get('directions', []))
    nerList = parseJsonList(row.get('NER', []))
    
    # point
    tPoints = 0
    ingredientsArray = []
    
    # for each ingredient presented on the list
    for ing in ingredientsList:
        quantity, unit = parseQuantUnit(ing)
        
        grams = quantity * UNIT_TO_GRAMS.get(unit, 100) if unit else 100 # to gramsssss
        
        pointPerGram = getPointPerGram(ing)
        ingredientPoint = grams * pointPerGram
        tPoints += ingredientPoint
        
        if unit:
            ingredientsArray.append(f"{ing.strip()} ({round(grams)}g)")
        else:
            ingredientsArray.append(f"{ing.strip()}")
        
    # this score is a mere calculation shouldnt be held as the normal nutriscore thats why i say its ENUTRISCORE AS eletronic Nutriscore, no..
    eScoreLetter = getNutriLetter(tPoints)
    normalizedIngredients = [str(n).upper() for n in nerList if str(n).strip()]
    if not normalizedIngredients: 
        normalizedIngredients = [ing.split(' ', 1)[-1].upper() for ing in ingredientsList]

    # stripping downt the tutorial
    normalizedTutorial = [str(d).strip().strip('"').strip('.') for d in directionsList if str(d).strip()]
    
    # returns the way i want
    return {
        "recipe": recipeName,
        "enutriscore": eScoreLetter,
        "totalPoints": round(tPoints),
        "ingredients": normalizedIngredients,
        "ingredientsValues": ingredientsArray,
        "tutorial": normalizedTutorial
    }

# Convert the csv to a json format :D
def csvJsonConvert(inputFile, jsonFile, tCount):
    print(f"[STEP 1] STEP 1: Reading {inputFile}...")
    try:
        df = pd.read_csv(inputFile, nrows=tCount + 500)
    except FileNotFoundError:
        print(f"[FAIL] Error: Could not find '{inputFile}'.") # NO NO NO
        return False
    except Exception as e:
        print(f"[FAIL] Error reading CSV: {e}") # this happened multiple times xd
        return False

    print(f"[STEP 1] Processing recipes and writing to {jsonFile}...")
    counter = 0
    
    # open the json file recipes_output.jsonl to write the contetn i want
    with open(jsonFile, 'w', encoding='utf-8') as f:
        for index, row in df.iterrows():
            if counter >= tCount: break
            try:
                if pd.isna(row.get('title')) or pd.isna(row.get('ingredients')): continue
                recipeJson = processRecipe(row)
                f.write(json.dumps(recipeJson, ensure_ascii=False) + '\n')
                counter += 1
                if counter % 50 == 0:
                    print(f"  [JSONL] Processed {counter}/{tCount} recipes...")
            except Exception: continue

    print(f"[SUCCESS][STEP 1] Complete! Saved {counter} recipes to {jsonFile}\n")
    return True


# This is where an professional would say we are building, but do i
INPUT_CSB = 'RecipeNLG.csv'
OUTPUT_RECIPES = 'recipes_output.jsonl'
tCount = 5000 # Change this to however many you want, i think this is like 2MB

# Well done if it works
if csvJsonConvert(INPUT_CSB, OUTPUT_RECIPES, tCount):
    print("\n[SUCCESS] Pipeline Complete! You now have your JSONL file.")
else:
    print("[FAIL] Pipeline failed at Step 1.")


