const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Received request', req.method, req.url);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify({ message: 'Test server is working!' }));
});

server.listen(5001, () => {
  console.log('Test server running at http://localhost:5001/');
});
