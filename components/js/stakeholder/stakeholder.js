const stakeholderLimitQueryValue = "reached";
const stakeholderDailyLimit = 10;
const stakeholderQuotaCollection = "automationQuota";
const stakeholderFirestoreProjectId = "join-issue-collector-b5f54";


/**
 * Initializes the public stakeholder page and loads today's shared quota.
 */
async function initStakeholderPage() {
  const state = getStakeholderPageState(window.location.search);
  renderStakeholderPageState(state);
  if (state.demoOverride) return;
  const requestCount = await loadStakeholderQuota();
  renderStakeholderPageState(createStakeholderPageState(requestCount));
}


/**
 * Builds the display state represented by a stakeholder page query string.
 * @param {string} search - URL query string, including its leading question mark.
 * @returns {{demoOverride: boolean, limitReached: boolean, requestCount: number, view: string}} Page state.
 */
function getStakeholderPageState(search) {
  const demoOverride =
    new URLSearchParams(search).get("limit") === stakeholderLimitQueryValue;
  return createStakeholderPageState(demoOverride ? stakeholderDailyLimit : 0, {
    demoOverride,
  });
}


/**
 * Creates a safe display state from a persisted request count.
 * @param {number} requestCount - Number of automation slots used today.
 * @param {{demoOverride?: boolean}} [options] - Optional Figma demo state.
 * @returns {{demoOverride: boolean, limitReached: boolean, requestCount: number, view: string}} Page state.
 */
function createStakeholderPageState(requestCount, options = {}) {
  const normalizedCount = Math.min(
    stakeholderDailyLimit,
    Math.max(0, Number.isFinite(Number(requestCount)) ? Number(requestCount) : 0),
  );
  const limitReached = normalizedCount >= stakeholderDailyLimit;
  return {
    demoOverride: Boolean(options.demoOverride),
    limitReached,
    requestCount: normalizedCount,
    view: limitReached ? "limit" : "default",
  };
}


/**
 * Loads today's public quota document directly from Firestore REST.
 * Missing documents and temporary network errors represent an unused counter.
 * @param {Function} [fetchImpl] - Fetch implementation, injectable for tests.
 * @returns {Promise<number>} Persisted number of used automation slots.
 */
async function loadStakeholderQuota(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(getStakeholderQuotaUrl());
    if (!response.ok) return 0;
    const document = await response.json();
    return Number(document?.fields?.used?.integerValue ?? 0);
  } catch {
    return 0;
  }
}


/**
 * Builds the REST URL for today's quota document in the Berlin time zone.
 * @param {Date} [date] - Current instant, injectable for tests.
 * @returns {string} Firestore document endpoint.
 */
function getStakeholderQuotaUrl(date = new Date()) {
  const day = getBerlinDateKey(date);
  return `https://firestore.googleapis.com/v1/projects/${stakeholderFirestoreProjectId}/databases/(default)/documents/${stakeholderQuotaCollection}/${day}`;
}


/**
 * Formats an instant as YYYY-MM-DD for the Europe/Berlin calendar day.
 * @param {Date} date - Instant to format.
 * @returns {string} Berlin-local date key.
 */
function getBerlinDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
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
    `${requestCount} of ${stakeholderDailyLimit} requests used today`,
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
