/**
 * Test Response Node Normalization
 * 
 * Verify that response tool is always moved to the end after mutation
 */

const API_URL = 'http://localhost:4000';
const OWNER_ID = 'user_default';

async function testResponseNormalization() {
  console.log('🧪 Testing Response Node Normalization\n');

  try {
    // Step 1: Create initial workflow
    console.log('📝 Step 1: Create initial workflow...');
    const createResponse = await fetch(`${API_URL}/ai/generate-mcp-server`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'create a simple user api',
        ownerId: OWNER_ID,
      }),
    });

    const createData = await createResponse.json();
    const serverId = createData.serverId;
    const workflowId = `mcp_workflow_${serverId}_${Date.now()}`;

    console.log('✅ Initial workflow created');
    console.log(`   - Tools: ${createData.tools.map((t: any) => t.toolId).join(' → ')}`);
    console.log(`   - Response at end: ${createData.tools[createData.tools.length - 1].toolId === 'response' ? '✅' : '❌'}\n`);

    // Step 2: Mutate workflow (add something in the middle)
    console.log('🔄 Step 2: Mutate workflow (add validation)...');
    const mutateResponse = await fetch(`${API_URL}/ai/mutate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'add email validation',
        workflowId,
        ownerId: OWNER_ID,
      }),
    });

    const mutateData = await mutateResponse.json();
    
    console.log('✅ Workflow mutated');
    
    // Get the actual MCP server to check tool order
    const serverResponse = await fetch(`${API_URL}/mcp/servers/${serverId}?ownerId=${OWNER_ID}`);
    const serverData = await serverResponse.json();
    
    console.log(`   - Tools: ${serverData.tools.map((t: any) => t.toolId).join(' → ')}`);
    
    const lastTool = serverData.tools[serverData.tools.length - 1];
    const responseAtEnd = lastTool.toolId === 'response' || lastTool.toolId.startsWith('response');
    
    console.log(`   - Response at end: ${responseAtEnd ? '✅' : '❌'}`);
    
    if (!responseAtEnd) {
      console.log(`   - ❌ ERROR: Response tool is at position ${serverData.tools.findIndex((t: any) => t.toolId === 'response' || t.toolId.startsWith('response'))}`);
      console.log(`   - Last tool is: ${lastTool.toolId}`);
      process.exit(1);
    }

    console.log('\n🎉 Test passed!');
    console.log('✅ Response node normalization is working');
    console.log('✅ Response tool is always at the end');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testResponseNormalization();
