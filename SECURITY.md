# 🔒 VERIDD Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in VERIDD, please **do NOT** open a public issue.

Contact the team privately via:
- **Email**: veridd-security@googlegroups.com
- **GitHub**: Create a private advisory at https://github.com/xi-kki/veridd/security/advisories

## ⚠️ Known Security Practices

### 1. Never Hardcode Secrets
All API keys, tokens, and private keys **must** be loaded from environment variables or a secret manager.

**Bad:**
```js
const TOKEN = 'vcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // ❌
```

**Good:**
```js
const TOKEN = process.env.VERCEL_TOKEN; // ✅
if (!TOKEN) throw new Error('VERCEL_TOKEN not set');
```

### 2. Use .env Files (Never Commit)
- `.env` is in `.gitignore` — use `.env.example` as a template
- Never commit real API keys, wallet private keys, or RPC URLs with credentials

### 3. Sanitize Console Logs
- Never log: private keys, API tokens, passwords, mnemonics
- Use structured logging with redaction for production

### 4. Input Validation
- All contract inputs validated before sending transactions
- API responses are parsed with try/catch to prevent JSON.parse crashes
- User inputs validated for length and content

### 5. XSS Prevention
- Avoid `dangerouslySetInnerHTML` where possible
- When SVG/HTML icons are necessary, use strict allowlists
- Sanitize user-generated content before rendering

## Security Checklist Before Deploy

- [ ] All hardcoded secrets removed from source code
- [ ] `.env` files in `.gitignore`
- [ ] API tokens loaded from environment variables
- [ ] Console.log statements reviewed (no sensitive data)
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] Git history scanned for secrets (`gitleaks detect --source=.`)
- [ ] Smart contracts audited for common vulnerabilities
- [ ] Input validation on all user-facing forms
