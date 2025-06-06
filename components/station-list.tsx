"use client"

import type { Station } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation, MapPin, Clock } from "lucide-react"

interface StationListProps {
  stations: Station[]
  userLocation: { lat: number; lng: number } | null
}

export default function StationList({ stations, userLocation }: StationListProps) {
  // Função para calcular a distância entre dois pontos (em km)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Função para formatar a distância
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`
    }
    return `${distance.toFixed(1)} km`
  }

  // Ordenar postos por distância
  const sortedStations = [...stations].sort((a, b) => {
    if (!userLocation) return 0

    const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lon)
    const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lon)

    return distanceA - distanceB
  })

  return (
    <div className="space-y-3">
      {sortedStations.map((station, index) => {
        const distance = userLocation
          ? calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lon)
          : null

        return (
          <Card
            key={`${station.lat}-${station.lon}-${index}`}
            className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow dark:bg-gray-800 dark:border-gray-700"
          >
            <CardContent className="p-0">
              <div className="p-4 bg-white">
                <h3 className="font-semibold text-gray-800">{station.name}</h3>

                <div className="text-sm text-gray-600 mt-2 flex items-start dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>{station.address}</span>
                </div>

                {station.opening_hours && (
                  <div className="flex items-center text-sm text-gray-600 mt-2 dark:text-gray-300">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{station.opening_hours}</span>
                  </div>
                )}

                {distance !== null && (
                  <div className="flex items-center text-sm mt-2">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center dark:bg-blue-900 dark:text-blue-200">
                      <span className="font-medium">{formatDistance(distance)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t p-3 flex justify-between gap-2 bg-white dark:bg-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex-1"
                  onClick={() => {
                    window.open(
                      `https://www.openstreetmap.org/?mlat=${station.lat}&mlon=${station.lon}&zoom=16`,
                      "_blank",
                    )
                  }}
                >
                  Ver no mapa
                </Button>

                <Button
                  size="sm"
                  className="text-xs flex items-center gap-1 flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (userLocation) {
                      window.open(
                        `https://www.openstreetmap.org/directions?from=${userLocation.lat},${userLocation.lng}&to=${station.lat},${station.lon}`,
                        "_blank",
                      )
                    }
                  }}
                >
                  <Navigation className="h-3 w-3" />
                  Rota
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
