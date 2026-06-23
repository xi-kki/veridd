#!/usr/bin/env node
/**
 * Quick Grok API test — verify the key works
 * Usage: node test-grok.js
 * Env:   GROK_KEY (or pass as arg: node test-grok.js <key>)
 */

const https = require('https');

const apiKey = process.argv[2] || process.env.GROK_KEY;
if (!apiKey) {
  console.error('Usage: node test-grok.js <api-key>');
  console.error('  or:  GROK_KEY=<key> node test-grok.js');
  process.exit(1);
}

const data = JSON.stringify({
  model: 'grok-2-latest',
  max_tokens: 100,
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Say "VERIDD Grok API works!" and nothing else.' },
  ],
});

const req = https.request(
  {
    hostname: 'api.x.ai',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.choices && json.choices[0]?.message?.content) {
          console.log('✅ Grok API works!');
          console.log('Response:', json.choices[0].message.content);
          console.log('Model:', json.model);
          console.log('Usage:', JSON.stringify(json.usage));
        } else {
          console.error('❌ Grok API error:', JSON.stringify(json).slice(0, 200));
        }
      } catch (e) {
        console.error('❌ Parse error:', body.slice(0, 200));
      }
    });
  },
);

req.on('error', (err) => console.error('❌ Network error:', err.message));
req.write(data);
req.end();
