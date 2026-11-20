// Anthropic Claude provider – uses the official SDK's tool runner to drive the agent loop.

const Anthropic = require('@anthropic-ai/sdk');
const { betaTool } = require('@anthropic-ai/sdk/helpers/beta/json-schema');

const DEFAULT_MODEL = 'claude-opus-5-5';
const MAX_ITERATIONS = 8;

let client = null;
function getClient() {
  if (!client) client = new Anthropic({ baseURL: process.env.ANTHROPIC_BASE_URL });
  return client;
}

function toClaudeMessages(history, message) {
  const messages = [];
  for (const entry of history) {
    const role = entry.role === 'assistant' ? 'assistant' : 'user';
    if (messages.length === 0 && role === 'assistant') continue;
    const last = messages[messages.length - 1];
    if (last && last.role === role) last.content += `\n\n${entry.content}`;
    else messages.push({ role, content: entry.content });
  }
  const last = messages[messages.length - 1];
  if (last && last.role === 'user') last.content += `\n\n${message}`;
  else messages.push({ role: 'user', content: message });
  return messages;
}

async function runClaude({ systemPrompt, history, message, tools, executeTool }) {
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;

  const runnableTools = tools.map(tool => betaTool({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.schema,
    run: async input => JSON.stringify(await executeTool(tool.name, input))
  }));

  const finalMessage = await getClient().beta.messages.toolRunner({
    model,
    max_tokens: 16000,
    system: systemPrompt,
    messages: toClaudeMessages(history, message),
    tools: runnableTools,
    max_iterations: MAX_ITERATIONS,
    thread: false,
    output_config: { effort: process.env.CLAUDE_EFFORT || 'low' },
    // If a request is declined by a safety classifier, the API retries it on a fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default'
  });

  if (finalMessage.stop_reason === 'refusal') {
    throw new Error(`Claude declined the request (${finalMessage.stop_details?.category || 'no category'})`);
  }

  const text = finalMessage.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim();
  if (!text) throw new Error(`Claude returned no text (stop_reason: ${finalMessage.stop_reason})`);
  return { text, model: finalMessage.model || model };
}

module.exports = { runClaude, toClaudeMessages, DEFAULT_MODEL };
