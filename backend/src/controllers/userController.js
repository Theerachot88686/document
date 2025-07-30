import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ดึงรายชื่อผู้ใช้ทั้งหมด (ไม่รวมรหัสผ่าน)
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.status(200).json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: 'Failed to retrieve users.', error: error.message })
  }
}

// ดึงผู้ใช้ตาม id
export const getUserById = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid User ID provided.' })

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!user) return res.status(404).json({ message: 'User not found.' })

    res.status(200).json(user)
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error)
    res.status(500).json({ message: `Failed to retrieve user with ID ${id}.`, error: error.message })
  }
}

// สร้างผู้ใช้ใหม่ (hash password ก่อนเก็บ)
export const createUser = async (req, res) => {
  const { name, username, password, role } = req.body
  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields: name, username, password, role.' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    })
    res.status(201).json({ message: 'User created successfully.', user })
  } catch (error) {
    console.error("Error creating user:", error)
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return res.status(409).json({ message: 'Username already exists. Please use a different username.' })
    }
    res.status(400).json({ message: 'Failed to create user.', error: error.message })
  }
}

export const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid User ID provided.' });

  const { name, username, role, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return res.status(404).json({ message: 'User not found.' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) updateData.role = role;

    // ถ้ามีการส่ง password มา ให้แฮชก่อนเก็บ
    if (password !== undefined && password.trim() !== '') {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ message: 'User updated successfully.', user });
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return res.status(409).json({ message: 'Username already exists. Please use a different username.' });
    }
    res.status(400).json({ message: `Failed to update user with ID ${id}.`, error: error.message });
  }
};

// ลบผู้ใช้
export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid User ID provided.' })

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) return res.status(404).json({ message: 'User not found.' })

    await prisma.user.delete({ where: { id } })
    res.status(200).json({ message: 'User deleted successfully.' })
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error)
    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'Cannot delete user. It is associated with other records.',
        error: error.message,
      })
    }
    res.status(400).json({ message: `Failed to delete user with ID ${id}.`, error: error.message })
  }
}
