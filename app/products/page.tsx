'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
// Removed: import { List } from '@/components/ui/list'

interface Product {
  id: number
  name: string
  price: number
  description: string
}

interface CartItem extends Product {
  quantity: number
}

export default function ProductsPage() {
  const [cart, setCart] = useState<CartItem[]>([])

  // Mock products data
  const products: Product[] = [
    { id: 1, name: "Laptop", price: 999.99, description: "High performance laptop" },
    { id: 2, name: "Smartphone", price: 699.99, description: "Latest smartphone" },
    { id: 3, name: "Headphones", price: 199.99, description: "Wireless headphones" },
  ]

  const addToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, { ...product, quantity }]
    })
  }

  const submitOrder = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!')
      return
    }
    
    // Here you would typically make an API call to submit the order
    console.log('Order submitted:', cart)
    alert('Order submitted successfully!')
    setCart([])
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Card key={product.id} className="p-4">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-lg font-bold mt-2">${product.price}</p>
            <div className="mt-4 flex gap-2">
              <Input
                type="number"
                min="1"
                defaultValue="1"
                className="w-20"
                id={`quantity-${product.id}`}
              />
              <Button
                onClick={() => {
                  const quantity = parseInt(
                    (document.getElementById(`quantity-${product.id}`) as HTMLInputElement).value
                  )
                  addToCart(product, quantity)
                }}
              >
                Add to Cart
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
        {cart.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            <ul className="space-y-2"> {/* Replaced List with ul */}
              {cart.map(item => (
                <li key={item.id} className="border-b pb-2"> {/* Replaced List.Item with li and added basic styling */}
                  {item.name} - Quantity: {item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                </li>
              ))}
            </ul> {/* Replaced /List with /ul */}
            <div className="mt-4">
              <p className="text-xl font-bold">
                Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
              </p>
              <Button onClick={submitOrder} className="mt-4">
                Submit Order
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
