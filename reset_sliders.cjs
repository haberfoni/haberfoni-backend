const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({ host: 'localhost', user: 'haberfoni_user', password: 'userpassword', database: 'haberfoni' });

  const [delRes] = await c.execute("DELETE FROM headlines WHERE news_id IN (SELECT id FROM news WHERE title LIKE '%abonelik%')");
  console.log('Deleted Abonelik dummy news from headlines:', delRes.affectedRows);

  const [m2Del] = await c.execute("DELETE FROM headlines WHERE type = 2 AND news_id IN (SELECT id FROM news WHERE image_url IS NULL OR image_url = '')");
  console.log('Removed imageless news from Manset 2:', m2Del.affectedRows);

  const [res] = await c.execute("SELECT h.id, n.title, n.image_url, h.type FROM headlines h JOIN news n ON h.news_id = n.id WHERE h.type = 2 LIMIT 10");
  console.log('Remaining Manset 2 News:', JSON.stringify(res, null, 2));

  await c.end();
}

run().catch(console.error);
