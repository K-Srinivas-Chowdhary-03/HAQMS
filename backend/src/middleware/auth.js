const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "my-super-secret-secret-key-12345!!!";

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 🔥 FIX: Strict expiration tracking enabled (removed ignoreExpiration configuration parameter)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user details to request object
    req.user = decoded;
    next();
  } catch (error) {
    // 🔥 FIX: Generic secure message applied to prevent system details leak to the client
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Role authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized. User context missing." });
    }

    // Role-based verification
    if (roles.length && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: `Forbidden. Requires role: ${roles.join(" or ")}` });
    }

    next();
  };
};

// 🔥 FIX: Operationalized legacy administrator verification check to block privilege escalation exploits
const authorizeAdminOnlyLegacy = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied. Admin access only." });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeAdminOnlyLegacy,
};
