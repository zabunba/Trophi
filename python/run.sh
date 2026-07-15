#!/bin/bash

set -e

# Create venv only if it doesn't exist
if [ ! -d "myenv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv myenv
fi

# Activate venv
# source myenv/bin/activate

# Upgrade pip (recommended)
pip install -qq --upgrade pip

# Install dependencies (ONLY real external ones)
pip install -qq -r requirements.txt

# Run script
# python recipes.py && python final.py