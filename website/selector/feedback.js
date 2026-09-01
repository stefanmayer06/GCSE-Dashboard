(() => {
  'use strict';
  const form = document.querySelector('#feedback-form');
  const button = document.querySelector('#feedback-button');
  const status = document.querySelector('#status');
  const source = document.querySelector('#source');

  try {
    const params = new URLSearchParams(window.location.search);
    const src = (params.get('src') || '').trim();
    if (src && src.length <= 120) source.value = src.slice(0, 120);
  } catch (e) {
    source.value = '';
  }

  function message(text, kind = '') {
    status.textContent = text;
    status.className = `status ${kind}`.trim();
  }

  async function errorMessage(response, fallback) {
    try {
      const body = await response.json();
      return typeof body.error === 'string' ? body.error : fallback;
    } catch {
      return fallback;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message('');
    if (!form.reportValidity()) return;

    const ratingInput = form.querySelector('input[name="rating"]:checked');
    const payload = {
      role: form.role.value,
      subject: form.subject.value,
      rating: ratingInput ? Number(ratingInput.value) : 0,
      message: form.message.value,
      heard: form.heard.value,
      email: form.email.value,
      website: form.website.value,
      source: source.value,
    };

    button.disabled = true;
    try {
      message('Sending your feedback...');
      const response = await fetch('/api/feedback', {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await errorMessage(response, 'Your feedback could not be sent. Please try again.'));
      form.reset();
      message('Thank you — feedback received. This genuinely decides what gets built next.', 'success');
    } catch (error) {
      message(error instanceof Error ? error.message : 'Your feedback could not be sent. Please try again.', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
