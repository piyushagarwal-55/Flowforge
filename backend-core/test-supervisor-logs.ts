/**
 * Test SupervisorAgent Logs in API Response
 * 
 * This script verifies that supervisor logs appear in the API response
 * and can be displayed in the frontend logs panel.
 */

const API_URL = 'http://localhost:4000';
const OWNER_ID = 'user_default';

async function testSupervisorLogs() {
  console.log('🧪 Testing SupervisorAgent Logs in API Response\n');

  try {
    // Test 1: Generate MCP Server and check logs
    console.log('📝 Test 1: Generate MCP server and verify supervisor logs...');
    const generateResponse = await fetch(`${API_URL}/ai/generate-mcp-server`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'create a simple todo api',
        ownerId: OWNER_ID,
      }),
    });

    if (!generateResponse.ok) {
      throw new Error(`Generate failed: ${generateResponse.status}`);
    }

    const generateData = await generateResponse.json();
    
    console.log('✅ MCP Server Generated:');
    console.log(`   - Server ID: ${generateData.serverId}`);
    console.log(`   - Name: ${generateData.name}`);
    console.log(`   - Tools: ${generateData.tools.length}`);
    
    if (generateData.metadata?.supervisorLogs) {
      console.log('\n🧠 Supervisor Logs (from API response):');
      generateData.metadata.supervisorLogs.forEach((log: string, index: number) => {
        console.log(`   ${index + 1}. ${log}`);
      });
    } else {
      console.log('\n❌ No supervisor logs found in response!');
      process.exit(1);
    }

    const serverId = generateData.serverId;
    const workflowId = `mcp_workflow_${serverId}_${Date.now()}`;

    // Test 2: Mutate workflow and check logs
    console.log('\n🔄 Test 2: Mutate workflow and verify supervisor logs...');
    const mutateResponse = await fetch(`${API_URL}/ai/mutate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'add validation',
        workflowId,
        ownerId: OWNER_ID,
      }),
    });

    if (!mutateResponse.ok) {
      throw new Error(`Mutation failed: ${mutateResponse.status}`);
    }

    const mutateData = await mutateResponse.json();
    
    console.log('✅ Workflow Mutated:');
    console.log(`   - Nodes: ${mutateData.nodes.length}`);
    
    if (mutateData.supervisorLogs) {
      console.log('\n🧠 Supervisor Logs (from mutation):');
      mutateData.supervisorLogs.forEach((log: string, index: number) => {
        console.log(`   ${index + 1}. ${log}`);
      });
    } else {
      console.log('\n❌ No supervisor logs found in mutation response!');
      process.exit(1);
    }

    console.log('\n🎉 All tests passed!\n');
    console.log('✅ Supervisor logs are included in API responses');
    console.log('✅ Frontend can now display these logs in the logs panel');
    console.log('\n📋 To see logs in UI:');
    console.log('   1. Open http://localhost:5000');
    console.log('   2. Create or open a workflow');
    console.log('   3. Send a chat message (e.g., "add JWT")');
    console.log('   4. Click "Logs" button to see supervisor logs');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testSupervisorLogs();
