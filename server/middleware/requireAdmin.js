const { clerkClient } = require("@clerk/express");
const { requireAuth } = require("./requireAuth");

function parseAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.toLowerCase().trim())
      .filter(Boolean)
  );
}

async function getAdminContext(userId) {
  const adminEmails = parseAdminEmails();
  if (adminEmails.size === 0) {
    throw new Error("ADMIN_EMAILS is not configured");
  }

  const user = await clerkClient.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase().trim() ?? null;

  return {
    userEmail,
    isAdmin: Boolean(userEmail && adminEmails.has(userEmail)),
  };
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, async () => {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const { userEmail, isAdmin } = await getAdminContext(userId);
      req.userEmail = userEmail ?? undefined;

      if (!isAdmin) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof Error && error.message === "ADMIN_EMAILS is not configured") {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: "Failed to load user from Clerk" });
    }
  });
}

module.exports = { requireAdmin, getAdminContext };
