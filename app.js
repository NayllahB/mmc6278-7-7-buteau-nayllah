require('dotenv').config()
const express = require('express')
const exphbs = require('express-handlebars')
// Import the sessions packages
const apiRoutes = require('./routes/api-routes')
const htmlRoutes = require('./routes/html-routes')
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Add code to use sessions with a MySQL Store

app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')

app.use(express.static('public'))

app.use('/', htmlRoutes)
app.use('/api', apiRoutes)

module.exports = app
