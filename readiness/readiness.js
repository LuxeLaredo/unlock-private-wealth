(() => {
  const CONFIG = {
    endpoint: 'https://yssidthemskvrlopgolj.supabase.co/functions/v1/readiness-submit'
  };

  const form = document.querySelector('#readiness-form');
  const result = document.querySelector('#readiness-result');
  const status = document.querySelector('#readiness-status');
  if (!form || !result) return;

  const title = document.querySelector('#result-title');
  const body = document.querySelector('#result-body');
  const details = document.querySelector('#result-details');
  const primary = document.querySelector('#result-primary');
  const button = form.querySelector("button[type='submit']");

  const strategyCallUrl = '../strategy-call/';
  const blueprintUrl = '../blueprint/';
  const params = new URLSearchParams(window.location.search);

  const preserveQuery = (url, additions = {}) => {
    const next = new URLSearchParams(window.location.search);
    Object.entries(additions).forEach(([key, val]) => {
      if (val) next.set(key, val);
    });
    const query = next.toString();
    return query ? `${url}?${query}` : url;
  };

  const value = (data, key) => String(data.get(key) || '');
  const getUtm = (key) => String(params.get(key) || '').slice(0, 180);

  const setStatus = (message, type = 'error') => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status is-visible ${type === 'success' ? 'is-success' : 'is-error'}`;
    status.focus({ preventScroll: true });
  };

  try {
    const lead = JSON.parse(sessionStorage.getItem('denali_lead') || '{}');
    if (lead.first_name) form.elements.first_name.value = lead.first_name;
    if (lead.last_name) form.elements.last_name.value = lead.last_name;
    if (lead.email) form.elements.email.value = lead.email;
  } catch (_) {}

  const sourceDetail = () => {
    const parts = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
      const val = params.get(key);
      if (val) parts.push(`${key}=${val.slice(0, 180)}`);
    });
    try {
      const lead = JSON.parse(sessionStorage.getItem('denali_lead') || '{}');
      if (lead.source_detail) parts.push(`prior=${String(lead.source_detail).slice(0, 500)}`);
    } catch (_) {}
    return (parts.join(';') || 'investor_readiness').slice(0, 1000);
  };

  const renderRoute = (route) => {
    sessionStorage.setItem('denali_readiness_route', route);
    sessionStorage.setItem('denali_readiness_completed_at', new Date().toISOString());

    if (route === 'strategy_call_appropriate') {
      title.textContent = 'Your responses suggest that a focused Strategy Call may be a useful next step.';
      body.textContent = 'The purpose of the call is to work through your questions, timeline, risk concerns, and what you would need to understand before evaluating a specific opportunity.';
      details.innerHTML = '<p><strong>Next:</strong> Schedule a private conversation with Todd W. Michael. This readiness result is educational and does not determine suitability, accreditation, or investment access.</p>';
      primary.textContent = 'Schedule a Strategy Call';
      primary.href = preserveQuery(strategyCallUrl, { readiness_route: route });
    } else if (route === 'manual_review') {
      title.textContent = 'You do not need to have every answer today.';
      body.textContent = 'Continue reviewing the Blueprint, and schedule a conversation when you are ready to work through your questions.';
      details.innerHTML = '<p>One or more responses call for additional context rather than an automated conclusion. If you selected “Prefer to discuss privately,” that response is intentionally reserved for a confidential conversation.</p>';
      primary.textContent = 'Review Denali Resources';
      primary.href = 'https://denaliequityinvestments.com/resources.html';
    } else {
      title.textContent = 'Based on your responses, private real estate may not be appropriate for you at this time.';
      body.textContent = 'That is not a permanent judgment. It means education, liquidity planning, or a clearer understanding of illiquidity and loss of capital should come before a Strategy Call.';
      details.innerHTML = '<p>Revisit the Blueprint and discuss any financial or tax questions with the appropriate professional before considering a specific private investment.</p>';
      primary.textContent = 'Revisit the Blueprint';
      primary.href = preserveQuery(blueprintUrl, { readiness_route: route });
    }

    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const turnstileToken = value(data, 'cf-turnstile-response');
    if (!turnstileToken) {
      setStatus('Please complete the human verification and try again.');
      return;
    }

    const answers = {
      horizon: value(data, 'horizon'),
      liquidity: value(data, 'liquidity'),
      returns: value(data, 'returns'),
      lp_role: value(data, 'lp_role'),
      illiquidity: value(data, 'illiquidity'),
      tax_context: value(data, 'tax_context'),
      risk_fit: value(data, 'risk_fit'),
      loss_capacity: value(data, 'loss_capacity')
    };

    const payload = {
      first_name: value(data, 'first_name').trim(),
      last_name: value(data, 'last_name').trim(),
      email: value(data, 'email').trim().toLowerCase(),
      goals: data.getAll('objectives').map(String),
      answers,
      source_category: (params.get('utm_source') || 'unlock_private_wealth').slice(0, 100),
      source_detail: sourceDetail(),
      landing_url: window.location.href,
      referrer_url: document.referrer || '',
      utm_source: getUtm('utm_source'),
      utm_medium: getUtm('utm_medium'),
      utm_campaign: getUtm('utm_campaign'),
      utm_content: getUtm('utm_content'),
      utm_term: getUtm('utm_term'),
      website: value(data, 'website').trim(),
      turnstile_token: turnstileToken
    };

    button.disabled = true;
    button.textContent = 'Reviewing…';
    status?.classList.remove('is-visible', 'is-error', 'is-success');

    try {
      const response = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let responseBody = {};
      try { responseBody = await response.json(); } catch (_) {}
      if (!response.ok || responseBody.ok !== true || !responseBody.route_outcome) {
        throw new Error(responseBody.error || 'Your readiness submission could not be completed.');
      }

      sessionStorage.setItem('denali_lead', JSON.stringify({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        source_category: payload.source_category,
        source_detail: payload.source_detail
      }));

      setStatus('Readiness saved.', 'success');
      renderRoute(responseBody.route_outcome);
    } catch (error) {
      console.error('Readiness submission failed', error);
      setStatus(error?.message || 'We could not save your readiness submission. Please try again.');
      window.turnstile?.reset?.();
    } finally {
      button.disabled = false;
      button.textContent = 'Review My Readiness';
    }
  });
})();
