// Format Mongoose validation and other errors for API response
function formatError(error) {
  if (error.code === 11000) {
    return 'A bill with this number already exists. Please try again.';
  }
  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors).map((e) => e.message);
    return messages.join('. ');
  }
  return error.message || 'Something went wrong';
}

module.exports = { formatError };
