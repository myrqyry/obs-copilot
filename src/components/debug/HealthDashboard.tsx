import React from 'react';
import { useHealthStatus, HealthReport, ServiceStatus } from '@/hooks/useHealthStatus';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const StatusIndicator: React.FC<{ status: ServiceStatus }> = ({ status }) => {
  const statusStyles: Record<ServiceStatus, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    critical: 'bg-red-500',
    unknown: 'bg-gray-500',
  };

  return <span className={`inline-block w-3 h-3 rounded-full ${statusStyles[status]}`} />;
};

const HealthDashboard: React.FC = () => {
  const { reports, overallStatus, lastChecked, isChecking, refreshHealth } = useHealthStatus();

  return (
    <Card className="m-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System Health</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant={overallStatus === 'healthy' ? 'default' : 'destructive'}>
            {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
          </Badge>
          <Button onClick={refreshHealth} disabled={isChecking} size="sm">
            {isChecking ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{report.service}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status={report.status} />
                    <span>{report.status.charAt(0).toUpperCase() + report.status.slice(1)}</span>
                  </div>
                </TableCell>
                <TableCell>{report.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-4">
          Last checked: {formatDistanceToNow(lastChecked, { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
};

export default HealthDashboard;
