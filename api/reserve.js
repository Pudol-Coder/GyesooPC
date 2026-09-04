const { kv } = require('@vercel/kv');

const VALID_SEATS = new Set();
[6, 6, 6, 6, 6, 4].forEach((count, rIdx) => {
  const row = rIdx + 1;
  for (let col = 1; col <= count; col++) VALID_SEATS.add(`${row}-${col}`);
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const { seat, name, grade } = req.body || {};

  if (!seat || !VALID_SEATS.has(seat)) {
    res.status(400).json({ error: 'INVALID_SEAT' });
    return;
  }
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'NAME_REQUIRED' });
    return;
  }

  const existing = await kv.hget('reservations', seat);
  if (existing) {
    res.status(409).json({ error: 'ALREADY_TAKEN' });
    return;
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));

  const entry = {
    seat,
    name: String(name).trim().slice(0, 20),
    grade: grade ? String(grade).trim().slice(0, 20) : '',
    code,
    durationMinutes: 30,
    createdAt: new Date().toISOString(),
  };

  await kv.hset('reservations', { [seat]: JSON.stringify(entry) });

  res.status(200).json({ code });
};
