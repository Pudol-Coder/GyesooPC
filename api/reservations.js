const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const adminKey = process.env.ADMIN_KEY;
  const provided = req.query.key;
  if (adminKey && provided !== adminKey) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const all = await kv.hgetall('reservations');
  const list = all ? Object.values(all).map((v) => JSON.parse(v)) : [];
  list.sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  res.status(200).json({ count: list.length, reservations: list });
};
