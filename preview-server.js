import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 处理SPA路由，将所有路由重定向到index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`预览服务器运行在 http://localhost:${PORT}`);
  console.log('PWA应用已准备好测试');
  console.log('按 Ctrl+C 停止服务器');
});