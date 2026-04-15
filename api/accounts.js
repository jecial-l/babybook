module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  const dbId  = '0b3c1417-97f3-41ae-8dd4-abe69ab3419f';
  if (!token) return res.status(500).json({ message: 'NOTION_TOKEN 未設定' });

  // GET: 讀取帳戶
  if (req.method === 'GET') {
    try {
      const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_size: 20 })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ message: data.message });
      const items = (data.results || []).map(p => ({
        id:     p.id,
        name:   p.properties['帳戶名稱']?.title?.[0]?.plain_text || '',
        type:   p.properties['類型']?.select?.name || '',
        bal:    p.properties['目前餘額']?.number || 0,
        income: p.properties['每月入帳金額']?.number || 0,
        day:    p.properties['入帳日']?.number || 0,
        color:  p.properties['帳戶顏色']?.rich_text?.[0]?.plain_text || '#DEDBD2',
      }));
      return res.status(200).json({ items });
    } catch(e) { return res.status(500).json({ message: e.message }); }
  }

  // POST: 新增帳戶
  if (req.method === 'POST') {
    const { name, type, bal, income, day, color } = req.body;
    try {
      const r = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties: {
            '帳戶名稱':    { title: [{ text: { content: name } }] },
            '類型':        { select: { name: type || '其他' } },
            '目前餘額':    { number: parseFloat(bal) || 0 },
            '每月入帳金額':{ number: parseFloat(income) || 0 },
            '入帳日':      { number: parseFloat(day) || 0 },
            '帳戶顏色':    { rich_text: [{ text: { content: color || '#DEDBD2' } }] },
          }
        })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ message: data.message });
      return res.status(200).json({ ok: true, id: data.id });
    } catch(e) { return res.status(500).json({ message: e.message }); }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};
