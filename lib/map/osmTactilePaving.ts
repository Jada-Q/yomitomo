/**
 * Fetch tactile paving data from OpenStreetMap via Overpass API
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_MIRROR = "https://overpass.kumi.systems/api/interpreter";

export interface TactilePavingNode {
  id: number;
  lat: number;
  lon: number;
  type: "node" | "way";
  tags?: Record<string, string>;
}

/**
 * Fetch tactile paving data within a bounding box
 * @param south - Southern latitude
 * @param west - Western longitude
 * @param north - Northern latitude
 * @param east - Eastern longitude
 */
export async function fetchTactilePaving(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<TactilePavingNode[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["tactile_paving"="yes"](${south},${west},${north},${east});
      way["tactile_paving"="yes"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;

  // Try primary, fallback to mirror
  for (const url of [OVERPASS_URL, OVERPASS_MIRROR]) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) continue;

      const data = await response.json();
      return (data.elements || [])
        .filter(
          (el: { type: string; lat?: number; lon?: number }) =>
            el.lat !== undefined && el.lon !== undefined,
        )
        .map(
          (el: {
            id: number;
            lat: number;
            lon: number;
            type: string;
            tags?: Record<string, string>;
          }) => ({
            id: el.id,
            lat: el.lat,
            lon: el.lon,
            type: el.type as "node" | "way",
            tags: el.tags,
          }),
        );
    } catch {
      continue;
    }
  }

  return [];
}

/**
 * Fetch tactile paving count for a region (lightweight)
 */
export async function fetchTactilePavingCount(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<number> {
  const query = `
    [out:json][timeout:15];
    (
      node["tactile_paving"="yes"](${south},${west},${north},${east});
      way["tactile_paving"="yes"](${south},${west},${north},${east});
    );
    out count;
  `;

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) return 0;

    const data = await response.json();
    return data.elements?.[0]?.tags?.total
      ? parseInt(data.elements[0].tags.total)
      : 0;
  } catch {
    return 0;
  }
}
