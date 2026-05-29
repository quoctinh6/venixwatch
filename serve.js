const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  // Decode URL path to support Unicode characters in filenames
  let decodedUrl = decodeURIComponent(req.url);
  // Remove query parameters
  const qIndex = decodedUrl.indexOf('?');
  if (qIndex !== -1) {
    decodedUrl = decodedUrl.substring(0, qIndex);
  }

  let filePath = '.' + decodedUrl;
  
  // Serve index.html by default for root or frontend directory paths
  if (filePath === './' || filePath === './frontend' || filePath === './frontend/') {
    filePath = './frontend/index.html';
  }

  // Serve admin.html for admin panel routes
  if (filePath === './admin' || filePath === './admin/' || filePath === './admin/index.html') {
    filePath = './frontend/admin.html';
  }

  // Prevent directory traversal
  const resolvedPath = path.resolve(filePath);
  const rootPath = path.resolve('.');
  if (!resolvedPath.startsWith(rootPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // SPA Fallback for client-side routing:
        // If the path doesn't have an extension (meaning it's likely a route)
        // and doesn't start with /backend, serve index.html
        if (!extname && !decodedUrl.startsWith('/backend')) {
          fs.readFile('./frontend/index.html', (err, indexContent) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading index.html');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexContent, 'utf-8');
            }
          });
        } else {
          res.writeHead(404);
          res.end('File not found');
        }
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/frontend/`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
