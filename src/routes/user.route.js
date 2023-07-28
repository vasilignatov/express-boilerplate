const router = require('express').Router();
const userController = require('../controllers/user.controller');


router.post('/', userController.createUser);

router.get('/:userId', userController.getUser);
router.put('/:userId',userController.updateUser);
router.delete('/:userId',userController.deleteUser);



module.exports = router;

