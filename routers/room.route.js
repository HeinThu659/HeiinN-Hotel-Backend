import express from 'express';
import { createNewRoom, deleteRoomByID, getAllRoom, getRoomByID, updateRoom } from '../controllers/room.ctrl.js';
import { authorizeRoles, isAuthenticated } from '../middlewares/auth.js';

const roomRouter = express.Router();

roomRouter
    .get('/all', getAllRoom)
    .get('/one/:id', getRoomByID)
    .post('/new', isAuthenticated, authorizeRoles([1, 2]), createNewRoom)
    .patch('/update/:id', isAuthenticated, authorizeRoles([1, 2]), updateRoom)
    .delete('/delete/:id', isAuthenticated, authorizeRoles([1, 2]), deleteRoomByID)

export default roomRouter;