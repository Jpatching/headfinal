#!/bin/bash

# Initialize a new Git repository
git init

# Create a .gitignore file
echo "node_modules
.next
.vercel
.env
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store" > .gitignore

# Add all files to Git
git add .

# Create the initial commit
git commit -m "Initial commit from Vercel deployment"
