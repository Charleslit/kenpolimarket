#!/bin/bash

echo "🔧 Deploying API URL Fix to Production"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Must run from kenpolimarket root directory"
    exit 1
fi

echo "📝 Staging changes..."
git add frontend/

echo ""
echo "📋 Files changed:"
git status --short

echo ""
echo "💾 Committing changes..."
git commit -m "Fix: Remove duplicate /api in API_BASE_URL to prevent /api/api/ double path

- Updated 13 frontend files to remove /api from fallback URL
- Fixed InteractiveMap, CountyExplorerEnhanced, and all dashboard components
- Updated .env.local for consistency
- Resolves 404 errors on production (Vercel)
- Backend URL in Vercel: https://kenpolimarket-backend.onrender.com/api
- Code now correctly appends paths without duplication"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Vercel will auto-deploy in 2-3 minutes"
echo ""
echo "📊 Monitor deployment:"
echo "   https://vercel.com/dashboard"
echo ""
echo "🔍 Test after deployment:"
echo "   https://kenpolimarket.vercel.app/explorer"
echo "   https://kenpolimarket.vercel.app/forecasts"
echo ""
echo "🎉 Your production site should work now!"

