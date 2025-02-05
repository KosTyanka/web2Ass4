const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const router = express.Router()

function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login')
  }
  next()
}

router.get('/register', (req, res) => {
  res.render('register')
})

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).send('Missing fields')
    }
    if (password.length < 6) {
      return res.status(400).send('Password must be at least 6 characters')
    }
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).send('Email already in use')
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = new User({ name, email, password: hashed })
    await user.save()
    req.session.user = { id: user._id, name: user.name, email: user.email }
    res.redirect('/profile')
  } catch {
    res.status(400).send('Registration error')
  }
})

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).send('Missing fields')
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).send('Email not found')
    }
    if (user.isLocked) {
      return res.status(403).send('Account is locked')
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      user.loginAttempts++
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 3600000
      }
      await user.save()
      return res.status(400).send('Incorrect password')
    }
    user.loginAttempts = 0
    user.lockUntil = undefined
    await user.save()
    req.session.user = { id: user._id, name: user.name, email: user.email }
    res.redirect('/profile')
  } catch {
    res.status(400).send('Login error')
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
})

module.exports = router
