#!/bin/bash

# Script to push frontend files to GitHub
# Run this when your network connection is stable

echo "🚀 Pushing frontend files to GitHub..."
echo ""

# Check network connectivity
echo "Checking network connection..."
if ! ping -c 1 github.com &> /dev/null; then
    echo "❌ Cannot reach github.com"
    echo "Please check your internet connection and try again."
    exit 1
fi

echo "✅ Network connection OK"
echo ""

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed frontend files to GitHub!"
    echo ""
    echo "📊 Summary:"
    echo "  - 32 frontend files added"
    echo "  - 4,808 lines of code"
    echo ""
    echo "🔗 View on GitHub:"
    echo "  https://github.com/Charleslit/kenpolimarket"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Deploy backend to Render"
    echo "  2. Deploy frontend to Vercel"
    echo ""
    echo "📖 See DEPLOY_NOW.md for detailed instructions"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "Please check your network connection and try again."
    exit 1
fi

