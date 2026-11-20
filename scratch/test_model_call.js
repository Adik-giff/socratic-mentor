const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/GEMINI_API_KEY=(.*)/)[1].trim();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: key });

async function callGemini(contents, config = {}) {
  try {
    console.log('1. Trying gemini-2.5-flash...');
    return await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config,
    });
  } catch (err) {
    const isRateLimit = err?.status === 429 ||
      err?.message?.includes('429') ||
      err?.message?.toLowerCase().includes('quota') ||
      err?.message?.includes('RESOURCE_EXHAUSTED');

    const isModelNotFound = err?.status === 404 ||
      err?.message?.includes('404') ||
      err?.message?.includes('not found') ||
      err?.message?.includes('no longer available');

    if (isRateLimit || isModelNotFound) {
      console.warn(`gemini-2.5-flash failed (${err?.status || err?.message?.slice(0, 80)}). Falling back to gemini-2.5-flash-lite...`);
      try {
        return await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents,
          config,
        });
      } catch (liteErr) {
        if (liteErr?.message?.includes('gemini-3.5-flash-lite') || liteErr?.status === 404) {
          console.warn('Falling back to gemini-3.5-flash-lite...');
          return await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents,
            config,
          });
        }
        throw liteErr;
      }
    }
    throw err;
  }
}

async function run() {
  const res = await callGemini('Привет! Назови одно главное отличие Python от C++ в 1 предложении.');
  console.log('SUCCESS Response:\n', res.text);
}

run().catch(console.error);
