// Test Supabase Admin User
const bcrypt = require('bcryptjs');

// Test the hash from supabase-schema.sql
const storedHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eidgV.wQ.GKG';
const password = 'Admin123!';

console.log('Testing bcrypt hash from supabase-schema.sql...');
console.log('Password:', password);
console.log('Stored Hash:', storedHash);

bcrypt.compare(password, storedHash).then(result => {
  console.log('Hash matches:', result);
  
  if (!result) {
    console.log('\n❌ Hash does NOT match!');
    console.log('Generating correct hash...');
    
    bcrypt.hash(password, 10).then(newHash => {
      console.log('✅ New correct hash:', newHash);
      console.log('\nPlease update supabase-schema.sql with this hash.');
    });
  } else {
    console.log('\n✅ Hash is correct!');
  }
}).catch(err => {
  console.error('Error:', err);
});
