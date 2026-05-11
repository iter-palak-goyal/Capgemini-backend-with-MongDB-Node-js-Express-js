const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing" });
    }

    const accessToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next(); // Pass control to the next middleware or route handler
  } catch (error) {
    // Distinguish expired vs invalid
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Access token expired. Please refresh." });
    }
    return res.status(401).json({ message: "Invalid access token" });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next(); 
  };
};
