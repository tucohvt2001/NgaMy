'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronsUpDown, Building2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBanks } from '@/hooks/useBanks';
import { Bank } from '@/types/models';

interface BankSelectProps {
  value?: string | null; // Có thể là bankCode, bankName, hoặc bankId
  onChange?: (bank: Bank | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function BankSelect({
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Chọn ngân hàng...',
}: BankSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: banks, isLoading } = useBanks({ transferOnly: true });

  const rawValue = (value || '').trim().toUpperCase();

  // Tìm bank được chọn dựa vào code, shortName, bin, hoặc id
  const selectedBank = banks?.find(
    (b) =>
      b.id === value ||
      b.code.toUpperCase() === rawValue ||
      b.shortName.toUpperCase() === rawValue ||
      b.bin === rawValue ||
      (rawValue.length > 2 && b.name.toUpperCase().includes(rawValue))
  );

  const filteredBanks = (banks ?? []).filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toUpperCase();
    return (
      b.code.toUpperCase().includes(q) ||
      b.shortName.toUpperCase().includes(q) ||
      b.name.toUpperCase().includes(q) ||
      b.bin.includes(q)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`w-full justify-between font-normal h-10 px-3 rounded-xl ${
            !selectedBank ? 'text-muted-foreground' : 'text-foreground'
          } ${className}`}
        >
          {selectedBank ? (
            <div className="flex items-center gap-2.5 truncate">
              {selectedBank.logo ? (
                <div className="relative size-6 shrink-0 rounded-md overflow-hidden bg-white p-0.5 border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedBank.logo}
                    alt={selectedBank.shortName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <Building2 className="size-4 shrink-0 text-amber-500" />
              )}
              <span className="font-semibold text-xs text-foreground truncate">
                {selectedBank.shortName}
              </span>
              <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                ({selectedBank.code})
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-2 text-xs">
              <Building2 className="size-4 text-muted-foreground" />
              {isLoading ? 'Đang tải ngân hàng...' : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] sm:w-[380px] p-0 rounded-2xl shadow-xl" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên ngân hàng, mã (VCB, MB, ACB...)"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 rounded-xl border-none focus:outline-none focus:ring-1 focus:ring-amber-500"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-1 divide-y divide-border/40">
          {filteredBanks.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {isLoading ? 'Đang tải danh sách ngân hàng...' : 'Không tìm thấy ngân hàng phù hợp.'}
            </div>
          ) : (
            filteredBanks.map((bank) => {
              const isSelected = selectedBank?.id === bank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    onChange?.(bank);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {bank.logo ? (
                      <div className="relative size-7 shrink-0 rounded-md overflow-hidden bg-white p-0.5 border shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bank.logo}
                          alt={bank.shortName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <Building2 className="size-5 text-amber-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">{bank.shortName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.2 bg-muted rounded">
                          {bank.code}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                        {bank.name}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="size-4 text-amber-600 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
