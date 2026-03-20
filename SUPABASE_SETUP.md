# 🚀 Настройка интеграции с Supabase

## ⚡ Быстрая настройка

### 1. Получите данные Supabase
В панели Supabase найдите:
- **Project URL**: `https://your-project.supabase.co`
- **Anon public key**: в разделе Settings → API

### 2. Настройте конфигурацию
Создайте файл `.env` в папке `telegram-crm-integration`:

```bash
# Скопируйте пример
cp .env.example .env
```

Заполните `.env`:
```env
# Токен Telegram бота
TELEGRAM_BOT_TOKEN=1234567890:AAEexampleBotTokenHere

# Ваши данные Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example

# Ваш tenant ID
TENANT_ID=1
```

### 3. Установите и запустите
```bash
npm install
npm start
```

## 🎯 Как работает

```
Telegram → Webhook → Парсер → Supabase → CRM
```

1. **AlbatoBot** отправляет лид в Telegram
2. **Webhook** получает сообщение
3. **Парсер** извлекает данные (имя, телефон, локация)
4. **Supabase** создает запись в таблице `leads`
5. **CRM** мгновенно показывает новый лид!

## 📊 Структура лида в Supabase

```javascript
{
  name: "David Lahorca Avila",
  phone: "+34676310032",
  source: "Facebook",
  status: "prospecto",
  notes: "Локация: Benicalar\nОригинальное сообщение: ...",
  tenant_id: 1,
  created_at: "2026-03-19T17:30:00Z",
  status_updated_at: "2026-03-19T17:30:00Z"
}
```

## 🔧 Настройка Webhook

Получите токен у @BotFather и выполните:

```bash
# Для продакшена
curl -X POST "https://api.telegram.org/bot YOUR_TOKEN/setWebhook" \
  -d "url=https://your-server.com/webhook"

# Для тестирования с ngrok
ngrok http 3001
curl -X POST "https://api.telegram.org/bot YOUR_TOKEN/setWebhook" \
  -d "url=https://abc123.ngrok.io/webhook"
```

## ✅ Проверка работы

1. **Запустите сервер**: `npm start`
2. **Отправьте тестовый лид** в группу Telegram
3. **Проверьте логи сервера** - должны увидеть парсинг и создание
4. **Откройте CRM** - новый лид в колонке "📥 Nuevos"!

## 🧪 Тестирование

```bash
# Проверьте парсер
npm run test

# Проверьте статус сервера
curl http://localhost:3001/status

# Имитируйте webhook
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"chat":{"id":123},"text":"Кладовки исп НОВАЯ ФОРМАBenicalarDavid+34676310032"}}'
```

## 🎉 Результат

**Автоматическое создание лидов:**
- ⚡ Мгновенно в CRM
- 📍 С правильной локацией
- 📞 С проверенным телефоном
- 🏷️ Источник "Facebook"
- ⏰ С точным временем

**Без ручных действий!** 🚀