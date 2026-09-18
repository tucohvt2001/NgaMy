'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Compass,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MapPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onSelectLocation: (data: {
    address: string;
    latitude: number;
    longitude: number;
    mapUrl: string;
  }) => void;
}

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function MapPickerDialog({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  initialAddress,
  onSelectLocation,
}: MapPickerDialogProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Default coordinate: TP. Hồ Chí Minh (10.7769, 106.7009) or Vietnam center
  const [lat, setLat] = useState<number>(initialLat || 10.7769);
  const [lng, setLng] = useState<number>(initialLng || 106.7009);
  const [currentAddress, setCurrentAddress] = useState<string>(initialAddress || '');
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);

  // Search in Map
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Close suggestions on click or touch outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // GPS locating
  const [isLocating, setIsLocating] = useState(false);

  // Load Leaflet and init map
  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    function initLeafletMap() {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultLat = initialLat || lat;
      const defaultLng = initialLng || lng;

      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 15);
      mapInstanceRef.current = map;

      // Google Maps Tiles (Mặc định - Nhanh, đầy đủ địa danh tiếng Việt)
      const googleRoadmap = L.tileLayer(
        'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps',
        }
      );

      // OpenStreetMap Tiles (Dự phòng)
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });

      // Google Satellite / Hybrid
      const googleHybrid = L.tileLayer(
        'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps',
        }
      );

      googleRoadmap.addTo(map);

      // Layer control
      L.control
        .layers(
          {
            'Bản đồ Google': googleRoadmap,
            'Vệ tinh Google': googleHybrid,
            'OpenStreetMap': osm,
          },
          {},
          { position: 'topright' }
        )
        .addTo(map);

      // Custom Icon with clear drag instruction note
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none;">
          <div style="background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 5px 12px; border-radius: 18px; font-size: 12px; font-weight: 800; box-shadow: 0 6px 20px rgba(0,0,0,0.5); border: 2.5px solid #ffffff; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center;">
            <div style="display: flex; align-items: center; gap: 4px; font-weight: 900;">
              <span>🦁</span>
              <span>Điểm diễn</span>
            </div>
            <span style="font-size: 9.5px; font-weight: 700; color: #fef08a; background: rgba(0,0,0,0.35); padding: 1px 6px; border-radius: 6px; letter-spacing: -0.2px;">
              📍 Kéo ghim tới điểm tổ chức sự kiện
            </span>
          </div>
          <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #ea580c; margin-top: -1px;"></div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragstart', () => {
        setShowSuggestions(false);
      });
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        if (isMounted) {
          setLat(position.lat);
          setLng(position.lng);
          reverseGeocode(position.lat, position.lng);
        }
      });

      // Handle click anywhere on map
      map.on('click', (e: any) => {
        setShowSuggestions(false);
        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        marker.setLatLng([clickedLat, clickedLng]);
        if (isMounted) {
          setLat(clickedLat);
          setLng(clickedLng);
          reverseGeocode(clickedLat, clickedLng);
        }
      });

      map.on('movestart', () => {
        setShowSuggestions(false);
      });

      // If initial address is empty, reverse geocode now
      if (!initialAddress) {
        reverseGeocode(defaultLat, defaultLng);
      }

      // Xử lý invalidateSize định kỳ khi modal xuất hiện
      [100, 300, 600, 1000].forEach((delay) => {
        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
      });
    }

    // Check if Leaflet CSS exists
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Check if Leaflet JS exists
    if (!(window as any).L) {
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          if (isMounted) initLeafletMap();
        };
        document.body.appendChild(script);
      }
    } else {
      setTimeout(() => {
        if (isMounted) initLeafletMap();
      }, 50);
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open]);

  // Reverse Geocoding
  const reverseGeocode = async (latitude: number, longitude: number) => {
    setIsLoadingAddress(true);
    try {
      const res = await fetch(`/api/map/reverse?lat=${latitude}&lon=${longitude}`);
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setCurrentAddress(data.display_name);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Trigger search address
  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/map/search?q=${encodeURIComponent(queryText.trim())}`);
      if (res.ok) {
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);

        // Nếu có kết quả, tự động nhảy đến vị trí đầu tiên
        if (data.length > 0) {
          const first = data[0];
          const itemLat = parseFloat(first.lat);
          const itemLng = parseFloat(first.lon);
          setLat(itemLat);
          setLng(itemLng);
          setCurrentAddress(first.display_name);

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([itemLat, itemLng], 16, { animate: true, duration: 1 });
            markerRef.current.setLatLng([itemLat, itemLng]);
          }
        } else {
          toast.error('Không tìm thấy địa điểm phù hợp. Hãy thử gõ địa danh hoặc xã/phường cụ thể hơn.');
        }
      }
    } catch {
      toast.error('Lỗi tra cứu bản đồ');
    } finally {
      setIsSearching(false);
    }
  };

  // Search address within dialog
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val);
    }, 500);
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      executeSearch(searchQuery);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: Suggestion) => {
    const itemLat = parseFloat(item.lat);
    const itemLng = parseFloat(item.lon);

    setLat(itemLat);
    setLng(itemLng);
    setCurrentAddress(item.display_name);
    setSearchQuery(item.display_name);
    setShowSuggestions(false);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([itemLat, itemLng], 16, { animate: true, duration: 1 });
      markerRef.current.setLatLng([itemLat, itemLng]);
    }
  };

  // Locate current GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ GPS');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myLat = pos.coords.latitude;
        const myLng = pos.coords.longitude;
        setLat(myLat);
        setLng(myLng);
        setIsLocating(false);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([myLat, myLng], 16, { animate: true, duration: 1 });
          markerRef.current.setLatLng([myLat, myLng]);
        }
        reverseGeocode(myLat, myLng);
        toast.success('Đã định vị GPS của bạn trên bản đồ!');
      },
      () => {
        setIsLocating(false);
        toast.error('Không thể lấy vị trí thiết bị. Vui lòng cho phép quyền truy cập GPS.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Confirm selection
  const handleConfirm = () => {
    const finalAddress = currentAddress.trim() || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    onSelectLocation({
      address: finalAddress,
      latitude: lat,
      longitude: lng,
      mapUrl,
    });

    onOpenChange(false);
    toast.success('Đã lưu vị trí bản đồ vào form đặt lịch!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-neutral-950 border-2 border-amber-500/50 text-white rounded-3xl shadow-2xl">
        <DialogHeader className="p-4 pb-3 bg-gradient-to-r from-red-950/80 via-neutral-900 to-red-950/80 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-black text-yellow-300 flex items-center gap-2">
                <MapPin className="size-4 text-red-500" />
                Chọn Vị Trí Sự Kiện Trên Bản Đồ
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Gõ tìm kiếm hoặc nhấp / kéo ghim trực tiếp đến đúng địa điểm tổ chức.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search bar & GPS inside Dialog */}
        <div className="p-3 bg-black/60 border-b border-white/10 flex items-center gap-2 relative z-[1500]">
          <div
            ref={searchBoxRef}
            className="relative flex-1"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setShowSuggestions(false);
              }
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <Input
              placeholder="Gõ tên đường, địa danh, toà nhà... (Enter để tìm)"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="h-9 pl-9 pr-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl focus-visible:ring-amber-400"
            />
            {isSearching ? (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-amber-400 animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            ) : null}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/10 text-xs max-h-52 overflow-y-auto z-[2000]">
                {suggestions.map((item) => (
                  <div
                    key={item.place_id}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-2.5 hover:bg-amber-500/20 cursor-pointer flex items-start gap-2 text-slate-200 hover:text-white transition-colors"
                  >
                    <MapPin className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{item.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="h-9 text-xs rounded-xl px-3 gap-1.5 border-amber-400/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold shrink-0"
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin text-amber-400" />
            ) : (
              <Compass className="size-3.5 text-red-400" />
            )}
            <span className="hidden sm:inline">Vị trí của tôi</span>
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-72 sm:h-80 bg-neutral-900">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Hint Overlay */}
          <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/40 text-[11px] text-yellow-200 font-semibold shadow-lg pointer-events-none flex items-center gap-1.5">
            <span>📍</span>
            <span>Kéo thả ghim 🦁 tới đúng điểm tổ chức sự kiện</span>
          </div>
        </div>

        {/* Bottom Address preview & Action button */}
        <div className="p-4 bg-gradient-to-r from-neutral-950 via-black to-neutral-950 border-t border-white/10 space-y-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                <MapPin className="size-3 text-red-500" />
                Vị trí đang chọn:
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                ({lat.toFixed(5)}, {lng.toFixed(5)})
              </span>
            </div>
            <p className="text-white text-xs font-medium leading-relaxed line-clamp-2">
              {isLoadingAddress ? 'Đang tra cứu địa chỉ...' : currentAddress || 'Chưa xác định tên địa chỉ'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl text-slate-400 hover:text-white"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="h-9 px-5 text-xs rounded-xl font-bold bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 hover:from-red-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/25 border border-yellow-300/40"
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              Xác Nhận & Lưu Vị Trí Này
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
