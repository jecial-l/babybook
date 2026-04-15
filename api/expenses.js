module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const token = process.env.NOTION_TOKEN;
  const dbId  = '90247eaf-52f1-4e5b-ad8c-ccfeb554a66a';
  if (!token) return res.status(500).json({ message: 'NOTION_TOKEN 未設定' });

  const { action, name, amount, category, store, date, account, note, age } = req.body || {};

  // action='query' => 讀取列表
  if (action === 'query') {
    try {
      const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ sorts: [{ property: '日期', direction: 'descending' }], page_size: 100 })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ message: data.message || '讀取失敗' });
      const items = (data.results || []).map(p => ({
        id:       p.id,
        name:     p.properties['品項名稱']?.title?.[0]?.plain_text || '',
        amount:   p.properties['金額']?.number || 0,
        category: p.properties['分類']?.select?.name || '其他',
        store:    p.properties['店家']?.rich_text?.[0]?.plain_text || '',
        date:     p.properties['日期']?.date?.start || '',
        account:  p.properties['付款帳戶']?.rich_text?.[0]?.plain_text || '',
        note:     p.properties['備註']?.rich_text?.[0]?.plain_text || '',
      }));
      return res.status(200).json({ items });
    } catch(e) { return res.status(500).json({ message: e.message }); }
  }

  // action='create' => 新增支出
  if (action === 'create') {
    try {
      const r = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties: {
            '品項名稱': { title: [{ text: { content: name || category || '支出' } }] },
            '金額':     { number: parseFloat(amount) || 0 },
            '分類':     { select: { name: category || '其他' } },
            '店家':     { rich_text: [{ text: { content: store || '' } }] },
            '日期':     { date: { start: date || new Date().toISOString().split('T')[0] } },
            '付款帳戶': { rich_text: [{ text: { content: account || '' } }] },
            '寶寶月齡': { number: parseInt(age) || 0 },
            '備註':     { rich_text: [{ text: { content: note || '' } }] },
            '已同步':   { checkbox: true },
          }
        })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ message: data.message || '新增失敗' });
      return res.status(200).json({ ok: true, id: data.id });
    } catch(e) { return res.status(500).json({ message: e.message }); }
  }

  return res.status(400).json({ message: '缺少 action 參數（query 或 create）' });
};
