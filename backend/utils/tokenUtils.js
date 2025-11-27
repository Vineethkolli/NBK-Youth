import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (payload) => {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      ...payload,
      iat: now,
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
