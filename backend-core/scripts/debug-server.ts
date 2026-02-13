import { connectMongo } from '../src/db/mongo';
import MCPServer from '../src/models/mcpServer.model';

async function debugServer() {
  await connectMongo();
  
  const serverId = 'mcp_1770921684996_060e765d';
  const server = await MCPServer.findOne({ serverId });
  
  if (!server) {
    console.log('Server not found');
    return;
  }
  
  console.log('Server:', server.serverId);
  console.log('Name:', server.name);
  console.log('\nTools:');
  server.tools.forEach((tool: any, i: number) => {
    console.log(`\n${i + 1}. ${tool.name} (${tool.toolId})`);
    console.log('   Input Schema:', JSON.stringify(tool.inputSchema, null, 2));
  });
  
  console.log('\nExecution Order:', server.executionOrder);
  
  process.exit(0);
}

debugServer();
