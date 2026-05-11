const express = require('express')
const router = express.Router()
const {
  createMealController,
  getMealsController,
  updateMealController,
  deleteMealController,
} = require('../controllers/mealsController')

router.get('/', getMealsController)
router.post('/', createMealController)
router.patch('/:id', updateMealController)
router.delete('/:id', deleteMealController)

module.exports = router
