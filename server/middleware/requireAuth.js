const { getAuth } = require("@clerk/express");

function extractUserEmail(claims) {
  const rawEmail = claims?.email ?? claims?.email_address ?? claims?.primaryEmailAddress ?? null;
  if (!rawEmail) return null;
  return rawEmail.toLowerCase().trim();
}

function requireAuth(req, res, next) {
  const auth = getAuth(req);
  const sessionClaims = auth?.sessionClaims;
  const userId = sessionClaims?.userId || auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = userId;
  req.userEmail = extractUserEmail(sessionClaims) ?? undefined;
  next();
}

module.exports = { requireAuth };
