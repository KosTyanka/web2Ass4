const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const User = require('../models/User')
const router = express.Router()

router.get('/forgot', (req, res) => {
  res.render('forgot')
})

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).send('No user with that email')
    }
    const token = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = Date.now() + 3600000
    await user.save()
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
    const url = `http://${req.headers.host}/reset/${token}`
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      text: `Visit this URL to reset your password: ${url}`
    }
    await transporter.sendMail(mailOptions)
    res.send('A password reset link has been sent to your email')
  } catch {
    res.status(400).send('Forgot Password Error')
  }
})

router.get('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    })
    if (!user) {
      return res.status(400).send('Invalid or expired token')
    }
    res.render('reset', { token: req.params.token })
  } catch {
    res.status(400).send('Token Error')
  }
})

router.post('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    })
    if (!user) {
      return res.status(400).send('Invalid or expired token')
    }
    const { password } = req.body
    if (password.length < 6) {
      return res.status(400).send('Password must be at least 6 characters')
    }
    user.password = await bcrypt.hash(password, 10)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    res.send('Password reset successful. You can log in now.')
  } catch {
    res.status(400).send('Reset Password Error')
  }
})

module.exports = router
