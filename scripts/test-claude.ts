import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

async function run() {
  console.log('API key:', process.env.ANTHROPIC_API_KEY?.slice(0, 20) + '…');
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 64,
    messages: [{ role: 'user', content: 'Hi' }],
  });
  console.log('Reply:', (msg.content[0] as { text: string }).text);
}

run().catch((e) => { console.error(e.message); process.exit(1); });
