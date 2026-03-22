-- Создание пользователя administrator через SQL
-- Выполните эти команды в Supabase Dashboard > SQL Editor

-- 1. Сначала посмотрим существующих пользователей
SELECT id, username, role, tenant_id, is_active FROM users ORDER BY created_at DESC LIMIT 10;

-- 2. Проверим, есть ли уже пользователь administrator
SELECT * FROM users WHERE username = 'administrator';

-- 3. Создаем или обновляем пользователя administrator
-- Хеш для пароля 'admin123' с солью 'administrator'
INSERT INTO users (username, password_hash, role, tenant_id, is_active, created_at, updated_at)
VALUES (
  'administrator',
  'pbkdf2:ba2d4c06cf7571c98e37da53ec6e7daef55b4c5f6cf1886e05ae1af05f31e61c',
  'user',
  2, -- Основной тенант Daniil
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- 4. Проверим результат
SELECT id, username, role, tenant_id, is_active, created_at FROM users WHERE username = 'administrator';

-- ВАЖНО: Логин данные после создания:
-- Username: administrator
-- Password: admin123
-- Доступ к тенантам: 2, 3, 4 (Daniil, Vitalii, Alexandr)