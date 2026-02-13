/**
 * Test Agent Runner Flow
 * Verifies the complete end-to-end flow of agent execution
 */

const API_URL = 'http://localhost:4000';
const OWNER_ID = 'user_default';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function testFlow() {
  console.log('🧪 Testing Agent Runner Flow\n');

  // Step 1: List servers
  try {
    console.log('1️⃣ Listing MCP servers...');
    const response = await fetch(`${API_URL}/mcp/servers?ownerId=${OWNER_ID}`);
    const data = await response.json();
    
    if (data.servers && data.servers.length > 0) {
      results.push({
        step: 'List Servers',
        success: true,
        message: `Found ${data.servers.length} server(s)`,
        data: data.servers.map((s: any) => ({
          serverId: s.serverId,
          name: s.name,
          runtimeStatus: s.runtimeStatus,
          toolCount: s.toolCount,
        })),
      });
      console.log(`✅ Found ${data.servers.length} server(s)`);
      
      // Use first server for testing
      const server = data.servers[0];
      console.log(`   Using server: ${server.name} (${server.serverId})`);
      console.log(`   Runtime status: ${server.runtimeStatus}\n`);
      
      // Step 2: Get tool schemas
      await testToolSchemas(server.serverId);
      
      // Step 3: Start runtime if needed
      if (server.runtimeStatus !== 'running') {
        await testStartRuntime(server.serverId);
      }
      
      // Step 4: Run agent
      await testRunAgent(server.serverId);
      
    } else {
      results.push({
        step: 'List Servers',
        success: false,
        message: 'No servers found',
      });
      console.log('❌ No servers found\n');
    }
  } catch (error) {
    results.push({
      step: 'List Servers',
      success: false,
      message: (error as Error).message,
    });
    console.log(`❌ Error: ${(error as Error).message}\n`);
  }

  // Print summary
  printSummary();
}

async function testToolSchemas(serverId: string) {
  try {
    console.log('2️⃣ Fetching tool schemas...');
    const response = await fetch(
      `${API_URL}/mcp/servers/${serverId}/tools?ownerId=${OWNER_ID}`
    );
    const data = await response.json();
    
    if (data.tools && data.tools.length > 0) {
      results.push({
        step: 'Get Tool Schemas',
        success: true,
        message: `Found ${data.tools.length} tool(s)`,
        data: {
          toolCount: data.tools.length,
          executionOrderLength: data.executionOrder?.length || 0,
          tools: data.tools.map((t: any) => ({
            toolId: t.toolId,
            name: t.name,
            hasInputSchema: !!t.inputSchema,
            hasOutputSchema: !!t.outputSchema,
          })),
        },
      });
      console.log(`✅ Found ${data.tools.length} tool(s)`);
      console.log(`   Execution order: ${data.executionOrder?.length || 0} steps`);
      console.log(`   Tools: ${data.tools.map((t: any) => t.name).join(', ')}\n`);
    } else {
      results.push({
        step: 'Get Tool Schemas',
        success: false,
        message: 'No tools found',
      });
      console.log('❌ No tools found\n');
    }
  } catch (error) {
    results.push({
      step: 'Get Tool Schemas',
      success: false,
      message: (error as Error).message,
    });
    console.log(`❌ Error: ${(error as Error).message}\n`);
  }
}

async function testStartRuntime(serverId: string) {
  try {
    console.log('3️⃣ Starting runtime...');
    const response = await fetch(
      `${API_URL}/mcp/servers/${serverId}/runtime/start`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: OWNER_ID }),
      }
    );
    const data = await response.json();
    
    if (data.status === 'running') {
      results.push({
        step: 'Start Runtime',
        success: true,
        message: 'Runtime started successfully',
      });
      console.log('✅ Runtime started successfully\n');
    } else {
      results.push({
        step: 'Start Runtime',
        success: false,
        message: 'Failed to start runtime',
      });
      console.log('❌ Failed to start runtime\n');
    }
  } catch (error) {
    results.push({
      step: 'Start Runtime',
      success: false,
      message: (error as Error).message,
    });
    console.log(`❌ Error: ${(error as Error).message}\n`);
  }
}

async function testRunAgent(serverId: string) {
  try {
    console.log('4️⃣ Running agent...');
    
    // Test input data
    const input = {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User',
    };
    
    console.log(`   Input: ${JSON.stringify(input)}`);
    
    const response = await fetch(
      `${API_URL}/mcp/servers/${serverId}/run-agent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: OWNER_ID,
          input,
        }),
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      results.push({
        step: 'Run Agent',
        success: true,
        message: 'Agent executed successfully',
        data: {
          executionId: data.executionId,
          totalSteps: data.summary.totalSteps,
          successCount: data.summary.successCount,
          failedCount: data.summary.failedCount,
          duration: data.summary.duration,
          results: data.results.map((r: any) => ({
            step: r.step,
            toolName: r.toolName,
            status: r.status,
            error: r.error,
          })),
        },
      });
      console.log('✅ Agent executed successfully');
      console.log(`   Execution ID: ${data.executionId}`);
      console.log(`   Total steps: ${data.summary.totalSteps}`);
      console.log(`   Success: ${data.summary.successCount}`);
      console.log(`   Failed: ${data.summary.failedCount}`);
      console.log(`   Duration: ${data.summary.duration}ms`);
      console.log('\n   Step Results:');
      data.results.forEach((r: any) => {
        const icon = r.status === 'success' ? '✅' : '❌';
        console.log(`   ${icon} Step ${r.step}: ${r.toolName} - ${r.status}`);
        if (r.error) {
          console.log(`      Error: ${r.error}`);
        }
      });
      console.log('');
    } else {
      results.push({
        step: 'Run Agent',
        success: false,
        message: data.error || 'Agent execution failed',
        data: data.results,
      });
      console.log(`❌ Agent execution failed: ${data.error || 'Unknown error'}\n`);
    }
  } catch (error) {
    results.push({
      step: 'Run Agent',
      success: false,
      message: (error as Error).message,
    });
    console.log(`❌ Error: ${(error as Error).message}\n`);
  }
}

function printSummary() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.step}: ${result.message}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`Total: ${results.length} | Success: ${successCount} | Failed: ${failedCount}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (failedCount === 0) {
    console.log('🎉 All tests passed! Agent runner is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
  }
}

// Run tests
testFlow().catch(console.error);
