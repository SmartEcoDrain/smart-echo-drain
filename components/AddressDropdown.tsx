"use client"

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface AddressData {
  region: string
  province: string
  city: string
  barangay: string
  street: string
  country: string
  postal_code: string
  municipality: string
}

interface AddressDropdownProps {
  value: AddressData
  onChange: (address: AddressData) => void
  required?: boolean
}

interface AddressOption {
  code: string
  desc: string
}

interface AddressApiResponse {
  success: boolean
  data: {
    regions?: any[]
    provinces?: any[]
    cities?: any[]
    barangays?: any[]
  }
}

export function AddressDropdown({ value, onChange, required = false }: AddressDropdownProps) {
  const [regions, setRegions] = useState<AddressOption[]>([])
  const [provinces, setProvinces] = useState<AddressOption[]>([])
  const [cities, setCities] = useState<AddressOption[]>([])
  const [barangays, setBarangays] = useState<AddressOption[]>([])
  
  // Store selected codes to maintain relationship
  const [selectedRegionCode, setSelectedRegionCode] = useState('')
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [selectedCityCode, setSelectedCityCode] = useState('')
  
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  // Load initial regions
  useEffect(() => {
    loadRegions()
  }, [])

  const loadRegions = async () => {
    try {
      const response = await fetch('/api/address')
      const data: AddressApiResponse = await response.json()
      
      if (data.success && data.data.regions) {
        const regionOptions = data.data.regions.map(region => ({
          code: region.reg_code,
          desc: region.reg_desc
        }))
        setRegions(regionOptions)
      }
    } catch (error) {
      console.error('Failed to load regions:', error)
    }
  }

  const loadProvinces = async (regCode: string) => {
    setLoadingProvinces(true)
    try {
      const response = await fetch(`/api/address?reg_code=${regCode}`)
      const data: AddressApiResponse = await response.json()
      
      if (data.success && data.data.provinces) {
        const provinceOptions = data.data.provinces.map(province => ({
          code: province.prov_code,
          desc: province.prov_desc
        }))
        setProvinces(provinceOptions)
      } else {
        setProvinces([])
      }
    } catch (error) {
      console.error('Failed to load provinces:', error)
      setProvinces([])
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadCities = async (provCode: string) => {
    setLoadingCities(true)
    try {
      const response = await fetch(`/api/address?prov_code=${provCode}`)
      const data: AddressApiResponse = await response.json()
      
      if (data.success && data.data.cities) {
        const cityOptions = data.data.cities.map(city => ({
          code: city.citymun_code,
          desc: city.citymun_desc
        }))
        setCities(cityOptions)
      } else {
        setCities([])
      }
    } catch (error) {
      console.error('Failed to load cities:', error)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  const loadBarangays = async (cityCode: string) => {
    setLoadingBarangays(true)
    try {
      const response = await fetch(`/api/address?citymun_code=${cityCode}`)
      const data: AddressApiResponse = await response.json()
      
      if (data.success && data.data.barangays) {
        const barangayOptions = data.data.barangays.map(barangay => ({
          code: barangay.brgy_code,
          desc: barangay.brgy_desc
        }))
        setBarangays(barangayOptions)
      } else {
        setBarangays([])
      }
    } catch (error) {
      console.error('Failed to load barangays:', error)
      setBarangays([])
    } finally {
      setLoadingBarangays(false)
    }
  }

  const handleRegionChange = (regionCode: string) => {
    const region = regions.find(r => r.code === regionCode)
    setSelectedRegionCode(regionCode)
    setSelectedProvinceCode('')
    setSelectedCityCode('')
    
    // Clear dependent data
    setProvinces([])
    setCities([])
    setBarangays([])
    
    onChange({
      ...value,
      region: region?.desc || '',
      province: '',
      city: '',
      barangay: '',
      municipality: ''
    })

    // Load provinces for selected region
    if (regionCode) {
      loadProvinces(regionCode)
    }
  }

  const handleProvinceChange = (provinceCode: string) => {
    const province = provinces.find(p => p.code === provinceCode)
    setSelectedProvinceCode(provinceCode)
    setSelectedCityCode('')
    
    // Clear dependent data
    setCities([])
    setBarangays([])
    
    onChange({
      ...value,
      province: province?.desc || '',
      city: '',
      barangay: '',
      municipality: ''
    })

    // Load cities for selected province
    if (provinceCode) {
      loadCities(provinceCode)
    }
  }

  const handleCityChange = (cityCode: string) => {
    const city = cities.find(c => c.code === cityCode)
    setSelectedCityCode(cityCode)
    
    // Clear dependent data
    setBarangays([])
    
    onChange({
      ...value,
      city: city?.desc || '',
      barangay: '',
      municipality: city?.desc || ''
    })

    // Load barangays for selected city
    if (cityCode) {
      loadBarangays(cityCode)
    }
  }

  const handleBarangayChange = (barangayCode: string) => {
    const barangay = barangays.find(b => b.code === barangayCode)
    onChange({
      ...value,
      barangay: barangay?.desc || ''
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="region" className="text-sm font-medium text-foreground/80">
            Region {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedRegionCode}
            onValueChange={handleRegionChange}
          >
            <SelectTrigger className="w-full border-chart-1/20 focus:border-chart-1">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  {region.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="province" className="text-sm font-medium text-foreground/80">
            Province {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedProvinceCode}
            onValueChange={handleProvinceChange}
            disabled={!selectedRegionCode || loadingProvinces}
          >
            <SelectTrigger className="w-full border-chart-1/20 focus:border-chart-1">
              <SelectValue placeholder={
                loadingProvinces ? 'Loading...' : 
                !selectedRegionCode ? 'Select region first' : 
                'Select province'
              } />
              {loadingProvinces && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.code} value={province.code}>
                  {province.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city" className="text-sm font-medium text-foreground/80">
            City/Municipality {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedCityCode}
            onValueChange={handleCityChange}
            disabled={!selectedProvinceCode || loadingCities}
          >
            <SelectTrigger className="w-full border-chart-1/20 focus:border-chart-1">
              <SelectValue placeholder={
                loadingCities ? 'Loading...' : 
                !selectedProvinceCode ? 'Select province first' : 
                'Select city/municipality'
              } />
              {loadingCities && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.code} value={city.code}>
                  {city.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="barangay" className="text-sm font-medium text-foreground/80">
            Barangay {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={barangays.find(b => b.desc === value.barangay)?.code || ''}
            onValueChange={handleBarangayChange}
            disabled={!selectedCityCode || loadingBarangays}
          >
            <SelectTrigger className="w-full border-chart-1/20 focus:border-chart-1">
              <SelectValue placeholder={
                loadingBarangays ? 'Loading...' : 
                !selectedCityCode ? 'Select city first' : 
                'Select barangay'
              } />
              {loadingBarangays && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {barangays.map((barangay) => (
                <SelectItem key={barangay.code} value={barangay.code}>
                  {barangay.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {value.region || value.province || value.city || value.barangay ? (
        <div className="p-4 bg-gradient-to-br from-chart-1/5 to-chart-1/10 rounded-lg border border-chart-1/20">
          <Label className="text-sm font-medium text-foreground/80">Address Preview:</Label>
          <div className="text-foreground font-medium mt-1">
            {[
              value.street,
              value.barangay, 
              value.municipality || value.city, 
              value.province, 
              value.region,
              value.country,
              value.postal_code
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
        </div>
      ) : null}
    </div>
  )
}