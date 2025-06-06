"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Fuel, Loader2, Moon, Sun } from "lucide-react"
import StationList from "@/components/station-list"
import Map from "@/components/map"
import type { Station } from "@/lib/types"
import { useTheme } from "next-themes"

export default function Home() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { theme, setTheme } = useTheme()

  const getUserLocation = () => {
    setLoading(true)
    setError(null)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          findNearbyStations(latitude, longitude)
          setLoading(false)
        },
        (err) => {
          setError("Não foi possível obter sua localização. Por favor, permita o acesso à localização.")
          setLoading(false)
          console.error("Erro de geolocalização:", err)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      )
    } else {
      setError("Geolocalização não é suportada pelo seu navegador.")
      setLoading(false)
    }
  }

  const findNearbyStations = async (lat: number, lng: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stations?lat=${lat}&lng=${lng}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setStations(data.stations || [])
      }
    } catch (err) {
      setError("Erro ao buscar postos próximos.")
      console.error("Erro ao buscar postos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Solicitar localização quando o componente montar
    getUserLocation()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800 dark:text-white">⛽ Posto Finder</h1>
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </Button>
        </div>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-2">Encontre postos de combustível próximos</p>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6 bg-yellow-50 border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg p-3 w-full">
          <span className="inline-block mr-1">⏱️</span> Os postos podem demorar até 15 segundos para aparecer
        </p>

        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 p-4 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <Card className="mb-4 shadow-lg">
          <CardContent className="p-4">
            <Button
              onClick={getUserLocation}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {loading ? "Localizando..." : "Atualizar minha localização"}
            </Button>
          </CardContent>
        </Card>

        {userLocation && (
          <div className="w-full mb-6 h-64 rounded-lg overflow-hidden shadow-lg">
            <Map userLocation={userLocation} stations={stations} />
          </div>
        )}

        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
            <Fuel className="h-5 w-5 text-blue-600" />
            Postos Próximos ({stations.length})
          </h2>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : stations.length > 0 ? (
            <StationList stations={stations} userLocation={userLocation} />
          ) : (
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Fuel className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {userLocation ? "Nenhum posto encontrado nas proximidades." : "Aguardando sua localização..."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
