#!/bin/bash

# prebuild the application
npx expo prebuild

# go to directory
cd android

# assemble with gradle
./gradlew assembleRelease