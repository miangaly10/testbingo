const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'save-data.json');

// Helper – read persisted data
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch { /* ignore corrupt file */ }
  return {};
}

// Helper – write persisted data
function writeData(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
}

// Helper – read full request body
function body(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => (buf += c));
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);

    // ── API: GET saved data for a key ──
    if (req.method === 'GET' && urlPath.startsWith('/api/data/')) {
      const key = urlPath.slice('/api/data/'.length);
      const store = readData();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ key, value: store[key] ?? null }));
      return;
    }

    // ── API: POST save data for a key ──
    if (req.method === 'POST' && urlPath.startsWith('/api/data/')) {
      const key = urlPath.slice('/api/data/'.length);
      const raw = await body(req);
      const { value } = JSON.parse(raw);
      const store = readData();
      store[key] = value;
      writeData(store);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // ── Static files ──
    let requestPath = urlPath;
    if (requestPath === '/' || requestPath === '') requestPath = '/index.html';

    const filePath = path.join(__dirname, requestPath);
    if (!filePath.startsWith(__dirname)) {
      res.statusCode = 400;
      res.end('Bad request');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mime = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      res.end(data);
    });
  } catch (e) {
    res.statusCode = 500;
    res.end('Server error');
  }
});

server.listen(port, () => console.log(`Server running at http://localhost:${port}/`));

module.exports = server;
