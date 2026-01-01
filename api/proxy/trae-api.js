// api/proxy/trae-api.js - Vercel serverless function for Trae API proxy

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
    const path = url.pathname.replace('/api/proxy/trae-api', '');
    const queryString = url.search;
    const remoteUrl = `https://trae-api-sg.mchost.guru${path}${queryString}`;

    // Forward the request to the Trae API
    const response = await fetch(remoteUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json, image/*, text/html, */*',
        ...(req.method !== 'GET' && req.headers['content-type'] && {
          'Content-Type': req.headers['content-type']
        })
      },
      ...(req.method !== 'GET' && req.body && {
        body: req.body
      }),
      redirect: 'follow', // Follow redirects
      follow: 10 // Maximum 10 redirects
    });

    // Set the response status code
    res.status(response.status);

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Return the appropriate response based on content type
    if (contentType.startsWith('image/')) {
      // For images, return the raw binary data
      const buffer = Buffer.from(await response.arrayBuffer());
      return res.send(buffer);
    } else if (contentType.startsWith('application/json')) {
      // For JSON, return the parsed JSON
      const data = await response.json();
      return res.json(data);
    } else {
      // For other types, return the text
      const text = await response.text();
      return res.send(text);
    }
  } catch (error) {
    console.error('Trae API proxy error:', error);
    return res.status(500).json({
      error: 'PROXY_ERROR',
      message: error.message || 'Unknown error occurred'
    });
  }
}
