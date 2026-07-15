import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route for image proxy
  app.all('/api/proxy-image', async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).send('URL is required');
      }

      const response = await fetch(imageUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': new URL(imageUrl).origin,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      if (req.method === 'HEAD') {
        return res.status(200).end();
      }
      
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).send('Failed to proxy image');
    }
  });

  // API route for stream proxy
  app.all('/api/proxy-stream', async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
    try {
      const streamUrl = req.query.url as string;
      if (!streamUrl) {
        return res.status(400).send('URL is required');
      }

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': new URL(streamUrl).origin,
        'Referer': new URL(streamUrl).origin + '/',
      };

      if (req.query.headers) {
        try {
          const customHeaders = JSON.parse(req.query.headers as string);
          Object.assign(headers, customHeaders);
        } catch (e) {
          console.error('Failed to parse custom headers', e);
        }
      }

      const response = await fetch(streamUrl, { 
        headers,
        method: req.method === 'HEAD' ? 'HEAD' : 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stream: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      // Allow CORS
      

      if (req.method === 'HEAD') {
        return res.status(200).end();
      }

      if (streamUrl.includes('.m3u8') || (contentType && contentType.includes('mpegurl'))) {
        let text = await response.text();
        
        const headersQuery = req.query.headers ? `&headers=${encodeURIComponent(req.query.headers as string)}` : '';

        // Rewrite URIs in the playlist to use the proxy
        const rewrittenText = text.split('\n').map(line => {
          line = line.trim();
          if (!line) return line;
          
          if (line.startsWith('#EXT-X-KEY:')) {
            // e.g. #EXT-X-KEY:METHOD=AES-128,URI="key.php"
            return line.replace(/URI="([^"]+)"/, (match, uri) => {
              const absoluteUri = new URL(uri, streamUrl).toString();
              return `URI="/api/proxy-stream?url=${encodeURIComponent(absoluteUri)}${headersQuery}"`;
            });
          }
          
          if (line.startsWith('#')) return line;
          
          // It's a segment or playlist URI
          const absoluteUri = new URL(line, streamUrl).toString();
          return `/api/proxy-stream?url=${encodeURIComponent(absoluteUri)}${headersQuery}`;
        }).join('\n');
        
        res.send(rewrittenText);
      } else {
        // Stream the response for TS segments or other files
        if (response.body) {
           const arrayBuffer = await response.arrayBuffer();
           res.send(Buffer.from(arrayBuffer));
        } else {
           res.status(500).send('Empty body');
        }
      }
    } catch (error) {
      console.error('Stream proxy error:', error);
      res.status(500).send('Failed to proxy stream');
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
