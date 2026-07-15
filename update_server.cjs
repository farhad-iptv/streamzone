const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("app.get('/api/proxy-image', async (req, res) => {", `app.all('/api/proxy-image', async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }`);

code = code.replace("app.get('/api/proxy-stream', async (req, res) => {", `app.all('/api/proxy-stream', async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }`);

code = code.replace(/const response = await fetch\(imageUrl, \{\s*headers: \{/g, `const response = await fetch(imageUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: {`);

code = code.replace(/const response = await fetch\(streamUrl, \{ headers \}\);/g, `const response = await fetch(streamUrl, { 
        headers,
        method: req.method === 'HEAD' ? 'HEAD' : 'GET'
      });`);

code = code.replace(/const buffer = await response\.arrayBuffer\(\);\s*res\.send\(Buffer\.from\(buffer\)\);/g, `if (req.method === 'HEAD') {
        return res.status(200).end();
      }
      
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));`);

code = code.replace(/if \(streamUrl\.includes\('\.m3u8'\) \|\| \(contentType && contentType\.includes\('mpegurl'\)\)\) \{/g, `if (req.method === 'HEAD') {
        return res.status(200).end();
      }

      if (streamUrl.includes('.m3u8') || (contentType && contentType.includes('mpegurl'))) {`);

code = code.replace(/res\.setHeader\('Access-Control-Allow-Origin', '\*'\);\s*res\.setHeader\('Access-Control-Allow-Methods', 'GET, OPTIONS'\);\s*res\.setHeader\('Access-Control-Allow-Headers', 'Content-Type, Authorization'\);/g, '');

fs.writeFileSync('server.ts', code);
