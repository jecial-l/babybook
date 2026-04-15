export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ message: 'NOTION_TOKEN 環境變數未設定，請到 Vercel Settings → Environment Variables 新增' });

  const { dbId } = req.body;
  if (!dbId) return res.status(400).json({ message: '缺少 dbId' });

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ message: data.message || 'Token 無效或資料庫未授權' });
    return res.status(200).json({ ok: true, title: data.title?.[0]?.plain_text || '寶寶帳本' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
