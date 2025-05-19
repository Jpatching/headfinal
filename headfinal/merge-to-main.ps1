# Merge to main to prevent rollback

# Add all changed files
git add .

# Commit the changes
git commit -m "Fix matchmaking and betting functionality"

# Switch to main branch
git checkout main

# Merge the changes from current branch
git merge -

# Push to origin
git push origin main

# Deploy to Vercel to update the production deployment
.\deploy.ps1
