const crypto = require('crypto');

// Функция хеширования пароля как в auth-login (соль = user_id)
function hashPassword(password, salt = "default") {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      resolve('pbkdf2:' + derivedKey.toString('hex'));
    });
  });
}

async function generateCorrectHashWithId() {
  console.log('🔐 Генерируем правильный хеш пароля с ID как солью...\n');

  // Генерируем хеш для administrator с паролем admin123 и солью "10" (ID пользователя)
  const adminHash = await hashPassword('admin123', '10');
  console.log('👤 Пользователь: administrator');
  console.log('🆔 ID пользователя: 10');
  console.log('🔑 Пароль: admin123');
  console.log('🧂 Соль: 10');
  console.log('🔐 Хеш:', adminHash);
  console.log('');

  console.log('📋 SQL для обновления пароля:');
  console.log(`UPDATE users SET password_hash = '${adminHash}' WHERE username = 'administrator';`);
}

generateCorrectHashWithId().catch(console.error);