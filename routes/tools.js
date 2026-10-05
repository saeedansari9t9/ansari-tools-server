const express = require('express');
const Tool = require('../models/Tool');
const ToolCredential = require('../models/ToolCredential');
const UserTool = require('../models/UserTool');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

// Legacy credential endpoint used by the extension. A current database-backed
// session and an active tool assignment are both required.
router.post('/get-credentials', userAuth, async (req, res) => {
  const requestedTool = typeof req.body.tool === 'string' ? req.body.tool.toLowerCase().trim() : '';
  if (!requestedTool || requestedTool.length > 100) {
    return res.status(400).json({ message: 'Valid tool name is required' });
  }

  try {
    const escapedTool = requestedTool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tool = await Tool.findOne({
      $or: [{ slug: requestedTool }, { name: { $regex: `^${escapedTool}$`, $options: 'i' } }],
      active: true,
    });
    if (!tool) return res.status(404).json({ message: 'Tool not found' });

    if (req.user.role !== 'admin') {
      const assignment = await UserTool.exists({
        user: req.user.userId,
        tool: tool._id,
        status: 'active',
        expiresAt: { $gt: new Date() },
      });
      if (!assignment) {
        return res.status(403).json({ message: 'Active subscription required' });
      }
    }

    const credential = await ToolCredential.findOne({ toolName: tool.name.toLowerCase() }).select('+password');
    if (!credential) return res.status(404).json({ message: 'Credentials not found' });

    res.set('Cache-Control', 'no-store');
    return res.json({ email: credential.email, password: credential.revealPassword() });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
