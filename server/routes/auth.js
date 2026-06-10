const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { getAdminContext } = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/auth/me", requireAuth, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { userEmail, isAdmin } = await getAdminContext(userId);
    res.json({ userId, email: userEmail, isAdmin });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_EMAILS is not configured") {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to load user from Clerk" });
  }
});

module.exports = router;
