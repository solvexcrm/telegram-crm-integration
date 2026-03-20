// Тестирование парсера лидов из сообщений Telegram

// Тестовые сообщения из скриншота
const testMessages = [
  'Кладовки исп НОВАЯ ФОРМАлиды Calle Sant Pedro Pascual,9, Angel Guimera, с 16.03Marce Cetro+34661574982',

  'Кладовки исп НОВАЯ ФОРМАBenicalarDavid Lahorca Avila+34676310032',

  'Кладовки исп НОВАЯ ФОРМАBenicalapaaaron jimenez+34661491177',

  'Кладовки исп НОВАЯ ФОРМАBenicalarMaria Jesus Benitez Benitez+34671429906',

  'Кладовки исп НОВАЯ ФОРМАBenicalarpgabri_ma+34667158964'
];

// Импортируем парсер (в реальном проекте это было бы require('./server'))
function parseLeadFromMessage(text) {
  console.log('📨 Получено сообщение:', text);

  if (!text.includes('Кладовки исп НОВАЯ ФОРМА')) {
    console.log('❌ Не является сообщением с лидом');
    return null;
  }

  try {
    let content = text.replace('Кладовки исп НОВАЯ ФОРМА', '').trim();
    console.log('🔧 Контент после удаления префикса:', content);

    // Ищем телефон
    const phoneMatch = content.match(/\+34\d{9}/);
    if (!phoneMatch) {
      console.log('❌ Телефон не найден');
      return null;
    }

    const phone = phoneMatch[0];
    console.log('📞 Найден телефон:', phone);

    content = content.replace(phone, '').trim();

    let location = '';
    let name = '';

    // Известные локации
    const locations = [
      'Calle Sant Pedro Pascual,9, Angel Guimera',
      'Angel Guimera',
      'Benicalap',
      'Benicalar'
    ];

    // Ищем локацию
    for (const loc of locations) {
      if (content.includes(loc)) {
        location = loc;
        name = content.replace(loc, '').trim();
        name = name.replace(/,?\s*с\s*\d{2}\.\d{2}\w*/, '').trim();
        name = name.replace(/^лиды\s*/, '').trim(); // Убираем "лиды" в начале
        break;
      }
    }

    // Если локация не найдена, определяем по первым буквам
    if (!location) {
      const parts = content.split(/(?=[A-Z])/);
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

// Запускаем тесты
console.log('🧪 ТЕСТИРОВАНИЕ ПАРСЕРА ЛИДОВ\n');
console.log('='.repeat(50));

testMessages.forEach((message, index) => {
  console.log(`\n📋 ТЕСТ ${index + 1}:`);
  console.log('-'.repeat(30));

  const result = parseLeadFromMessage(message);

  if (result) {
    console.log('✅ УСПЕШНО РАСПОЗНАН:');
    console.log(`   👤 Имя: ${result.name}`);
    console.log(`   📞 Телефон: ${result.phone}`);
    console.log(`   🏢 Локация: ${result.location}`);
    console.log(`   📱 Источник: ${result.source}`);
  } else {
    console.log('❌ НЕ УДАЛОСЬ РАСПОЗНАТЬ');
  }

  console.log('-'.repeat(30));
});

console.log('\n' + '='.repeat(50));
console.log('🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');