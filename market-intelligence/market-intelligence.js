(() => {
  // This endpoint is separate from blueprint-request. It records newsletter-only consent.
  const CONFIG = {
    endpoint: 'https://yssidthemskvrlopgolj.supabase.co/functions/v1/market-intelligence-subscribe'
  };
  const form = document.querySelector('#intelligence-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#form-status');
  const notice = document.querySelector('#preview-notice');
  const isFilePreview = window.location.protocol === 'file:';
  if (isFilePreview) notice?.classList.add('is-visible');
  const setStatus = (message, type = 'error') => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status is-visible ${type === 'success' ? 'is-success' : 'is-error'}`;
    status.focus({ preventScroll: true });
  };
  const params = new URLSearchParams(window.location.search);
  const getUtm = key => String(params.get(key) || '').slice(0, 180);
  const sourceDetail = () => {
    const parts = [];
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key => {
      const val = params.get(key);
      if (val) parts.push(`${key}=${val.slice(0,180)}`);
    });
    if (document.referrer) {
      try { parts.push(`referrer=${new URL(document.referrer).hostname}`); }
      catch (_) { parts.push('referrer=present'); }
    }
    return (parts.join(';') || 'direct').slice(0, 1000);
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (isFilePreview) {
      setStatus('Local file preview only. Use the published page to subscribe.');
      return;
    }
    const data = new FormData(form);
    if (data.get('newsletter_consent') !== 'on') {
      setStatus('Please confirm your consent to receive the newsletter.');
      return;
    }
    const token = String(data.get('cf-turnstile-response') || '');
    if (!token) {
      setStatus('Please complete the human verification and try again.');
      return;
    }
    const payload = {
      first_name: String(data.get('first_name') || '').trim(),
      last_name: String(data.get('last_name') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      newsletter_consent: true,
      consent_text_version: 'weekly-market-intelligence-v1-2026-11-13',
      source_category: String(params.get('utm_source') || 'unlock_private_wealth').slice(0,100),
      source_detail: sourceDetail(),
      landing_url: window.location.href,
      referrer_url: document.referrer || '',
      utm_source: getUtm('utm_source'),
      utm_medium: getUtm('utm_medium'),
      utm_campaign: getUtm('utm_campaign'),
      utm_content: getUtm('utm_content'),
      utm_term: getUtm('utm_term'),
      website: String(data.get('website') || '').trim(),
      turnstile_token: token
    };
    button.disabled = true;
    button.textContent = 'Submitting subscription...';
    status?.classList.remove('is-visible','is-success','is-error');
    try {
      const response = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      let result = {};
      try { result = await response.json(); } catch (_) {}
      if (!response.ok || result.ok !== true || result.subscription_saved !== true) {
        throw new Error(result.error || 'The subscription could not be saved.');
      }
      form.reset();
      window.turnstile?.reset?.();
      setStatus('Thank you. Your subscription has been recorded.', 'success');
      window.DenaliAnalytics?.track('market_intelligence_subscription_succeeded', { form_id: 'weekly_market_intelligence' });
    } catch (error) {
      console.error('Newsletter subscription failed', error);
      setStatus(error?.message || 'We could not save your subscription. Please try again.');
      window.turnstile?.reset?.();
    } finally {
      button.disabled = false;
      button.textContent = 'Subscribe to Market Intelligence';
    }
  });
})();
