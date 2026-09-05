/**
 * Requests a creator notification after a persisted board status change.
 * The webhook receives no recipient address; n8n reads the trusted creator
 * metadata from Firestore using the task id.
 *
 * @param {Object} task - Persisted task containing its id and creator metadata.
 * @param {string} previousStatus - Status before the board move.
 * @param {string} nextStatus - Persisted destination status.
 * @returns {Promise<boolean>} True when a webhook request was started.
 */
async function notifyTaskCreatorOfStatusChange(task, previousStatus, nextStatus) {
  if (!canNotifyTaskCreator(task, previousStatus, nextStatus)) return false;
  const webhookUrl = getTaskStatusWebhookUrl();
  if (!webhookUrl) return false;
  await fetch(webhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ taskId: task.id, previousStatus, nextStatus }),
  });
  return true;
}


/**
 * Checks whether a real column change has a creator who can receive email.
 * @param {Object} task - Task containing optional creator metadata.
 * @param {string} previousStatus - Status before the move.
 * @param {string} nextStatus - Requested destination status.
 * @returns {boolean} True when the notification request is meaningful.
 */
function canNotifyTaskCreator(task, previousStatus, nextStatus) {
  const email = String(task?.creator?.email || "").trim();
  return Boolean(
    task?.id &&
    previousStatus &&
    nextStatus &&
    previousStatus !== nextStatus &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  );
}


/**
 * Returns the locally configured n8n production webhook URL.
 * @returns {string} Valid HTTP(S) URL or an empty string when not configured.
 */
function getTaskStatusWebhookUrl() {
  const value = String(window.joinN8nStatusWebhookUrl || "").trim();
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
