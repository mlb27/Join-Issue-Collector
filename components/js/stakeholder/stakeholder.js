const stakeholderLimitQueryValue = "reached";


/**
 * Initializes the public stakeholder page from its demo query parameters.
 */
function initStakeholderPage() {
  const state = getStakeholderPageState(window.location.search);
  renderStakeholderPageState(state);
}


/**
 * Builds the display state represented by a stakeholder page query string.
 * @param {string} search - URL query string, including its leading question mark.
 * @returns {{limitReached: boolean, requestCount: number, view: string}} Page state.
 */
function getStakeholderPageState(search) {
  const limitReached =
    new URLSearchParams(search).get("limit") === stakeholderLimitQueryValue;
  return {
    limitReached,
    requestCount: limitReached ? 10 : 0,
    view: limitReached ? "limit" : "default",
  };
}


/**
 * Applies a stakeholder display state to the rendered page.
 * @param {{limitReached: boolean, requestCount: number, view: string}} state - Page state to render.
 */
function renderStakeholderPageState(state) {
  const page = document.querySelector(".stakeholder-page");
  if (!page) return;
  page.classList.toggle("stakeholder-page--limit", state.limitReached);
  setElementText("stakeholderRequestCount", state.requestCount);
  updateStakeholderQuotaLabel(state.requestCount);
  toggleStakeholderViews(page, state.view);
}


/**
 * Keeps the quota's accessible label synchronized with its visible count.
 * @param {number} requestCount - Number of requests used today.
 */
function updateStakeholderQuotaLabel(requestCount) {
  getElement("stakeholderQuota")?.setAttribute(
    "aria-label",
    `${requestCount} of 10 requests used today`,
  );
}


/**
 * Shows only the stakeholder content variant selected by the page state.
 * @param {HTMLElement} page - Rendered stakeholder page root.
 * @param {string} activeView - Name of the view that should remain visible.
 */
function toggleStakeholderViews(page, activeView) {
  page.querySelectorAll("[data-stakeholder-view]").forEach((view) => {
    view.hidden = view.dataset.stakeholderView !== activeView;
  });
}
