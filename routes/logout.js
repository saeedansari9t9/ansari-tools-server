const router = require("express").Router();

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".ansaritools.com",
    path: "/",
  });

  res.clearCookie("user_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".ansaritools.com",
    path: "/",
  });

  res.set("Cache-Control", "no-store");
  return res.json({ ok: true });
});

module.exports = router;
