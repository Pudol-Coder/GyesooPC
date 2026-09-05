document.getElementById('goReserve').addEventListener('click', () => {
  window.location.href = 'reserve.html';
});

const TOTAL_SEATS = 34;
fetch('/api/seats')
  .then((res) => res.json())
  .then((data) => {
    const remaining = TOTAL_SEATS - (data.taken || []).length;
    document.getElementById('landingSeatCount').textContent = `${TOTAL_SEATS}석 중 ${remaining}석 남음`;
  })
  .catch(() => {});
