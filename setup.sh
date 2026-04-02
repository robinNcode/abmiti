#!/bin/bash
set -e
echo "🚀 Setting up abmiti..."

echo "📦 Installing server dependencies..."
cd server
cp .env.example .env
npm install
cd ..

echo "📦 Installing client dependencies..."
cd client
cp .env.example .env
npm install
cd ..

echo ""
echo "✅ Done! Next steps:"
echo ""
echo "  1. Edit server/.env  — set MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET"
echo ""
echo "  2. Start server:     cd server && npm run dev"
echo "  3. Start client:     cd client && npm run dev"
echo ""
echo "  Or with Docker:      docker-compose up -d"
echo ""
echo "  API runs on  → http://localhost:5000"
echo "  App runs on  → http://localhost:5173"
