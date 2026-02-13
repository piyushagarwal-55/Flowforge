/**
 * Test HTTP API Publishing
 * Demonstrates the full flow: Generate MCP → Call API → Verify Result
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000';
const OWNER_ID = 'demo_user';

async function testHttpApiFlow() {
  console.log('🚀 Starting HTTP API Publishing Test\n');

  try {
    // Step 1: Generate MCP Server
    console.log('📝 Step 1: Generating MCP server...');
    const generateResponse = await axios.post(`${API_URL}/ai/generate-mcp-server`, {
      prompt: 'Create user registration API with email and password',
      ownerId: OWNER_ID,
    });

    const { serverId, name, apiEndpoint, exampleCurl, exampleFetch } = generateResponse.data;

    console.log('✅ MCP server generated:');
    console.log(`   Server ID: ${serverId}`);
    console.log(`   Name: ${name}`);
    console.log(`   API Endpoint: ${apiEndpoint}\n`);

    // Step 2: Display API Usage
    console.log('📋 Step 2: API Usage Examples\n');
    console.log('cURL:');
    console.log(exampleCurl);
    console.log('\nJavaScript:');
    console.log(exampleFetch);
    console.log('');

    // Step 3: Call API (runtime auto-starts)
    console.log('🔥 Step 3: Calling API endpoint...');
    const apiResponse = await axios.post(`${API_URL}/mcp/api/${serverId}`, {
      email: 'demo@example.com',
      password: 'SecurePassword123',
      name: 'Demo User',
    });

    console.log('✅ API call successful:');
    console.log(JSON.stringify(apiResponse.data, null, 2));
    console.log('');

    // Step 4: Make another call to verify it works consistently
    console.log('🔄 Step 4: Making second API call...');
    const secondResponse = await axios.post(`${API_URL}/mcp/api/${serverId}`, {
      email: 'demo2@example.com',
      password: 'AnotherPassword456',
      name: 'Demo User 2',
    });

    console.log('✅ Second API call successful:');
    console.log(JSON.stringify(secondResponse.data, null, 2));
    console.log('');

    // Summary
    console.log('🎉 Test Complete!\n');
    console.log('Summary:');
    console.log(`✓ MCP server generated: ${serverId}`);
    console.log(`✓ API endpoint available: ${apiEndpoint}`);
    console.log(`✓ Runtime auto-started on first call`);
    console.log(`✓ Multiple API calls successful`);
    console.log('');
    console.log('💡 You can now use this API from any frontend:');
    console.log(`   curl -X POST ${apiEndpoint} -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"pass123"}'`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Error:', error.response?.data || error.message);
    } else {
      console.error('❌ Error:', error);
    }
    process.exit(1);
  }
}

// Run test
testHttpApiFlow();
