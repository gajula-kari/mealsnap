const {
  createMeal,
  getMeals,
  getMealsByDate,
  updateMeal,
  deleteMeal,
} = require('../services/mealService')

async function createMealController(req, res) {
  try {
    const meal = await createMeal(req.body)
    res.status(201).json({ meal })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

async function getMealsController(req, res) {
  try {
    const { date } = req.query
    const meals = date ? await getMealsByDate(date) : await getMeals()
    res.json({ meals })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

async function updateMealController(req, res) {
  try {
    const meal = await updateMeal(req.params.id, req.body)
    res.json({ meal })
  } catch (err) {
    if (err.message === 'Meal not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(400).json({ error: err.message })
  }
}

async function deleteMealController(req, res) {
  try {
    await deleteMeal(req.params.id)
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
