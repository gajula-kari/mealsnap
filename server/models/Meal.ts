import { Schema, model } from 'mongoose'

export type MealTag = 'CLEAN' | 'INDULGENT'

export interface IMeal {
  userId: string
  imageUrl: string | null
  tag: MealTag
  amountSpent: number | null
  note: string | null
  occurredAt: number
}

const mealSchema = new Schema<IMeal>(
  {
    userId: { type: String, required: true },
    imageUrl: { type: String, default: null },
    tag: { type: String, enum: ['CLEAN', 'INDULGENT'], required: true },
    amountSpent: { type: Number, default: null },
    note: { type: String, default: null },
    occurredAt: { type: Number, required: true },
  },
  { timestamps: true }
)

export default model<IMeal>('Meal', mealSchema)
