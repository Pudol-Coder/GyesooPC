const { kv } = require('@vercel/kv');

function checkAuth(req, res) {
  const adminKey = process.env.ADMIN_KEY;
  const provided = req.headers['x-admin-key'];
  if (adminKey && provided !== adminKey) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    if (!checkAuth(req, res)) return;

    const all = await kv.hgetall('reservations');
    const list = all ? Object.values(all) : [];
    list.sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

    res.status(200).json({ count: list.length, reservations: list });
    return;
  }

  if (req.method === 'DELETE') {
    if (!checkAuth(req, res)) return;

    const seat = req.query.seat;
    if (!seat) {
      res.status(400).json({ error: 'SEAT_REQUIRED' });
      return;
    }

    const existing = await kv.hget('reservations', seat);
    if (!existing) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    await kv.hdel('reservations', seat);
    res.status(200).json({ deleted: seat });
    return;
  }

  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
};
