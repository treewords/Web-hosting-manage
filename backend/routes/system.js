const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/system/stats
// @desc    Get current system resource stats
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        // We can gather multiple stats in parallel
        const [cpu, mem, fs] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize()
        ]);

        // Find the main filesystem (usually the first one or the one for '/')
        const mainFs = fs.find(f => f.mount === '/') || fs[0];

        const stats = {
            cpu: {
                currentLoad: cpu.currentLoad.toFixed(2), // %
                cores: cpu.cpus.length
            },
            memory: {
                total: mem.total,
                used: mem.used,
                free: mem.free,
                usedPercent: ((mem.used / mem.total) * 100).toFixed(2)
            },
            disk: {
                total: mainFs.size,
                used: mainFs.used,
                free: mainFs.size - mainFs.used,
                usedPercent: mainFs.use.toFixed(2)
            }
        };

        res.json(stats);

    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
