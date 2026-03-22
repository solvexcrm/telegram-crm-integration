const crypto = require('crypto');

// Функция хеширования пароля как в Edge Function (соль "default")
function hashPassword(password, salt = "default") {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      resolve('pbkdf2:' + derivedKey.toString('hex'));
    });
  });
}

async function generateCorrectHash() {
  console.log('🔐 Генерируем правильный хеш пароля...\n');

  // Генерируем хеш для administrator с паролем admin123 и солью "default"
  const adminHash = await hashPassword('admin123', 'default');
  console.log('👤 Пользователь: administrator');
  console.log('🔑 Пароль: admin123');
  console.log('🧂 Соль: default');
  console.log('🔐 Хеш:', adminHash);
  console.log('');

  console.log('📋 SQL для обновления пароля:');
  console.log(`UPDATE users SET password_hash = '${adminHash}' WHERE username = 'administrator';`);
}

generateCorrectHash().catch(console.error);