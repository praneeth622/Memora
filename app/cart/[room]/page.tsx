'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  CreditCard,
  Package,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

// TypeScript interfaces
interface CartPageProps {
  params: {
    room: string
  }
  searchParams: {
    username?: string
  }
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  description?: string
}

interface FormErrors {
  email?: string
  address?: string
  city?: string
  zipCode?: string
}

// Mock cart data for development
const mockCartItems: CartItem[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    quantity: 1,
    description: 'High-quality noise-canceling headphones'
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    price: 399.99,
    quantity: 2,
    description: 'Advanced fitness tracking and notifications'
  },
  {
    id: '3',
    name: 'Portable Bluetooth Speaker',
    price: 89.99,
    quantity: 1,
    description: 'Waterproof speaker with 12-hour battery'
  }
]

export default function CartPage({ params, searchParams }: CartPageProps) {
  const router = useRouter()
  const { room } = params
  const { username } = searchParams

  // State management
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Checkout form state
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')

  // Decode URL parameters
  const decodedRoom = decodeURIComponent(room)
  const decodedUsername = username ? decodeURIComponent(username) : 'Guest'

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08 // 8% tax
  const shipping = subtotal > 100 ? 0 : 9.99
  const total = subtotal + tax + shipping

  // Cart item management
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setCartItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeItem = (itemId: string) => {
    setCartItems(items => items.filter(item => item.id !== itemId))
  }

  // Form validation
  const validateField = (fieldName: string, value: string): string | undefined => {
    const trimmedValue = value.trim()
    
    switch (fieldName) {
      case 'email':
        if (!trimmedValue) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) return 'Invalid email format'
        break
      case 'address':
        if (!trimmedValue) return 'Address is required'
        break
      case 'city':
        if (!trimmedValue) return 'City is required'
        break
      case 'zipCode':
        if (!trimmedValue) return 'ZIP code is required'
        if (!/^\d{5}(-\d{4})?$/.test(trimmedValue)) return 'Invalid ZIP code format'
        break
    }
    
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const emailError = validateField('email', email)
    const addressError = validateField('address', address)
    const cityError = validateField('city', city)
    const zipCodeError = validateField('zipCode', zipCode)
    
    if (emailError) newErrors.email = emailError
    if (addressError) newErrors.address = addressError
    if (cityError) newErrors.city = cityError
    if (zipCodeError) newErrors.zipCode = zipCodeError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case 'email': setEmail(value); break
      case 'address': setAddress(value); break
      case 'city': setCity(value); break
      case 'zipCode': setZipCode(value); break
    }
    
    // Clear error for this field when user starts typing
    if (errors[fieldName as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }))
    }
  }

  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName))
    
    const error = validateField(fieldName, value)
    if (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }

  const shouldShowError = (fieldName: string): boolean => {
    return touchedFields.has(fieldName) && !!errors[fieldName as keyof FormErrors]
  }

  // Checkout process
  const handleCheckout = async () => {
    setTouchedFields(new Set(['email', 'address', 'city', 'zipCode']))
    
    if (!validateForm()) {
      return
    }
    
    setIsCheckingOut(true)
    
    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to success page or back to chat
      router.push(`/chat/${room}?username=${username}&checkout=success`)
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleBackToChat = () => {
    router.push(`/chat/${room}?username=${username}`)
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Your Cart is Empty
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              No items in your cart for room "{decodedRoom}"
            </p>
          </CardHeader>
          
          <CardContent>
            <Button 
              onClick={handleBackToChat}
              className="w-full transition-all duration-200 hover:shadow-md"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToChat}
            className="mb-4 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {decodedRoom}
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
              <p className="text-sm text-muted-foreground">
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} • {decodedUsername}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Items in Cart</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center space-x-4">
                      {/* Item Image Placeholder */}
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {index < cartItems.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-4">
            {/* Order Summary */}
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600' : ''}>
                      {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Free shipping on orders over $100
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={() => setShowCheckout(!showCheckout)}
                  className="w-full transition-all duration-200 hover:shadow-md"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {showCheckout ? 'Hide Checkout' : 'Proceed to Checkout'}
                </Button>
              </CardContent>
            </Card>

            {/* Checkout Form */}
            {showCheckout && (
              <Card className="shadow-lg border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Checkout Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={(e) => handleFieldBlur('email', e.target.value)}
                        className={shouldShowError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
                        disabled={isCheckingOut}
                      />
                      {shouldShowError('email') && (
                        <p className="text-sm text-destructive font-medium flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Address Field */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Street Address
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="123 Main Street"
                        value={address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        onBlur={(e) => handleFieldBlur('address', e.target.value)}
                        className={shouldShowError('address') ? 'border-destructive focus-visible:ring-destructive' : ''}
                        disabled={isCheckingOut}
                      />
                      {shouldShowError('address') && (
                        <p className="text-sm text-destructive font-medium flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.address}
                        </p>
                      )}
                    </div>

                    {/* City and ZIP */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          City
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="New York"
                          value={city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          onBlur={(e) => handleFieldBlur('city', e.target.value)}
                          className={shouldShowError('city') ? 'border-destructive focus-visible:ring-destructive' : ''}
                          disabled={isCheckingOut}
                        />
                        {shouldShowError('city') && (
                          <p className="text-xs text-destructive font-medium">
                            {errors.city}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-sm font-medium">
                          ZIP Code
                        </Label>
                        <Input
                          id="zipCode"
                          type="text"
                          placeholder="10001"
                          value={zipCode}
                          onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                          onBlur={(e) => handleFieldBlur('zipCode', e.target.value)}
                          className={shouldShowError('zipCode') ? 'border-destructive focus-visible:ring-destructive' : ''}
                          disabled={isCheckingOut}
                        />
                        {shouldShowError('zipCode') && (
                          <p className="text-xs text-destructive font-medium">
                            {errors.zipCode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full transition-all duration-200 hover:shadow-md"
                      disabled={isCheckingOut}
                      size="lg"
                    >
                      {isCheckingOut ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Complete Order • ${total.toFixed(2)}</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}