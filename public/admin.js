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
    updateStats(data.count);
    loadInquiries();
    loadReservationStatus();
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

async function loadInquiries() {
  try {
    const res = await fetch('/api/inquiries', { headers: { 'x-admin-key': currentKey() } });
    const data = await res.json();
    if (!res.ok) return;
    renderInquiries(data.inquiries);
    document.getElementById('iqCount').textContent = `총 ${data.count}건`;
  } catch (e) {
    // 문의 로딩 실패는 예약 화면 자체를 막지 않음
  }
}

function renderInquiries(rows) {
  const tbody = document.getElementById('iqTbody');
  tbody.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.message)}</td>
      <td>${new Date(r.createdAt).toLocaleString('ko-KR')}</td>
      <td><button class="delete-btn" data-id="${r.id}">삭제</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('iqTable').style.display = rows.length ? '' : 'none';

  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => onDeleteInquiry(btn.dataset.id, btn));
  });
}

async function onDeleteInquiry(id, btn) {
  if (!confirm('이 문의를 삭제할까요?')) return;
  btn.disabled = true;
  try {
    await fetch(`/api/inquiries?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': currentKey() },
    });
    loadInquiries();
  } catch (e) {
    btn.disabled = false;
  }
}
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
document.getElementById('searchBox').addEventListener('input', applyFilter);
document.getElementById('loadBtn').addEventListener('click', load);

const TOTAL_SEATS = 34;

function updateStats(count) {
  const percent = Math.round((count / TOTAL_SEATS) * 100);
  document.getElementById('statsText').textContent = `${count} / ${TOTAL_SEATS}석 예약됨`;
  document.getElementById('statsPercent').textContent = `${percent}%`;
  document.getElementById('statsFill').style.width = `${percent}%`;
}

async function loadReservationStatus() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setToggleUI(data.open !== false);
  } catch (e) {
    document.getElementById('reservationStatusText').textContent = '확인 실패';
  }
}

function setToggleUI(open) {
  const toggle = document.getElementById('reservationToggle');
  toggle.classList.toggle('on', open);
  document.getElementById('reservationStatusText').textContent = open ? '접수 중' : '마감됨';
}

document.getElementById('reservationToggle').addEventListener('click', async () => {
  const toggle = document.getElementById('reservationToggle');
  const nextOpen = !toggle.classList.contains('on');
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': currentKey() },
      body: JSON.stringify({ open: nextOpen }),
    });
    if (!res.ok) {
      alert('변경에 실패했어요. 관리자 키를 확인해주세요.');
      return;
    }
    setToggleUI(nextOpen);
  } catch (e) {
    alert('네트워크 오류가 발생했어요.');
  }
});

loadReservationStatus();
