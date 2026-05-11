const Meal = require('../models/Meal')

const HARDCODED_USER_ID = 'user-123'

async function createMeal({ imageUrl, tag, amountSpent, note, occurredAt }) {
  if (!occurredAt) {
    throw new Error('occurredAt is required')
  }

  const meal = await Meal.create({
    userId: HARDCODED_USER_ID,
    imageUrl: imageUrl ?? null,
    tag,
    amountSpent: tag === 'HOME' ? null : amountSpent,
    note: note ?? null,
    occurredAt,
  })

  return meal
}

async function getMeals() {
  return Meal.find({ userId: HARDCODED_USER_ID }).sort({ occurredAt: -1 })
}

async function getMealsByDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('date must be in YYYY-MM-DD format')
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const start = new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
  const end = new Date(year, month - 1, day, 23, 59, 59, 999).getTime()

  const meals = await Meal.find({
    userId: HARDCODED_USER_ID,
    occurredAt: { $gte: start, $lte: end },
  }).sort({ occurredAt: -1 })

  return meals
}

async function updateMeal(mealId, { tag, amountSpent, note }) {
  if (tag === 'OUTSIDE' && amountSpent == null) {
    throw new Error('amountSpent is required for OUTSIDE meals')
  }

  const updates = {
    tag,
    amountSpent: tag === 'HOME' ? null : amountSpent,
    note: note ?? null,
  }

  const meal = await Meal.findOneAndUpdate(
    { _id: mealId, userId: HARDCODED_USER_ID },
    updates,
    { new: true, runValidators: true },
  )

  if (!meal) {
    throw new Error('Meal not found')
  }

  return meal
}

async function deleteMeal(mealId) {
  const meal = await Meal.findOneAndDelete({ _id: mealId, userId: HARDCODED_USER_ID })
  if (!meal) {
    throw new Error('Meal not found')
  }
  return true
}

module.exports = { createMeal, getMeals, getMealsByDate, updateMeal, deleteMeal }
