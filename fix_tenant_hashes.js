const crypto = require('crypto');

// Функция хеширования пароля
function hashPassword(password, salt = "default") {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      resolve('pbkdf2:' + derivedKey.toString('hex'));
    });
  });
}

async function fixTenantHashes() {
  console.log('🔐 Генерируем правильные хеши с реальными ID...\n');

  const users = [
    { username: 'Daniil_tr', password: 'daniil123', id: 13 },
    { username: 'Vitalii_tr', password: 'vitalii123', id: 14 },
    { username: 'Alexander_tr', password: 'alexander123', id: 15 }
  ];

  let sql = '-- Обновление хешей паролей с правильными ID\n\n';

  for (const user of users) {
    const hash = await hashPassword(user.password, user.id.toString());

    console.log(`👤 ${user.username}:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Пароль: ${user.password}`);
    console.log(`   Соль: ${user.id}`);
    console.log(`   Хеш: ${hash}\n`);

    sql += `-- ${user.username} (ID ${user.id})\n`;
    sql += `UPDATE users SET password_hash = '${hash}' WHERE id = ${user.id};\n\n`;
  }

  console.log('📋 SQL для обновления хешей:\n');
  console.log(sql);

  console.log('🎯 Финальные данные для входа:');
  users.forEach(user => {
    console.log(`   ${user.username}: ${user.password}`);
  });
}

fixTenantHashes().catch(console.error);