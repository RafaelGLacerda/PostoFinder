"use client"

import { useEffect, useRef } from "react"
import type { Station } from "@/lib/types"
import { useTheme } from "next-themes"

interface MapProps {
  userLocation: { lat: number; lng: number }
  stations: Station[]
}

export default function Map({ userLocation, stations }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    // Carregar Leaflet dinamicamente
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !window.L) {
        // Carregar CSS do Leaflet
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)

        // Carregar JS do Leaflet
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        document.head.appendChild(script)

        return new Promise<void>((resolve) => {
          script.onload = () => resolve()
        })
      }
    }

    const initMap = async () => {
      await loadLeaflet()

      if (mapRef.current && window.L && !mapInstanceRef.current) {
        // Criar o mapa
        mapInstanceRef.current = window.L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 14)

        // Adicionar camada do OpenStreetMap
        const tileUrl =
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        window.L.tileLayer(tileUrl, {
          attribution: theme === "dark" ? "© CARTO © OpenStreetMap contributors" : "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)

        // Ícone personalizado para o usuário
        const userIcon = window.L.divIcon({
          html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          className: "custom-div-icon",
        })

        // Adicionar marcador para a localização do usuário
        window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Sua localização")
      }

      // Atualizar posição do usuário se o mapa já existe
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14)
      }

      // Limpar marcadores anteriores dos postos
      markersRef.current.forEach((marker) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker)
        }
      })
      markersRef.current = []

      // Adicionar marcadores para os postos
      if (window.L && mapInstanceRef.current) {
        const gasIcon = window.L.divIcon({
          html: '<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">⛽</div>',
          iconSize: [30, 30],
          className: "custom-div-icon",
        })

        stations.forEach((station) => {
          const marker = window.L.marker([station.lat, station.lon], { icon: gasIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${station.name}</h3>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">${station.address}</p>
                <a href="https://www.openstreetmap.org/directions?from=${userLocation.lat},${userLocation.lng}&to=${station.lat},${station.lon}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 12px;">
                  🗺️ Como chegar
                </a>
              </div>
            `)

          markersRef.current.push(marker)
        })

        // Ajustar zoom para mostrar todos os pontos
        if (stations.length > 0) {
          const group = new window.L.featureGroup([
            window.L.marker([userLocation.lat, userLocation.lng]),
            ...markersRef.current,
          ])
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
        }
      }
    }

    if (userLocation) {
      initMap()
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [userLocation, stations, theme])

  return <div ref={mapRef} className="w-full h-full" />
}
