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

async function generateTenantUsers() {
  console.log('🔐 Генерируем хеши паролей для пользователей тенантов...\n');

  const users = [
    { username: 'Daniil_tr', password: 'daniil123', tenant_id: 2 },
    { username: 'Vitalii_tr', password: 'vitalii123', tenant_id: 3 },
    { username: 'Alexander_tr', password: 'alexander123', tenant_id: 4 }
  ];

  let sql = '-- Создание пользователей для тенантов\n\n';

  for (const user of users) {
    // Предполагаем ID будут 11, 12, 13 (после administrator с ID 10)
    const estimatedId = users.indexOf(user) + 11;
    const hash = await hashPassword(user.password, estimatedId.toString());

    console.log(`👤 ${user.username}:`);
    console.log(`   Пароль: ${user.password}`);
    console.log(`   Тенант: ${user.tenant_id}`);
    console.log(`   Предполагаемый ID: ${estimatedId}`);
    console.log(`   Хеш: ${hash}\n`);

    sql += `-- ${user.username} (тенант ${user.tenant_id})\n`;
    sql += `INSERT INTO users (username, password_hash, role, tenant_id, is_active)\n`;
    sql += `VALUES ('${user.username}', '${hash}', 'user', ${user.tenant_id}, true)\n`;
    sql += `ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;\n\n`;
  }

  console.log('📋 Полный SQL:\n');
  console.log(sql);

  console.log('🎯 Данные для входа:');
  users.forEach(user => {
    console.log(`   ${user.username}: ${user.password} (тенант ${user.tenant_id})`);
  });
}

generateTenantUsers().catch(console.error);