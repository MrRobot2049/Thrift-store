const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // Prefer explicit Authorization header when provided.
  // This avoids stale cookie sessions overriding a newly selected logged-in user.
  const authHeader = req.header("Authorization");
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        ...decoded,
        role: decoded.role || "user",
      };
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // Fallback to session-based auth (cookie)
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      role: req.session.userRole || "user",
    };
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};

module.exports = protect;
