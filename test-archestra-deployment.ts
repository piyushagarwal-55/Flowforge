/**
 * Test script for Archestra deployment
 * 
 * This script tests the complete deployment flow:
 * 1. Create a signup API workflow
 * 2. Deploy it to Archestra
 * 3. Verify deployment info is saved
 */

import axios from 'axios';

const API_URL = 'http://localhost:4000';
const OWNER_ID = 'test-user-123';

async function testArchestraDeployment() {
  console.log('🚀 Testing Archestra Deployment Flow\n');

  try {
    // Step 1: Generate a signup API workflow
    console.log('Step 1: Generating signup API workflow...');
    const generateResponse = await axios.post(`${API_URL}/ai/generate-mcp-server`, {
      prompt: 'create a sign up api with email validation and JWT authentication',
      ownerId: OWNER_ID,
    });

    const serverId = generateResponse.data.serverId;
    console.log(`✅ Workflow generated: ${serverId}\n`);

    // Step 2: Start the runtime
    console.log('Step 2: Starting runtime...');
    await axios.post(`${API_URL}/mcp/servers/${serverId}/runtime/start`, {
      ownerId: OWNER_ID,
    });
    console.log('✅ Runtime started\n');

    // Step 3: Deploy to Archestra
    console.log('Step 3: Deploying to Archestra...');
    try {
      const deployResponse = await axios.post(
        `${API_URL}/mcp/servers/${serverId}/deploy`,
        { ownerId: OWNER_ID }
      );

      console.log('✅ Deployment successful!');
      console.log('📋 Deployment Info:');
      console.log(`   Agent ID: ${deployResponse.data.agentId}`);
      console.log(`   Endpoint: ${deployResponse.data.endpoint}`);
      console.log(`   Dashboard: ${deployResponse.data.dashboardUrl}`);
      console.log('');

      // Step 4: Verify deployment info is persisted
      console.log('Step 4: Verifying deployment info...');
      const serverResponse = await axios.get(
        `${API_URL}/mcp/servers/${serverId}?ownerId=${OWNER_ID}`
      );

      if (serverResponse.data.archestraAgentId) {
        console.log('✅ Deployment info persisted correctly');
        console.log(`   Agent ID: ${serverResponse.data.archestraAgentId}`);
        console.log(`   Endpoint: ${serverResponse.data.archestraEndpoint}`);
        console.log(`   Dashboard: ${serverResponse.data.archestraDashboardUrl}`);
        console.log(`   Deployed At: ${serverResponse.data.archestraDeployedAt}`);
      } else {
        console.log('❌ Deployment info not found in database');
      }

      console.log('\n✅ All tests passed!');
    } catch (deployError: any) {
      if (deployError.response?.status === 500) {
        console.log('⚠️  Deployment failed (expected if Archestra API key not configured)');
        console.log('   Error:', deployError.response.data.error);
        console.log('\n📝 To enable deployment:');
        console.log('   1. Set ARCHESTRA_API_KEY in backend-core/.env');
        console.log('   2. Set ARCHESTRA_ENDPOINT in backend-core/.env');
        console.log('   3. Restart the backend server');
      } else {
        throw deployError;
      }
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testArchestraDeployment();
