/* Denali website intelligence - anonymous, explicit-only analytics.
   No input values, email, phone, readiness answers, session replay or auto interaction capture.
   Configuration is loaded separately; the PostHog project token is a public browser key. */
(() => {
  'use strict';
  const cfg = window.DENALI_ANALYTICS_CONFIG || {};
  if (location.protocol === 'file:' || !/^phc_/.test(cfg.posthog_project_token || '') ||
      !/^https:\/\/[a-z0-9.-]+\.posthog\.com\/?$/.test(cfg.posthog_host || '')) {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.error('POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_PROJECT_TOKEN is configured');
    }
    return;
  }

  const uri = new URL(location.href);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const params = {};
  utmKeys.forEach(k => { const v = uri.searchParams.get(k); if (v) params[k] = v.slice(0, 160); });
  // Persist campaign attribution only for the current browser tab/session.
  // No contact details, investor data, or form values are stored here.
  try {
    const storageKey = 'denali_funnel_utm_session_v1';
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    if (Object.keys(params).length) {
      sessionStorage.setItem(storageKey, JSON.stringify(params));
    } else if (saved && typeof saved === 'object') {
      utmKeys.forEach(k => {
        if (typeof saved[k] === 'string') params[k] = saved[k].slice(0, 160);
      });
    }
  } catch (_) { /* Storage unavailable; analytics still works without it. */ }
  const path = uri.pathname.replace(/\/+$/, '') || '/';
  const domain = location.hostname.toLowerCase();
  const safeUrl = uri.origin + uri.pathname + (Object.keys(params).length ?
    '?' + new URLSearchParams(params).toString() : '');
  const referringDomain = (() => {
    try { return document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; }
    catch (_) { return ''; }
  })();
  const pageTypes = {
    '/': 'home', '/index.html': 'home', '/resources.html': 'resources',
    '/about-todd.html': 'founder', '/investment-strategy.html': 'strategy',
    '/readiness': 'readiness', '/market-intelligence': 'newsletter',
    '/blueprint': 'blueprint_delivery', '/strategy-call': 'scheduling',
    '/introduction-call': 'scheduling', '/get-acquainted-call': 'scheduling'
  };
  const pageId = path.replace(/^\/|\/$/g, '') || 'home';
  const common = Object.assign({
    site_domain: domain, page_id: pageId, page_type: pageTypes[path] || 'other',
    referring_domain: referringDomain
  }, params);
  const allowedEvents = new Set([
    '$pageview', 'cta_clicked', 'content_opened', 'content_scroll_milestone',
    'content_engagement_milestone', 'blueprint_request_succeeded',
    'readiness_submitted', 'market_intelligence_subscription_succeeded'
  ]);
  const allowedValues = new Set([
    'cta_id', 'cta_destination', 'content_id', 'scroll_percent',
    'engagement_seconds', 'form_id', 'site_domain', 'page_id', 'page_type'
  ]);
  let ready = false;
  const pending = [];
  function track(name, details = {}) {
    if (!allowedEvents.has(name)) return;
    const props = Object.assign({ $process_person_profile: false }, common);
    for (const [key, value] of Object.entries(details)) {
      if (allowedValues.has(key) &&
          (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string')) {
        props[key] = typeof value === 'string' ? value.slice(0, 160) : value;
      }
    }
    if (name === '$pageview') props.$current_url = safeUrl;
    if (ready && window.posthog && typeof window.posthog.capture === 'function') {
      try { window.posthog.capture(name, props); } catch (_) { /* analytics never blocks site */ }
    } else if (pending.length < 30) {
      pending.push([name, props]);
    }
  }
  window.DenaliAnalytics = Object.freeze({ track });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!link.matches('.cta, .text-link, .primary-button, .footer-contact-email') &&
        !/unlockmyprivatewealth\.com|cashflowportal\.com/.test(href)) return;
    let destination = '';
    try { const u = new URL(href, location.href); destination = u.hostname + u.pathname; }
    catch (_) { return; }
    const label = (link.id || link.textContent || 'link').replace(/\s+/g, ' ').trim().slice(0, 100);
    track('cta_clicked', { cta_id: label, cta_destination: destination });
  }, { capture: true });

  document.addEventListener('toggle', event => {
    if (!event.target.matches('details[open]')) return;
    const article = event.target.closest('article[id]');
    if (article) track('content_opened', { content_id: article.id });
  }, true);

  const reached = new Set();
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const percent = Math.min(100, Math.round(100 * window.scrollY / max));
    [50, 75, 90].forEach(mark => {
      if (percent >= mark && !reached.has(mark)) {
        reached.add(mark);
        track('content_scroll_milestone', { scroll_percent: mark });
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  let visibleSeconds = 0;
  const seen = new Set();
  window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    visibleSeconds += 5;
    [30, 60, 120].forEach(seconds => {
      if (visibleSeconds >= seconds && !seen.has(seconds)) {
        seen.add(seconds);
        track('content_engagement_milestone', { engagement_seconds: seconds });
      }
    });
  }, 5000);

  // PostHog's standard async browser SDK bootstrap with a queue before it loads.
  (function(t, e) {
    var o, n, p, r;
    if (e.__SV || (window.posthog && window.posthog.__loaded)) return;
    window.posthog = e;
    e._i = [];
    e.init = function(key, options, name) {
      function stub(obj, method) {
        const parts = method.split('.');
        if (parts.length === 2) { obj = obj[parts[0]]; method = parts[1]; }
        obj[method] = function() { obj.push([method].concat(Array.prototype.slice.call(arguments, 0))); };
      }
      if (!p) {
        p = t.createElement('script');
        p.type = 'text/javascript'; p.crossOrigin = 'anonymous'; p.async = true;
        p.src = options.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
        p.onerror = function() { p = null; };
        r = t.getElementsByTagName('script')[0];
        r.parentNode.insertBefore(p, r);
      }
      var instance = e;
      if (typeof name !== 'undefined') instance = e[name] = [];
      else name = 'posthog';
      instance.people = instance.people || [];
      o = 'capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags resetGroups onFeatureFlags addFeatureFlagsHandler onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRender getNextSurveyStep'.split(' ');
      for (n = 0; n < o.length; n++) stub(instance, o[n]);
      e._i.push([key, options, name]);
    };
    e.__SV = 1;
  })(document, window.posthog || []);

  window.posthog.init(cfg.posthog_project_token, {
    api_host: cfg.posthog_host,
    defaults: '2026-08-30',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    advanced_disable_flags: true,
    person_profiles: 'identified_only',
    loaded: function() {
      ready = true;
      while (pending.length) {
        const item = pending.shift();
        try { window.posthog.capture(item[0], item[1]); } catch (_) { /* non-blocking */ }
      }
    }
  });
  track('$pageview');
})();