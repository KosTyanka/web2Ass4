require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const path = require('path')
const MongoStore = require('connect-mongo')
const authRoutes = require('./routes/auth')
const resetRoutes = require('./routes/reset')
const userRoutes = require('./routes/user')
const app = express()

mongoose.set('strictQuery', true)
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login')
  }
  next()
}

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 3600000 }
  })
)

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user
  next()
})

app.use('/', authRoutes)
app.use('/', resetRoutes)
app.use('/', userRoutes)

app.get('/', isAuthenticated, (req, res) => {
  res.render('index')
})

app.listen(process.env.PORT || 3000)
