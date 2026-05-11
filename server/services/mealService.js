const Meal = require('../models/Meal')

async function createMeal(userId, { imageUrl, tag, amountSpent, note, occurredAt }) {
  if (!occurredAt) {
    throw new Error('occurredAt is required')
  }

  const meal = await Meal.create({
    userId,
    imageUrl: imageUrl ?? null,
    tag,
    amountSpent: tag === 'CLEAN' ? null : amountSpent,
    note: note ?? null,
    occurredAt,
  })

  return meal
}

async function getMeals(userId) {
  return Meal.find({ userId }).sort({ occurredAt: -1 })
}

async function getMealsByDate(userId, dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('date must be in YYYY-MM-DD format')
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const start = new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
  const end = new Date(year, month - 1, day, 23, 59, 59, 999).getTime()

  const meals = await Meal.find({
    userId,
    occurredAt: { $gte: start, $lte: end },
  }).sort({ occurredAt: -1 })

  return meals
}

async function updateMeal(userId, mealId, { tag, amountSpent, note }) {
  const updates = {
    tag,
    amountSpent: tag === 'CLEAN' ? null : amountSpent,
    note: note ?? null,
  }

  const meal = await Meal.findOneAndUpdate({ _id: mealId, userId }, updates, {
    new: true,
    runValidators: true,
  })

  if (!meal) {
    throw new Error('Meal not found')
  }

  return meal
}

async function deleteMeal(userId, mealId) {
  const meal = await Meal.findOneAndDelete({ _id: mealId, userId })
  if (!meal) {
    throw new Error('Meal not found')
  }
  return true
}

module.exports = { createMeal, getMeals, getMealsByDate, updateMeal, deleteMeal }
