const {
  createMeal,
  getMeals,
  getMealsByDate,
  updateMeal,
  deleteMeal,
} = require('../services/mealService')

function getUserId(req, res) {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(400).json({ error: 'x-user-id header is required' })
    return null
  }
  return userId
}

async function createMealController(req, res) {
  const userId = getUserId(req, res)
  if (!userId) return
  try {
    const meal = await createMeal(userId, req.body)
    res.status(201).json({ meal })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

async function getMealsController(req, res) {
  const userId = getUserId(req, res)
  if (!userId) return
  try {
    const { date } = req.query
    const meals = date ? await getMealsByDate(userId, date) : await getMeals(userId)
    res.json({ meals })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

async function updateMealController(req, res) {
  const userId = getUserId(req, res)
  if (!userId) return
  try {
    const meal = await updateMeal(userId, req.params.id, req.body)
    res.json({ meal })
  } catch (err) {
    if (err.message === 'Meal not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(400).json({ error: err.message })
  }
}

async function deleteMealController(req, res) {
  const userId = getUserId(req, res)
  if (!userId) return
  try {
    await deleteMeal(userId, req.params.id)
    res.json({ success: true })
  } catch (err) {
    if (err.message === 'Meal not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(400).json({ error: err.message })
  }
}

module.exports = {
  createMealController,
  getMealsController,
  updateMealController,
  deleteMealController,
}
