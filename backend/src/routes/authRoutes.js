import express from 'express'
import {
  registerUser,
  loginUser,
  authenticateToken,
  checkToken,
  refreshAccessToken,
} from '../controllers/authController.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/check-token', authenticateToken, checkToken)
router.post('/refresh-token', refreshAccessToken)

export default router
