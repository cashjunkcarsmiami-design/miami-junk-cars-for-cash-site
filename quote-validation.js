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
});
