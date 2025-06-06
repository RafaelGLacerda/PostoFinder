import { NextResponse } from "next/server"
import type { Station } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!lat || !lng) {
    return NextResponse.json({ error: "Latitude e longitude são obrigatórios" }, { status: 400 })
  }

  try {
    // Usar Overpass API para buscar postos de combustível próximos
    const radius = 5000 // 5km de raio
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="fuel"](around:${radius},${lat},${lng});
        way["amenity"="fuel"](around:${radius},${lat},${lng});
        relation["amenity"="fuel"](around:${radius},${lat},${lng});
      );
      out center meta;
    `

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    if (!response.ok) {
      throw new Error("Falha ao buscar dados da API Overpass")
    }

    const data = await response.json()

    // Processar os resultados
    const stations: Station[] = data.elements
      .map((element: any) => {
        // Para ways e relations, usar o centro
        const elementLat = element.lat || element.center?.lat
        const elementLon = element.lon || element.center?.lon

        if (!elementLat || !elementLon) return null

        const tags = element.tags || {}

        return {
          lat: elementLat,
          lon: elementLon,
          name: tags.name || tags.brand || tags.operator || "Posto de Combustível",
          address: formatAddress(tags),
          opening_hours: tags.opening_hours || null,
          brand: tags.brand || null,
          operator: tags.operator || null,
          fuel_types: extractFuelTypes(tags),
        }
      })
      .filter(Boolean) // Remove elementos nulos

    // Buscar endereços usando Nominatim para postos sem endereço
    const stationsWithAddresses = await Promise.all(
      stations.map(async (station) => {
        if (!station.address || station.address === "Endereço não disponível") {
          try {
            const nominatimResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${station.lat}&lon=${station.lon}&zoom=18&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "PostoFinder/1.0",
                },
              },
            )

            if (nominatimResponse.ok) {
              const addressData = await nominatimResponse.json()
              station.address = formatNominatimAddress(addressData)
            }
          } catch (error) {
            console.error("Erro ao buscar endereço:", error)
          }
        }
        return station
      }),
    )

    return NextResponse.json({
      stations: stationsWithAddresses.slice(0, 20), // Limitar a 20 resultados
    })
  } catch (error) {
    console.error("Erro ao buscar postos:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar postos de combustível. Tente novamente em alguns segundos.",
      },
      { status: 500 },
    )
  }
}

function formatAddress(tags: any): string {
  const parts = []

  if (tags["addr:street"]) {
    parts.push(tags["addr:street"])
    if (tags["addr:housenumber"]) {
      parts[parts.length - 1] += `, ${tags["addr:housenumber"]}`
    }
  }

  if (tags["addr:city"]) {
    parts.push(tags["addr:city"])
  }

  if (tags["addr:state"]) {
    parts.push(tags["addr:state"])
  }

  return parts.length > 0 ? parts.join(", ") : "Endereço não disponível"
}

function formatNominatimAddress(data: any): string {
  const address = data.address || {}
  const parts = []

  if (address.road) {
    let street = address.road
    if (address.house_number) {
      street += `, ${address.house_number}`
    }
    parts.push(street)
  }

  if (address.neighbourhood || address.suburb) {
    parts.push(address.neighbourhood || address.suburb)
  }

  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village)
  }

  if (address.state) {
    parts.push(address.state)
  }

  return parts.length > 0 ? parts.join(", ") : data.display_name || "Endereço não disponível"
}

function extractFuelTypes(tags: any): string[] {
  const fuelTypes = []

  if (tags["fuel:diesel"] === "yes") fuelTypes.push("Diesel")
  if (tags["fuel:octane_95"] === "yes") fuelTypes.push("Gasolina Comum")
  if (tags["fuel:octane_98"] === "yes") fuelTypes.push("Gasolina Aditivada")
  if (tags["fuel:e85"] === "yes") fuelTypes.push("Etanol")
  if (tags["fuel:lpg"] === "yes") fuelTypes.push("GLP")
  if (tags["fuel:cng"] === "yes") fuelTypes.push("GNV")

  return fuelTypes
}
