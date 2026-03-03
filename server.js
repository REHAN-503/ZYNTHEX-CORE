
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const __root = __dirname;
const QUESTIONS_FILE = path.join(__root, 'data', 'questions', 'questions.json');
const USERS_FILE = path.join(__root, 'data', 'users', 'users.json');
const FRONTEND_DIR = path.join(__root, 'frontend');

let engine = null;
try {
  engine = require('./build/Release/zynthex_engine');
  console.log('  ✓ C++ engine loaded — using native XP & scoring module');
} catch (e) {
  console.warn('  ⚠ C++ engine not found — falling back to pure-JS logic');
  console.warn('    Run `npm run build` to compile the addon.');
}


function genId() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return null; }
}

function saveJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 1e6) { raw = '{}'; req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}


const LEVEL_XP = [0, 200, 500, 1000, 1800, 3000, 5000, 8000, 12000, 18000, 25000];
const DIFF_XP = { Beginner: 15, Easy: 30, Intermediate: 60, Advanced: 120, Expert: 200 };

function getLevel(xp) {
  let lvl = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) lvl = i + 1; else break;
  }
  return Math.min(lvl, LEVEL_XP.length);
}

function nextLevelXP(xp) {
  const lvl = getLevel(xp);
  return LEVEL_XP[lvl] ?? LEVEL_XP[LEVEL_XP.length - 1];
}

function prevLevelXP(xp) {
  const lvl = getLevel(xp);
  return LEVEL_XP[lvl - 1] ?? 0;
}


function loadUsers() { return loadJSON(USERS_FILE) || {}; }
function saveUsers(users) { saveJSON(USERS_FILE, users); }

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'zynthex_salt_v1').digest('hex');
}

function makeUser(name, email) {
  return {
    id: crypto.randomBytes(6).toString('hex'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: null,
    xp: 0, level: 1,
    answeredQuestions: {},
    analytics: {},
    certificates: [],
    createdAt: new Date().toISOString(),
  };
}

function getOrCreateUser(name) {
  const users = loadUsers();
  const userId = name.trim().toLowerCase().replace(/\s+/g, '_');
  if (!users[userId]) {
    users[userId] = {
      id: userId, name: name.trim(),
      xp: 0, level: 1,
      answeredQuestions: {},
      analytics: {},
      certificates: [],
      createdAt: new Date().toISOString()
    };
    saveUsers(users);
  }
  return { users, userId };
}


let _questions = null;
function questions() {
  if (!_questions) _questions = loadJSON(QUESTIONS_FILE) || [];
  return _questions;
}


const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};


const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
  res.end(body);
}

function staticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const buf = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(buf);
  } catch {
    const index = path.join(FRONTEND_DIR, 'index.html');
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(index));
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  }
}


