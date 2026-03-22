const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.json());

// Конфигурация
const PORT = process.env.PORT || 3001;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
// Поддержка нескольких чатов через отдельные переменные
const ALLOWED_CHAT_IDS = [
  process.env.CHAT_ID,
  process.env.CHAT_ID2,
  process.env.CHAT_ID3 // На будущее если понадобится
].filter(id => id && id.trim() !== ''); // Убираем пустые значения

// Supabase конфигурация
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const TENANT_ID = process.env.TENANT_ID || 1;

// Mapping локаций к массивам tenant_id
const LOCATION_TENANT_MAPPING = {
  'Чиревея': [4],
  'Патраикс': [2, 4], // Множественный тенант
  'Angel Guimera': [2, 4], // Множественный тенант
  'Calle Sant Pedro Pascual,9, Angel Guimera': [2, 4],
  'Albal': [3],
  'Benicalap': [3],
  'Benicalar': [3], // Пока на тенант 3
  // Неизвестные локации по умолчанию идут в тенант 2
  'Unknown': [2]
};

// Создаем Supabase клиент
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Парсер лидов из сообщений AlbatoBot
function parseLeadFromMessage(text) {
  console.log('📨 Получено сообщение:', text);

  // Проверяем, что это сообщение с лидом
  if (!text.includes('Кладовки исп НОВАЯ ФОРМА')) {
    console.log('❌ Не является сообщением с лидом');
    return null;
  }

  try {
    // Убираем префикс
    let content = text.replace('Кладовки исп НОВАЯ ФОРМА', '').trim();
    console.log('🔧 Контент после удаления префикса:', content);

    // Ищем телефон (начинается с +34)
    const phoneMatch = content.match(/\+34\d{9}/);
    if (!phoneMatch) {
      console.log('❌ Телефон не найден');
      return null;
    }

    const phone = phoneMatch[0];
    console.log('📞 Найден телефон:', phone);

    // Удаляем телефон из строки
    content = content.replace(phone, '').trim();

    // Определяем локацию и имя
    let location = '';
    let name = '';

    // Известные локации
    const locations = [
      'Angel Guimera', 'Benicalap', 'Benicalar',
      'Calle Sant Pedro Pascual,9, Angel Guimera',
      'Чиревея', 'Патраикс', 'Albal'
    ];

    // Ищем локацию
    for (const loc of locations) {
      if (content.includes(loc)) {
        location = loc;
        name = content.replace(loc, '').trim();
        // Убираем дату если есть (например "с 16.03Marce")
        name = name.replace(/,?\s*с\s*\d{2}\.\d{2}\w*/, '').trim();
        break;
      }
    }

    // Если локация не найдена, пробуем другой подход
    if (!location) {
      // Берем все что до имени как локацию
      const parts = content.split(/(?=[A-Z][a-z])/); // Разделяем по заглавным буквам
      if (parts.length >= 2) {
        location = parts[0].trim();
        name = parts.slice(1).join('').trim();
      } else {
        location = 'Unknown';
        name = content;
      }
    }

    console.log('🏢 Локация:', location);
    console.log('👤 Имя:', name);

    return {
      name: name || 'Lead from Facebook',
      phone: phone,
      location: location,
      source: 'Facebook',
      raw_message: text
    };

  } catch (error) {
    console.error('❌ Ошибка парсинга:', error);
    return null;
  }
}

