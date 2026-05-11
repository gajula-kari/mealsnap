const { Schema, model } = require('mongoose')

const mealSchema = new Schema(
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

module.exports = model('Meal', mealSchema)
