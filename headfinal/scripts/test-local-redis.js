const { createClient } = require('redis');

async function testLocalRedis() {
  console.log('Testing local Redis connection...');
  
  try {
    // Connect to local Redis
    const client = createClient({
      url: 'redis://localhost:6379'
    });
    
    client.on('error', (err) => {
      console.error('Local Redis error:', err);
    });
    
    // Connect
    await client.connect();
    console.log('✅ Connected to local Redis successfully');
    
    // Test set/get operations
    await client.set('test-key', 'Hello from local Redis!');
    const value = await client.get('test-key');
    console.log(`✅ Retrieved test value: "${value}"`);
    
    // Disconnect
    await client.disconnect();
    console.log('✅ Disconnected from Redis');
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to local Redis:', error);
    return false;
  }
}

// Run the test
testLocalRedis()
  .then(success => {
    console.log(success 
      ? '✅ Local Redis test completed successfully' 
      : '❌ Local Redis test failed');
  });
