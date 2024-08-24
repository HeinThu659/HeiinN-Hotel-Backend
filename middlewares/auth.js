import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

// authenticated user
export const isAuthenticated = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({
            success: false,
            error: "Please login to access this resource.",
        });
    }
    const token = authHeader.split(' ')[1];
    if(!token) {
        return res.status(400).json({
            success: false,
            error: "Please login to access this resource.",
        });
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    if(!decoded) {
        return res.status(400).json({
            success: false,
            error: "access token is not valid.",
        });
    }
    const user = await UserModel.findById(decoded.id);
    if(!user) {
        return res.status(400).json({
            success: false,
            error: "Please login to access this resource.",
        });
    }
    req.user = user;
    next();
};

export const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({
                success: false,
                error: `Role: ${req.user?.role} is not allowed to access this resource`,
            });
        }
        next();
    }
}