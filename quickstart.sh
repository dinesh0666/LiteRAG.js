#!/bin/bash

# LiteRAG.js - One-Click Quickstart
# This script sets up and runs a complete RAG demo in under 5 minutes

set -e

echo "🚀 LiteRAG.js Quickstart"
echo "========================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found"
echo ""

# Start Qdrant
echo "📦 Starting Qdrant vector database..."
docker run -d --name literag-qdrant -p 6333:6333 qdrant/qdrant 2>/dev/null || docker start literag-qdrant
sleep 3
echo "✅ Qdrant running on http://localhost:6333"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Build the project
echo "🔨 Building LiteRAG..."
npm run build
echo ""

# Run the demo
echo "🎬 Running demo..."
echo ""
npx ts-node examples/basic.ts

echo ""
echo "✅ Demo complete!"
echo ""
echo "Next steps:"
echo "  1. Start the API server: npx ts-node examples/server.ts"
echo "  2. Test the API:"
echo "     curl -X POST http://localhost:3000/ingest \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"content\": \"Your text here\", \"metadata\": {\"source\": \"test\"}}'"
echo ""
echo "  3. Query:"
echo "     curl -X POST http://localhost:3000/query \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"query\": \"your search query\", \"k\": 5}'"
echo ""
echo "To stop Qdrant: docker stop literag-qdrant"
