// This middleware checks if the user's role is one of the allowed roles.
// It should be used AFTER the authMiddleware, as it depends on req.user.

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            // This case should technically be caught by authMiddleware first
            return res.status(401).json({ msg: 'Authorization denied, user role not found.' });
        }

        const userRole = req.user.role;

        if (allowedRoles.includes(userRole)) {
            // User has one of the allowed roles, proceed to the next middleware/route handler
            next();
        } else {
            // User's role is not in the allowed list
            res.status(403).json({ msg: 'Forbidden: You do not have the required permissions.' });
        }
    };
};

module.exports = checkRole;
