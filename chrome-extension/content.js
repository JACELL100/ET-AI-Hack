(() => {
  if (window.__rakshaVoiceControlInstalled) return;
  window.__rakshaVoiceControlInstalled = true;

  const routes = [
    [["admin dashboard", "admin panel"], "/admin", "Opened the admin panel."],
    [["admin drishti"], "/admin/drishti", "Opened DRISHTI intelligence."],
    [["admin netra"], "/admin/netra", "Opened admin NETRA."],
    [["admin sentinel"], "/admin/sentinel", "Opened admin SENTINEL."],
    [["admin jaal"], "/admin/jaal", "Opened admin JAAL."],
    [["dashboard", "home", "citizen portal"], "/dashboard", "Opened dashboard."],
    [["report fraud", "file a report", "fraud report", "report a scam"], "/report-fraud", "Opened fraud report."],
    [["phone safety", "phone lookup", "check number"], "/phone-safety", "Opened phone safety."],
    [["netra", "banknote", "bank note", "verify currency"], "/netra", "Opened NETRA."],
    [["kavach", "citizen shield", "chatbot"], "/kavach", "Opened KAVACH."],
    [["sentinel", "scam detector", "call analysis"], "/sentinel", "Opened SENTINEL."],
    [["jaal", "network check"], "/jaal", "Opened JAAL."],
    [["drishti", "map intelligence", "crime map"], "/admin/drishti", "Opened DRISHTI intelligence."],
  ];
  const states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];

  const setInput = (id, value) => {
    const input = document.getElementById(id);
    if (!input || value === undefined) return;
    const nextValue = input instanceof HTMLSelectElement
      ? [...input.options].find((option) => option.text.trim().toLowerCase() === String(value).trim().toLowerCase())?.value || value
      : value;
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(input, nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const parseDraft = (command) => {
    const valueAfter = (regex) => command.match(regex)?.[1]?.trim();
    const draft = {};
    const description = valueAfter(/(?:description|details|what happened)(?: is| are|:)?\s+(.+)/i);
    const district = valueAfter(/(?:district|city)(?: is|:)?\s+([a-z][a-z .'-]*?)(?=\s+(?:and\s+)?(?:state|phone|my name|name)\b|$)/i);
    const stateValue = valueAfter(/state(?: is|:)?\s+([a-z ]+?)(?=\s+(?:and\s+)?(?:district|phone|my name|name)\b|$)/i);
    const name = valueAfter(/(?:my name is|reporter name is|name is)\s+([a-z][a-z .'-]*?)(?=\s+(?:and\s+)?(?:district|state|phone)\b|$)/i);
    const phone = command.match(/(?:phone|number|mobile)(?: is|:)?\s*([+\d][\d\s-]{7,})/i)?.[1];
    if (description) draft.description = description;
    if (!description && /\b(scam|fraud|caller|call|otp|upi|bank|money|transaction|asked|threat|lost|stole)\b/i.test(command) && command.length > 18) draft.description = command;
    if (district) draft.district = district.trim();
    if (stateValue) draft.state = states.find((state) => state.toLowerCase() === stateValue.toLowerCase().trim());
    if (name) draft.reporterName = name;
    if (phone) { const digits = phone.replace(/\D/g, ""); draft.phone = digits.length === 10 ? `+91 ${digits}` : phone.trim(); }
    const type = ["counterfeit", "upi", "network", "scam", "other"].find((item) => new RegExp(`\\b${item}\\b`, "i").test(command));
    if (type) draft.type = type;
    return draft;
  };

  const applyDraft = (draft) => {
    let existing = {};
    try { existing = JSON.parse(localStorage.getItem("raksha_voice_report_draft") || "{}"); } catch { /* Ignore an invalid old draft. */ }
    localStorage.setItem("raksha_voice_report_draft", JSON.stringify({ ...existing, ...draft }));
    window.dispatchEvent(new CustomEvent("raksha:report-draft", { detail: draft }));
    setInput("description", draft.description); setInput("district", draft.district); setInput("state", draft.state); setInput("phone", draft.phone); setInput("name", draft.reporterName);
  };

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type !== "RAKSHA_VOICE_COMMAND") return;
    if (!request.baseOrigin || location.origin !== request.baseOrigin) {
      sendResponse({ message: "This tab is not the configured RAKSHA portal." });
      return;
    }
    const command = String(request.command || "").trim();
    const lower = command.toLowerCase();
    if (!command) { sendResponse({ message: "I did not hear a command. Please try again." }); return; }

    // When the portal's page agent is available, it has richer awareness of
    // the visible controls and retains its confirmation safeguards.
    if (document.documentElement.dataset.rakshaVoiceAgent === "ready") {
      window.dispatchEvent(new CustomEvent("raksha:voice-command", { detail: { command } }));
      sendResponse({ message: "Command sent to the RAKSHA page agent." });
      return;
    }
    if (/^(confirm|confirm submit|submit report)$/i.test(lower)) {
      if (location.pathname === "/report-fraud") { window.dispatchEvent(new Event("raksha:submit-fraud-report")); sendResponse({ message: "Submitting your report." }); }
      else { location.assign("/report-fraud"); sendResponse({ message: "Opened the report. Say confirm submit once you have reviewed it." }); }
      return;
    }
    const draft = parseDraft(command);
    if (Object.keys(draft).length) {
      applyDraft(draft);
      if (location.pathname !== "/report-fraud") location.assign("/report-fraud");
      sendResponse({ message: `Filled ${Object.keys(draft).join(", ")}.` });
      return;
    }
    const route = routes.find(([terms]) => terms.some((term) => lower.includes(term)));
    if (route) { location.assign(route[1]); sendResponse({ message: route[2] }); return; }
    sendResponse({ message: "Try: take me to dashboard, report fraud, or say your district, state, phone, or description." });
  });
})();
