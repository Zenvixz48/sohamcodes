(() => {
  const form = document.getElementById('requestForm');
  if (!form) return;

  const status = document.getElementById('formStatus');
  const submitButton = document.getElementById('submitButton');
  const buttonLabel = submitButton?.querySelector('.button-label');
  const description = document.getElementById('description');
  const charCount = document.getElementById('charCount');
  const successOverlay = document.getElementById('successOverlay');
  const closeSuccess = document.getElementById('closeSuccess');

  // Preserve the existing Google Apps Script URL and the payload field names.
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzZzyZ0psq5KRQ2b1zG-6oQO42JdywuuQiTd_8h9Ypua8GQvZ1PdrAHJBrhuMtOh5CD/exec';

  const showStatus = (message, kind) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
    status.hidden = false;
  };
  const clearStatus = () => {
    if (!status) return;
    status.hidden = true;
    status.textContent = '';
    delete status.dataset.kind;
  };
  const setBusy = busy => {
    if (submitButton) {
      submitButton.disabled = busy;
      submitButton.classList.toggle('is-loading', busy);
    }
    if (buttonLabel) buttonLabel.textContent = busy ? 'Sending your request…' : 'Send project request';
  };
  const validateField = field => {
    const valid = field.checkValidity();
    field.setAttribute('aria-invalid', String(!valid));
    return valid;
  };

  const updateCharacterCount = () => {
    if (description && charCount) charCount.textContent = `${description.value.length} / 2500`;
  };
  description?.addEventListener('input', () => {
    updateCharacterCount();
    if (description.getAttribute('aria-invalid') === 'true') validateField(description);
  });
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => { if (field.hasAttribute('aria-invalid')) validateField(field); });
    field.addEventListener('change', () => { if (field.hasAttribute('aria-invalid')) validateField(field); });
  });

  const dismissSuccess = () => {
    if (successOverlay) successOverlay.hidden = true;
    submitButton?.focus();
  };
  closeSuccess?.addEventListener('click', dismissSuccess);
  successOverlay?.addEventListener('click', event => { if (event.target === successOverlay) dismissSuccess(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && successOverlay && !successOverlay.hidden) dismissSuccess();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearStatus();

    const fields = [...form.querySelectorAll('input[required], select[required], textarea[required]')];
    const invalid = fields.filter(field => !validateField(field));
    if (invalid.length) {
      showStatus('Please check the highlighted fields. Enter a valid email and at least 15 characters about your idea.', 'error');
      invalid[0].focus();
      return;
    }

    const data = {
      discord: form.elements.discord.value.trim(),
      firstName: form.elements.firstName.value.trim(),
      lastName: form.elements.lastName.value.trim(),
      email: form.elements.email.value.trim(),
      websiteType: form.elements.websiteType.value,
      description: form.elements.description.value.trim()
    };

    setBusy(true);
    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const responseText = await response.text();
      if (responseText) {
        try {
          const result = JSON.parse(responseText);
          if (result && result.success === false) throw new Error(result.message || 'The form service could not save your request.');
        } catch (parseError) {
          if (parseError instanceof SyntaxError) throw new Error('The form service returned an unexpected response. Please try again.');
          throw parseError;
        }
      }
      form.reset();
      updateCharacterCount();
      form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
      if (successOverlay) successOverlay.hidden = false;
      closeSuccess?.focus();
    } catch (error) {
      console.error('Project request submission failed:', error);
      showStatus('I couldn’t confirm that your request was sent. Please check your connection and try again. If it keeps failing, contact me through the website.', 'error');
    } finally {
      setBusy(false);
    }
  });

  updateCharacterCount();
})();
