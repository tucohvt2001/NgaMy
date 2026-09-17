import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ display_name: '' });
  }

  // 1. Thử gọi Nominatim reverse với User-Agent chuẩn
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'NgaMyThuongLionDance/1.0 (contact@ngamythuong.vn)',
        'Accept-Language': 'vi,en;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.error('Nominatim reverse error, trying fallback:', err);
  }

  // 2. Dự phòng: Gọi Photon reverse API
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
    const res = await fetch(photonUrl, {
      headers: {
        'Accept-Language': 'vi,en;q=0.9',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features) && data.features.length > 0) {
        const p = data.features[0].properties || {};
        const parts = [
          p.name,
          p.street,
          p.housenumber,
          p.district || p.suburb,
          p.city || p.county,
          p.state,
          p.country,
        ].filter(Boolean);
        const displayName = parts.length > 0 ? parts.join(', ') : `${lat}, ${lon}`;
        return NextResponse.json({ display_name: displayName });
      }
    }
  } catch (err) {
    console.error('Photon reverse fallback error:', err);
  }

  return NextResponse.json({ display_name: `Toạ độ (${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)})` });
}
