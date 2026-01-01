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
      redirect: 'manual' // Don't follow redirects automatically
    });

    // Check if it's a redirect
    if (response.status >= 300 && response.status < 400) {
      // Get the redirect URL
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        // If it's a redirect to an image URL, fetch that directly
        if (redirectUrl.startsWith('https://') && (redirectUrl.endsWith('.jpeg') || redirectUrl.endsWith('.jpg') || redirectUrl.endsWith('.png') || redirectUrl.endsWith('.gif'))) {
          try {
            const imageResponse = await fetch(redirectUrl, {
              method: 'GET',
              headers: {
                'Accept': 'image/*'
              },
              redirect: 'follow',
              follow: 5
            });
            
            if (imageResponse.ok && imageResponse.headers.get('content-type')?.startsWith('image/')) {
              // Set the response status code and headers
              res.status(imageResponse.status);
              res.setHeader('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg');
              
              // Return the image data
              const buffer = Buffer.from(await imageResponse.arrayBuffer());
              return res.send(buffer);
            }
          } catch (imageError) {
            console.error('Error fetching redirected image:', imageError);
          }
        }
      }
    }

    // If it's not a redirect or redirect failed, set the response status code
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
      
      // If we get an authentication error, try to use a default image
      if (data.code === 1001 && data.message === 'Authentication failed') {
        // Use the default image URL from the redirect location
        const defaultImageUrl = 'https://lf-cdn.trae.ai/obj/trae-ai-image-sg/page_image/default.jpeg';
        try {
          const defaultImageResponse = await fetch(defaultImageUrl, {
            method: 'GET',
            headers: {
              'Accept': 'image/*'
            }
          });
          
          if (defaultImageResponse.ok) {
            res.status(defaultImageResponse.status);
            res.setHeader('Content-Type', defaultImageResponse.headers.get('content-type') || 'image/jpeg');
            const buffer = Buffer.from(await defaultImageResponse.arrayBuffer());
            return res.send(buffer);
          }
        } catch (defaultImageError) {
          console.error('Error fetching default image:', defaultImageError);
        }
      }
      
      return res.json(data);
    } else {
      // For other types, return the text
      const text = await response.text();
      return res.send(text);
    }
  } catch (error) {
    console.error('Trae API proxy error:', error);
    
    // If we get an error, try to use a default image
    try {
      const defaultImageUrl = 'https://lf-cdn.trae.ai/obj/trae-ai-image-sg/page_image/default.jpeg';
      const defaultImageResponse = await fetch(defaultImageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (defaultImageResponse.ok) {
        res.status(defaultImageResponse.status);
        res.setHeader('Content-Type', defaultImageResponse.headers.get('content-type') || 'image/jpeg');
        const buffer = Buffer.from(await defaultImageResponse.arrayBuffer());
        return res.send(buffer);
      }
    } catch (defaultImageError) {
      console.error('Error fetching default image:', defaultImageError);
    }
    
    return res.status(500).json({
      error: 'PROXY_ERROR',
      message: error.message || 'Unknown error occurred'
    });
  }
}
