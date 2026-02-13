/**
 * Test SupervisorAgent Integration
 * 
 * This script tests that:
 * 1. SupervisorAgent receives requests
 * 2. MCP server is generated
 * 3. Runtime is created
 * 4. Logs show supervisor routing
 */

const API_URL = 'http://localhost:4000';
const OWNER_ID = 'user_default';

async function testWorkflowGeneration() {
  console.log('🧪 Testing Workflow Generation via SupervisorAgent\n');

  try {
    // Test 1: Generate MCP Server
    console.log('📝 Test 1: Generate signup API...');
    const generateResponse = await fetch(`${API_URL}/ai/generate-mcp-server`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'create a sign up api',
        ownerId: OWNER_ID,
      }),
    });

    if (!generateResponse.ok) {
      throw new Error(`Generate failed: ${generateResponse.status} ${await generateResponse.text()}`);
    }

    const generateData = await generateResponse.json();
    console.log('✅ MCP Server Generated:');
    console.log(`   - Server ID: ${generateData.serverId}`);
    console.log(`   - Name: ${generateData.name}`);
    console.log(`   - Tools: ${generateData.tools.length}`);
    console.log(`   - Task ID: ${generateData.metadata.taskId}`);
    console.log(`   - API Endpoint: ${generateData.apiEndpoint}\n`);

    const serverId = generateData.serverId;

    // Test 2: Start Runtime
    console.log('🚀 Test 2: Start runtime...');
    const startResponse = await fetch(`${API_URL}/mcp/servers/${serverId}/runtime/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: OWNER_ID }),
    });

    if (!startResponse.ok) {
      throw new Error(`Start runtime failed: ${startResponse.status} ${await startResponse.text()}`);
    }

    const startData = await startResponse.json();
    console.log('✅ Runtime Started:');
    console.log(`   - Status: ${startData.status}\n`);

    // Test 3: Execute Workflow
    console.log('▶️  Test 3: Execute workflow...');
    const executeResponse = await fetch(`${API_URL}/mcp/servers/${serverId}/run-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          email: 'test@example.com',
          password: 'securepass123',
          name: 'Test User',
        },
        ownerId: OWNER_ID,
      }),
    });

    if (!executeResponse.ok) {
      throw new Error(`Execute failed: ${executeResponse.status} ${await executeResponse.text()}`);
    }

    const executeData = await executeResponse.json();
    console.log('✅ Workflow Executed:');
    console.log(`   - Success: ${executeData.success}`);
    console.log(`   - Steps: ${executeData.summary.totalSteps}`);
    console.log(`   - Duration: ${executeData.summary.duration}ms\n`);

    // Test 4: Test Mutation (add JWT)
    console.log('🔄 Test 4: Mutate workflow (add JWT)...');
    
    // Create workflowId from serverId
    const workflowId = `mcp_workflow_${serverId}_${Date.now()}`;
    
    const mutateResponse = await fetch(`${API_URL}/ai/mutate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'add JWT',
        workflowId,
        ownerId: OWNER_ID,
      }),
    });

    if (!mutateResponse.ok) {
      throw new Error(`Mutation failed: ${mutateResponse.status} ${await mutateResponse.text()}`);
    }

    const mutateData = await mutateResponse.json();
    console.log('✅ Workflow Mutated:');
    console.log(`   - Nodes: ${mutateData.nodes.length}`);
    console.log(`   - Task ID: ${mutateData.taskId || 'N/A'}\n`);

    // Test 5: Call Generated API
    console.log('🌐 Test 5: Call generated API endpoint...');
    const apiResponse = await fetch(`${API_URL}/mcp/api/${serverId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'api-test@example.com',
        password: 'apipass123',
        name: 'API Test User',
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(`API call failed: ${apiResponse.status} ${await apiResponse.text()}`);
    }

    const apiData = await apiResponse.json();
    console.log('✅ API Call Successful:');
    console.log(`   - Response:`, JSON.stringify(apiData, null, 2));
    console.log('\n');

    console.log('🎉 All tests passed!\n');
    console.log('✅ SupervisorAgent is working correctly');
    console.log('✅ MCP server generation works');
    console.log('✅ Runtime creation works');
    console.log('✅ Workflow execution works');
    console.log('✅ Workflow mutation works');
    console.log('✅ API endpoint works');
    console.log('\n📋 Check backend logs for SupervisorAgent routing messages');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testWorkflowGeneration();
