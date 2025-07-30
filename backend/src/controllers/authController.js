import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../index.js'

// ฟังก์ชันสร้าง access token และ refresh token
function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

// ลงทะเบียนผู้ใช้
export const registerUser = async (req, res) => {
  const { name, username, password, role } = req.body

  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อ, ชื่อผู้ใช้งาน, รหัสผ่าน และบทบาทให้ครบถ้วน' })
  }

  try {
    // ตรวจสอบว่าผู้ใช้ซ้ำไหม
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว' })
    }

    // แฮชรหัสผ่านก่อนเก็บ
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
      },
    })

    res.status(201).json({ message: 'ลงทะเบียนผู้ใช้เรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' })
  }
}

// เข้าสู่ระบบ
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const tokens = generateTokens(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};

// Middleware ตรวจสอบ access token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer token

  if (!token) {
    return res.status(401).json({ message: 'ไม่มีโทเค็นสำหรับตรวจสอบ' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'โทเค็นไม่ถูกต้องหรือหมดอายุแล้ว' })
    }
    req.user = user
    next()
  })
}

// ตรวจสอบ token ยัง valid หรือไม่
export const checkToken = (req, res) => {
  res.json({ valid: true, user: req.user })
}

// Refresh access token ใหม่จาก refresh token
export const refreshAccessToken = (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(401).json({ message: 'ไม่มี refresh token สำหรับตรวจสอบ' })
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'refresh token ไม่ถูกต้องหรือหมดอายุแล้ว' })
    }

    // สร้าง access token ใหม่
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    res.json({ token: accessToken })
  })
}
