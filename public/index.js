async function updateCartQuantity(e) {
  const cartId = e.target.getAttribute('data-cart-id')
  const quantity = +e.target.value
  const min = +e.target.min
  const max = +e.target.max
  if (quantity > max || quantity < min) return
  await fetch(`/api/cart/${cartId}`, {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({quantity})
  })
  window.location.replace('/cart')
}

for (const btn of document.querySelectorAll('.cart-item-controls input')) {
  btn.onchange = updateCartQuantity
}

async function deleteCart(e) {
  e.preventDefault()
  await fetch('/api/cart', {
    method: 'DELETE'
  })
  window.location.replace('/cart')
}

const emptyCartBtn = document.getElementById('emptyCart')
if (emptyCartBtn)
  emptyCartBtn.onclick = deleteCart

async function removeFromCart(e) {
  const cartId = e.target.getAttribute('data-cart-id')
  await fetch(`/api/cart/${cartId}`, {
    method: 'delete'
  })
  window.location.replace('/cart')
}

for (const btn of document.querySelectorAll('.remove-from-cart')) {
  btn.onclick = removeFromCart
}
