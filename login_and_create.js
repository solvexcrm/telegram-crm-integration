const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Конфигурация
const SUPABASE_URL = 'https://olkejjlpoucibwgznjot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sa2Vqamxwb3VjaWJ3Z3puam90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzU3NjUsImV4cCI6MjA4NzU1MTc2NX0.nCOAJJ_dbX8jXKu9O5r9Ym82SyxNe8AJgRsZTDmfFEg';

// Сначала логинимся как superadmin
async function loginAsSuperadmin() {
  try {
    console.log('🔐 Входим как superadmin...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'login',
        username: 'superadmin',
        password: 'super123' // Попробуем стандартный пароль
      })
    });

    const result = await response.json();
    console.log('📋 Результат логина:', result);

    if (result.token) {
      console.log('✅ Успешно вошли как superadmin!');
      return result.token;
    } else {
      console.log('❌ Не удалось войти как superadmin');
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка логина:', error.message);
    return null;
  }
}

// Создаем пользователя administrator
async function createAdministrator(token) {
  try {
    console.log('🔧 Создаем пользователя administrator...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/crm-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-crm-token': token,
      },
      body: JSON.stringify({
        action: 'create_user',
        data: {
          username: 'administrator',
          password: 'admin123',
          role: 'user'
        }
      })
    });

    const result = await response.json();
    console.log('📋 Результат создания пользователя:', result);

    if (result.success) {
      console.log('✅ Пользователь administrator создан успешно!');
      console.log('🎯 Данные для входа:');
      console.log('   Username: administrator');
      console.log('   Password: admin123');
      console.log('   Тенанты: 2, 3, 4 (Daniil, Vitalii, Alexandr)');
      console.log('');
      console.log('🌐 Войти можно по адресу: http://localhost:3001/');
      return true;
    } else {
      console.log('❌ Ошибка создания пользователя:', result.error);

      if (result.error.includes('duplicate key')) {
        console.log('🔄 Пользователь уже существует. Попробуем обновить пароль...');

        // Сначала получим ID существующего пользователя
        const getUserResponse = await fetch(`${SUPABASE_URL}/functions/v1/crm-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-crm-token': token,
          },
          body: JSON.stringify({
            action: 'select',
            table: 'users'
          })
        });

        const users = await getUserResponse.json();
        const adminUser = users.data?.find(u => u.username === 'administrator');

        if (adminUser) {
          console.log(`🔍 Найден пользователь с ID: ${adminUser.id}`);

          // Обновляем пароль
          const updateResponse = await fetch(`${SUPABASE_URL}/functions/v1/crm-api`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'x-crm-token': token,
            },
            body: JSON.stringify({
              action: 'update_user',
              id: adminUser.id,
              data: {
                password: 'admin123'
              }
            })
          });

          const updateResult = await updateResponse.json();
          console.log('📋 Результат обновления пароля:', updateResult);

          if (updateResult.success) {
            console.log('✅ Пароль обновлен успешно!');
            console.log('🎯 Данные для входа:');
            console.log('   Username: administrator');
            console.log('   Password: admin123');
            return true;
          }
        }
      }
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return false;
  }
}

// Основная функция
async function main() {
  const token = await loginAsSuperadmin();
  if (token) {
    await createAdministrator(token);
  } else {
    console.log('💡 Попробуйте другие учетные данные для superadmin');
    console.log('💡 Или создайте пользователя administrator вручную через Supabase Dashboard');
  }
}

// Запуск
main();