const express = require('express')
const cors = require('cors')
const mealsRouter = require('./routes/meals')

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/meals', mealsRouter)

module.exports = app
