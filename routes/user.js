const express = require('express')
const User = require('../models/User')
const router = express.Router()

function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login')
  }
  next()
}

router.get('/profile', isAuthenticated, (req, res) => {
  res.render('profile')
})

router.get('/profile/edit', isAuthenticated, (req, res) => {
  res.render('editProfile')
})

router.post('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).send('Name is required')
    }
    await User.findByIdAndUpdate(req.session.user.id, { name })
    req.session.user.name = name
    res.redirect('/profile')
  } catch {
    res.status(400).send('Error updating profile')
  }
})

router.post('/profile/delete', isAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.session.user.id)
    req.session.destroy(() => {
      res.redirect('/')
    })
  } catch {
    res.status(400).send('Error deleting account')
  }
})

module.exports = router
