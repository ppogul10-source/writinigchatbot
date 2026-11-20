module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { prompt } = req.body || {};
  if (!prompt || prompt.length > 8000) return res.status(400).json({ error: 'bad_request' });

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
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (r.status === 429) return res.status(429).json({ error: 'rate_limited' });
    if (!r.ok) {
      const detail = await r.text();
      console.error('Anthropic API error', r.status, detail);
      return res.status(500).json({ error: 'api_error' });
    }

    const data = await r.json();
    // 대답에는 '생각' 블록 등 여러 조각이 올 수 있어서, 글(text) 조각만 모아요
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    if (!text) {
      console.error('Empty answer', data.stop_reason, JSON.stringify(data.content).slice(0, 500));
      return res.status(500).json({ error: 'empty_answer' });
    }
    res.status(200).json({ text });
  } catch (e) {
    console.error('Server error', e);
    res.status(500).json({ error: 'server_error' });
  }
};
