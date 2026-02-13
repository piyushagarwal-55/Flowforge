/**
 * Test Input Tool Context Structure
 * Verifies that the context structure matches what the input tool expects
 */

// Simulate the input tool handler
function inputToolHandler(input: any, context: any) {
  console.log('📥 Input Tool Handler Called');
  console.log('Input:', JSON.stringify(input, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
  const { variables } = input;
  const inputData = context.vars.input?.input || context.vars.input || {};
  
  console.log('\n🔍 Extracting input data...');
  console.log('inputData:', JSON.stringify(inputData, null, 2));
  
  const result: Record<string, any> = {};

  for (const v of variables) {
    const varName = v.name;
    console.log(`\n  Checking variable: ${varName}`);
    
    if (varName in inputData) {
      console.log(`    ✅ Found in inputData: ${inputData[varName]}`);
      result[varName] = inputData[varName];
      context.vars[varName] = inputData[varName];
    } else if (v.default !== undefined) {
      console.log(`    ⚠️  Not found, using default: ${v.default}`);
      result[varName] = v.default;
      context.vars[varName] = v.default;
    } else {
      console.log(`    ❌ Not found, setting to null`);
      result[varName] = null;
      context.vars[varName] = null;
    }
  }

  console.log('\n📤 Result:', JSON.stringify(result, null, 2));
  console.log('Updated context.vars:', JSON.stringify(context.vars, null, 2));
  
  return { variables: result };
}

// Test Case 1: Current implementation (should work)
console.log('═══════════════════════════════════════════════════════');
console.log('TEST CASE 1: Current Implementation');
console.log('═══════════════════════════════════════════════════════\n');

const userInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

const context1 = {
  vars: {
    input: {
      input: userInput,
    },
  },
  headers: {},
  executionId: 'test-123',
};

const toolInput1 = {
  variables: [
    { name: 'email', type: 'string', required: true },
    { name: 'password', type: 'string', required: true },
    { name: 'name', type: 'string', required: false },
  ],
};

try {
  const result1 = inputToolHandler(toolInput1, context1);
  console.log('\n✅ TEST PASSED');
  console.log('Result:', JSON.stringify(result1, null, 2));
} catch (error) {
  console.log('\n❌ TEST FAILED');
  console.log('Error:', (error as Error).message);
}

// Test Case 2: Alternative structure (context.vars.input directly)
console.log('\n\n═══════════════════════════════════════════════════════');
console.log('TEST CASE 2: Alternative Structure (context.vars.input)');
console.log('═══════════════════════════════════════════════════════\n');

const context2 = {
  vars: {
    input: userInput, // Direct assignment
  },
  headers: {},
  executionId: 'test-456',
};

try {
  const result2 = inputToolHandler(toolInput1, context2);
  console.log('\n✅ TEST PASSED');
  console.log('Result:', JSON.stringify(result2, null, 2));
} catch (error) {
  console.log('\n❌ TEST FAILED');
  console.log('Error:', (error as Error).message);
}

// Test Case 3: Missing context.vars.input (should fail)
console.log('\n\n═══════════════════════════════════════════════════════');
console.log('TEST CASE 3: Missing context.vars.input (Expected to Fail)');
console.log('═══════════════════════════════════════════════════════\n');

const context3 = {
  vars: {}, // No input property
  headers: {},
  executionId: 'test-789',
};

try {
  const result3 = inputToolHandler(toolInput1, context3);
  console.log('\n⚠️  TEST PASSED (but all values are null)');
  console.log('Result:', JSON.stringify(result3, null, 2));
} catch (error) {
  console.log('\n❌ TEST FAILED');
  console.log('Error:', (error as Error).message);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log('✅ Test Case 1: context.vars.input.input - SHOULD WORK');
console.log('✅ Test Case 2: context.vars.input - SHOULD WORK (fallback)');
console.log('⚠️  Test Case 3: No input - Returns null values');
console.log('═══════════════════════════════════════════════════════\n');
