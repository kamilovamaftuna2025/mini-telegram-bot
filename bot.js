const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { TOKEN } = require('./config');

const bot = new TelegramBot(TOKEN, { polling: true });

const users = {};

// Savollarni yuklovchi funksiya
function loadQuestions(level, lang) {
  const filePath = `./questions/${level}.json`;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Savollarni yuklashda xatolik:', err);
    return [];
  }
}

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;

  users[chatId] = {
    level: 'beginner',
    lang: 'uz',
    score: 0
  };

  const welcomeText = `👋 Salom, ${name}!
\n📚 Siz bilim va imkoniyatlar dunyosiga xush kelibsiz!
💡 Har bir savol — bu sizni yanada kuchli va zukko insonga aylantiradigan qadamdir.
🎯 O‘zingizga ishoning! Bugun siz o‘z ustingizda ishlayotgan insonsiz, bu esa katta yutuq!
\n🚀 Testni boshlash uchun quyidagi \"🧪 Testni boshlash\" tugmasini bosing. Omad siz bilan bo‘lsin!`;

  bot.sendMessage(chatId, welcomeText, {
    reply_markup: {
      keyboard: [
        ['🧪 Testni boshlash'],
        ['📊 Statistika', '⚙ Sozlamalar']
      ],
      resize_keyboard: true
    }
  });
});

// Foydalanuvchi xabarlarini qayta ishlash
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!users[chatId]) {
    users[chatId] = {
      level: 'beginner',
      lang: 'uz',
      score: 0
    };
  }

  switch (text) {
    case '🧪 Testni boshlash': {
      const user = users[chatId];
      const questions = loadQuestions(user.level, user.lang);
      const question = questions[Math.floor(Math.random() * questions.length)];

      const options = question.options.map((opt, i) => [{
        text: opt,
        callback_data: `answer_${i}_${question.correct}`
      }]);

      bot.sendMessage(chatId, `🧪 Savol:\n${question.question}`, {
        reply_markup: {
          inline_keyboard: options
        }
      });
      break;
    }

    case '⚙ Sozlamalar': {
      bot.sendMessage(chatId, "⚙ Sozlamalar menyusi:", {
        reply_markup: {
          keyboard: [
            ['🌐 Tilni tanlash'],
            ['🎯 Darajani tanlash'],
            ['⬅️ Orqaga']
          ],
          resize_keyboard: true
        }
      });
      break;
    }

    case '🌐 Tilni tanlash': {
      bot.sendMessage(chatId, "🌐 Tilni tanlang:", {
        reply_markup: {
          keyboard: [
            ['🇺🇿 Oʻzbekcha', '🇬🇧 English'],
            ['⬅️ Orqaga']
          ],
          resize_keyboard: true
        }
      });
      break;
    }

    case '🎯 Darajani tanlash': {
      bot.sendMessage(chatId, "🎯 Darajani tanlang:", {
        reply_markup: {
          keyboard: [
            ['🟢 Beginner', '🟡 Intermediate', '🔴 Advanced'],
            ['⬅️ Orqaga']
          ],
          resize_keyboard: true
        }
      });
      break;
    }

    case '⬅️ Orqaga': {
      bot.sendMessage(chatId, "🔙 Asosiy menyuga qaytdingiz", {
        reply_markup: {
          keyboard: [
            ['🧪 Testni boshlash'],
            ['📊 Statistika', '⚙ Sozlamalar']
          ],
          resize_keyboard: true
        }
      });
      break;
    }

    case '🇺🇿 Oʻzbekcha':
      users[chatId].lang = 'uz';
      bot.sendMessage(chatId, '✅ Til o\'zgartirildi: O\'zbekcha');
      break;

    case '🇬🇧 English':
      users[chatId].lang = 'en';
      bot.sendMessage(chatId, '✅ Language changed: English');
      break;

    case '🟢 Beginner':
    case '🟡 Intermediate':
    case '🔴 Advanced': {
      const levelMap = {
        '🟢 Beginner': 'beginner',
        '🟡 Intermediate': 'intermediate',
        '🔴 Advanced': 'advanced'
      };
      users[chatId].level = levelMap[text];
      bot.sendMessage(chatId, `✅ Siz tanlagan daraja: ${text}\n🧪 Endi savol beriladi...`);

      const questions = loadQuestions(users[chatId].level, users[chatId].lang);
      const question = questions[Math.floor(Math.random() * questions.length)];

      const options = question.options.map((opt, i) => [{
        text: opt,
        callback_data: `answer_${i}_${question.correct}`
      }]);

      bot.sendMessage(chatId, `🧪 Savol:\n${question.question}`, {
        reply_markup: {
          inline_keyboard: options
        }
      });
      break;
    }
  }
});

// Callback query uchun javob
bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const [, selectedIndex, correctIndex] = data.split('_');

  if (parseInt(selectedIndex) === parseInt(correctIndex)) {
    bot.sendMessage(chatId, '✅ To‘g‘ri javob! Zo‘r ishladingiz.');
  } else {
    bot.sendMessage(chatId, `❌ Noto‘g‘ri. To‘g‘ri javob: ${correctIndex}`);
  }
});
