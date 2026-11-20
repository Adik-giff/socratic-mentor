import { NextResponse } from "next/server";

const LECTURE_SYSTEM_INSTRUCTION = `
Ты — персональный ИИ-тьютор, работающий по методу Фейнмана и активного обучения. Твоя задача — объяснить студенту сложный материал лекции простым, понятным языком и убедиться, что он действительно разобрался.

Правила работы:
1. Переводи сложный академический текст в ясную структуру с короткими абзацами, списками и понятными примерами (учитывая выбранный студентом стиль объяснения).
2. Не вываливай всё сразу огромной стеной текста — разбей материал на логические смысловые блоки.
3. В конце КАЖДОГО своего ответа обязательно задай студенту 1 короткий проверочный вопрос (или попроси объяснить ключевую идею своими словами), чтобы проверить понимание.
4. Оценивай текущий прогресс понимания студента по шкале от 0 до 100 (understandingScore):
   - При первом разборе лекции ставь 20–30.
   - Если студент правильно отвечает на твои проверочные вопросы — хвали, плавно повышай understandingScore (+20..30 за каждый верный ответ) и переходи к следующему аспекту лекции.
   - Если студент ответил неверно или написал «не понял» — не повышай балл, а объясни этот же фрагмент ещё проще через другую аналогию.
5. Отвечай СТРОГО в формате валидного JSON без markdown-обёртки \`\`\`json, со следующей структурой:
{
  "reply": "Текст объяснения и проверочный вопрос в формате Markdown",
  "understandingScore": 25
}
`;

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

export async function POST(req) {
  try {
    const body = await req.json();
    const { lectureText, style = "Простыми словами", messages = [] } = body;

    if (!lectureText || !lectureText.trim()) {
      return NextResponse.json(
        { error: "Вставьте текст лекции или конспекта для разбора." },
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

    const formattedHistory = [];
    if (Array.isArray(messages) && messages.length > 0) {
      const previous = messages.slice(0, -1);
      for (const m of previous) {
        formattedHistory.push({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        });
      }
      const lastMsg = messages[messages.length - 1];
      formattedHistory.push({
        role: "user",
        content: `Стиль объяснения: ${style}\n\nИсходный текст лекции:\n"""\n${lectureText}\n"""\n\nОтвет/вопрос студента: ${lastMsg.content}`,
      });
    } else {
      formattedHistory.push({
        role: "user",
        content: `Стиль объяснения: ${style}\n\nРазбери эту лекцию простым языком и задай первый проверочный вопрос:\n"""\n${lectureText}\n"""`,
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
          { role: "system", content: LECTURE_SYSTEM_INSTRUCTION },
          ...formattedHistory,
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      const detail = groqData?.error?.message || JSON.stringify(groqData);
      return NextResponse.json(
        { error: `Ошибка ИИ-ментора (${groqRes.status}) [${model}]: ${detail}` },
        { status: 500 }
      );
    }

    const rawContent = groqData.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { reply: rawContent, understandingScore: 25 };
    }

    return NextResponse.json({
      reply: parsed.reply || "Не удалось разобрать лекцию.",
      understandingScore:
        typeof parsed.understandingScore === "number" ? parsed.understandingScore : 25,
      model,
    });
  } catch (error) {
    console.error("Lecture API Error:", error);
    return NextResponse.json(
      { error: `Сбой сервера: ${error.message}` },
      { status: 500 }
    );
  }
}
