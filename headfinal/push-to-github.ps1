# This script will push your code to GitHub
# Before running, make sure to create a repository on GitHub

# GitHub repository URL
$GitHubRepoUrl = "https://github.com/Jpatching/headfinal.git"

# Add the remote repository
git remote add origin $GitHubRepoUrl

# Create and switch to main branch (from master)
git branch -M main

# Push to GitHub with force flag to overwrite remote content
git push -u origin main --force

# Display completion message
Write-Host "Repository pushed to GitHub at $GitHubRepoUrl"
