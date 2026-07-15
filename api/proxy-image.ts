export default async function handler(req: any, res: any) {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('URL is required');
    }
    const response = await fetch(imageUrl, {
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
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).send('Failed to proxy image');
  }
}
