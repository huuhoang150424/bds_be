import express from 'express';
const Router = express.Router();
import { verifyRole, paginationMiddleware } from '@middleware';
import { UserController } from '@controller';
import uploadCloud from '@config/cloudinary.config';
import { query } from 'express-validator';
import { UserAction } from '@models/enums';

Router.get('/getAllUser', verifyRole(['Admin']), paginationMiddleware, UserController.getAllUser as any);
Router.get('/:userId/getUser', verifyRole(['User', 'Agent']), UserController.getUserById as any);
Router.put(
  '/:userId/updateUser',
  uploadCloud.single('image'),
  verifyRole(['User', 'Agent']),
  UserController.updateUser as any,
);
Router.patch(
  '/:userId/toggleUserLock',
  verifyRole(['Admin']),
  [
    query('action')
      .customSanitizer((value) => value.toUpperCase())
      .isIn([...Object.values(UserAction)])
      .withMessage('Action must be either LOCK or UNLOCK'),
  ],
  UserController.toggleUserLock as any,
);
Router.patch('/updatePhone', verifyRole(['User', 'Agent']), UserController.updatePhone as any);
export default Router;
