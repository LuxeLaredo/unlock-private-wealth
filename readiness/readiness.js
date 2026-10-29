(() => {
  const form = document.querySelector('#readiness-form');
  const result = document.querySelector('#readiness-result');
  if (!form || !result) return;

  const title = document.querySelector('#result-title');
  const body = document.querySelector('#result-body');
  const details = document.querySelector('#result-details');
  const primary = document.querySelector('#result-primary');

  const denaliContactUrl = 'https://denaliequityinvestments.com/#contact';
  const blueprintUrl = '../blueprint/';

  const preserveQuery = (url) => {
    const query = window.location.search;
    if (!query || !url.startsWith('../')) return url;
    return `${url}${query}`;
  };

  const value = (data, key) => String(data.get(key) || '');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const answers = {
      horizon: value(data, 'horizon'),
      liquidity: value(data, 'liquidity'),
      returns: value(data, 'returns'),
      lpRole: value(data, 'lp_role'),
      illiquidity: value(data, 'illiquidity'),
      taxContext: value(data, 'tax_context'),
      riskFit: value(data, 'risk_fit'),
      lossCapacity: value(data, 'loss_capacity')
    };

    const hardStop = answers.returns !== 'yes' || answers.lossCapacity !== 'yes';
    const coreKeys = ['horizon', 'liquidity', 'lpRole', 'illiquidity', 'riskFit'];
    const coreUnclear = coreKeys.filter((key) => answers[key] !== 'yes');

    let route;
    if (hardStop || coreUnclear.length >= 2) {
      route = 'nurture';
    } else if (coreUnclear.length === 1 || answers.taxContext !== 'yes') {
      route = 'manual_review';
    } else {
      route = 'strategy_call_appropriate';
    }

    sessionStorage.setItem('denali_readiness_route', route);
    sessionStorage.setItem('denali_readiness_completed_at', new Date().toISOString());

    if (route === 'strategy_call_appropriate') {
      title.textContent = 'A focused investor conversation may be useful now.';
      body.textContent = 'Your answers indicate that you understand the basic structure, illiquidity, downside risk, and time horizon well enough for a more specific conversation to be productive.';
      details.innerHTML = '<p><strong>Next:</strong> Use a Strategy Call to discuss fit, questions, and what you would need to understand before evaluating a specific opportunity.</p>';
      primary.textContent = 'Explore a Strategy Call';
      primary.href = denaliContactUrl;
    } else if (route === 'manual_review') {
      title.textContent = 'Clarify one or two items before moving forward.';
      body.textContent = 'You have much of the framework in place, but one or more areas deserves a closer look before a strategy conversation becomes truly useful.';
      details.innerHTML = '<p>Review the item you marked “not yet / unsure.” If it concerns taxes, discuss it with your CPA or tax advisor. If it concerns liquidity, time horizon, or investor role, revisit the Blueprint and make sure the tradeoffs are clear.</p>';
      primary.textContent = 'Review Denali Resources';
      primary.href = 'https://denaliequityinvestments.com/resources.html';
    } else {
      title.textContent = 'More groundwork first is the better next step.';
      body.textContent = 'Private real estate can involve illiquidity and loss of capital. Based on your answers, more education or financial planning should come before a strategy conversation.';
      details.innerHTML = '<p>Start by reviewing the Blueprint again and resolving the questions around liquidity, loss capacity, time horizon, or expectations before considering a specific opportunity.</p>';
      primary.textContent = 'Revisit the Blueprint';
      primary.href = preserveQuery(blueprintUrl);
    }

    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
