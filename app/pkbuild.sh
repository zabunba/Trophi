#!/bin/bash

# install leagcy
npm install --legacy-peer-deps

# prebuild the application
npx expo prebuild

# go to directory
cd android

# assemble with gradle
./gradlew assembleRelease