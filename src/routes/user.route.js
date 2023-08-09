const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/', auth, isAdmin, userController.getUsers);
router.post('/', auth, isAdmin, userController.createUser);

router.get('/:userId', auth, userController.getUser);
router.put('/:userId', auth, userController.updateUser);
router.delete('/:userId', auth, userController.deleteUser);


module.exports = router;

