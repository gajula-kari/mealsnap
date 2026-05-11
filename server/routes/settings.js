const express = require('express')
const router = express.Router()
const {
  getSettingsController,
  upsertSettingsController,
} = require('../controllers/settingsController')

router.get('/', getSettingsController)
router.patch('/', upsertSettingsController)

module.exports = router
