#!/bin/bash
rm -f .git/shallow
git push --force "https://aishasidra63-221:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/aishasidra63-221/luldown.git" main
