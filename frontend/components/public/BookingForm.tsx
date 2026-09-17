'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  User,
  MessageSquare,
  Compass,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useSubmitPublicBooking } from '@/hooks/usePublicBooking';
import { PublicBookingResult } from '@/services/booking.service';
import { MapPickerDialog } from '@/components/public/MapPickerDialog';
import { toast } from 'sonner';

const EVENT_TYPE_OPTIONS = [
  { value: 'KHAI_TRUONG', label: '🧧 Khai Trương / Khánh Thành' },
  { value: 'TRUNG_THU', label: '🌕 Tết Trung Thu / Thiếu Nhi' },
  { value: 'TET', label: '🏮 Tết Cổ Truyền / Khai Xuân' },
  { value: 'DAM_CUOI', label: '💒 Đám Cưới / Lễ Rước Dâu' },
  { value: 'TRANG_TRI', label: '🌺 Trang Trí Không Gian Lân Sư Rồng' },
  { value: 'LE_HOI', label: '🚩 Lễ Hội / Sự Kiện Doanh Nghiệp' },
  { value: 'OTHER', label: '🎭 Biểu Diễn Theo Yêu Cầu Khác' },
];

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface BookingFormProps {
  onSuccess?: (result: PublicBookingResult) => void;
}

export function BookingForm({ onSuccess }: BookingFormProps) {
  const submitMutation = useSubmitPublicBooking();

  // Basic Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventType, setEventType] = useState('KHAI_TRUONG');
  const [eventDateTime, setEventDateTime] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Map & GPS State
  const [mapUrl, setMapUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  // Address Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement | null>(null);

  // Result state
  const [bookingSuccess, setBookingSuccess] = useState<PublicBookingResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Đóng dropdown gợi ý khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý tìm kiếm địa chỉ tự động (Debounce 400ms)
  const handleSearchAddressChange = (val: string) => {
    setSearchQuery(val);
    setAddress(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `/api/map/search?q=${encodeURIComponent(val.trim())}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch {
        // bỏ qua nếu lỗi mạng
      }
    }, 400);
  };

  // Chọn gợi ý địa điểm từ danh sách tìm kiếm
  const handleSelectSuggestion = (item: LocationSuggestion) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setAddress(item.display_name);
    setSearchQuery(item.display_name);
    setLatitude(lat);
    setLongitude(lon);
    setMapUrl(`https://www.google.com/maps?q=${lat},${lon}`);
    setGpsSuccess(true);
    setShowSuggestions(false);
    toast.success('Đã chọn toạ độ vị trí bản đồ!');
  };

  // Lấy vị trí GPS của thiết bị khách hàng
  const handleGetDeviceLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsGettingGps(true);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        const link = `https://www.google.com/maps?q=${lat},${lon}`;
        setMapUrl(link);
        setGpsSuccess(true);
        setIsGettingGps(false);
        toast.success('Đã lấy vị trí GPS hiện tại!');

        try {
          const res = await fetch(`/api/map/reverse?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              setAddress(data.display_name);
              setSearchQuery(data.display_name);
            }
          }
        } catch {
          // Bỏ qua lỗi reverse geocode
        }
      },
      (err) => {
        setIsGettingGps(false);
        let msg = 'Không thể lấy vị trí hiện tại.';
        if (err.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí. Hãy gõ tìm kiếm địa chỉ ở trên nhé.';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Vui lòng nhập họ tên hoặc tên đơn vị');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ (từ 9 số trở lên)');
      return;
    }

    if (!eventDate) {
      toast.error('Vui lòng chọn thời gian tổ chức sự kiện');
      return;
    }

    if (!address.trim()) {
      toast.error('Vui lòng nhập hoặc tìm kiếm địa chỉ tổ chức');
      return;
    }

    const serviceName = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label || eventType;

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceType: eventType,
      serviceName,
      eventDate,
      startTime: startTime || undefined,
      address: address.trim(),
      mapUrl: mapUrl.trim() || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      notes: notes.trim() || undefined,
    };

    submitMutation.mutate(payload, {
      onSuccess: (data) => {
        setBookingSuccess(data);
        if (onSuccess) onSuccess(data);
      },
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success('Đã sao chép mã đặt lịch!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // ================= VIEW THÀNH CÔNG =================
  if (bookingSuccess) {
    return (
      <div className="text-center space-y-4 py-3 animate-in fade-in zoom-in-95 duration-300">
        <div className="size-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-md">
          <CheckCircle2 className="size-7 stroke-[2.5]" />
        </div>

        <div className="space-y-1 max-w-md mx-auto">
          <Badge className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-[11px] px-2.5 py-0.5 border-0 shadow-md">
            🏮 TIẾP NHẬN YÊU CẦU THÀNH CÔNG
          </Badge>
          <h2 className="text-xl font-black text-yellow-300">
            Cảm Ơn Quý Khách Đã Đặt Lịch!
          </h2>
          <p className="text-xs text-slate-300">
            Đoàn Nghệ Thuật Lân Sư Rồng Nga My Thượng đã nhận được thông tin và sẽ liên hệ lại với quý khách trong thời gian sớm nhất.
          </p>
        </div>

        {/* Mã đơn */}
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 max-w-sm mx-auto flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Mã đặt lịch:</span>
            <span className="font-mono text-xl font-black text-yellow-300">
              {bookingSuccess.booking.eventCode}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCopyCode(bookingSuccess.booking.eventCode)}
            className="h-8 text-xs rounded-xl gap-1 border-amber-400/50 bg-black/40 text-amber-200 hover:bg-amber-500/20"
          >
            {isCopied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            {isCopied ? 'Đã chép' : 'Sao chép'}
          </Button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left max-w-md mx-auto space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span>Khách hàng:</span>
            <strong className="text-white">{bookingSuccess.booking.customerName}</strong>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span>Số điện thoại:</span>
            <strong className="text-white">{bookingSuccess.booking.customerPhone}</strong>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-1">
            <span>Thời gian tổ chức:</span>
            <strong className="text-white">
              {new Date(bookingSuccess.booking.eventDate).toLocaleDateString('vi-VN')}
              {bookingSuccess.booking.startTime ? ` lúc ${bookingSuccess.booking.startTime}` : ''}
            </strong>
          </div>
          <div className="flex flex-col gap-0.5 pt-1">
            <span>Địa điểm:</span>
            <strong className="text-white text-[11px] leading-relaxed">
              {bookingSuccess.booking.location}
            </strong>
          </div>
        </div>

        <p className="text-xs text-amber-200 bg-amber-500/15 p-2.5 rounded-xl max-w-md mx-auto border border-amber-500/30">
          📞 Ban Quản Trị sẽ gọi điện thoại hoặc gửi Zalo cho quý khách trong ít phút!
        </p>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            type="button"
            onClick={() => {
              setBookingSuccess(null);
              setCustomerName('');
              setCustomerPhone('');
              setEventDateTime('');
              setEventDate('');
              setStartTime('');
              setAddress('');
              setSearchQuery('');
              setNotes('');
            }}
            className="rounded-xl h-9 px-6 text-xs font-bold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md hover:from-red-700 hover:to-amber-600"
          >
            🏮 Đặt Thêm Lịch Khác
          </Button>
        </div>
      </div>
    );
  }

  // ================= VIEW FORM ĐƠN GIẢN =================
  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-white">
      {/* 1. THÔNG TIN KHÁCH HÀNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <User className="size-3.5 text-amber-400" />
            Họ tên / Đơn vị tổ chức <span className="text-red-400">*</span>
          </Label>
          <Input
            placeholder="VD: Anh Minh / Shop Mai Vàng..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-9 text-xs rounded-xl bg-black/40 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-amber-400"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Phone className="size-3.5 text-emerald-400" />
            Số điện thoại (Zalo) <span className="text-red-400">*</span>
          </Label>
          <Input
            type="tel"
            placeholder="VD: 0988 123 456"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="h-9 text-xs rounded-xl bg-black/40 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-amber-400"
            required
          />
        </div>
      </div>

      {/* 2. LOẠI SỰ KIỆN & THỜI GIAN TỔ CHỨC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-bold text-amber-300">Loại sự kiện / Dịch vụ</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="h-9 text-xs rounded-xl bg-black/40 border-white/20 text-white">
              <SelectValue placeholder="Chọn loại sự kiện" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-amber-500/40 text-white">
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs focus:bg-amber-500/20">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <CalendarIcon className="size-3.5 text-red-400" />
            Thời gian tổ chức (Ngày & Giờ) <span className="text-red-400">*</span>
          </Label>
          <DateTimePicker
            value={eventDateTime}
            onChange={(isoString) => {
              setEventDateTime(isoString);
              if (isoString) {
                const d = new Date(isoString);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setEventDate(`${year}-${month}-${day}`);
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                setStartTime(`${hours}:${minutes}`);
              } else {
                setEventDate('');
                setStartTime('');
              }
            }}
            placeholder="Chọn ngày và giờ (24h)..."
            className="h-9 text-xs rounded-xl bg-black/40 border-white/20 text-white hover:bg-black/60 focus-visible:ring-amber-400"
          />
        </div>
      </div>

      {/* 3. ĐỊA ĐIỂM & TÌM KIẾM VỊ TRÍ BẢN ĐỒ / GPS */}
      <div className="space-y-1 relative" ref={suggestionsBoxRef}>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <MapPin className="size-3.5 text-red-400" />
            Địa chỉ / Tìm vị trí bản đồ <span className="text-red-400">*</span>
          </Label>

          <div className="flex items-center gap-1.5">
            {/* NÚT MỞ BẢN ĐỒ TƯƠNG TÁC */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMapPickerOpen(true)}
              className="h-6 text-[11px] rounded-lg px-2 gap-1 border-amber-400/60 bg-gradient-to-r from-amber-500/25 to-red-500/25 text-yellow-300 hover:bg-amber-500/35 font-bold shadow-xs"
            >
              <span>🗺️ Mở Bản Đồ</span>
            </Button>

            {/* NÚT LẤY GPS */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetDeviceLocation}
              disabled={isGettingGps}
              className="h-6 text-[11px] rounded-lg px-2 gap-1 border-white/20 bg-black/40 text-amber-200 hover:bg-white/10 font-bold"
            >
              {isGettingGps ? (
                <Loader2 className="size-3 animate-spin text-amber-400" />
              ) : (
                <Compass className="size-3 text-red-400" />
              )}
              <span>{isGettingGps ? 'Định vị...' : '📍 GPS'}</span>
            </Button>
          </div>
        </div>

        {/* Ô INPUT TÌM KIẾM ĐỊA CHỈ */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Gõ tên đường, phường/xã, địa điểm... (VD: 128 Nguyễn Trãi, Chợ Bến Thành...)"
            value={searchQuery || address}
            onChange={(e) => handleSearchAddressChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            className="h-9 pl-9 pr-8 text-xs rounded-xl bg-black/40 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-amber-400"
            required
          />
          {(searchQuery || address) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setAddress('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* DROPDOWN GỢI Ý ĐỊA ĐIỂM (NOMINATIM SEARCH) */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-neutral-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/10 text-xs max-h-52 overflow-y-auto">
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

        {/* HIỂN THỊ VỊ TRÍ ĐÃ CHỌN & LINK GOOGLE MAPS */}
        {mapUrl && (
          <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200">
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="size-3 text-emerald-400" />
              Đã ghim vị trí toạ độ bản đồ
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMapPickerOpen(true)}
                className="text-amber-300 hover:underline font-semibold text-[11px]"
              >
                Đổi vị trí
              </button>
              <span>•</span>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:underline flex items-center gap-1 font-bold"
              >
                <ExternalLink className="size-3" />
                Google Maps
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 4. GHI CHÚ YÊU CẦU */}
      <div className="space-y-1">
        <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-amber-400" />
          Yêu cầu thêm (Số lượng lân, màu sắc, trang trí, giờ đón khách...)
        </Label>
        <Textarea
          rows={2}
          placeholder="VD: Cần 2 lân vàng đỏ, 1 thần tài, múa mở màn lúc 8h sáng, có thêm trống hội..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-xs rounded-xl bg-black/40 border-white/20 text-white placeholder:text-slate-400 resize-none focus-visible:ring-amber-400"
        />
      </div>

      {/* NÚT GỬI ĐẶT LỊCH */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full h-10 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 hover:from-red-700 hover:to-amber-600 text-white shadow-xl shadow-amber-500/25 gap-2 border border-yellow-300/40"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Đang gửi thông tin...</span>
            </>
          ) : (
            <>
              <Send className="size-3.5" />
              <span>🏮 GỬI YÊU CẦU ĐẶT LỊCH</span>
            </>
          )}
        </Button>
        <p className="text-[11px] text-center text-slate-300 mt-1.5">
          Ban Quản Trị đoàn sẽ liên hệ lại với quý khách qua Số điện thoại / Zalo để tư vấn chi tiết chương trình.
        </p>
      </div>

      {/* DIALOG CHỌN VỊ TRÍ TRÊN BẢN ĐỒ TƯƠNG TÁC */}
      <MapPickerDialog
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialLat={latitude}
        initialLng={longitude}
        initialAddress={address}
        onSelectLocation={(loc) => {
          setAddress(loc.address);
          setSearchQuery(loc.address);
          setLatitude(loc.latitude);
          setLongitude(loc.longitude);
          setMapUrl(loc.mapUrl);
          setGpsSuccess(true);
        }}
      />
    </form>
  );
}
