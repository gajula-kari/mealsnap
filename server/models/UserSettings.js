const { Schema, model } = require('mongoose')

const userSettingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    monthlyOutsideGoal: { type: Number, default: null },
    previousGoal: { type: Number, default: null },
    reminderEnabled: { type: Boolean, default: false },
    reminderTime: { type: String, default: null },
    goalUpdatedAt: { type: Number, default: null },
  },
  { timestamps: true }
)

module.exports = model('UserSettings', userSettingsSchema)
