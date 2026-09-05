const crypto = require('crypto');

const SECRET = process.env.CAPTCHA_SECRET || 'gyesoo-pcbang-captcha-v1';

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

function verify(token, answer) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [a, b, exp, sig] = parts;
  const payload = `${a}.${b}.${exp}`;
  if (sign(payload) !== sig) return false;
  if (Date.now() > Number(exp)) return false;
  const correct = Number(a) + Number(b);
  return Number(answer) === correct;
}

module.exports = { sign, verify };
