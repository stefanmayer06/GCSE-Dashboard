(() => {
  'use strict';
  const form = document.getElementById('support-form');
  if (!form) return;
  const button = document.getElementById('support-button');
  const status = document.getElementById('status');
  const topic = document.getElementById('topic');
  const email = document.getElementById('email');

  topic.addEventListener('change', () => {
    email.required = topic.value === 'privacy';
  });

  function show(message, kind = '') {
    status.textContent = message;
    status.className = `status ${kind}`.trim();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    show('');
    if (!form.reportValidity()) return;
    button.disabled = true;
    try {
      show('Sending your request…');
      const response = await fetch('/api/support', {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.value,
          message: document.getElementById('message').value,
          email: email.value,
          website: form.elements.namedItem('website').value,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Your request could not be sent. Please try again.');
      }
      form.reset();
      email.required = false;
      show('Your request was received. Thank you for telling us.', 'success');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Your request could not be sent. Please try again.', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
