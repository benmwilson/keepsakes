"use client";

import { useState, useEffect } from "react";
import { fetchLogsForEvent } from "@/actions/logs";
import type { StoredLogEntry } from "@/lib/logs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { RefreshCw, Download, Filter } from "lucide-react";
import { SerializableEvent } from "@/lib/types";

interface LogsViewerProps {
  event: SerializableEvent;
}

export default function LogsViewer({ event }: LogsViewerProps) {
  const [logs, setLogs] = useState<StoredLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [logLimit, setLogLimit] = useState<number>(100);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === "all" ? undefined : selectedCategory as any;
      const logsData = await fetchLogsForEvent(event.id, logLimit, category);
      setLogs(logsData);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [event.id, selectedCategory, logLimit]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warn':
        return 'bg-yellow-500 text-white';
      case 'debug':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'upload':
        return 'bg-blue-500 text-white';
      case 'guest':
        return 'bg-green-500 text-white';
      case 'admin':
        return 'bg-purple-500 text-white';
      case 'system':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Category', 'Message', 'Event Slug', 'Data'],
      ...logs.map(log => [
        formatTimestamp(log.createdAt),
        log.level,
        log.category,
        log.message,
        log.eventSlug || '',
        log.data ? JSON.stringify(log.data) : ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${event.slug}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Logs</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs} disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upload">Uploads</SelectItem>
                <SelectItem value="guest">Guest Activity</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Limit:</span>
            <Select value={logLimit.toString()} onValueChange={(value) => setLogLimit(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No logs found for this event.</p>
              <p className="text-sm">Logs will appear here as guests interact with the event.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getCategoryColor(log.category)}>
                        {log.category}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>
                  
                  <p className="font-medium">{log.message}</p>
                  
                  {log.data && Object.keys(log.data).length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {log.userAgent && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        User Agent
                      </summary>
                      <p className="mt-2 p-2 bg-muted rounded text-xs break-all">
                        {log.userAgent}
                      </p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