async function router(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  const u = new URL(req.url, `http://localhost`);
  const route = req.method + ' ' + u.pathname;
  const p = u.searchParams;

  if (route === 'POST /api/register') {
    const body = await readBody(req);
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const pw = (body.password || '');

    if (!name) return json(res, { error: 'Name is required' }, 400);
    if (!email || !email.includes('@'))
      return json(res, { error: 'Valid email is required' }, 400);
    if (pw.length < 6)
      return json(res, { error: 'Password must be at least 6 characters' }, 400);

    const users = loadUsers();

    const exists = Object.values(users).find(u => u.email === email);
    if (exists) return json(res, { error: 'Email already registered. Please log in.' }, 409);

    const user = makeUser(name, email);
    user.passwordHash = hashPassword(pw);
    users[user.id] = user;
    saveUsers(users);

    if (engine) { try { engine.loadUser(user.id, user.name, 0, 0, 0); } catch { } }

    const safe = {
      userId: user.id, name: user.name, email: user.email,
      xp: 0, level: 1, nextLevelXP: nextLevelXP(0), prevLevelXP: 0, analytics: {}
    };
    return json(res, safe, 201);
  }

  if (route === 'POST /api/login') {
    const body = await readBody(req);
    const email = (body.email || '').trim().toLowerCase();
    const pw = (body.password || '');

    if (!email || !pw)
      return json(res, { error: 'Email and password are required' }, 400);

    const users = loadUsers();
    const user = Object.values(users).find(u => u.email === email);

    if (!user || !user.passwordHash)
      return json(res, { error: 'No account found with that email.' }, 404);

    if (user.passwordHash !== hashPassword(pw))
      return json(res, { error: 'Incorrect password.' }, 401);

    user.level = getLevel(user.xp);

    if (engine) {
      try {
        const al = user.analytics || {};
        const totals = Object.values(al).reduce(
          (acc, v) => ({ t: acc.t + (v.total || 0), c: acc.c + (v.correct || 0) }),
          { t: 0, c: 0 }
        );
        engine.loadUser(user.id, user.name, user.xp, totals.t, totals.c);
      } catch { }
    }

    const safe = {
      userId: user.id, name: user.name, email: user.email,
      xp: user.xp, level: user.level,
      nextLevelXP: nextLevelXP(user.xp), prevLevelXP: prevLevelXP(user.xp),
      analytics: user.analytics
    };
    return json(res, safe);
  }

  if (route === 'POST /api/init') {
    const body = await readBody(req);
    const name = (body.name || '').trim();
    if (!name) return json(res, { error: 'Name is required' }, 400);

    const { users, userId } = getOrCreateUser(name);
    const user = users[userId];
    user.level = getLevel(user.xp);

    return json(res, {
      userId,
      name: user.name,
      xp: user.xp,
      level: user.level,
      nextLevelXP: nextLevelXP(user.xp),
      prevLevelXP: prevLevelXP(user.xp),
      analytics: user.analytics,
    });
  }

  if (route === 'GET /api/questions') {
    let qs = questions().slice();
    const lang = p.get('language');
    const diff = p.get('difficulty');
    const offs = Math.max(0, parseInt(p.get('offset') || '0'));
    const lim = Math.min(50, Math.max(1, parseInt(p.get('limit') || '10')));

    if (lang) qs = qs.filter(q => q.language === lang);
    if (diff) qs = qs.filter(q => q.difficulty === diff);

    const total = qs.length;
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    const batch = qs.slice(offs, offs + lim)
      .map(({ correctAnswer, ...rest }) => rest);   // strip answer

    return json(res, { questions: batch, total, offset: offs, limit: lim });
  }

  if (route === 'GET /api/languages') {
    const map = {};
    questions().forEach(q => {
      if (!map[q.language]) map[q.language] = { language: q.language, difficulties: {}, total: 0 };
      map[q.language].total++;
      map[q.language].difficulties[q.difficulty] = (map[q.language].difficulties[q.difficulty] || 0) + 1;
    });
    return json(res, { languages: Object.values(map) });
  }

  if (route === 'POST /api/submit') {
    const body = await readBody(req);
    const { userId, questionId, answer } = body;

    if (!userId || !questionId || answer === undefined)
      return json(res, { error: 'userId, questionId and answer are required' }, 400);

    const users = loadUsers();
    const user = users[userId];
    if (!user) return json(res, { error: 'User not found — call /api/init first' }, 404);

    const q = questions().find(x => x.id === questionId);
    if (!q) return json(res, { error: 'Question not found' }, 404);

    const isCorrect = String(answer).trim() === String(q.correctAnswer).trim();
    const alreadyAnswered = !!user.answeredQuestions[questionId];
    const xpReward = (q.xpReward || DIFF_XP[q.difficulty] || 15);

    let xpEarned = 0;
    if (!alreadyAnswered) {
      if (engine) {
        try {
          const result = engine.submitAnswer(userId, questionId, answer, isCorrect, xpReward);
          user.xp = result.newXP;
          user.level = result.level;
          xpEarned = isCorrect ? xpReward : 0;
        } catch (engineErr) {
          try {
            const al = user.analytics || {};
            const totals = Object.values(al).reduce((a, v) => ({ t: a.t + (v.total || 0), c: a.c + (v.correct || 0) }), { t: 0, c: 0 });
            engine.loadUser(userId, user.name, user.xp, totals.t, totals.c);
            const result = engine.submitAnswer(userId, questionId, answer, isCorrect, xpReward);
            user.xp = result.newXP;
            user.level = result.level;
            xpEarned = isCorrect ? xpReward : 0;
          } catch { /* fall through to JS fallback */ }
        }
      }
      if (!engine || xpEarned === 0 && isCorrect) {
        xpEarned = isCorrect ? xpReward : 0;
        user.xp += xpEarned;
        user.level = getLevel(user.xp);
      }
    }

    user.answeredQuestions[questionId] = {
      answer,
      correct: isCorrect,
      timestamp: new Date().toISOString(),
    };

    const lang = q.language;
    if (!user.analytics[lang])
      user.analytics[lang] = { correct: 0, total: 0, byDifficulty: {}, byTopic: {} };

    const al = user.analytics[lang];
    if (!alreadyAnswered) {
      al.total++;
      if (isCorrect) al.correct++;

      const bd = al.byDifficulty;
      if (!bd[q.difficulty]) bd[q.difficulty] = { correct: 0, total: 0 };
      bd[q.difficulty].total++;
      if (isCorrect) bd[q.difficulty].correct++;

      const bt = al.byTopic;
      if (!bt[q.topic]) bt[q.topic] = { correct: 0, total: 0 };
      bt[q.topic].total++;
      if (isCorrect) bt[q.topic].correct++;
    }

    saveUsers(users);

    return json(res, {
      correct: isCorrect,
      correctAnswer: q.correctAnswer,
      xpEarned,
      totalXP: user.xp,
      level: user.level,
      nextLevelXP: nextLevelXP(user.xp),
      prevLevelXP: prevLevelXP(user.xp),
    });
  }

  if (route === 'GET /api/analytics') {
    const userId = p.get('userId');
    if (!userId) return json(res, { error: 'userId required' }, 400);

    const users = loadUsers();
    const user = users[userId];
    if (!user) return json(res, { error: 'User not found' }, 404);

    const weakTopics = [];
    Object.entries(user.analytics).forEach(([lang, data]) => {
      Object.entries(data.byTopic || {}).forEach(([topic, stats]) => {
        const acc = stats.total > 0 ? stats.correct / stats.total : 0;
        if (acc < 0.6 && stats.total >= 1)
          weakTopics.push({ language: lang, topic, accuracy: Math.round(acc * 100), total: stats.total });
      });
    });
    weakTopics.sort((a, b) => a.accuracy - b.accuracy);

    return json(res, {
      analytics: user.analytics,
      weakTopics: weakTopics.slice(0, 10),
      xp: user.xp,
      level: user.level,
      totalAnswered: Object.keys(user.answeredQuestions).length,
    });
  }

  if (route === 'GET /api/xp') {
    const userId = p.get('userId');
    const users = loadUsers();
    const user = users[userId];
    if (!user) return json(res, { error: 'User not found' }, 404);

    return json(res, {
      xp: user.xp,
      level: getLevel(user.xp),
      nextLevelXP: nextLevelXP(user.xp),
      prevLevelXP: prevLevelXP(user.xp),
    });
  }

  if (route === 'GET /api/certificate') {
    const userId = p.get('userId');
    const lang = p.get('language');
    if (!userId || !lang) return json(res, { error: 'userId and language required' }, 400);

    const users = loadUsers();
    const user = users[userId];
    if (!user) return json(res, { error: 'User not found' }, 404);

    const al = (user.analytics || {})[lang];
    if (!al || al.total < 5)
      return json(res, { error: `Complete at least 5 questions in ${lang} to earn a certificate` }, 400);

    const accuracy = Math.round((al.correct / al.total) * 100);
    const certId = `ZYNC-${Date.now().toString(36).toUpperCase()}-${genId()}`;
    const cert = {
      id: certId, userId, name: user.name, language: lang,
      accuracy, questionsAnswered: al.total, level: getLevel(user.xp),
      issuedAt: new Date().toISOString(),
    };

    user.certificates = user.certificates || [];
    user.certificates.push(cert);
    saveUsers(users);

    return json(res, cert);
  }

  if (route === 'POST /api/runCode') {
    const body = await readBody(req);
    const { language, code } = body;
    if (!code || !language) return json(res, { error: 'language and code required' }, 400);

    if (language.toLowerCase() === 'javascript') {
      const logs = [];
      try {
        const sandbox = new Function(
          'console', 'Math', 'JSON', 'parseInt', 'parseFloat',
          'String', 'Number', 'Boolean', 'Array', 'Object',
          'Date', 'RegExp', 'Error', 'Map', 'Set', 'Symbol',
          code
        );
        sandbox(
          { log: (...a) => logs.push(a.map(x => (typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x))).join(' ')) },
          Math, JSON, parseInt, parseFloat,
          String, Number, Boolean, Array, Object,
          Date, RegExp, Error, Map, Set, Symbol
        );
        return json(res, { output: logs.join('\n') || '(no output)', error: null, executionTime: '<1ms' });
      } catch (e) {
        return json(res, { output: '', error: e.message, executionTime: '<1ms' });
      }
    }

    return json(res, {
      output: `[Sandbox] ${language} code accepted (${(code || '').length} chars)\nTo enable live ${language} execution, integrate Judge0 or Piston API.\nStatus: ✓ Accepted`,
      error: null,
      executionTime: '~12ms',
    });
  }

  const safePath = path.join(FRONTEND_DIR, u.pathname.replace(/\.\./g, ''));
  if (u.pathname !== '/' && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    return staticFile(res, safePath);
  }

  return staticFile(res, path.join(FRONTEND_DIR, 'index.html'));
}


const server = http.createServer(async (req, res) => {
  try {
    await router(req, res);
  } catch (err) {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  if (engine) {
    const users = loadUsers();
    let count = 0;
    for (const [userId, u] of Object.entries(users)) {
      try {
        const al = u.analytics || {};
        const totals = Object.values(al).reduce(
          (acc, v) => ({ t: acc.t + (v.total || 0), c: acc.c + (v.correct || 0) }),
          { t: 0, c: 0 }
        );
        engine.loadUser(userId, u.name || '', u.xp || 0, totals.t, totals.c);
        count++;
      } catch (e) { /* skip malformed entries */ }
    }
    console.log(`  ✓ C++ engine hydrated: ${count} user(s) loaded from users.json`);
  }

  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║                                           ║');
  console.log('  ║   ◈  ZYNTHEX CORE — Code Intelligence     ║');
  console.log('  ║                                           ║');
  console.log(`  ║   ▶   http://localhost:${PORT}            ║`);
  console.log('  ║                                           ║');
  console.log('  ║   C++ engine active. Press Ctrl+C to stop ║');
  console.log('  ║                                           ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ✗ Port ${PORT} is already in use.`);
    console.error(`  Try: PORT=3001 node server.js\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
