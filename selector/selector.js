async function setSubjectStatus(subject, endpoint, update) {
  const status = document.getElementById(`${subject}-status`);
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json();
    status.classList.add('ready');
    status.lastChild.textContent = ' Ready';
    update(data);
  } catch {
    status.lastChild.textContent = ' Offline';
  }
}

setSubjectStatus('maths', '/api/maths/health', (data) => {
  if (data.bankSize) document.getElementById('maths-bank').textContent = `${data.bankSize.toLocaleString()} questions`;
});

setSubjectStatus('english', '/api/english/health', (data) => {
  if (data.texts) document.getElementById('english-texts').textContent = `${data.texts} source texts`;
});
