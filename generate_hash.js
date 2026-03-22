const crypto = require('crypto');

// Функция хеширования пароля (как в Edge Function)
function hashPassword(password, salt = "default") {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      resolve('pbkdf2:' + derivedKey.toString('hex'));
    });
  });
}

async function generateHashes() {
  console.log('🔐 Генерируем хеши паролей...\n');

  // Генерируем хеш для administrator с паролем admin123
  const adminHash = await hashPassword('admin123', 'administrator');
  console.log('👤 Пользователь: administrator');
  console.log('🔑 Пароль: admin123');
  console.log('🔐 Хеш:', adminHash);
  console.log('');

  // Генерируем хеш для superadmin с паролем super123
  const superHash = await hashPassword('super123', 'superadmin');
  console.log('👤 Пользователь: superadmin');
  console.log('🔑 Пароль: super123');
  console.log('🔐 Хеш:', superHash);
  console.log('');

  console.log('📋 SQL для создания administrator:');
  console.log(`INSERT INTO users (username, password_hash, role, tenant_id, is_active, created_at)
VALUES ('administrator', '${adminHash}', 'user', 2, true, NOW())
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;`);
}

generateHashes().catch(console.error);