'use client';

import { useState } from 'react';
import {
  Plus,
  Minus,
  Download,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Eye,
  Pencil,
  Trash2,
  Filter,
  RefreshCw,
  Coins,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationBar } from '@/components/tables/PaginationBar';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { TransactionFormDialog } from '@/components/forms/TransactionFormDialog';
import { TransactionDetailDialog } from '@/components/forms/TransactionDetailDialog';
import {
  useTransactions,
  useTransactionSummary,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/useTransactions';
import { transactionService } from '@/services/transaction.service';
import { useAuthStore } from '@/stores/authStore';
import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  STATUS_LABELS,
  TransactionCategory,
  PaymentMethod,
} from '@/types/enums';
import { Transaction, TransactionInput } from '@/types/models';

const ALL_VALUE = '__all__';

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

export default function TransactionsPage() {
  const user = useAuthStore((state) => state.user);
  const canManage = user?.permissions.includes('finance:manage');

  // Filter States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>(ALL_VALUE);
  const [category, setCategory] = useState<string>(ALL_VALUE);
  const [paymentMethod, setPaymentMethod] = useState<string>(ALL_VALUE);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { data, isLoading, refetch } = useTransactions({
    page,
    limit: 15,
    search: search || undefined,
    type: type !== ALL_VALUE ? (type as any) : undefined,
    category: category !== ALL_VALUE ? category : undefined,
    paymentMethod: paymentMethod !== ALL_VALUE ? (paymentMethod as any) : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const { data: summary, isLoading: loadingSummary } = useTransactionSummary({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  // Mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const handleCreateSubmit = (values: TransactionInput) => {
    if (editingTransaction) {
      updateMutation.mutate(
        { id: editingTransaction.id, input: values },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingTransaction(null);
          },
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          setFormOpen(false);
        },
      });
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await transactionService.downloadExcel({
        search: search || undefined,
        type: type !== ALL_VALUE ? (type as any) : undefined,
        category: category !== ALL_VALUE ? category : undefined,
        paymentMethod: paymentMethod !== ALL_VALUE ? (paymentMethod as any) : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
    } catch {
      // Handled in service or interceptor
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setType(ALL_VALUE);
    setCategory(ALL_VALUE);
    setPaymentMethod(ALL_VALUE);
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Quản lý Thu Chi & Sổ Quỹ</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi dòng tiền thu chi, quản lý kinh phí show diễn, mua sắm đạo cụ và quỹ CLB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            isLoading={isExporting}
            className="gap-2 shadow-xs"
          >
            <Download className="size-4" />
            Xuất Excel
          </Button>

          {canManage && (
            <>
              <Button
                onClick={() => {
                  setEditingTransaction(null);
                  setFormDefaultType('INCOME');
                  setFormOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md"
              >
                <ArrowDownLeft className="size-4" />
                Lập Phiếu Thu
              </Button>

              <Button
                onClick={() => {
                  setEditingTransaction(null);
                  setFormDefaultType('EXPENSE');
                  setFormOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-md"
              >
                <ArrowUpRight className="size-4" />
                Lập Phiếu Chi
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 3 Thẻ Thống Kê Tổng Quan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Tổng Thu */}
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Tổng Thu Thực Nhận
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {loadingSummary ? '...' : formatCurrency(summary?.totalIncome ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowDownLeft className="size-3.5 text-emerald-500" />
              Từ biểu diễn show, tài trợ, quỹ hội viên...
            </p>
          </CardContent>
        </Card>

        {/* Tổng Chi */}
        <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-background to-background shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-rose-700 dark:text-rose-400">
              Tổng Chi Hoạt Động
            </CardTitle>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <TrendingDown className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {loadingSummary ? '...' : formatCurrency(summary?.totalExpense ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="size-3.5 text-rose-500" />
              Chi thù lao, mua lân, bảo dưỡng, ăn uống...
            </p>
          </CardContent>
        </Card>

        {/* Tồn Quỹ Hiện Tại */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-primary">
              Tồn Quỹ Thực Tế
            </CardTitle>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-black tracking-tight ${
                (summary?.netBalance ?? 0) >= 0 ? 'text-primary' : 'text-rose-600'
              }`}
            >
              {loadingSummary ? '...' : formatCurrency(summary?.netBalance ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Coins className="size-3.5 text-amber-500" />
              Số dư quỹ tiền mặt & ngân hàng hiện hữu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <Card className="shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm mã phiếu, người nộp/nhận, diễn giải..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Loại giao dịch */}
            <div>
              <Select
                value={type}
                onValueChange={(val) => {
                  setType(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tất cả loại (Thu & Chi)</SelectItem>
                  <SelectItem value="INCOME">Phiếu Thu (Tiền vào)</SelectItem>
                  <SelectItem value="EXPENSE">Phiếu Chi (Tiền ra)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Danh mục */}
            <div>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tất cả danh mục</SelectItem>
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {TRANSACTION_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phương thức */}
            <div>
              <Select
                value={paymentMethod}
                onValueChange={(val) => {
                  setPaymentMethod(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tất cả phương thức</SelectItem>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm} value={pm}>
                      {PAYMENT_METHOD_LABELS[pm]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nút đặt lại */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="w-full text-xs text-muted-foreground"
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Đặt lại
              </Button>
            </div>
          </div>

          {/* Hàng lọc ngày */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t text-xs text-muted-foreground">
            <span className="font-medium">Khoảng thời gian:</span>
            <div className="flex items-center gap-1.5">
              <span>Từ</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Đến</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs w-36"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng Dữ Liệu Giao Dịch */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingState label="Đang tải dữ liệu sổ quỹ..." />
        ) : !data || data.items.length === 0 ? (
          <EmptyState label="Không tìm thấy giao dịch thu chi nào phù hợp" />
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-32 font-bold">Mã phiếu</TableHead>
                  <TableHead className="w-28 font-bold">Ngày lập</TableHead>
                  <TableHead className="w-28 font-bold">Phân loại</TableHead>
                  <TableHead className="font-bold">Danh mục & Diễn giải</TableHead>
                  <TableHead className="font-bold">Người nộp / nhận</TableHead>
                  <TableHead className="w-32 font-bold">Phương thức</TableHead>
                  <TableHead className="text-right font-bold w-40">Số tiền</TableHead>
                  <TableHead className="w-28 font-bold">Trạng thái</TableHead>
                  <TableHead className="w-28 text-right font-bold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const isIncome = item.type === 'INCOME';
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Mã phiếu */}
                      <TableCell className="font-semibold text-xs text-foreground">
                        <button
                          onClick={() => setDetailTransaction(item)}
                          className="hover:underline text-primary font-mono"
                        >
                          {item.code}
                        </button>
                      </TableCell>

                      {/* Ngày */}
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(item.transactionDate)}
                      </TableCell>

                      {/* Loại */}
                      <TableCell>
                        <Badge
                          variant={isIncome ? 'default' : 'destructive'}
                          className={`text-[11px] font-semibold gap-1 ${
                            isIncome
                              ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="size-3" />
                          ) : (
                            <ArrowUpRight className="size-3" />
                          )}
                          {isIncome ? 'Thu tiền' : 'Chi tiền'}
                        </Badge>
                      </TableCell>

                      {/* Danh mục & Diễn giải */}
                      <TableCell>
                        <p className="font-medium text-xs text-foreground">
                          {TRANSACTION_CATEGORY_LABELS[item.category as TransactionCategory] || item.category}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        {item.event && (
                          <p className="text-[10px] text-primary/80 font-medium mt-0.5">
                            Show: {item.event.name}
                          </p>
                        )}
                      </TableCell>

                      {/* Người nộp/nhận */}
                      <TableCell className="text-xs font-medium">
                        {item.payerOrReceiver}
                        {item.member && (
                          <span className="text-[10px] text-muted-foreground block">
                            (Thành viên: {item.member.fullName})
                          </span>
                        )}
                      </TableCell>

                      {/* Phương thức */}
                      <TableCell className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[item.paymentMethod as PaymentMethod] || item.paymentMethod}
                      </TableCell>

                      {/* Số tiền */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-bold text-sm ${
                              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                          </span>
                          {isIncome && item.tipAmount && item.tipAmount > 0 ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              (Gồm {formatCurrency(item.tipAmount)} lộc)
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Trạng thái */}
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Xem chi tiết & In phiếu"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setDetailTransaction(item)}
                          >
                            <Eye className="size-4" />
                          </Button>

                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Chỉnh sửa"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditingTransaction(item);
                                  setFormDefaultType(item.type);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                title="Xóa"
                                className="size-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletingTransaction(item)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {data.pagination && (
              <PaginationBar
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                total={data.pagination.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Form Dialog */}
      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editingTransaction}
        defaultType={formDefaultType}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Detail & Print Dialog */}
      <TransactionDetailDialog
        open={!!detailTransaction}
        onOpenChange={(open) => !open && setDetailTransaction(null)}
        transaction={detailTransaction}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deletingTransaction}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        title="Xóa phiếu giao dịch"
        description={`Bạn có chắc muốn xóa phiếu "${deletingTransaction?.code}" với số tiền ${
          deletingTransaction ? formatCurrency(deletingTransaction.amount) : ''
        }? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa phiếu"
        onConfirm={() => {
          if (deletingTransaction) {
            deleteMutation.mutate(deletingTransaction.id, {
              onSuccess: () => setDeletingTransaction(null),
            });
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
