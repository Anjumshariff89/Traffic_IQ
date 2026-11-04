/**
 * Routing Service using OpenStreetMap / OSRM (Open Source Routing Machine).
 * Fetches real road-network geometry, turns, curves, and driving instructions
 * matching the true road network (similar to Google Maps).
 */

export interface RouteGeometryResult {
  coordinates: [number, number][]; // [lat, lng] array following actual roads
  distanceMeters: number;
  durationSeconds: number;
  steps?: {
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
    location: [number, number];
  }[];
}

const routeCache = new Map<string, RouteGeometryResult>();

/**
 * Fetch driving directions along the real road network between coordinates.
 * Supports intermediate waypoints (e.g. for detours or avoiding roadblocks).
 */
export async function fetchRoadRoute(
  waypoints: [number, number][],
  options?: { signal?: AbortSignal }
): Promise<RouteGeometryResult | null> {
  if (!waypoints || waypoints.length < 2) return null;

  // Format key for caching: "lng,lat;lng,lat"
  const coordsString = waypoints
    .map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`)
    .join(';');

  if (routeCache.has(coordsString)) {
    return routeCache.get(coordsString)!;
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(url, { signal: options?.signal });
    if (!res.ok) {
      console.warn(`OSRM routing returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM routing: no valid route found', data);
      return null;
    }

    const route = data.routes[0];
    // GeoJSON coordinates are [longitude, latitude], convert to Leaflet's [latitude, longitude]
    const latLngCoords: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
    );

    const steps = route.legs?.flatMap((leg: any) =>
      (leg.steps || []).map((step: any) => ({
        instruction: step.maneuver
          ? `${step.maneuver.type} ${step.maneuver.modifier || ''} ${step.name ? 'onto ' + step.name : ''}`.trim()
          : step.name || 'Proceed',
        distanceMeters: step.distance,
        durationSeconds: step.duration,
        location: [step.maneuver?.location[1], step.maneuver?.location[0]] as [number, number],
      }))
    );

    const result: RouteGeometryResult = {
      coordinates: latLngCoords,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      steps,
    };

    routeCache.set(coordsString, result);
    return result;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Failed to fetch road geometry from OSRM:', err);
    }
    return null;
  }
}

