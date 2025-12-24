// api/proxy/unsplash.js - Vercel serverless function for Unsplash proxy

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract the path from the URL
    const url = new URL(req.url, `http://localhost:3000`);
    const path = url.pathname.replace('/api/proxy/unsplash', '');
    const queryString = url.search;
    const remoteUrl = `https://images.unsplash.com${path}${queryString}`;

    // Forward the request to Unsplash
    const response = await fetch(remoteUrl, {
      method: req.method,
      headers: {
        'Accept': 'image/*, */*',
        'User-Agent': req.headers['user-agent'] || '',
        ...(req.method !== 'GET' && req.headers['content-type'] && {
          'Content-Type': req.headers['content-type']
        })
      },
      ...(req.method !== 'GET' && req.body && {
        body: req.body
      })
    });

    // Set the response status code
    res.status(response.status);

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    // Return the image binary data
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error('Unsplash proxy error:', error);
    return res.status(500).json({
      error: 'UNSPLASH_PROXY_ERROR',
      message: error.message || 'Failed to proxy Unsplash image'
    });
  }
}
