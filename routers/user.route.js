import express from "express";
import { deleteUserByID, getAllUsers, getUserInfo, loginUser, registerUser, updateUserInfo, updateUserPsw, uploadPfp } from "../controllers/user.ctrl.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
const userRouter = express.Router();

userRouter
    .post('/register', registerUser)
    .post('/login', loginUser)
    .get('/me', isAuthenticated, getUserInfo)
    .get('/all-users', isAuthenticated, authorizeRoles([1]), getAllUsers)
    .post('/upload-pfp', isAuthenticated, uploadPfp)
    .patch('/update-user-info', isAuthenticated, updateUserInfo)
    .patch('/update-user-psw', isAuthenticated, updateUserPsw)
    .delete('/delete-user/:id', isAuthenticated, authorizeRoles([1]), deleteUserByID);

export default userRouter;