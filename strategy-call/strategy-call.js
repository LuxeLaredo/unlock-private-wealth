(() => {
  const CAL_PATH = 'toddwmichael/denali-equity-investments-private-investor-strategy-call';
  const FALLBACK_BASE = `https://cal.com/${CAL_PATH}`;
  const current = new URLSearchParams(window.location.search);

  const passthroughKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const calConfig = { layout: 'month_view', theme: 'light' };
  const fallbackParams = new URLSearchParams();

  passthroughKeys.forEach((key) => {
    const val = current.get(key);
    if (!val) return;
    calConfig[key] = val;
    fallbackParams.set(key, val);
  });

  try {
    const lead = JSON.parse(sessionStorage.getItem('denali_lead') || '{}');
    const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
    if (fullName) {
      calConfig.name = fullName;
      fallbackParams.set('name', fullName);
    }
    if (lead.email) {
      calConfig.email = lead.email;
      fallbackParams.set('email', lead.email);
    }
  } catch (_) {}

  const readinessRoute = current.get('readiness_route') || sessionStorage.getItem('denali_readiness_route');
  if (readinessRoute) sessionStorage.setItem('denali_readiness_route', readinessRoute);

  const fallback = document.querySelector('#cal-fallback');
  if (fallback) {
    const query = fallbackParams.toString();
    fallback.href = query ? `${FALLBACK_BASE}?${query}` : FALLBACK_BASE;
  }

  (function (C, A, L) {
    const p = function (a, ar) { a.q.push(ar); };
    const d = C.document;
    C.Cal = C.Cal || function () {
      const cal = C.Cal;
      const ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement('script')).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar);
          p(cal, ['initNamespace', namespace]);
        } else {
          p(cal, ar);
        }
        return;
      }
      p(cal, ar);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');

  window.Cal('init', { origin: 'https://cal.com' });
  window.Cal('inline', {
    elementOrSelector: '#my-cal-inline',
    calLink: CAL_PATH,
    config: calConfig
  });

  window.Cal('ui', {
    theme: 'light',
    layout: 'month_view',
    hideEventTypeDetails: false,
    cssVarsPerTheme: { light: { 'cal-brand': '#111627' } }
  });
})();
