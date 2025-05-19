#!/bin/bash

# Replace with your GitHub repository URL
GITHUB_REPO_URL="https://github.com/username/repo-name.git"

# Add the remote
git remote add origin $GITHUB_REPO_URL

# Push to the main branch
git branch -M main
git push -u origin main
