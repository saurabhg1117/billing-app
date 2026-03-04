// Global error handler for API errors - triggers ErrorPopup
let showErrorCallback = null;

export function setErrorHandler(callback) {
  showErrorCallback = callback;
}

export function showError(message) {
  if (showErrorCallback) showErrorCallback(message);
}

export function getErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (msg) return msg;
  if (error?.response?.status === 400) return 'Bad request. Please check your input.';
  if (error?.response?.status === 404) return 'Not found.';
  if (error?.response?.status === 500) return 'Server error. Please try again later.';
  if (error?.message === 'Network Error') return 'Cannot connect. Check if the server is running.';
  if (error?.code === 'ECONNABORTED') return 'Request timed out.';
  return error?.message || 'Something went wrong';
}
