export interface Station {
  lat: number
  lon: number
  name: string
  address: string
  opening_hours?: string | null
  brand?: string | null
  operator?: string | null
  fuel_types?: string[]
}
