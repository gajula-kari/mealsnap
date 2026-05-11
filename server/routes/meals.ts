import { Router } from 'express'
import {
  createMealController,
  getMealsController,
  updateMealController,
  deleteMealController,
} from '../controllers/mealsController'

const router = Router()

router.get('/', getMealsController)
router.post('/', createMealController)
router.patch('/:id', updateMealController)
router.delete('/:id', deleteMealController)

export default router
