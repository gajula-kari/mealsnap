import EventLog, { type InstallEvent } from '../models/EventLog'

export async function logEvent(userId: string, event: InstallEvent) {
  return EventLog.create({ userId, event, occurredAt: Date.now() })
}
