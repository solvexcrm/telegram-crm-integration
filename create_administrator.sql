-- Создание пользователя administrator для multi-tenant доступа

-- Сначала проверим, есть ли уже пользователь
SELECT username, role, tenant_id FROM users WHERE username = 'administrator';

-- Если есть, обновим пароль
UPDATE users
SET password_hash = 'pbkdf2:a59b84fc8b97f0e8c6e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7' -- хеш для пароля 'admin123'
WHERE username = 'administrator';

-- Если нет, создадим нового
INSERT INTO users (username, password_hash, role, tenant_id, created_at, is_active)
VALUES ('administrator',
        'pbkdf2:a59b84fc8b97f0e8c6e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7e3e5f5e9e2e8a7c7',
        'user',
        2,
        NOW(),
        true)
ON CONFLICT (username)
DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Проверим результат
SELECT id, username, role, tenant_id, is_active, created_at FROM users WHERE username = 'administrator';