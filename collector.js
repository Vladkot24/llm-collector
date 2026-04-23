import express from 'express';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
app.use(express.json({ limit: '1mb' }));

const API_KEY = process.env.API_KEY || 'change-me-123';

// Проверка что сервер живой
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Сюда отправляем запросы
app.post('/collect', (req, res) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = {
    id: crypto.randomUUID(),
    captured_at: new Date().toISOString(),
    ...req.body
  };

  // Каждый запрос = одна строка в файле
  fs.appendFileSync('requests.jsonl', JSON.stringify(payload) + '\n');
  console.log('Captured:', payload.id);

  res.json({ ok: true, id: payload.id });
});

// Посмотреть что накопилось
app.get('/requests', (req, res) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!fs.existsSync('requests.jsonl')) {
    return res.json([]);
  }

  const lines = fs.readFileSync('requests.jsonl', 'utf-8')
    .split('\n').filter(Boolean).map(JSON.parse);

  res.json({ count: lines.length, requests: lines });
});

app.listen(3000, () => console.log('Collector running'));