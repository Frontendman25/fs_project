import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'

// import authRoutes from './routes/auth';
// import { error } from 'console';

dotenv.config() // Загружаем переменные из .env

const app = express()

const PORT = process.env.PORT || 3100

app.use(express.json())
app.use(cookieParser())

// CORS с поддержкой cookies
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true // обязательно!
  })
)

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false, // Не сохраняем сессию если она не изменилась
    saveUninitialized: false, // Не сохраняем "пустую" сессию
    cookie: {
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
)

// app.use('/auth', authRoutes);

interface User {
  username: string
  password: string
}

const users: User[] = []

app.post('/register', (req: Request, res: Response): void => {
  const { username, password } = req.body
  const exists = users.find((user) => user.username === username)

  if (exists) {
    res.status(400).json({ message: 'User already exists' })
    return
  }

  users.push({ username, password })
  res.status(201).json({ message: 'User registered successfully' })
})

// Фейковая авторизация
app.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body

  const user = users.find(
    (u) => u.username === username && u.password === password
  )

  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET as string, {
    expiresIn: '1h'
  })

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false // true — если HTTPS
  })

  // req.session.user = { username };
  ;(req.session as any).user = { username }

  res.json({ message: 'Logged in', token })
})

function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies.token

  if (!token) {
    res.status(401).json({ message: 'No token provided' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string)
    ;(req as any).user = decoded

    next()
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' })
  }
}

app.get('/profile', authenticateJWT, (req: Request, res: Response) => {
  res.json({ profile: (req as any).user })
})

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('token')
    res.json({ message: 'Logged out' })
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`)
})
