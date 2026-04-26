import type { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

// Middleware для проверки ошибок валидации
export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  next()
}
