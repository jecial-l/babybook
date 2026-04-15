module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ message: 'NOTION_TOKEN 未設定' });

  const { pageId } = req.body || {};
  if (!pageId) return res.status(400).json({ message: '缺少 pageId' });

  try {
    const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archived: true }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ message: data.message || '刪除失敗' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
