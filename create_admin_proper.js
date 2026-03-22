const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Конфигурация
const SUPABASE_URL = 'https://olkejjlpoucibwgznjot.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sa2Vqamxwb3VjaWJ3Z3puam90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk3NTc2NSwiZXhwIjoyMDg3NTUxNzY1fQ.TUj6AzZzqZnrTpF7KlSyOgqfkqF8Tbs-wU0dTgY6xJQ'; // Service role ключ

// Создаем Supabase клиент с service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Функция хеширования пароля (как в Edge Function)
async function hashPassword(password, salt = "default") {
  return new Promise((resolve) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) throw err;
      resolve('pbkdf2:' + derivedKey.toString('hex'));
    });
  });
}

async function createAdministrator() {
  try {
    console.log('🔧 Создаем пользователя administrator...');

    // Хешируем пароль
    const hashedPassword = await hashPassword('admin123', 'administrator');
    console.log('🔐 Пароль захеширован:', hashedPassword.substring(0, 20) + '...');

    // Проверяем, есть ли уже пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'administrator')
      .single();

    if (existingUser) {
      console.log('👤 Пользователь administrator уже существует. Обновляем пароль...');

      // Обновляем пароль
      const { data, error } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('username', 'administrator')
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка обновления пароля:', error);
        return;
      }

      console.log('✅ Пароль обновлен успешно!');
    } else {
      console.log('👤 Создаем нового пользователя administrator...');

      // Создаем нового пользователя
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: 'administrator',
          password_hash: hashedPassword,
          role: 'user',
          tenant_id: 2, // Основной тенант - Daniil
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        return;
      }

      console.log('✅ Пользователь administrator создан успешно!');
    }

    console.log('🎯 Данные для входа:');
    console.log('   Username: administrator');
    console.log('   Password: admin123');
    console.log('   Тенанты: 2, 3, 4 (Daniil, Vitalii, Alexandr)');
    console.log('');
    console.log('🌐 Войти можно по адресу: http://localhost:3001/');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Запуск
createAdministrator();