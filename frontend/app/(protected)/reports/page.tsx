'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/tables/States';
import { useAttendanceReport, useEventReport, useMemberReport, useSalaryReport } from '@/hooks/useReports';
import { reportService } from '@/services/report.service';

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

export default function ReportsPage() {
  const { data: memberReport, isLoading: loadingMembers } = useMemberReport();
  const { data: eventReport, isLoading: loadingEvents } = useEventReport();
  const { data: attendanceReport, isLoading: loadingAttendance } = useAttendanceReport();
  const { data: salaryReport, isLoading: loadingSalary } = useSalaryReport();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo</h1>
          <p className="text-muted-foreground">Báo cáo tổng hợp nhân sự, lịch diễn, chấm công và tiền công</p>
        </div>
        <Button variant="outline" onClick={() => reportService.downloadSalaryExcel()}>
          <Download className="mr-2 size-4" />
          Xuất Excel tiền công
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Báo cáo nhân sự</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMembers || !memberReport ? (
              <LoadingState />
            ) : (
              <div className="space-y-2 text-sm">
                <p>Tổng thành viên: <strong>{memberReport.total}</strong></p>
                <p>Đang hoạt động: <strong>{memberReport.active}</strong></p>
                <p>Đang nghỉ: <strong>{memberReport.onLeave}</strong></p>
                <p>Ngừng hoạt động: <strong>{memberReport.inactive}</strong></p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Đội</TableHead>
                      <TableHead>Số thành viên</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberReport.byTeam.map((team) => (
                      <TableRow key={team.teamId}>
                        <TableCell>{team.teamName}</TableCell>
                        <TableCell>{team.memberCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo lịch diễn</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEvents || !eventReport ? (
              <LoadingState />
            ) : (
              <div className="space-y-2 text-sm">
                <p>Tổng số buổi diễn: <strong>{eventReport.total}</strong></p>
                <p>Hoàn thành: <strong>{eventReport.completed}</strong></p>
                <p>Đã hủy: <strong>{eventReport.cancelled}</strong></p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo chấm công</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttendance || !attendanceReport ? (
              <LoadingState />
            ) : (
              <div className="space-y-2 text-sm">
                <p>Tổng số buổi: <strong>{attendanceReport.totalSessions}</strong></p>
                <p>Có mặt: <strong>{attendanceReport.present}</strong></p>
                <p>Vắng có phép: <strong>{attendanceReport.absentWithPermission}</strong></p>
                <p>Vắng không phép: <strong>{attendanceReport.absentWithoutPermission}</strong></p>
                <p>Tỷ lệ chuyên cần: <strong>{attendanceReport.attendanceRate}%</strong></p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo tiền công</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSalary || !salaryReport ? (
              <LoadingState />
            ) : (
              <div className="space-y-2 text-sm">
                <p>Tổng tiền công: <strong>{formatCurrency(salaryReport.grandTotal)}</strong></p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thành viên</TableHead>
                      <TableHead>Tháng/Năm</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryReport.byMember.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.memberName}</TableCell>
                        <TableCell>{row.month}/{row.year}</TableCell>
                        <TableCell>{formatCurrency(row.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
