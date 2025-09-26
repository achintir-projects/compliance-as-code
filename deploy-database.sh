#!/bin/bash

echo "🗄️ Setting up database for deployment..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Create db directory if it doesn't exist
mkdir -p db

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

# Run database initialization
echo "🚀 Initializing database..."
npx tsx setup-system-tenant.js

echo "✅ Database setup completed successfully!"
echo ""
echo "📋 Database Status:"
echo "=================="
echo "✅ Database schema created"
echo "✅ Prisma client generated"
echo "✅ System tenant initialized"
echo "✅ Ready for deployment"