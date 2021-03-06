import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { createLogger, format, transports } from 'winston'
import { retrieveUserByUserName } from '../models'
import { compareHash } from '../services'
import { validate } from '../services/validation'

dotenv.config()
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports : []
})
if (process.env.CONSOLELOG === 'true') {
  logger.add(new transports.Console())
}
if (process.env.LOGFILE === 'true') {
  logger.add(new transports.File({ filename: 'logs.log' }))
}

// post/token #returns a token
export async function token (req: Request, res: Response) {
  const valid = validate(req, res)
  if (!valid) {
    return
  } else {
    req.body = valid
  }
  try {
    const userExists = await retrieveUserByUserName(req.body.userName)
    if (userExists) {
      const result = await compareHash(userExists, req.body.pssword)
      if (result) {
        const authData = {
          id: userExists.id,
          userName: userExists.userName,
          role: userExists.role
        }
        logger.info(authData)
        jwt.sign({ authData }, 'secret',{ expiresIn: '1h' }, (_err, token) => {
          res.json({ token })
        })
      } else {
        res.sendStatus(401)
      }
    } else {
      res.sendStatus(404)
    }
  } catch (error) {
    logger.error(error)
    res.sendStatus(500)
  }
}
