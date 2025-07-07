const router = require('express').Router()
const db = require('../db')
const checkAuth = require('../middleware/auth')

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM inventory;')
  const data = {items: rows, loggedIn: req.session.loggedIn}
  if (req.session.loggedIn) {
    const [[{cartCount}]] = await db.query(
      'SELECT SUM(quantity) AS cartCount FROM cart WHERE user_id=?;',
      [req.session.userId]
    )
    data.cartCount = cartCount || 0
  }
  res.render('index', data)
})

router.get('/login', async (req, res) => {
  res.render('login')
})

router.get('/create-account', async (req, res) => {
  res.render('signup')
})

router.get('/product/:id', async (req, res) => {
  const [[product]] = await db.query(
    'SELECT * FROM inventory WHERE id=?;',
    [req.params.id]
  )
  const data = {product, loggedIn: req.session.loggedIn}
  if (req.session.loggedIn) {
    const [[{cartCount}]] = await db.query(
      'SELECT SUM(quantity) AS cartCount FROM cart WHERE user_id=?;',
      [req.session.userId]
    )
    data.cartCount = cartCount || 0
  }
  res.render('product', data)
})

router.get('/cart', checkAuth, async (req, res) => {
  const [cartItems] = await db.query(
    `SELECT
        cart.id,
        cart.inventory_id AS inventoryId,
        cart.quantity,
        inventory.price,
        ROUND(inventory.price * cart.quantity, 2) AS calculatedPrice,
        inventory.name,
        inventory.image,
        inventory.quantity AS inventoryQuantity
      FROM cart LEFT JOIN inventory ON cart.inventory_id=inventory.id
      WHERE cart.user_id=?`,
    [req.session.userId]
  )
  res.render('cart', {
    loggedIn: req.session.loggedIn,
    cartItems,
    total: cartItems.reduce(
      (total, item) => item.calculatedPrice + total, 0
    ).toFixed(2)
  })
})

module.exports = router
