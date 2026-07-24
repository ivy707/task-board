const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'taskboard';
const COLLECTION = 'state';
const DOC_ID = 'main';

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

let db = null;
let stateCollection = null;

async function connect() {
  if (!MONGODB_URI) {
    console.error('❌ 缺少 MONGODB_URI 环境变量');
    process.exit(1);
  }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    stateCollection = db.collection(COLLECTION);
    console.log('✅ 已连接 MongoDB');
  } catch (e) {
    console.error('❌ MongoDB 连接失败:', e.message);
    process.exit(1);
  }
}

function normalizeState(data) {
  return {
    _id: DOC_ID,
    schema: data.schema ?? 6,
    viewWeekStart: data.viewWeekStart ?? null,
    targetDay: data.targetDay ?? null,
    herViewDate: data.herViewDate ?? null,
    myTasks: Array.isArray(data.myTasks) ? data.myTasks : [],
    herTasks: Array.isArray(data.herTasks) ? data.herTasks : [],
    updatedAt: new Date().toISOString()
  };
}

app.get('/api/tasks', async (req, res) => {
  try {
    const doc = await stateCollection.findOne({ _id: DOC_ID });
    if (!doc) {
      return res.json({ myTasks: [], herTasks: [], schema: 6,
        viewWeekStart: null, targetDay: null, herViewDate: null });
    }
    const { _id, updatedAt, ...rest } = doc;
    res.json(rest);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const data = req.body;
    const state = normalizeState(data);
    await stateCollection.replaceOne({ _id: DOC_ID }, state, { upsert: true });
    res.json({ ok: true, savedAt: state.updatedAt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ping', (req, res) => res.json({ ok: true, db: !!stateCollection }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '我的任务看板.html'));
});

connect().then(() => {
  app.listen(PORT, () => console.log(`✅ 任务看板运行在端口 ${PORT}`));
});
