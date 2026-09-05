const { kv } = require('@vercel/kv');
const { verify: verifyCaptcha } = require('../lib/captcha');

const VALID_SEATS = new Set();
for (let i = 1; i <= 34; i++) VALID_SEATS.add(String(i));

const RATE_LIMIT_MAX = 5; // 같은 IP에서 허용하는 최대 시도 횟수
const RATE_LIMIT_WINDOW_SEC = 60; // 시간 창(초)

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket ? req.socket.remoteAddress : 'unknown';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  // --- 예약 오픈/마감 여부 확인 ---
  const isOpen = await kv.get('reservationOpen');
  if (isOpen === false) {
    res.status(403).json({ error: 'RESERVATION_CLOSED' });
    return;
  }

  // --- 속도 제한: 같은 IP가 짧은 시간에 너무 많이 시도하지 못하게 ---
  const ip = getClientIp(req);
  const rateKey = `ratelimit:reserve:${ip}`;
  const attempts = await kv.incr(rateKey);
  if (attempts === 1) {
    await kv.expire(rateKey, RATE_LIMIT_WINDOW_SEC);
  }
  if (attempts > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'TOO_MANY_REQUESTS' });
    return;
  }

  const { seat, studentId, phone, captchaToken, captchaAnswer } = req.body || {};

  // --- 캡차 검증 ---
  if (!verifyCaptcha(captchaToken, captchaAnswer)) {
    res.status(400).json({ error: 'CAPTCHA_INVALID' });
    return;
  }

  if (!seat || !VALID_SEATS.has(seat)) {
    res.status(400).json({ error: 'INVALID_SEAT' });
    return;
  }
  if (!studentId || !/^[0-9]{5}$/.test(String(studentId))) {
    res.status(400).json({ error: 'STUDENT_ID_INVALID' });
    return;
  }
  if (!phone || !/^[0-9]{9,11}$/.test(String(phone))) {
    res.status(400).json({ error: 'PHONE_INVALID' });
    return;
  }

  const existing = await kv.hget('reservations', seat);
  if (existing) {
    res.status(409).json({ error: 'ALREADY_TAKEN' });
    return;
  }

  // --- 같은 학번이 이미 다른 좌석을 예약했는지 확인 ---
  const all = await kv.hgetall('reservations');
  const list = all ? Object.values(all) : [];
  const dup = list.find((r) => r.studentId === String(studentId));
  if (dup) {
    res.status(409).json({ error: 'DUPLICATE_STUDENT' });
    return;
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));

  const entry = {
    seat,
    studentId: String(studentId),
    phone: String(phone),
    code,
    durationMinutes: 30,
    createdAt: new Date().toISOString(),
  };

  await kv.hset('reservations', { [seat]: JSON.stringify(entry) });

  res.status(200).json({ ok: true });
};
