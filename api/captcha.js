const { sign } = require('../lib/captcha');

const TTL_MS = 5 * 60 * 1000; // 토큰 유효시간 5분

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const a = Math.floor(Math.random() * 8) + 1; // 1~8
  const b = Math.floor(Math.random() * 8) + 1;
  const exp = Date.now() + TTL_MS;
  const payload = `${a}.${b}.${exp}`;
  const sig = sign(payload);
  const token = `${payload}.${sig}`;

  res.status(200).json({ question: `${a} + ${b}`, token });
};
