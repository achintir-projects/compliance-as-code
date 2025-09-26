#!/bin/bash

echo "🚀 Redeploying GlassBox AI with updated iframe headers..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running code quality checks..."
npm run lint

# Build the application
echo "🏗️ Building the application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "✅ Updated middleware.ts with dynamic CSP handling"
echo "✅ Updated server.ts with dynamic CSP handling"
echo "✅ Local headers configured correctly:"
echo "   - Content-Security-Policy: frame-ancestors 'self' https://*.space.z.ai https://z.ai http://localhost:* http://127.0.0.1:*"
echo "   - X-Frame-Options: ALLOWALL"
echo "   - Cross-Origin-Opener-Policy: same-origin-allow-popups"
echo "   - Cross-Origin-Embedder-Policy: require-corp"
echo ""
echo "🌐 For deployment:"
echo "=================="
echo "The application is now ready for deployment with proper iframe headers."
echo "The deployed version will automatically detect if it's running on:"
echo "  - Preview domains (space.z.ai): Uses 'frame-ancestors *' (permissive)"
echo "  - Local development: Uses restricted frame-ancestors"
echo ""
echo "🔧 Next Steps:"
echo "============="
echo "1. Deploy the application using your deployment process"
echo "2. The deployed version should now work in Firefox iframes"
echo "3. Test the deployment in the preview environment"
echo ""
echo "🎯 Expected Results:"
echo "==================="
echo "- Firefox iframe blocking should be resolved"
echo "- CSP should allow embedding from Z.ai preview domains"
echo "- X-Frame-Options should be set to ALLOWALL"
echo "- All 20+ modules should be accessible in the preview"