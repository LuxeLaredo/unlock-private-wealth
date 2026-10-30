(() => {
  const CONFIG = {
    endpoint: "https://yssidthemskvrlopgolj.supabase.co/functions/v1/blueprint-request",
    successPath: "blueprint/"
  };

  const form = document.querySelector("#blueprint-form");
  if (!form) return;

  const button = form.querySelector("button[type='submit']");
  const status = document.querySelector("#form-status");
  const previewNotice = document.querySelector("#preview-notice");

  const isFilePreview = window.location.protocol === "file:";
  if (isFilePreview) previewNotice?.classList.add("is-visible");

  const setStatus = (message, type) => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status is-visible ${type === "success" ? "is-success" : "is-error"}`;
    status.focus({ preventScroll: true });
  };

  const params = new URLSearchParams(window.location.search);
  const getUtm = (key) => String(params.get(key) || "").slice(0, 180);

  const sourceDetail = () => {
    const parts = [];
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
      const value = params.get(key);
      if (value) parts.push(`${key}=${value.slice(0, 180)}`);
    });
    if (document.referrer) {
      try {
        const ref = new URL(document.referrer);
        parts.push(`referrer=${ref.hostname}`);
      } catch (_) {
        parts.push("referrer=present");
      }
    }
    return (parts.join(";") || "direct").slice(0, 1000);
  };

  const sourceCategory = () => (params.get("utm_source") || "unlock_private_wealth").slice(0, 100);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (isFilePreview) {
      setStatus("This local file preview is visual only. Open the site through VS Code Live Server on port 5500 to test the live form.", "error");
      return;
    }

    const data = new FormData(form);
    const turnstileToken = String(data.get("cf-turnstile-response") || "");
    if (!turnstileToken) {
      setStatus("Please complete the human verification and try again.", "error");
      return;
    }

    const payload = {
      first_name: String(data.get("first_name") || "").trim(),
      last_name: String(data.get("last_name") || "").trim(),
      email: String(data.get("email") || "").trim().toLowerCase(),
      phone: String(data.get("phone") || "").trim(),
      source_category: sourceCategory(),
      source_detail: sourceDetail(),
      landing_url: window.location.href,
      referrer_url: document.referrer || "",
      utm_source: getUtm("utm_source"),
      utm_medium: getUtm("utm_medium"),
      utm_campaign: getUtm("utm_campaign"),
      utm_content: getUtm("utm_content"),
      utm_term: getUtm("utm_term"),
      market_intelligence_opt_in: data.get("market_intelligence_opt_in") === "on",
      website: String(data.get("website") || "").trim(),
      turnstile_token: turnstileToken
    };

    button.disabled = true;
    button.textContent = "Sending your Blueprint…";
    status?.classList.remove("is-visible", "is-error", "is-success");

    try {
      const response = await fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let result = {};
      try { result = await response.json(); } catch (_) {}

      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || "Request could not be completed.");
      }

      sessionStorage.setItem("denali_lead", JSON.stringify({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
        source_category: payload.source_category,
        source_detail: payload.source_detail
      }));

      setStatus("Your Blueprint is ready. Taking you to the delivery page…", "success");
      window.setTimeout(() => {
        const query = window.location.search || "";
        window.location.assign(`${CONFIG.successPath}${query}`);
      }, 450);
    } catch (error) {
      console.error("Blueprint request failed", error);
      setStatus(error?.message || "We couldn't complete the request. Please try again.", "error");
      window.turnstile?.reset?.();
      button.disabled = false;
      button.textContent = "Get the Private Wealth Blueprint";
    }
  });
})();
