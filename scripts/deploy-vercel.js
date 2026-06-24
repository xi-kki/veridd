#!/usr/bin/env node
/**
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *
 *   CRITICAL: NEVER hardcode API tokens in this file!
 *
 *   Use environment variables instead:
 *     export VERCEL_TOKEN="your-token-here"
 *     node scripts/deploy-vercel.js
 *
 *   The token was previously hardcoded here. This is a
 *   SECURITY ISSUE — rotate any leaked tokens immediately.
 *
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *
 * Deploy frontend/dist to Vercel programmatically.
 *
 * Usage:
 *   VERCEL_TOKEN=<your-token> node scripts/deploy-vercel.js
 *
 * Environment:
 *   VERCEL_TOKEN  - Required. Vercel API deployment token.
 *   VERCEL_TEAM   - Optional. Vercel team ID if using team account.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ───── Security: Read token from environment ONLY ─────
const TOKEN = process.env.VERCEL_TOKEN;
if (!TOKEN) {
  console.error('');
  console.error('❌ VERCEL_TOKEN environment variable is required.');
  console.error('');
  console.error('   Usage:');
  console.error('     export VERCEL_TOKEN="your-vercel-api-token"');
  console.error('     node scripts/deploy-vercel.js');
  console.error('');
  console.error('   Get a token: https://vercel.com/account/tokens');
  console.error('');
  process.exit(1);
}

const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const PROJECT_NAME = 'veridd';

// ───── Validate dist directory ─────
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ dist/ directory not found. Run `npm run build` first.');
  process.exit(1);
}

// ───── Read all files recursively from dist ─────
function getAllFiles(dir, baseDir = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      files.push({ fullPath, relativePath });
    }
  }
  return files;
}

const allFiles = getAllFiles(DIST_DIR);
console.log(`📦 Found ${allFiles.length} files in dist/`);

// ───── Determine binary files ─────
const binaryExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp',
  '.woff', '.woff2', '.eot', '.ttf', '.otf', '.svg',
]);

function isBinary(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.has(ext);
}

// ───── Build Vercel API payload ─────
const filesPayload = allFiles.map(({ fullPath, relativePath }) => {
  const binary = isBinary(fullPath);
  const content = fs.readFileSync(fullPath);
  return {
    file: relativePath,
    data: binary ? content.toString('base64') : content.toString('utf-8'),
    encoding: binary ? 'base64' : undefined,
  };
});

const payload = JSON.stringify({
  name: PROJECT_NAME,
  files: filesPayload,
  projectSettings: {
    framework: null,
    buildCommand: null,
    outputDirectory: '.',
    installCommand: 'echo skip',
    devCommand: null,
  },
  target: 'production',
});

console.log(`📤 Payload size: ${(payload.length / 1024 / 1024).toFixed(2)} MB`);
console.log('🚀 Sending to Vercel API...');

// ───── Make API call ─────
const postData = payload;
const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: '/v13/deployments',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('');
        console.log('✅ Deployment created!');
        console.log(`   URL: https://${result.url}`);
        console.log(`   Project: ${result.name}`);
        console.log(`   State: ${result.readyState || 'ready'}`);
        if (result.alias) {
          console.log(`   Aliases: ${result.alias.join(', ')}`);
        }
        console.log('');
      } else {
        console.log(`❌ Error (${res.statusCode}):`, JSON.stringify(result, null, 2));
      }
    } catch (e) {
      console.log(`❌ Raw response (${res.statusCode}):`, responseData.slice(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();
