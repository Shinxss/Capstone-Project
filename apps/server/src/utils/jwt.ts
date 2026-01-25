import jwt from "jsonwebtoken";

export function signAccessToken(payload: object, secret: string, expiresIn = "1d") {
  return jwt.sign(payload, secret, { expiresIn });
}
