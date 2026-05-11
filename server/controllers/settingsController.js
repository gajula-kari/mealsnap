const UserSettings = require('../models/UserSettings')

async function getSettingsController(req, res) {
  const userId = req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'x-user-id header is required' })
  try {
    const settings = await UserSettings.findOne({ userId })
    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function upsertSettingsController(req, res) {
  const userId = req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'x-user-id header is required' })
  try {
    const { monthlyIndulgentLimit } = req.body
    const existing = await UserSettings.findOne({ userId })

    const update = { monthlyIndulgentLimit, goalUpdatedAt: Date.now() }

    if (existing && existing.monthlyIndulgentLimit !== monthlyIndulgentLimit) {
      update.previousGoal = existing.monthlyIndulgentLimit
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: update, $setOnInsert: { userId } },
      { upsert: true, new: true }
    )

    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getSettingsController, upsertSettingsController }
