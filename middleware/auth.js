const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
   const authHeader = req.headers.authorization;

if (!authHeader) {
  return res.status(401).json({
    message: "Authentication required"
  });
}

const token = authHeader.startsWith("Bearer ")
  ? authHeader.split(" ")[1]
  : authHeader;
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = auth;
