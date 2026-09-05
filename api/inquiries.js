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
  if (req.method === 'POST') {
    const { name, message } = req.body || {};
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'NAME_REQUIRED' });
      return;
    }
    if (!message || !String(message).trim()) {
      res.status(400).json({ error: 'MESSAGE_REQUIRED' });
      return;
    }

    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const entry = {
      id,
      name: String(name).trim().slice(0, 20),
      message: String(message).trim().slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    await kv.hset('inquiries', { [id]: JSON.stringify(entry) });

    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'GET') {
    if (!checkAuth(req, res)) return;

    const all = await kv.hgetall('inquiries');
    const list = all ? Object.values(all) : [];
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ count: list.length, inquiries: list });
    return;
  }

  if (req.method === 'DELETE') {
    if (!checkAuth(req, res)) return;

    const id = req.query.id;
    if (!id) {
      res.status(400).json({ error: 'ID_REQUIRED' });
      return;
    }
    await kv.hdel('inquiries', id);
    res.status(200).json({ deleted: id });
    return;
  }

  res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
};
