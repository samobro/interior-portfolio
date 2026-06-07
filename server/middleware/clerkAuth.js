const { clerkClient } = require('@clerk/clerk-sdk-node');

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const payload = await clerkClient.verifyToken(token);
    const user = await clerkClient.users.getUser(payload.sub);
    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

    if (!allowedEmails.includes(email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.adminEmail = email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireAdmin };
