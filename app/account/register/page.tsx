"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddressDropdown } from '@/components/AddressDropdown'
import { Loader2, Eye, EyeOff, User, Mail, Phone, MapPin, Lock } from 'lucide-react'
import Link from 'next/link'

interface NameData {
  first_name: string
  middle_name: string
  last_name: string
  suffix: string
}

interface AddressData {
  region: string
  province: string
  city: string
  barangay: string
  street: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface FormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  name: NameData
  phone_number: string
  address: AddressData
  gender: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    name: {
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: ''
    },
    phone_number: '',
    address: {
      region: '',
      province: '',
      city: '',
      barangay: '',
      street: ''
    },
    gender: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Calculate progress
  const calculateProgress = () => {
    const requiredFields = [
      formData.email,
      formData.password,
      formData.name.first_name,
      formData.name.last_name,
      formData.address.region,
      formData.address.province,
      formData.address.city,
      formData.address.barangay
    ]
    const filledFields = requiredFields.filter(field => field.trim() !== '').length
    return (filledFields / requiredFields.length) * 100
  }

  // Update full_name when name parts change
  const updateFullName = (nameData: NameData) => {
    const parts = [
      nameData.first_name,
      nameData.middle_name,
      nameData.last_name,
      nameData.suffix
    ].filter(part => part.trim() !== '')
    
    setFormData(prev => ({
      ...prev,
      full_name: parts.join(' ')
    }))
  }

  const handleNameChange = (field: keyof NameData, value: string) => {
    const newNameData = { ...formData.name, [field]: value }
    setFormData(prev => ({
      ...prev,
      name: newNameData
    }))
    updateFullName(newNameData)
  }

  const handleAddressChange = (address: AddressData) => {
    setFormData(prev => ({
      ...prev,
      address
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      setError('Email, password, and full name are required')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          name: formData.name,
          phone_number: formData.phone_number || undefined,
          address: formData.address,
          gender: formData.gender || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess('Registration successful! Redirecting to login...')
      
      // Redirect after success
      setTimeout(() => {
        router.push('/account/login?message=Registration successful. Please log in.')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-accent p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Smart Echo Drain
          </h1>
          <p className="text-white/90 text-lg">
            Create Your Account
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white to-white/80 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/80 text-sm text-center mt-2">
            {Math.round(progress)}% Complete
          </p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gradient">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Join Smart Echo Drain monitoring system
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Status Messages */}
              {error && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-500/50 bg-green-50 text-green-700">
                  <AlertDescription className="font-medium">{success}</AlertDescription>
                </Alert>
              )}

              {/* Account Information Section */}
              <div className="form-section bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                        className="pl-10 border-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                        Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter password"
                          className="pl-10 pr-10 border-primary/20 focus:border-primary"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/80">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm password"
                          className="pl-10 pr-10 border-primary/20 focus:border-primary"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="form-section bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-6 border border-accent/20">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-foreground/80">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.name.first_name}
                        onChange={(e) => handleNameChange('first_name', e.target.value)}
                        placeholder="First name"
                        className="border-accent/20 focus:border-accent"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="middleName" className="text-sm font-medium text-foreground/80">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        value={formData.name.middle_name}
                        onChange={(e) => handleNameChange('middle_name', e.target.value)}
                        placeholder="Middle name"
                        className="border-accent/20 focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-foreground/80">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.name.last_name}
                        onChange={(e) => handleNameChange('last_name', e.target.value)}
                        placeholder="Last name"
                        className="border-accent/20 focus:border-accent"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="suffix" className="text-sm font-medium text-foreground/80">
                        Suffix
                      </Label>
                      <Input
                        id="suffix"
                        value={formData.name.suffix}
                        onChange={(e) => handleNameChange('suffix', e.target.value)}
                        placeholder="Jr., Sr., III, etc."
                        className="border-accent/20 focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                          placeholder="+63 9XX XXX XXXX"
                          className="pl-10 border-accent/20 focus:border-accent"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-foreground/80">
                        Gender
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="border-accent/20 focus:border-accent">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.full_name && (
                    <div className="p-4 bg-white rounded-lg border border-accent/20">
                      <Label className="text-sm font-medium text-foreground/80">Full Name Preview</Label>
                      <div className="text-foreground font-medium mt-1">
                        {formData.full_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Section */}
              <div className="form-section bg-gradient-to-br from-chart-1/5 to-chart-1/10 rounded-xl p-6 border border-chart-1/20">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-chart-1" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Address Information</h3>
                </div>
                
                <div className="space-y-4">
                  <AddressDropdown
                    value={formData.address}
                    onChange={handleAddressChange}
                    required={false}
                  />

                  <div>
                    <Label htmlFor="street" className="text-sm font-medium text-foreground/80">
                      Street Address
                    </Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      placeholder="House number, street name, subdivision"
                      className="border-chart-1/20 focus:border-chart-1"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full py-6 text-lg font-semibold btn-gradient hover:shadow-lg transition-all duration-300" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link 
                  href="/account/login" 
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign in here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-white/60 text-sm">
            © 2025 Smart Echo Drain. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}