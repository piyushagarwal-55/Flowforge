#!/bin/bash

# Script to obtain Archestra API key for Orchestrix integration
# This script logs into Archestra and creates an API key

ARCHESTRA_URL="${ARCHESTRA_URL:-http://localhost:9000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@localhost.ai}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password}"

echo "🔑 Getting Archestra API Key..."
echo ""
echo "Archestra URL: $ARCHESTRA_URL"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Step 1: Login to get auth token
echo "Step 1: Logging in to Archestra..."
LOGIN_RESPONSE=$(curl -s -X POST "$ARCHESTRA_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login to Archestra"
  echo "Response: $LOGIN_RESPONSE"
  echo ""
  echo "Make sure Archestra is running:"
  echo "  docker ps | grep archestra"
  echo ""
  echo "If not running, start it with:"
  echo "  docker run -p 9000:9000 -p 3000:3000 -e ARCHESTRA_QUICKSTART=true archestra/platform"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Create API key
echo "Step 2: Creating API key for Orchestrix..."
API_KEY_RESPONSE=$(curl -s -X POST "$ARCHESTRA_URL/api/keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Orchestrix Integration","description":"API key for Orchestrix deployment integration"}')

# Extract API key from response
API_KEY=$(echo $API_KEY_RESPONSE | grep -o '"key":"[^"]*' | cut -d'"' -f4)

if [ -z "$API_KEY" ]; then
  echo "❌ Failed to create API key"
  echo "Response: $API_KEY_RESPONSE"
  exit 1
fi

echo "✅ API key created successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Your Archestra API Key:"
echo ""
echo "  $API_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Copy the API key above"
echo ""
echo "2. Update backend-core/.env:"
echo "   ARCHESTRA_API_KEY=$API_KEY"
echo ""
echo "3. Restart Orchestrix backend:"
echo "   cd backend-core && npm run dev"
echo ""
echo "4. Try deploying a workflow from the UI"
echo ""
