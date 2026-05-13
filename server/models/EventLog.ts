import { Schema, model } from 'mongoose'

export type InstallEvent = 'install_clicked' | 'app_installed' | 'uninstall_detected'

export interface IEventLog {
  userId: string
  event: InstallEvent
  occurredAt: number
}

const eventLogSchema = new Schema<IEventLog>(
  {
    userId: { type: String, required: true },
    event: {
      type: String,
      enum: ['install_clicked', 'app_installed', 'uninstall_detected'],
      required: true,
    },
    occurredAt: { type: Number, required: true },
  },
  { timestamps: true }
)

export default model<IEventLog>('EventLog', eventLogSchema)
