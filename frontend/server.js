const http = require('http');
const path = require('path');
const fs = require('fs');

const frontendRoot = __dirname;
const port = Number(process.env.PORT) || 3000;
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((request, response) => {
    const requestedPath = decodeURIComponent(request.url.split('?')[0]);
    if (requestedPath === '/') {
        response.writeHead(302, { Location: '/src/pages/index.html' });
        response.end();
        return;
    }

    const relativePath = requestedPath;
    const filePath = path.resolve(frontendRoot, `.${relativePath}`);

    if (!filePath.startsWith(frontendRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Archivo no encontrado');
        return;
    }

    response.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
    console.log(`Frontend disponible en http://localhost:${port}`);
});