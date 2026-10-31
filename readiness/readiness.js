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
  const secondary = document.querySelector('#result-secondary');
  const tertiary = document.querySelector('#result-tertiary');
  const button = form.querySelector("button[type='submit']");

  const strategyCallUrl = '../strategy-call/';
  const introductionCallUrl = 'https://cal.com/toddwmichael/20-minute-investor-introduction-call';
  const getAcquaintedCallUrl = 'https://cal.com/toddwmichael/get-acquainted-call';
  const blueprintUrl = '../blueprint/';
  const denaliResourcesUrl = 'https://denaliequityinvestments.com/resources.html';
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

  // Prefer this tab's session; fall back once to a short-lived cross-tab handoff.
  // Both storage areas are bound to the same website origin.
  let lead = {};
  try {
    lead = JSON.parse(sessionStorage.getItem('denali_lead') || '{}') || {};
  } catch (_) {}
  try {
    const pending = JSON.parse(localStorage.getItem('denali_lead_handoff') || '{}') || {};
    localStorage.removeItem('denali_lead_handoff');
    if (!lead.email && pending.email && Number(pending.expires_at) > Date.now()) {
      const { expires_at, ...rest } = pending;
      lead = rest;
      try { sessionStorage.setItem('denali_lead', JSON.stringify(lead)); } catch (_) {}
    }
  } catch (_) {}
  try {
    if (lead.first_name) form.elements.first_name.value = lead.first_name;
    if (lead.last_name) form.elements.last_name.value = lead.last_name;
    if (lead.email) form.elements.email.value = lead.email;
    if (lead.phone && form.elements.phone) form.elements.phone.value = lead.phone;
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

  // Route is returned by the existing Supabase Edge Function. Never re-score on the client.
  // These are relationship and educational starting points, not pass/fail ratings.
  const renderRoute = (route) => {
    try {
      sessionStorage.setItem('denali_readiness_route', route);
      sessionStorage.setItem('denali_readiness_completed_at', new Date().toISOString());
    } catch (_) {}

    // Keep contact data out of Cal.com URL parameters. Pass only source tags.
    const calendarLink = (baseUrl) => {
      const next = new URL(baseUrl);
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const value = params.get(key);
        if (value) next.searchParams.set(key, value.slice(0, 180));
      }
      return next.toString();
    };
    const action = (node, label, href) => {
      node.textContent = label;
      node.href = href;
      node.hidden = false;
    };
    secondary.hidden = true;
    tertiary.hidden = true;

    if (route === 'strategy_call_appropriate') {
      title.textContent = 'A conversation could be a useful next step.';
      body.textContent = 'Your responses suggest that you are comfortable exploring several important considerations of private real estate, including long-term ownership, limited liquidity, and investment risk.';
      details.textContent = 'A Private Investor Strategy Call with Todd W. Michael is an opportunity to discuss your objectives, learn how Denali evaluates opportunities, and determine what questions deserve further consideration.';
      action(primary, 'Schedule a Strategy Call', preserveQuery(strategyCallUrl, { readiness_route: route }));
      action(secondary, 'Start with a 20-Minute Introduction', calendarLink(introductionCallUrl));
    } else if (route === 'manual_review') {
      title.textContent = 'Some questions are better explored together.';
      body.textContent = 'Your responses suggest there may be questions worth exploring, or circumstances you would prefer to discuss privately. That is a perfectly reasonable place to begin.';
      details.textContent = 'We invite you to schedule a brief conversation with Todd W. Michael to get acquainted, discuss what is on your mind, and learn more about Denali’s approach. You are equally welcome to continue exploring the educational resources at your own pace. No preparation or investment decision is expected.';
      action(primary, 'Schedule a 20-Minute Introduction Call', calendarLink(introductionCallUrl));
      action(secondary, 'Explore Denali Resources', denaliResourcesUrl);
      action(tertiary, 'Revisit the Private Wealth Blueprint', preserveQuery(blueprintUrl, { readiness_route: route }));
    } else {
      title.textContent = 'Your financial well-being comes first.';
      body.textContent = 'Your responses highlight considerations that deserve attention before making a commitment to private real estate. These may include liquidity needs, the potential for investment loss, or how private investments fit your broader financial circumstances.';
      details.textContent = 'There is no reason to rush. Continue learning, ask questions, and make decisions on your own timeline. If you would simply like to meet Todd W. Michael, learn about Denali, or establish a connection for the future, you are always welcome. A conversation is educational and does not change the risks of investing.';
      action(primary, 'Revisit the Private Wealth Blueprint', preserveQuery(blueprintUrl, { readiness_route: route }));
      action(secondary, 'Schedule a 15-Minute Get-Acquainted Call', calendarLink(getAcquaintedCallUrl));
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
      phone: value(data, 'phone').trim(),
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
        phone: payload.phone || (JSON.parse(sessionStorage.getItem('denali_lead') || '{}').phone || ''),
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