// Создание лидов в CRM через Supabase (ВСЕ лиды во ВСЕ тенанты)
async function createLeadInCRM(leadData) {
  try {
    console.log('📤 Создаем лиды в Supabase:', leadData);

    // ВСЕ лиды идут во ВСЕ тенанты
    const tenantIds = [2, 3, 4]; // Daniil, Vitalii, Alexandr
    console.log(`🏢 Создаем лид во ВСЕХ тенантах:`, tenantIds);

    const currentTime = new Date().toISOString();
    const createdLeads = [];

    // Создаем отдельный лид для каждого тенанта
    for (const tenantId of tenantIds) {
      console.log(`📝 Создаем лид для tenant_id: ${tenantId}`);

      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: leadData.name,
          phone: leadData.phone,
          source: leadData.source,
          notes: `Локация: ${leadData.location}\nОригинальное сообщение: ${leadData.raw_message}`,
          status: 'prospecto',
          tenant_id: tenantId,
          tenant_ids: [tenantId.toString()], // Массив со строковым ID тенанта
          created_at: currentTime,
          status_updated_at: currentTime
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Supabase error для tenant ${tenantId}:`, error);
        throw error;
      }

      console.log(`✅ Лид создан для tenant ${tenantId}:`, data);
      createdLeads.push(data);
    }

    console.log(`🎯 Всего создано лидов: ${createdLeads.length} (во всех тенантах)`);
    return createdLeads;

  } catch (error) {
    console.error('❌ Ошибка создания лидов в Supabase:', error.message);
    throw error;
  }
}

// Webhook для получения сообщений от Telegram
app.post('/webhook', async (req, res) => {
  try {
    console.log('📬 Получен webhook от Telegram:', JSON.stringify(req.body, null, 2));

    const update = req.body;

    // Проверяем, что это текстовое сообщение
    if (update.message && update.message.text) {
      const messageText = update.message.text;
      const chatId = update.message.chat.id;

      console.log(`📨 Сообщение от ${chatId}: ${messageText}`);
      console.log(`👤 Отправитель:`, update.message.from);
      console.log(`📋 Полное сообщение:`, JSON.stringify(update.message, null, 2));

      // Проверяем, что сообщение из разрешенной группы
      if (!ALLOWED_CHAT_IDS.includes(chatId.toString())) {
        console.log(`⚠️ Сообщение из неразрешенного чата: ${chatId}, разрешенные: ${ALLOWED_CHAT_IDS.join(', ')}`);
        res.status(200).json({ ok: true });
        return;
      }

      // Парсим лид из сообщения
      const leadData = parseLeadFromMessage(messageText);

      if (leadData) {
        console.log('✅ Лид распознан:', leadData);

        try {
          // Создаем лид в CRM
          await createLeadInCRM(leadData);
          console.log('🎯 Лид успешно создан в CRM!');

          // Отправляем подтверждение в Telegram (опционально)
          // await sendTelegramMessage(chatId, '✅ Лид добавлен в CRM!');

        } catch (error) {
          console.error('❌ Ошибка создания лида:', error);
        }
      } else {
        console.log('ℹ️ Сообщение не является лидом, игнорируем');
      }
    }

    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Тестовый endpoint для проверки парсера
app.post('/test-parser', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const result = parseLeadFromMessage(message);
  res.json({
    original: message,
    parsed: result,
    success: !!result
  });
});

// Статус сервера
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    message: 'Telegram-CRM integration server is running',
    config: {
      tenant_id: TENANT_ID,
      allowed_chat_ids: ALLOWED_CHAT_IDS,
      has_supabase_config: !!(SUPABASE_URL && SUPABASE_URL !== 'https://your-project.supabase.co')
    }
  });
});

// Endpoint для проверки лидов в Supabase
app.get('/check-leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, phone, tenant_id, source, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Группируем по tenant_id
    const byTenant = data.reduce((acc, lead) => {
      acc[lead.tenant_id] = acc[lead.tenant_id] || [];
      acc[lead.tenant_id].push(lead);
      return acc;
    }, {});

    res.json({
      success: true,
      total_leads: data.length,
      recent_leads: data,
      current_tenant_id: parseInt(TENANT_ID),
      leads_by_tenant: byTenant,
      config: {
        tenant_id: TENANT_ID,
        chat_ids: ALLOWED_CHAT_IDS,
        supabase_url: SUPABASE_URL,
        has_valid_config: !!(SUPABASE_URL && SUPABASE_URL !== 'https://your-project.supabase.co')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint для сравнения структуры лидов
app.get('/compare-leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    // Разделяем на старые (работающие) и новые (webhook)
    const oldLeads = data.filter(lead => lead.source !== 'Facebook');
    const webhookLeads = data.filter(lead => lead.source === 'Facebook');

    res.json({
      success: true,
      comparison: {
        old_leads_structure: oldLeads[0] || null,
        webhook_leads_structure: webhookLeads[0] || null,
        all_old_fields: oldLeads.length > 0 ? Object.keys(oldLeads[0]) : [],
        all_webhook_fields: webhookLeads.length > 0 ? Object.keys(webhookLeads[0]) : [],
        differences: 'Сравните поля выше'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Telegram-CRM Integration Server запущен на порту ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🧪 Тестовый парсер: http://localhost:${PORT}/test-parser`);
  console.log(`📊 Статус: http://localhost:${PORT}/status`);
});

module.exports = app;