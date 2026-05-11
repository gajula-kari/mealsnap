const UserSettings = require('../models/UserSettings')

const HARDCODED_USER_ID = 'user-123'

async function getSettingsController(req, res) {
  try {
    const settings = await UserSettings.findOne({ userId: HARDCODED_USER_ID })
    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

async function upsertSettingsController(req, res) {
  try {
    const { monthlyOutsideGoal } = req.body
    const existing = await UserSettings.findOne({ userId: HARDCODED_USER_ID })

    const update = { monthlyOutsideGoal, goalUpdatedAt: Date.now() }

    if (existing && existing.monthlyOutsideGoal !== monthlyOutsideGoal) {
      update.previousGoal = existing.monthlyOutsideGoal
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: HARDCODED_USER_ID },
      { $set: update, $setOnInsert: { userId: HARDCODED_USER_ID } },
      { upsert: true, new: true }
    )

    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getSettingsController, upsertSettingsController }
