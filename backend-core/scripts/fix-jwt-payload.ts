/**
 * Script to fix JWT payload configuration in existing MCP servers
 * Run with: bun run scripts/fix-jwt-payload.ts
 */

import dotenv from 'dotenv';
import { connectMongo, disconnectMongo } from '../src/db/mongo';
import MCPServer from '../src/models/mcpServer.model';
import { logger } from '../src/utils/logger';

dotenv.config();

async function fixJWTPayload() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Find all MCP servers with JWT tools that have empty/missing payload
    const servers = await MCPServer.find({
      'tools.toolId': 'jwtGenerate'
    });

    console.log(`📊 Found ${servers.length} servers with JWT tools`);

    for (const server of servers) {
      let updated = false;

      for (const tool of server.tools) {
        if (tool.toolId === 'jwtGenerate') {
          // Check if payload is missing or empty
          const currentPayload = tool.inputSchema?.payload;
          
          if (!currentPayload || (typeof currentPayload === 'object' && Object.keys(currentPayload).length === 0)) {
            console.log(`\n🔧 Fixing JWT tool in server: ${server.serverId} (${server.name})`);
            console.log(`   Current payload:`, currentPayload);
            
            // Set a proper payload configuration
            // Use the created user data from the previous dbInsert step
            tool.inputSchema = {
              ...tool.inputSchema,
              payload: {
                userId: "{{created._id}}",
                email: "{{email}}"
              },
              expiresIn: "7d",
              output: "token"
            };
            
            console.log(`   New payload:`, tool.inputSchema.payload);
            updated = true;
          }
        }
      }

      if (updated) {
        await server.save();
        console.log(`✅ Updated server: ${server.serverId}`);
      }
    }

    console.log('\n✅ JWT payload fix completed!');
    console.log('🔄 Please restart your backend server to reload the updated configurations');

  } catch (error) {
    console.error('❌ Error fixing JWT payload:', error);
    throw error;
  } finally {
    await disconnectMongo();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixJWTPayload()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
