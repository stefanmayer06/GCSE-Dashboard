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

    const priceFields = ['priceTooCheap', 'priceBargain', 'priceExpensive', 'priceTooExpensive'];
    const prices = priceFields.map((name) => form[name].value.trim());
    if (prices.every(Boolean) && prices.map(Number).some((price, i, all) => i > 0 && price < all[i - 1])) {
      message('Each pricing answer should be the same or higher than the one before it. Please check the four prices.', 'error');
      form.priceTooCheap.focus();
      return;
    }

    const ratingInput = form.querySelector('input[name="rating"]:checked');
    const designInput = form.querySelector('input[name="designRating"]:checked');
    const payload = {
      role: form.role.value,
      subject: form.subject.value,
      rating: ratingInput ? Number(ratingInput.value) : 0,
      message: form.message.value,
      designRating: designInput ? Number(designInput.value) : null,
      designNote: form.designNote.value,
      payer: form.payer.value,
      priceModel: form.priceModel.value,
      ...Object.fromEntries(priceFields.map((name, i) => [name, prices[i]])),
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
