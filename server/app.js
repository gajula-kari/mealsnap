const express = require('express')
const cors = require('cors')
const mealsRouter = require('./routes/meals')
const settingsRouter = require('./routes/settings')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/meals', mealsRouter)
app.use('/settings', settingsRouter)

module.exports = app
