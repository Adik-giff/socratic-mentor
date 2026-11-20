import { NextResponse } from "next/server";

const BASE_SYSTEM_INSTRUCTION = `
Ты — опытный, терпеливый ментор по программированию, работающий по методу Сократа. Твоя цель — помочь студенту самостоятельно найти и исправить ошибку в коде или понять алгоритм.

Строгие правила:
1. НИКОГДА не пиши готовый исправленный код за студента, даже если он очень просит.
2. ВАЖНЕЙШЕЕ ПРАВИЛО: Анализируй ИСКЛЮЧИТЕЛЬНО тот код, который передан в теге [КОД ДЛЯ АНАЛИЗА] последнего сообщения пользователя. Это единственный актуальный код. Игнорируй любые другие функции или примеры кода, если они не присутствуют в этом блоке — даже если они упоминались в предыдущих сообщениях диалога.
3. Адаптируй свой ответ строго под выбранный студентом УРОВЕНЬ ПОДСКАЗКИ (hintLevel):
   - Уровень 1 (Наводящий вопрос): Задай 1–2 точных вопроса, которые направят внимание студента на проблемную строку или неверную логику. Не объясняй теорию.
   - Уровень 2 (Теоретическая подсказка): Объясни концепцию или механизм работы языка, из-за которого возникает ошибка, и задай контрольный вопрос. Не давай алгоритм решения.
   - Уровень 3 (Псевдокод): Распиши правильный алгоритм пошагово на русском языке (без синтаксиса Python/C++/JS и без готовых конструкций языка), чтобы студент сам перевёл шаги в код.
4. Хвали студента за верные догадки и прогресс.
5. Отвечай кратко, структурированно, дружелюбно, используя форматирование Markdown.
`;

const LEVEL_DESCRIPTIONS = {
  1: "Уровень 1: Только наводящий вопрос (укажи направление, где искать ошибку, без объяснения теории).",
  2: "Уровень 2: Подсказка по теории (объясни концепцию/механизм, почему текущий подход не сработает, но без алгоритма).",
  3: "Уровень 3: Псевдокод (дай пошаговую логику решения обычными словами без синтаксиса кода).",
};

// Автовыбор рабочей chat-модели из Groq API
async function pickGroqModel(apiKey) {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Не удалось получить список моделей Groq: ${res.status}`);

  const json = await res.json();
  const EXCLUDE = ["whisper", "guard", "tts", "embed"];
  const PREFER = ["llama", "qwen", "gemma"];

  const chatModels = (json.data || [])
    .map((m) => m.id)
    .filter((id) => !EXCLUDE.some((kw) => id.toLowerCase().includes(kw)));

  if (chatModels.length === 0) throw new Error("Нет доступных chat-моделей в Groq API.");

  const preferred = chatModels.find((id) =>
    PREFER.some((kw) => id.toLowerCase().includes(kw))
  );
  return preferred || chatModels[0];
}

// Строит одно user-сообщение с кодом и текстом в явном теге [КОД ДЛЯ АНАЛИЗА]
function buildUserMessage(code, language, levelText, messageContent) {
  return (
    `[КОД ДЛЯ АНАЛИЗА — анализируй только этот блок, игнорируй любой другой код из истории]\n` +
    `\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\n\n` +
    `Язык: ${language} | Режим помощи: ${levelText}\n\n` +
    `Сообщение студента: ${messageContent}`
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { code, language = "Python", messages = [], hintLevel = 1 } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: "Редактор кода пуст. Вставьте код для анализа." },
        { status: 400 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { error: "Сервер не видит GROQ_API_KEY! Перезапусти сервер или проверь файл .env.local." },
        { status: 500 }
      );
    }

    // Автовыбор рабочей модели
    let model;
    try {
      model = await pickGroqModel(groqKey.trim());
    } catch (err) {
      return NextResponse.json({ error: `Ошибка выбора модели: ${err.message}` }, { status: 500 });
    }

    const levelText = LEVEL_DESCRIPTIONS[hintLevel] || LEVEL_DESCRIPTIONS[1];

    // Строим историю диалога:
    // - все user-сообщения из истории получают актуальный код — модель всегда видит правильный контекст
    // - assistant-сообщения передаются как есть
    const formattedHistory = [];

    if (Array.isArray(messages) && messages.length > 0) {
      // Все предыдущие сообщения (кроме последнего)
      const previous = messages.slice(0, -1);
      for (const m of previous) {
        if (m.role === "assistant" || m.role === "mentor") {
          // Ответы ментора — как есть
          formattedHistory.push({ role: "assistant", content: m.content });
        } else {
          // Каждое user-сообщение из истории пересобираем с актуальным кодом,
          // чтобы модель не путалась при смене пресета/кода
          formattedHistory.push({
            role: "user",
            content: buildUserMessage(code, language, levelText, m.content),
          });
        }
      }

      // Последнее сообщение — актуальный запрос студента
      const lastMsg = messages[messages.length - 1];
      formattedHistory.push({
        role: "user",
        content: buildUserMessage(code, language, levelText, lastMsg.content),
      });
    } else {
      // Первый запрос — нет истории
      formattedHistory.push({
        role: "user",
        content: buildUserMessage(
          code,
          language,
          levelText,
          "Проверь мой код и помоги разобраться с проблемой."
        ),
      });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: BASE_SYSTEM_INSTRUCTION },
          ...formattedHistory,
        ],
        temperature: 0.4,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      const detail = data?.error?.message || JSON.stringify(data);
      return NextResponse.json(
        { error: `Ошибка ИИ-ментора (${groqRes.status}) [${model}]: ${detail}` },
        { status: 500 }
      );
    }

    const reply = data.choices?.[0]?.message?.content || "Пустой ответ от модели.";
    return NextResponse.json({ reply, model });
  } catch (error) {
    return NextResponse.json(
      { error: `Сбой сервера: ${error.message}` },
      { status: 500 }
    );
  }
}
