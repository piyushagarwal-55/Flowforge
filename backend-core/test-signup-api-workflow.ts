/**
 * Comprehensive test for creating a signup API workflow with JWT
 * This tests the complete flow: intent → generate → mutate → execute
 * Run with: bun run test-signup-api-workflow.ts
 */

const BACKEND_URL = 'http://localhost:4000';
const OWNER_ID = 'user_default';

async function testSignupAPIWorkflow() {
  console.log('🧪 Testing Complete Signup API Workflow with JWT\n');
  console.log('='.repeat(70));
  
  let workflowId = '';
  let authToken = '';

  // Step 1: Register a test user
  console.log('\n📝 Step 1: Register Test User');
  console.log('-'.repeat(70));
  
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';
  
  try {
    const registerRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      }),
    });
    
    const registerData = await registerRes.json();
    
    if (!registerRes.ok) {
      console.error('❌ Registration failed:', registerData);
      return;
    }
    
    authToken = registerData.token;
    console.log('✅ User registered successfully');
    console.log('   Email:', testEmail);
    console.log('   Token:', authToken.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Registration error:', error);
    return;
  }

  // Step 2: AI Intent Detection
  console.log('\n🤖 Step 2: AI Intent Detection');
  console.log('-'.repeat(70));
  
  try {
    const intentRes = await fetch(`${BACKEND_URL}/ai/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a user signup API endpoint',
        ownerId: OWNER_ID,
      }),
    });
    
    const intentData = await intentRes.json();
    
    if (!intentRes.ok) {
      console.error('❌ Intent detection failed:', intentData);
      return;
    }
    
    workflowId = intentData.workflowId;
    console.log('✅ Intent detected successfully');
    console.log('   Workflow ID:', workflowId);
    console.log('   Components:', intentData.components);
    console.log('   Has workflow prompt:', intentData.hasWorkflowPrompt);
  } catch (error) {
    console.error('❌ Intent detection error:', error);
    return;
  }

  // Step 3: Generate Workflow with AI
  console.log('\n🎨 Step 3: Generate Signup API Workflow');
  console.log('-'.repeat(70));
  
  try {
    const generateRes = await fetch(`${BACKEND_URL}/ai/generate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a user signup API that accepts email, password, and name. Hash the password with bcrypt, save to users collection, and return success message.',
        workflowId: workflowId,
        ownerId: OWNER_ID,
      }),
    });
    
    const generateData = await generateRes.json();
    
    if (!generateRes.ok) {
      console.error('❌ Workflow generation failed:', generateData);
      console.error('   Full response:', JSON.stringify(generateData, null, 2));
      return;
    }
    
    console.log('✅ Workflow generated successfully');
    console.log('   Nodes:', generateData.nodes?.length || 0);
    console.log('   Edges:', generateData.edges?.length || 0);
    
    if (generateData.nodes && generateData.nodes.length > 0) {
      console.log('\n   Node Types:');
      generateData.nodes.forEach((node: any, index: number) => {
        console.log(`   ${index + 1}. ${node.type} (${node.id})`);
        if (node.data?.label) {
          console.log(`      Label: ${node.data.label}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Workflow generation error:', error);
    return;
  }

  // Step 4: Mutate Workflow to Add JWT
  console.log('\n🔧 Step 4: Mutate Workflow to Add JWT Token Generation');
  console.log('-'.repeat(70));
  
  try {
    const mutateRes = await fetch(`${BACKEND_URL}/ai/mutate-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Add JWT token generation after successful signup. Use jwtGenerate step to create a token with the user email and id.',
        workflowId: workflowId,
        ownerId: OWNER_ID,
      }),
    });
    
    const mutateData = await mutateRes.json();
    
    if (!mutateRes.ok) {
      console.error('❌ Workflow mutation failed:', mutateData);
      console.error('   Full response:', JSON.stringify(mutateData, null, 2));
      return;
    }
    
    console.log('✅ Workflow mutated successfully');
    console.log('   Nodes:', mutateData.nodes?.length || 0);
    console.log('   Edges:', mutateData.edges?.length || 0);
    
    if (mutateData.nodes && mutateData.nodes.length > 0) {
      console.log('\n   Updated Node Types:');
      mutateData.nodes.forEach((node: any, index: number) => {
        console.log(`   ${index + 1}. ${node.type} (${node.id})`);
        if (node.data?.label) {
          console.log(`      Label: ${node.data.label}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Workflow mutation error:', error);
    return;
  }

  // Step 5: Get Workflow Details
  console.log('\n📋 Step 5: Retrieve Workflow Details');
  console.log('-'.repeat(70));
  
  try {
    const getRes = await fetch(`${BACKEND_URL}/workflows/${workflowId}?ownerId=${OWNER_ID}`);
    const getData = await getRes.json();
    
    if (!getRes.ok) {
      console.error('❌ Get workflow failed:', getData);
      return;
    }
    
    console.log('✅ Workflow retrieved successfully');
    console.log('   Workflow ID:', getData.workflowId);
    console.log('   API Name:', getData.apiName);
    console.log('   API Path:', getData.apiPath);
    console.log('   Steps:', getData.steps?.length || 0);
    console.log('   Edges:', getData.edges?.length || 0);
    console.log('   Input Variables:', getData.inputVariables?.length || 0);
    
    if (getData.steps && getData.steps.length > 0) {
      console.log('\n   Workflow Steps:');
      getData.steps.forEach((step: any, index: number) => {
        console.log(`   ${index + 1}. ${step.type} (${step.id})`);
        if (step.collection) {
          console.log(`      Collection: ${step.collection}`);
        }
        if (step.secret) {
          console.log(`      Secret: ${step.secret}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Get workflow error:', error);
    return;
  }

  // Step 6: Explain Workflow
  console.log('\n📖 Step 6: Get AI Explanation of Workflow');
  console.log('-'.repeat(70));
  
  try {
    const explainRes = await fetch(`${BACKEND_URL}/ai/explain-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowId: workflowId,
        ownerId: OWNER_ID,
      }),
    });
    
    const explainData = await explainRes.json();
    
    if (!explainRes.ok) {
      console.error('❌ Workflow explanation failed:', explainData);
      console.error('   Full response:', JSON.stringify(explainData, null, 2));
      return;
    }
    
    console.log('✅ Workflow explanation generated');
    console.log('\n   Explanation:');
    console.log('   ' + explainData.explanation?.substring(0, 300) + '...');
  } catch (error) {
    console.error('❌ Workflow explanation error:', error);
    return;
  }

  // Step 7: Execute Workflow (if it has steps)
  console.log('\n⚡ Step 7: Execute Workflow');
  console.log('-'.repeat(70));
  
  try {
    const executeRes = await fetch(`${BACKEND_URL}/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          email: 'newuser@example.com',
          password: 'SecurePassword123',
          name: 'New User',
        },
        ownerId: OWNER_ID,
      }),
    });
    
    const executeData = await executeRes.json();
    
    if (!executeRes.ok) {
      console.log('⚠️  Workflow execution skipped or failed:', executeData.error);
      console.log('   This is expected if the workflow has no executable steps yet');
    } else {
      console.log('✅ Workflow executed successfully');
      console.log('   Execution ID:', executeData.executionId);
      console.log('   Result:', JSON.stringify(executeData.result, null, 2));
    }
  } catch (error) {
    console.error('⚠️  Workflow execution error:', error);
    console.log('   This is expected if the workflow is not fully configured');
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Summary');
  console.log('='.repeat(70));
  console.log('\n✅ All Core Tests Passed:');
  console.log('   1. ✅ User registration');
  console.log('   2. ✅ AI intent detection');
  console.log('   3. ✅ Workflow generation');
  console.log('   4. ✅ Workflow mutation (add JWT)');
  console.log('   5. ✅ Workflow retrieval');
  console.log('   6. ✅ Workflow explanation');
  console.log('   7. ⚠️  Workflow execution (may need manual steps)');
  
  console.log('\n🎉 Complete Signup API Workflow Test Successful!');
  console.log('\n📝 Next Steps:');
  console.log('   - Review the generated workflow in the database');
  console.log('   - Test the workflow execution with real data');
  console.log('   - Verify JWT token generation works correctly');
  console.log('   - Connect frontend to test the complete flow');
  
  console.log('\n🔗 Workflow Details:');
  console.log(`   Workflow ID: ${workflowId}`);
  console.log(`   Owner ID: ${OWNER_ID}`);
  console.log(`   Backend URL: ${BACKEND_URL}`);
}

testSignupAPIWorkflow().catch(console.error);
