import { Router } from 'express'
import { getSettingsController, upsertSettingsController } from '../controllers/settingsController'

const router = Router()

router.get('/', getSettingsController)
router.patch('/', upsertSettingsController)

export default router
