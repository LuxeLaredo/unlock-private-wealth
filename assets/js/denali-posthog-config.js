// Public PostHog website configuration (project token, NOT a secret API key).
// Static GitHub Pages deployment cannot read runtime environment variables.
// Keep this config separate from event instrumentation; never put personal API keys here.
window.DENALI_ANALYTICS_CONFIG = Object.freeze({
  posthog_project_token: 'phc_naWZ2WYtStib2Z9TxxXXb8fNep5K93sXvswzx3FxJWfG',
  posthog_host: 'https://us.i.posthog.com'
});
