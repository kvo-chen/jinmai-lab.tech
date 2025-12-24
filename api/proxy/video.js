// api/proxy/video.js - Vercel serverless function for video proxy

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract the video URL from query parameters
    const url = new URL(req.url, `http://localhost:3000`);
    const videoUrl = url.searchParams.get('url') || '';

    // Validate the video URL
    if (!videoUrl) {
      return res.status(400).json({
        error: 'URL_NOT_PROVIDED',
        message: 'Video URL is required'
      });
    }

    // Check if the URL is from an allowed domain
    const allowedDomains = ['volces.com', 'tos-cn-beijing'];
    const isAllowed = allowedDomains.some(domain => videoUrl.includes(domain));

    if (!isAllowed) {
      return res.status(400).json({
        error: 'URL_NOT_ALLOWED',
        message: 'Video URL is not from an allowed domain'
      });
    }

    // Forward the request to the video URL
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'video/*, */*'
      }
    });

    // Set the response status code
    res.status(response.status);

    // Set the content type from the response
    const contentType = response.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);

    // Set other important headers for video streaming
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) {
      res.setHeader('Accept-Ranges', acceptRanges);
    }

    // Return the video binary data
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error('Video proxy error:', error);
    return res.status(500).json({
      error: 'VIDEO_PROXY_ERROR',
      message: error.message || 'Failed to proxy video'
    });
  }
}
