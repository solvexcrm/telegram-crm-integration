const fetch = require('node-fetch');

// Конфигурация
const SUPABASE_URL = 'https://olkejjlpoucibwgznjot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sa2Vqamxwb3VjaWJ3Z3puam90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzU3NjUsImV4cCI6MjA4NzU1MTc2NX0.nCOAJJ_dbX8jXKu9O5r9Ym82SyxNe8AJgRsZTDmfFEg';

async function createAdministrator() {
  try {
    console.log('🔧 Создаем пользователя administrator...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/crm-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-crm-token': SUPERADMIN_TOKEN,
      },
      body: JSON.stringify({
        action: 'create_user',
        data: {
          username: 'administrator',
          password: 'admin123', // Простой пароль для тестирования
          role: 'user'
        }
      })
    });

    const result = await response.json();
    console.log('📋 Результат создания пользователя:', result);

    if (result.success) {
      console.log('✅ Пользователь administrator создан успешно!');
      console.log('👤 Данные для входа:');
      console.log('   Username: administrator');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Ошибка создания пользователя:', result.error);

      if (result.error.includes('duplicate key')) {
        console.log('🔄 Пользователь уже существует, пробуем обновить пароль...');

        // Пытаемся обновить пароль существующего пользователя
        const updateResponse = await fetch(`${SUPABASE_URL}/functions/v1/crm-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-crm-token': SUPERADMIN_TOKEN,
          },
          body: JSON.stringify({
            action: 'update_user',
            id: 'administrator', // Попробуем по username
            data: {
              password: 'admin123'
            }
          })
        });

        const updateResult = await updateResponse.json();
        console.log('📋 Результат обновления пароля:', updateResult);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Запуск
createAdministrator();