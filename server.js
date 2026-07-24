const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.get('/api/tasks', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')));
    }
    res.json({ myTasks: [], herTasks: [], schema: 6,
      viewWeekStart: null, targetDay: null, herViewDate: null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const data = req.body;
    if (typeof data.myTasks === 'undefined') data.myTasks = [];
    if (typeof data.herTasks === 'undefined') data.herTasks = [];
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DATA_FILE);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '我的任务看板.html'));
});

app.listen(PORT, () => console.log(`✅ 任务看板运行在端口 ${PORT}`));
