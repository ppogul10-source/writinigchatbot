module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { prompt } = req.body || {};
  if (!prompt || prompt.length > 4000) return res.status(400).json({ error: 'bad_request' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-5-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (r.status === 429) return res.status(429).json({ error: 'rate_limited' });
    if (!r.ok) return res.status(500).json({ error: 'api_error' });
    const data = await r.json();
    res.status(200).json({ text: (data.content && data.content[0] && data.content[0].text) || '' });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
};
