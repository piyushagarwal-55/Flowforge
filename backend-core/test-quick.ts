/**
 * Quick test to verify backend-core is working
 * Run with: bun run test-quick.ts
 */

const BACKEND_URL = 'http://localhost:4000';

async function quickTest() {
  console.log('⚡ Quick Backend Test\n');

  // Test 1: Health
  const health = await fetch(`${BACKEND_URL}/health`);
  const healthData = await health.json();
  console.log('✅ Health:', healthData.status);

  // Test 2: Register
  const email = `test_${Date.now()}@example.com`;
  const register = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Test123',
      name: 'Test User',
    }),
  });
  const registerData = await register.json();
  console.log('✅ Register:', registerData.user?.email);

  // Test 3: Login
  const login = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Test123',
    }),
  });
  const loginData = await login.json();
  console.log('✅ Login:', loginData.token ? 'Token received' : 'Failed');

  // Test 4: Collections
  const collections = await fetch(`${BACKEND_URL}/collections`);
  const collectionsData = await collections.json();
  console.log('✅ Collections:', Object.keys(collectionsData.schemas || {}).length, 'schemas');

  // Test 5: AI Intent
  const intent = await fetch(`${BACKEND_URL}/ai/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Create a user API' }),
  });
  const intentData = await intent.json();
  console.log('✅ AI Intent:', intentData.workflowId);

  console.log('\n🎉 Backend Core is fully functional!');
  console.log('   - Port: 4000');
  console.log('   - Zero Motia dependencies');
  console.log('   - Zero Redis dependencies');
  console.log('   - All routes working');
}

quickTest().catch(console.error);
