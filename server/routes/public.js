const express = require('express');
const { lookupPincode, PublicDataError } = require('../services/publicData');

const router = express.Router();

// GET /api/public/pincode/:pincode – India Post lookup used to auto-fill city/state at registration
router.get('/pincode/:pincode', async (req, res) => {
  try {
    const result = await lookupPincode(req.params.pincode);
    return res.json(result);
  } catch (err) {
    if (err instanceof PublicDataError) {
      const status = { INVALID_INPUT: 400, NOT_FOUND: 404, RATE_LIMITED: 503, UNAVAILABLE: 503 }[err.code] || 502;
      return res.status(status).json({ error: err.message, code: err.code });
    }
    return res.status(500).json({ error: 'Pincode lookup failed' });
  }
});

module.exports = router;
