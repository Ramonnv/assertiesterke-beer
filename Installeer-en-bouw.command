#!/bin/bash
cd "$(dirname "$0")"
bash scripts/setup.sh && bash scripts/build.sh
echo
echo "Je kunt dit venster sluiten."
