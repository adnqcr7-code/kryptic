import readline from 'node:readline/promises';
import process from 'node:process';
import { chat } from './providers.js';

const MAX_TURNS = 20;
const MAX_MESSAGE = 12000;

export async function startChat({ providerId, workspace, systemPrompt, context = '', input = process.stdin, output = process.stdout } = {}) {
  if (!input.isTTY || !output.isTTY) throw new Error('Interactive chat requires a TTY. Use `ask` for one-shot planning in non-interactive environments.');
  const rl = readline.createInterface({ input, output, terminal: true });
  const messages = [{ role: 'system', content: `${systemPrompt}\nThis is interactive chat. Be concise, honest, and never claim execution without verification.\nWorkspace context:\n${context}` }];
  output.write(`Kryptic chat — ${providerId}. Type /help for commands, /quit to exit.\n`);
  try {
    for (let turn = 0; turn < MAX_TURNS; turn += 1) {
      const inputText = (await rl.question('you> ')).trim();
      if (!inputText) continue;
      if (inputText === '/quit' || inputText === '/exit') break;
      if (inputText === '/help') { output.write('/help  commands\n/reset clear conversation\n/status show limits\n/quit exit chat\n'); continue; }
      if (inputText === '/status') { output.write(`provider=${providerId} turns=${turn + 1}/${MAX_TURNS} max_message=${MAX_MESSAGE}\n`); continue; }
      if (inputText === '/reset') { messages.splice(1); output.write('conversation reset\n'); continue; }
      if (inputText.length > MAX_MESSAGE) { output.write(`message too long; limit is ${MAX_MESSAGE} characters\n`); continue; }
      messages.push({ role: 'user', content: inputText });
      const response = await chat({ providerId, messages, maxRetries: 1 });
      messages.push({ role: 'assistant', content: response.text });
      output.write(`kryptic> ${response.text}\n`);
    }
  } finally {
    rl.close();
  }
}
