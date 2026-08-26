(() => {
  'use strict';
  const form = document.querySelector('#delete-form');
  const email = document.querySelector('#email');
  const password = document.querySelector('#password');
  const confirmation = document.querySelector('#confirmation');
  const button = document.querySelector('#delete-button');
  const status = document.querySelector('#status');

  function message(text, kind = '') {
    status.textContent = text;
    status.className = `status ${kind}`.trim();
  }

  function clearSensitiveFields() {
    password.value = '';
    confirmation.value = '';
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
    if (confirmation.value !== 'DELETE') {
      message('Type DELETE exactly to confirm.', 'error');
      return;
    }

    button.disabled = true;
    let accessToken = null;
    try {
      message('Verifying your account...');
      const login = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: password.value }),
      });
      if (!login.ok) throw new Error(await errorMessage(login, 'Could not verify that email and password.'));
      const body = await login.json();
      accessToken = body?.session?.access_token;
      if (typeof accessToken !== 'string' || !accessToken) throw new Error('Sign-in did not return a deletion session. Contact support before trying again.');

      message('Deleting the account and server data...');
      const deletion = await fetch('/api/auth/account', {
        method: 'DELETE',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      if (!deletion.ok) throw new Error(await errorMessage(deletion, 'Account deletion could not be completed.'));

      form.reset();
      message('Account deleted. Your server account, progress and active sessions are no longer available.', 'success');
    } catch (error) {
      clearSensitiveFields();
      message(error instanceof Error ? error.message : 'Account deletion could not be completed.', 'error');
    } finally {
      accessToken = null;
      button.disabled = false;
    }
  });
})();
