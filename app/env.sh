#!/bin/bash

# Putting a name to the container
CONTAINER_NAME="code-env"

# Checking if the container is already created
if distrobox list | grep -q "$CONTAINER_NAME"; then
    echo "[INFO] Entering container '$CONTAINER_NAME'!"
else
    echo "[INFO] Creating the container..."

    # Create a debian DistroBox to use
    distrobox create --name "$CONTAINER_NAME" --image debian:latest --yes

    echo "[INFO] Container '$CONTAINER_NAME' successfully created."
fi

# Use the DistroBox
distrobox enter "$CONTAINER_NAME"