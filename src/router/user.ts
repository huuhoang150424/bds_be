import express from 'express';
const Router = express.Router();
import { verifyRole, paginationMiddleware } from '@middleware';
import { UserController } from '@controller';
import uploadCloud from '@config/cloudinary.config';
import { query } from 'express-validator';
import { Roles, UserAction } from '@models/enums';

Router.get('/getAllUser', verifyRole([Roles.Admin]), paginationMiddleware, UserController.getAllUser as any);
Router.get('/:userId/getUser', verifyRole([Roles.User, Roles.Agent]), UserController.getUserById as any);
Router.put(
  '/:userId/updateUser',
  uploadCloud.single('image'),
  verifyRole([Roles.User, Roles.Agent]),
  UserController.updateUser as any,
);
Router.patch(
  '/:userId/toggleUserLock',
  verifyRole([Roles.Admin]),
  [
    query('action')
      .customSanitizer((value) => value.toUpperCase())
      .isIn([...Object.values(UserAction)])
      .withMessage('Action must be either LOCK or UNLOCK'),
  ],
  UserController.toggleUserLock as any,
);
Router.patch('/updatePhone', verifyRole([Roles.User, Roles.Agent]), UserController.updatePhone as any);
export default Router;
