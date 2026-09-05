document.getElementById('goReserve').addEventListener('click', () => {
  window.location.href = 'reserve.html';
});

const introPanel = document.getElementById('introPanel');
document.getElementById('toggleIntro').addEventListener('click', () => {
  introPanel.classList.toggle('open');
});
