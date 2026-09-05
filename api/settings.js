const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const open = await kv.get('reservationOpen');
    res.status(200).json({ open: open === false ? false : true });
    return;
  }

  if (req.method === 'POST') {
    const adminKey = process.env.ADMIN_KEY;
    const provided = req.headers['x-admin-key'];
    if (adminKey && provided !== adminKey) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    const { open } = req.body || {};
    await kv.set('reservationOpen', open === false ? false : true);
    res.status(200).json({ open: open === false ? false : true });
    return;
  }

  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
};
