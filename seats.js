const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  const all = await kv.hgetall('reservations');
  const taken = all ? Object.keys(all) : [];
  res.status(200).json({ taken });
};
