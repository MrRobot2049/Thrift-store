const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // Prefer session-based auth (cookie)
  if (req.session && req.session.userId) {
    req.user = { id: req.session.userId };
    return next();
  }

  // Fallback to JWT auth
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = protect;
