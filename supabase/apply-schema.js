#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if Supabase CLI is installed
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Apply schema to Supabase project
async function applySchema() {
  console.log('\n🗄️  ALX Poll - Supabase Schema Migration Tool\n');
  
  // Check for Supabase CLI
  if (!checkSupabaseCLI()) {
    console.error('❌ Supabase CLI is not installed. Please install it first:');
    console.log('npm install -g supabase');
    process.exit(1);
  }
  
  // Get project reference
  const projectRef = await new Promise((resolve) => {
    rl.question('Enter your Supabase project reference: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  if (!projectRef) {
    console.error('❌ Project reference is required');
    process.exit(1);
  }
  
  // Link project
  console.log('\n🔗 Linking to Supabase project...');
  try {
    execSync(`supabase link --project-ref ${projectRef}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Failed to link project. Make sure your project reference is correct.');
    process.exit(1);
  }
  
  // Confirm before applying schema
  const confirmation = await new Promise((resolve) => {
    rl.question('\n⚠️  This will apply the schema to your Supabase project. Existing tables with the same names will be modified. Continue? (y/N): ', (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
  
  if (confirmation !== 'y' && confirmation !== 'yes') {
    console.log('\n🛑 Operation cancelled');
    rl.close();
    return;
  }
  
  // Apply schema
  console.log('\n🚀 Applying schema to Supabase project...');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('\n❌ Schema file not found. Make sure schema.sql exists in the supabase directory.');
    process.exit(1);
  }
  
  try {
    // Create a temporary migration file
    const migrationDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[\\:\-\.T]/g, '').slice(0, 14);
    const migrationPath = path.join(migrationDir, `${timestamp}_alx_poll_schema.sql`);
    
    // Copy schema to migration file
    fs.copyFileSync(schemaPath, migrationPath);
    
    // Apply migration
    execSync('supabase db push', { stdio: 'inherit' });
    
    console.log('\n✅ Schema applied successfully!');
    console.log('\n📊 You can now use the ALX Poll application with your Supabase database.');
  } catch (error) {
    console.error('\n❌ Failed to apply schema:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

applySchema();