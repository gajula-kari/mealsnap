import { Schema, model } from 'mongoose'

export interface IUserSettings {
  userId: string
  monthlyOutsideGoal: number | null
  previousGoal: number | null
  reminderEnabled: boolean
  reminderTime: string | null
  goalUpdatedAt: number | null
}

const userSettingsSchema = new Schema<IUserSettings>(
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

export default model<IUserSettings>('UserSettings', userSettingsSchema)
