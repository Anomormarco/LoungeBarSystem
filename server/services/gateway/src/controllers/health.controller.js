function health(_req, res) {
  res.json({ status: "ok", service: "gateway" });
}

module.exports = {
  health,
};
