import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || !q.trim()) {
    return NextResponse.json([]);
  }

  const query = q.trim();

  // 1. Thử gọi Nominatim với User-Agent chuẩn
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=vn&limit=7&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'NgaMyThuongLionDance/1.0 (contact@ngamythuong.vn)',
        'Accept-Language': 'vi,en;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.error('Nominatim search error, trying fallback:', err);
  }

  // 2. Dự phòng: Gọi Photon API (Komoot OpenStreetMap search)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=7`;
    const res = await fetch(photonUrl, {
      headers: {
        'Accept-Language': 'vi,en;q=0.9',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        const results = data.features.map((f: any, idx: number) => {
          const p = f.properties || {};
          const parts = [
            p.name,
            p.street,
            p.housenumber,
            p.district || p.suburb,
            p.city || p.county,
            p.state,
            p.country,
          ].filter(Boolean);
          const displayName = parts.length > 0 ? parts.join(', ') : query;
          const [lon, lat] = f.geometry?.coordinates || [105.8, 21.0];

          return {
            place_id: p.osm_id || idx + 1000,
            display_name: displayName,
            lat: String(lat),
            lon: String(lon),
          };
        });
        return NextResponse.json(results);
      }
    }
  } catch (err) {
    console.error('Photon search fallback error:', err);
  }

  return NextResponse.json([]);
}
