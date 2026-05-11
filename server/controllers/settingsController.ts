import { type Request, type Response } from 'express'
import UserSettings from '../models/UserSettings'

export async function getSettingsController(req: Request, res: Response): Promise<void> {
  const userId = req.headers['x-user-id']
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'x-user-id header is required' })
    return
  }
  try {
    const settings = await UserSettings.findOne({ userId })
    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function upsertSettingsController(req: Request, res: Response): Promise<void> {
  const userId = req.headers['x-user-id']
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'x-user-id header is required' })
    return
  }
  try {
    const { monthlyOutsideGoal } = req.body as { monthlyOutsideGoal: number }
    const existing = await UserSettings.findOne({ userId })

    const update: Record<string, unknown> = { monthlyOutsideGoal, goalUpdatedAt: Date.now() }

    if (existing && existing.monthlyOutsideGoal !== monthlyOutsideGoal) {
      update.previousGoal = existing.monthlyOutsideGoal
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: update, $setOnInsert: { userId } },
      { upsert: true, new: true }
    )

    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}
