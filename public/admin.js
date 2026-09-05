let lastData = null;

function currentKey() {
  return document.getElementById('adminKey').value.trim();
}

async function load() {
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.classList.remove('show');
  try {
    const res = await fetch('/api/reservations', {
      headers: { 'x-admin-key': currentKey() },
    });
    const data = await res.json();
    if (!res.ok) {
      errorMsg.textContent = data.error === 'UNAUTHORIZED' ? '관리자 키가 올바르지 않습니다.' : '불러오기에 실패했습니다.';
      errorMsg.classList.add('show');
      return;
    }
    lastData = data;
    applyFilter();
    document.getElementById('count').textContent = `총 ${data.count}건`;
    document.getElementById('downloadBtn').style.display = data.count ? '' : 'none';
  } catch (e) {
    errorMsg.textContent = '네트워크 오류가 발생했습니다.';
    errorMsg.classList.add('show');
  }
}

function renderTable(rows) {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.seat}</td>
      <td>${escapeHtml(r.studentId)}</td>
      <td class="code-cell">${r.code}</td>
      <td>${new Date(r.createdAt).toLocaleString('ko-KR')}</td>
      <td><button class="delete-btn" data-seat="${r.seat}">삭제</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('table').style.display = rows.length ? '' : 'none';

  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => onDelete(btn.dataset.seat, btn));
  });
}

async function onDelete(seat, btn) {
  if (!confirm(`${seat}번 좌석 예약을 삭제할까요?`)) return;
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.classList.remove('show');
  btn.disabled = true;
  btn.textContent = '삭제 중...';
  try {
    const res = await fetch(`/api/reservations?seat=${encodeURIComponent(seat)}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': currentKey() },
    });
    const data = await res.json();
    if (!res.ok) {
      errorMsg.textContent = data.error === 'UNAUTHORIZED' ? '관리자 키가 올바르지 않습니다.' : '삭제에 실패했습니다.';
      errorMsg.classList.add('show');
      btn.disabled = false;
      btn.textContent = '삭제';
      return;
    }
    load();
  } catch (e) {
    errorMsg.textContent = '네트워크 오류가 발생했습니다.';
    errorMsg.classList.add('show');
    btn.disabled = false;
    btn.textContent = '삭제';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function applyFilter() {
  if (!lastData) return;
  const q = document.getElementById('searchBox').value.trim();
  const rows = q ? lastData.reservations.filter((r) => r.studentId.includes(q)) : lastData.reservations;
  renderTable(rows);
}

document.getElementById('searchBox').addEventListener('input', applyFilter);
document.getElementById('loadBtn').addEventListener('click', load);
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!lastData) return;
  const blob = new Blob([JSON.stringify(lastData.reservations, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reservations-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
