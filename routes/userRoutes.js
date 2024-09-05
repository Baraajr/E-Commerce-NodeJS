const express = require('express');
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');

const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedUserValidator,
} = require('../utils/validators/userValidator');

const router = express.Router();

//protecting all the routes
router.use(authControllers.protect);

/////////////////////////////      logged user ROUTES      /////////////////////////////

router.get(
  '/getMe',
  userControllers.getLoggedUserData,
  userControllers.getUser,
);

router.patch(
  '/updateMe',
  updateLoggedUserValidator,
  userControllers.uploadUserImage,
  userControllers.resizeImage,
  userControllers.updateLoggedUserData,
);

router.patch('/changeMyPassword', userControllers.updateLoggedUserPassword);

router.delete('/deleteMe', userControllers.deleteLoggedUserData);

/////////////////////////////      only  admins ROUTES      /////////////////////////////

router.use(authControllers.restrictTo('admin', 'manager'));

// change the user password by the admin
router.patch(
  '/changePassword/:id',
  changeUserPasswordValidator,
  userControllers.updateUserPassword,
);

// update the role of the user by the admin
router.patch('/updateRole/:id', userControllers.updateUserRole);

/////////////////////////////      MAIN CRUDS ROUTES      /////////////////////////////

router
  .route('/')
  .get(userControllers.getAllUsers)
  .post(
    userControllers.uploadUserImage,
    userControllers.resizeImage,
    createUserValidator,
    userControllers.createUser,
  );

router
  .route('/:id')
  .get(getUserValidator, userControllers.getUser)
  .patch(
    userControllers.uploadUserImage,
    userControllers.resizeImage,
    updateUserValidator,
    userControllers.updateUser,
  )
  .delete(deleteUserValidator, userControllers.deleteUser);

module.exports = router;
