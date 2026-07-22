import express from 'express';

const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/api/ai-proxy', async (req, res) => {
  try {
    const { url, options } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Missing 'url' in request body." });
    }

    const fetchOptions: RequestInit = {
      method: options?.method || 'POST',
      headers: options?.headers || {},
    };

    if (options?.body) {
      fetchOptions.body = typeof options.body === 'object' ? JSON.stringify(options.body) : options.body;
    }

    console.log(`Proxying request to: ${url}`);
    const response = await fetch(url, fetchOptions);

    const contentType = response.headers.get('content-type') || '';
    const status = response.status;

    res.status(status);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (err: any) {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: err.message || 'Error occurred in proxy server' });
  }
});

export default app;
