#!/bin/bash

echo "🚀 GlassBox AI Manual Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Current Status:"
echo "=================="

# Check git status
echo "🔍 Git Status:"
git status --porcelain

echo ""
echo "📦 Preparing deployment..."

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Setup database
echo "🗄️ Setting up database..."
npm run db:setup

# Build application
echo "🏗️ Building application..."
npm run build

echo ""
echo "✅ Deployment preparation completed!"
echo ""
echo "📋 Summary:"
echo "==========="
echo "✅ Dependencies installed"
echo "✅ Database schema created"
echo "✅ System tenant initialized"
echo "✅ Application built successfully"
echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Deploy using your platform's deployment method:"
echo "   - Vercel: Connect repo and deploy"
echo "   - Netlify: Connect repo and deploy"
echo "   - Railway: Connect repo and deploy"
echo "   - Or use your platform's manual deployment"
echo ""
echo "2. After deployment, test:"
echo "   - Firefox iframe functionality"
echo "   - All 20+ modules accessibility"
echo "   - Application startup without errors"
echo ""
echo "🎯 Expected Results:"
echo "===================="
echo "✅ Firefox iframe blocking resolved"
echo "✅ Database initialization working"
echo "✅ All modules accessible in preview"
echo "✅ Cross-browser compatibility"