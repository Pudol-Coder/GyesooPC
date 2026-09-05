document.getElementById('iqSubmit').addEventListener('click', async () => {
  const name = document.getElementById('iqName').value.trim();
  const message = document.getElementById('iqMessage').value.trim();
  const errorMsg = document.getElementById('iqError');
  errorMsg.classList.remove('show');

  if (!name) {
    errorMsg.textContent = '학번 또는 이름을 입력해주세요.';
    errorMsg.classList.add('show');
    return;
  }
  if (!message) {
    errorMsg.textContent = '문의 내용을 입력해주세요.';
    errorMsg.classList.add('show');
    return;
  }

  const btn = document.getElementById('iqSubmit');
  btn.disabled = true;
  btn.textContent = '보내는 중...';

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message }),
    });
    if (!res.ok) throw new Error('failed');
    document.getElementById('inquiryForm').style.display = 'none';
    document.getElementById('iqDone').style.display = '';
  } catch (e) {
    errorMsg.textContent = '전송에 실패했어요. 다시 시도해주세요.';
    errorMsg.classList.add('show');
    btn.disabled = false;
    btn.textContent = '문의 남기기';
  }
});
