const quoteStyle = document.createElement('style');
quoteStyle.textContent = '.content form[action="/api/contact"]{position:static!important;align-self:start;scroll-margin-top:110px}.quote-status{margin:0;font-weight:700;color:#a31319}.quote-status:empty{display:none}';
document.head.appendChild(quoteStyle);
document.querySelectorAll('form[action="/api/contact"]').forEach(form => {
  const phone = form.elements.namedItem('Phone');
  if (!phone) return;
  const validate = () => {
    const value = phone.value.trim();
    const digits = value.replace(/\D/g, '');
    const valid = /^[+0-9\s().-]+$/.test(value) && (digits.length === 10 || (digits.length === 11 && digits.startsWith('1')));
    phone.setCustomValidity(value && !valid ? 'Enter a 10-digit phone number, optionally with country code 1. / Ingresa un teléfono de 10 dígitos, con código 1 opcional.' : '');
  };
  phone.addEventListener('input', validate);
  phone.addEventListener('change', validate);
  validate();
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  const originalText = button.textContent;
  const status = document.createElement('p');
  status.className = 'quote-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  button.before(status);
  form.addEventListener('invalid', () => {
    status.textContent = 'Please complete the highlighted field. / Completa el campo indicado para enviar tu solicitud.';
  }, true);
  form.addEventListener('input', () => { status.textContent = ''; });
  form.addEventListener('submit', () => {
    status.textContent = 'Sending your request… / Enviando tu solicitud…';
    button.textContent = 'Sending… / Enviando…';
    form.setAttribute('aria-busy', 'true');
  });
  window.addEventListener('pageshow', () => {
    button.textContent = originalText;
    status.textContent = '';
    form.removeAttribute('aria-busy');
  });
});
