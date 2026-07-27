export function errorHandler(err, _req, res, _next) {
  if (err.name === "MulterError" || err.message === "Unsupported file type") {
    return res.status(400).json({ success: false, message: err.message });
  }
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
}
