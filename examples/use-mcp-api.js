// Node.js example for calling MCP API
const API_URL = 'http://localhost:4000';

async function generateMCPServer() {
  const response = await fetch(`${API_URL}/ai/generate-mcp-server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Create user registration API with email and password',
      ownerId: 'demo_user'
    })
  });
  
  const data = await response.json();
  console.log('✅ MCP Server Generated:');
  console.log('Server ID:', data.serverId);
  console.log('API Endpoint:', data.apiEndpoint);
  console.log('\nExample cURL:');
  console.log(data.exampleCurl);
  
  return data;
}

async function callMCPApi(serverId) {
  const response = await fetch(`${API_URL}/mcp/api/${serverId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@example.com',
      password: 'SecurePass123',
      name: 'Demo User'
    })
  });
  
  const data = await response.json();
  console.log('\n✅ API Call Result:');
  console.log(JSON.stringify(data, null, 2));
  
  return data;
}

async function main() {
  try {
    console.log('🚀 Starting MCP API Demo\n');
    
    // Step 1: Generate MCP server
    const server = await generateMCPServer();
    
    // Step 2: Call the API
    await callMCPApi(server.serverId);
    
    console.log('\n✅ Demo Complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
