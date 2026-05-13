import { Router } from 'express'
import { logEventController } from '../controllers/eventsController'

const router = Router()

router.post('/', logEventController)

export default router
