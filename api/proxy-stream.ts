export default async function handler(req: any, res: any) {
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
    const response = await fetch(streamUrl, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch stream: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
}
