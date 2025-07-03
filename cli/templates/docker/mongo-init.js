// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
const dbName = process.env.MONGO_INITDB_DATABASE || 'myapp';
db = db.getSiblingDB(dbName);

// Create application user with read/write permissions
const appUser = process.env.MONGO_APP_USER || 'appuser';
const appPassword = process.env.MONGO_APP_PASSWORD || 'apppassword';

try {
  db.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [
      {
        role: 'readWrite',
        db: dbName
      }
    ]
  });
  
  print(`✅ Created application user: ${appUser}`);
} catch (error) {
  print(`❌ Error creating application user: ${error}`);
}

// Create indexes for better performance
try {
  // Users collection indexes
  db.users.createIndex({ email: 1 }, { unique: true });
  db.users.createIndex({ role: 1 });
  db.users.createIndex({ isActive: 1 });
  db.users.createIndex({ createdAt: -1 });
  
  print('✅ Created users collection indexes');
  
  // Refresh tokens collection indexes
  db.refreshtokens.createIndex({ userId: 1 });
  db.refreshtokens.createIndex({ token: 1 }, { unique: true });
  db.refreshtokens.createIndex({ expiresAt: 1 });
  db.refreshtokens.createIndex({ isRevoked: 1 });
  db.refreshtokens.createIndex({ userId: 1, isRevoked: 1 });
  db.refreshtokens.createIndex({ userId: 1, expiresAt: 1 });
  
  // TTL index for automatic cleanup of expired tokens
  db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
  
  print('✅ Created refresh tokens collection indexes');
  
} catch (error) {
  print(`❌ Error creating indexes: ${error}`);
}

// Create initial admin user (optional)
if (process.env.CREATE_ADMIN_USER === 'true') {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  
  try {
    // Hash password using bcrypt (simplified version for demo)
    // In production, this should be properly hashed
    db.users.insertOne({
      email: adminEmail,
      password: adminPassword, // This should be hashed in real implementation
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    print(`✅ Created admin user: ${adminEmail}`);
    print('⚠️  Remember to change the admin password after first login!');
  } catch (error) {
    print(`❌ Error creating admin user: ${error}`);
  }
}

// Create sample data (only in development)
if (process.env.NODE_ENV === 'development' && process.env.CREATE_SAMPLE_DATA === 'true') {
  try {
    // Sample users
    db.users.insertMany([
      {
        email: 'user1@example.com',
        password: 'hashedpassword1', // This should be properly hashed
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user2@example.com',
        password: 'hashedpassword2', // This should be properly hashed
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    print('✅ Created sample users for development');
  } catch (error) {
    print(`❌ Error creating sample data: ${error}`);
  }
}

// Print database statistics
try {
  const stats = db.stats();
  print(`📊 Database: ${dbName}`);
  print(`📊 Collections: ${stats.collections}`);
  print(`📊 Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
  print(`📊 Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  print(`❌ Error getting database stats: ${error}`);
}

print('🎉 MongoDB initialization completed successfully!'); 