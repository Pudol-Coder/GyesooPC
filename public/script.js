// 컴퓨터실 배치: 1~5번째 줄 6대(책상 3개), 6번째 줄 4대(책상 2개)
const ROWS = [6, 6, 6, 6, 6, 4];

const roomEl = document.getElementById('rows');
const panel = document.getElementById('panel');
const panelSeatLabel = document.getElementById('panelSeatLabel');
const resultSeatLabel = document.getElementById('resultSeatLabel');
const errorMsg = document.getElementById('errorMsg');
const studentIdInput = document.getElementById('studentId');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submitBtn');

let selectedSeat = null;
let takenSeats = new Set();

function renderRoom() {
  roomEl.innerHTML = '';
  let seatNum = 1;
  ROWS.forEach((count, rIdx) => {
    const isLastRow = rIdx === ROWS.length - 1;
    const rowEl = document.createElement('div');
    rowEl.className = isLastRow ? 'row align-right' : 'row';
    for (let d = 0; d < count / 2; d++) {
      const deskEl = document.createElement('div');
      deskEl.className = 'desk';
      for (let s = 1; s <= 2; s++) {
        const id = String(seatNum);
        const btn = document.createElement('button');
        btn.className = 'seat';
        btn.textContent = id;
        btn.dataset.id = id;
        btn.addEventListener('click', () => onSeatClick(id, btn));
        deskEl.appendChild(btn);
        seatNum++;
      }
      rowEl.appendChild(deskEl);
    }
    roomEl.appendChild(rowEl);
  });
}

function applyTakenState() {
  document.querySelectorAll('.seat').forEach(btn => {
    const id = btn.dataset.id;
    btn.classList.toggle('taken', takenSeats.has(id));
    if (takenSeats.has(id)) btn.disabled = true;
  });
}

async function loadSeats() {
  try {
    const res = await fetch('/api/seats');
    const data = await res.json();
    takenSeats = new Set(data.taken || []);
    applyTakenState();
  } catch (e) {
    console.error('좌석 현황을 불러오지 못했습니다', e);
  }
}

function onSeatClick(id, btn) {
  if (btn.classList.contains('taken')) return;
  document.querySelectorAll('.seat.selected').forEach(el => el.classList.remove('selected'));
  btn.classList.add('selected');
  selectedSeat = id;
  panelSeatLabel.textContent = `${id}번 좌석 예약`;
  errorMsg.classList.remove('show');
  document.getElementById('formView').style.display = '';
  document.getElementById('resultView').style.display = 'none';
  studentIdInput.value = '';
  phoneInput.value = '';
  panel.classList.add('open');
  setTimeout(() => studentIdInput.focus(), 200);
}

document.getElementById('cancelBtn').addEventListener('click', closePanel);

function closePanel() {
  panel.classList.remove('open');
  if (selectedSeat) {
    const el = document.querySelector(`.seat[data-id="${selectedSeat}"]`);
    if (el) el.classList.remove('selected');
  }
  selectedSeat = null;
}

submitBtn.addEventListener('click', async () => {
  const studentId = studentIdInput.value.trim();
  const phone = phoneInput.value.trim().replace(/[^0-9]/g, '');
  if (!/^[0-9]{5}$/.test(studentId)) {
    errorMsg.textContent = '학번 5자리를 숫자로 입력해주세요.';
    errorMsg.classList.add('show');
    return;
  }
  if (!/^[0-9]{9,11}$/.test(phone)) {
    errorMsg.textContent = '전화번호를 올바르게 입력해주세요.';
    errorMsg.classList.add('show');
    return;
  }
  submitBtn.disabled = true;
  submitBtn.textContent = '처리 중...';
  try {
    const res = await fetch('/api/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seat: selectedSeat, studentId, phone })
    });
    const data = await res.json();
    if (!res.ok) {
      const messages = {
        ALREADY_TAKEN: '이미 다른 사람이 예약한 좌석입니다.',
        DUPLICATE_STUDENT: '이미 이 학번으로 예약된 좌석이 있습니다.',
        TOO_MANY_REQUESTS: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      };
      errorMsg.textContent = messages[data.error] || '예약에 실패했습니다. 다시 시도해주세요.';
      errorMsg.classList.add('show');
      if (data.error === 'ALREADY_TAKEN') {
        takenSeats.add(selectedSeat);
        applyTakenState();
      }
      return;
    }
    resultSeatLabel.textContent = `${selectedSeat}번 좌석`;
    document.getElementById('formView').style.display = 'none';
    document.getElementById('resultView').style.display = '';
    takenSeats.add(selectedSeat);
    applyTakenState();
  } catch (e) {
    errorMsg.textContent = '네트워크 오류가 발생했습니다.';
    errorMsg.classList.add('show');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '예약하기 (30분)';
  }
});

document.getElementById('doneBtn').addEventListener('click', () => {
  panel.classList.remove('open');
  selectedSeat = null;
});

renderRoom();
loadSeats();
