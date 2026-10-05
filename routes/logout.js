const router = require("express").Router();
const { clearAdminCookieOptions, legacyAdminCookieOptions } = require('../utils/security');

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", clearAdminCookieOptions());
  res.clearCookie("admin_token", legacyAdminCookieOptions());

  res.set("Cache-Control", "no-store");
  return res.json({ ok: true });
});

module.exports = router;
