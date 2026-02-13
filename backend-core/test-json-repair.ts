import { repairJson } from './src/utils/repairJson';

// Test cases for JSON repair
const testCases = [
  {
    name: 'Trailing comma in array',
    input: '{"nodes": [{"id": 1}, {"id": 2},]}',
    expected: '{"nodes": [{"id": 1}, {"id": 2}]}',
  },
  {
    name: 'Unquoted keys',
    input: '{nodes: [{id: 1}]}',
    expected: '{"nodes": [{"id": 1}]}',
  },
  {
    name: 'Missing closing bracket',
    input: '{"nodes": [{"id": 1}, {"id": 2}',
    expected: '{"nodes": [{"id": 1}, {"id": 2}]}',
  },
  {
    name: 'Missing comma between objects',
    input: '{"nodes": [{"id": 1} {"id": 2}]}',
    expected: '{"nodes": [{"id": 1}, {"id": 2}]}',
  },
];

console.log('Testing JSON repair function...\n');

for (const test of testCases) {
  console.log(`Test: ${test.name}`);
  console.log(`Input:  ${test.input}`);
  
  const repaired = repairJson(test.input);
  console.log(`Output: ${repaired}`);
  
  try {
    JSON.parse(repaired);
    console.log('✅ Valid JSON\n');
  } catch (error) {
    console.log(`❌ Invalid JSON: ${(error as Error).message}\n`);
  }
}
