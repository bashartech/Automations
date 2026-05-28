// Update owner number in database
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./whatsapp_logs.db', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

async function updateOwner() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Step 1: Check current users
      console.log('\n📋 Current users:');
      db.all('SELECT phone_number, contact_name, role FROM users', [], (err, rows) => {
        if (err) {
          console.error('Error:', err.message);
        } else {
          rows.forEach(row => {
            console.log(`   ${row.phone_number} - ${row.contact_name} - ${row.role}`);
          });
        }
      });

      // Step 2: Demote old owner (923042985456) to public
      console.log('\n🔄 Demoting old owner number...');
      db.run(
        `UPDATE users SET role = 'public', permissions = '[]' WHERE phone_number IN ('923042985456', '+923042985456')`,
        function(err) {
          if (err) {
            console.error('❌ Error demoting old owner:', err.message);
          } else {
            console.log(`✅ Updated ${this.changes} record(s)`);
          }
        }
      );

      // Step 3: Delete new owner if exists (to avoid duplicates)
      console.log('\n🗑️  Removing new owner if exists...');
      db.run(
        `DELETE FROM users WHERE phone_number IN ('923239021325', '+923239021325')`,
        function(err) {
          if (err) {
            console.error('❌ Error:', err.message);
          } else {
            console.log(`✅ Deleted ${this.changes} record(s)`);
          }
        }
      );

      // Step 4: Add new owner (923239021325)
      console.log('\n➕ Adding new owner...');
      db.run(
        `INSERT INTO users (phone_number, contact_name, role, permissions) VALUES ('923239021325', 'Bashar (Owner)', 'owner', '["all"]')`,
        function(err) {
          if (err) {
            console.error('❌ Error adding new owner:', err.message);
          } else {
            console.log('✅ New owner added successfully');
          }
        }
      );

      // Step 5: Verify changes
      setTimeout(() => {
        console.log('\n✅ Final user list:');
        db.all('SELECT phone_number, contact_name, role FROM users', [], (err, rows) => {
          if (err) {
            console.error('Error:', err.message);
          } else {
            rows.forEach(row => {
              console.log(`   ${row.phone_number} - ${row.contact_name} - ${row.role}`);
            });
          }

          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            } else {
              console.log('\n✅ Database updated successfully!');
              console.log('\n🚀 Next steps:');
              console.log('   1. Restart the bot: npm start');
              console.log('   2. Send message from 923239021325 to bot number');
              console.log('   3. You should get full owner access!');
            }
            resolve();
          });
        });
      }, 1000);
    });
  });
}

updateOwner().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
