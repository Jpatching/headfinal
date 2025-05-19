#!/bin/bash

# Install Vercel CLI if you don't have it
npm i -g vercel

# Login to Vercel
vercel login

# Pull the project files
vercel pull --environment=production --yes

# This will download your production files to the current directory
