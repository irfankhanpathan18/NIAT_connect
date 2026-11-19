// Google Gemini provider – function-calling agent loop over the REST API.

const DEFAULT_MODEL = 'gemini-2.5-flash';
const MAX_STEPS = 6;

// Gemini accepts an OpenAPI-style subset of JSON Schema.
function toGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const { additionalProperties, ...rest } = schema;
  if (rest.properties) {
    rest.properties = Object.fromEntries(Object.entries(rest.properties).map(([k, v]) => [k, toGeminiSchema(v)]));
    if (Object.keys(rest.properties).length === 0) return undefined;
  }
  return rest;
}

function toGeminiContents(history, message) {
  const contents = [];
  for (const entry of history) {
    const role = entry.role === 'assistant' ? 'model' : 'user';
    if (contents.length === 0 && role === 'model') continue;
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n\n${entry.content}`;
    else contents.push({ role, parts: [{ text: entry.content }] });
  }
  const last = contents[contents.length - 1];
  if (last && last.role === 'user') last.parts[0].text += `\n\n${message}`;
  else contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

async function runGemini({ systemPrompt, history, message, tools, executeTool }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const functionDeclarations = tools.map(tool => {
    const parameters = toGeminiSchema(tool.schema);
    return parameters
      ? { name: tool.name, description: tool.description, parameters }
      : { name: tool.name, description: tool.description };
  });

  const contents = toGeminiContents(history, message);

  for (let step = 0; step < MAX_STEPS; step++) {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        tools: [{ functionDeclarations }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Gemini API returned ${resp.status} for model "${model}": ${body.slice(0, 300)}`);
    }

    const json = await resp.json();
    const candidate = json.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const calls = parts.filter(p => p.functionCall);

    if (calls.length === 0) {
      const text = parts.map(p => p.text || '').join('').trim();
      if (!text) throw new Error(`Gemini returned no text (finishReason: ${candidate?.finishReason || 'unknown'})`);
      return { text, model };
    }

    // Send the model turn back unchanged (it may carry thought signatures), then the results.
    contents.push(candidate.content);
    const responses = [];
    for (const part of calls) {
      const { name, args } = part.functionCall;
      const result = await executeTool(name, args || {});
      responses.push({ functionResponse: { name, response: result && typeof result === 'object' && !Array.isArray(result) ? result : { result } } });
    }
    contents.push({ role: 'user', parts: responses });
  }

  throw new Error('Gemini agent stopped after reaching the maximum number of tool steps');
}

module.exports = { runGemini, toGeminiSchema, toGeminiContents, DEFAULT_MODEL };
