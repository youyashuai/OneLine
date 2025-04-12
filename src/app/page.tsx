"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Timeline } from '@/components/Timeline';
import { ApiSettings } from '@/components/ApiSettings';
import { ApiProvider, useApi } from '@/contexts/ApiContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { TimelineData, TimelineEvent, DateFilterOption, DateFilterConfig } from '@/types';
import { fetchTimelineData, fetchEventDetails } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, SortDesc, SortAsc, Download } from 'lucide-react';

function MainContent() {
  const { apiConfig, isConfigured } = useApi();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineData>({ events: [] });
  const [showSettings, setShowSettings] = useState(!isConfigured);
  const [error, setError] = useState('');
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterConfig>({ option: 'all' });
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // 'asc' for oldest first, 'desc' for newest first

  // Effect to show/hide the floating button when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowFloatingButton(true);
      } else {
        setShowFloatingButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect to filter events based on date filter
  useEffect(() => {
    if (timelineData.events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    const now = new Date();
    let startDate: Date | undefined;

    switch (dateFilter.option) {
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'halfYear':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        startDate = dateFilter.startDate;
        break;
      default:
        // 'all' option - no filtering
        setFilteredEvents(sortEvents(timelineData.events));
        return;
    }

    const endDate = dateFilter.option === 'custom' ? dateFilter.endDate : undefined;

    // Filter events based on date
    const filtered = timelineData.events.filter(event => {
      // Parse the event date with various formats
      const dateParts = event.date.split('-').map(Number);
      let eventDate: Date;

      if (dateParts.length === 3) {
        // Full date: YYYY-MM-DD
        eventDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      } else if (dateParts.length === 2) {
        // Month precision: YYYY-MM
        eventDate = new Date(dateParts[0], dateParts[1] - 1, 1);
      } else if (dateParts.length === 1) {
        // Year precision: YYYY
        eventDate = new Date(dateParts[0], 0, 1);
      } else {
        // Invalid date format, include by default
        return true;
      }

      if (startDate && eventDate < startDate) {
        return false;
      }

      if (endDate && eventDate > endDate) {
        return false;
      }

      return true;
    });

    // Sort the filtered events based on current sort direction
    setFilteredEvents(sortEvents(filtered));
  }, [timelineData.events, dateFilter, sortDirection]);

  // Function to sort events based on sort direction
  const sortEvents = (events: TimelineEvent[]): TimelineEvent[] => {
    return [...events].sort((a, b) => {
      const dateA = a.date.replace(/\D/g, ''); // Remove non-digit characters
      const dateB = b.date.replace(/\D/g, '');
      return sortDirection === 'asc'
        ? dateA.localeCompare(dateB)  // oldest first (ascending)
        : dateB.localeCompare(dateA); // newest first (descending)
    });
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.warning('请输入搜索关键词');
      return;
    }

    if (!isConfigured) {
      toast.info('请先配置API设置');
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Add date range to query if filter is set
      let queryWithDateFilter = query;

      if (dateFilter.option !== 'all') {
        let dateRangeText = '';
        const now = new Date();

        switch(dateFilter.option) {
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            dateRangeText = `，请主要搜索 ${formatDate(monthAgo)} 至 ${formatDate(now)} 这段时间的内容`;
            break;
          case 'halfYear':
            const halfYearAgo = new Date(now);
            halfYearAgo.setMonth(now.getMonth() - 6);
            dateRangeText = `，请主要搜索 ${formatDate(halfYearAgo)} 至 ${formatDate(now)} 这段时间的内容`;
            break;
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateRangeText = `，请主要搜索 ${formatDate(yearAgo)} 至 ${formatDate(now)} 这段时间的内容`;
            break;
          case 'custom':
            if (dateFilter.startDate && dateFilter.endDate) {
              dateRangeText = `，请主要搜索 ${formatDate(dateFilter.startDate)} 至 ${formatDate(dateFilter.endDate)} 这段时间的内容`;
            }
            break;
        }

        queryWithDateFilter += dateRangeText;
      }

      const data = await fetchTimelineData(queryWithDateFilter, apiConfig);
      setTimelineData(data);
      if (data.events.length === 0) {
        toast.warning('未找到相关事件，请尝试其他关键词');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生错误，请稍后再试';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching timeline data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for API query
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleDateFilterChange = (value: DateFilterOption) => {
    if (value === 'custom') {
      // For custom date range, set both start and end dates if they haven't been set yet
      setDateFilter({
        option: value,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
    } else {
      setDateFilter({ option: value });
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    if (dateFilter.option === 'custom' && e.target.value) {
      setDateFilter({
        ...dateFilter,
        startDate: new Date(e.target.value)
      });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    if (dateFilter.option === 'custom' && e.target.value) {
      setDateFilter({
        ...dateFilter,
        endDate: new Date(e.target.value)
      });
    }
  };

  const handleRequestDetails = async (event: TimelineEvent): Promise<string> => {
    if (!isConfigured) {
      toast.info('请先配置API设置');
      setShowSettings(true);
      return '请先配置API设置';
    }

    try {
      // 构建更具体的查询，包含事件日期和标题，添加更详细的分析指导
      const detailedQuery = `事件：${event.title}（${event.date}）\n\n请提供该事件的详细分析，包括事件背景、主要过程、关键人物、影响与意义。请尽可能提供多方观点，并分析该事件在${query}整体发展中的位置与作用。`;

      const detailsContent = await fetchEventDetails(
        event.id,
        detailedQuery,
        apiConfig
      );

      return detailsContent;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '获取详细信息失败';
      toast.error(errorMessage);
      console.error('Error fetching event details:', err);
      return '获取详细信息失败，请稍后再试';
    }
  };

  // Function to export timeline as image
  const exportAsImage = () => {
    if (filteredEvents.length === 0) {
      toast.warning('没有可导出的内容');
      return;
    }

    // Use html2canvas library
    import('html2canvas').then(({ default: html2canvas }) => {
      const timelineElement = document.querySelector('.timeline-container') as HTMLElement;
      if (!timelineElement) {
        toast.error('找不到时间轴元素');
        return;
      }

      toast.info('正在生成图片，请稍候...');

      html2canvas(timelineElement, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        // Convert to image and download
        const fileName = `一线-${query.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();

        toast.success('图片已导出');
      }).catch(err => {
        console.error('Error exporting image:', err);
        toast.error('导出图片失败');
      });
    }).catch(err => {
      console.error('Error loading html2canvas:', err);
      toast.error('加载导出功能失败');
    });
  };

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8 backdrop-blur-lg bg-background/70 rounded-lg p-4 shadow-sm border border-border/30">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">一线</h1>
          <p className="text-sm md:text-base text-muted-foreground">热点事件时间轴分析工具</p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button variant="outline" onClick={() => setShowSettings(true)} className="mt-1 sm:mt-0 rounded-full">
            <Settings size={18} />
            <span className="ml-2 hidden sm:inline">API设置</span>
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6 sm:mb-8 backdrop-blur-lg bg-background/70 rounded-lg p-4 shadow-sm border border-border/30">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="输入关键词，例如：俄乌冲突"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-full"
          />
          <div className="flex gap-2">
            <Select
              value={dateFilter.option}
              onValueChange={handleDateFilterChange as (value: string) => void}
              defaultValue="all"
            >
              <SelectTrigger className="w-[140px] rounded-full">
                <SelectValue placeholder="筛选时间" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-md bg-background/80 border border-border/50 rounded-lg">
                <SelectItem value="month">一个月内</SelectItem>
                <SelectItem value="halfYear">半年内</SelectItem>
                <SelectItem value="year">一年内</SelectItem>
                <SelectItem value="all">不限时间</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isLoading} className="rounded-full">
              {isLoading ? '生成中...' : '生成时间轴'}
            </Button>
          </div>
        </div>

        {/* Custom date range inputs */}
        {dateFilter.option === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="flex-1 flex gap-2 items-center">
              <label htmlFor="start-date" className="text-sm whitespace-nowrap">开始日期:</label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="flex-1 rounded-lg"
              />
            </div>
            <div className="flex-1 flex gap-2 items-center">
              <label htmlFor="end-date" className="text-sm whitespace-nowrap">结束日期:</label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="flex-1 rounded-lg"
              />
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-300 rounded-lg backdrop-blur-lg text-sm sm:text-base border border-red-200 dark:border-red-800/50">
          {error}
        </div>
      )}

      {filteredEvents.length > 0 && (
        <div className="flex justify-between mb-4 backdrop-blur-lg bg-background/70 rounded-lg p-2 shadow-sm border border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortDirection}
            className="flex items-center gap-1 rounded-full"
          >
            {sortDirection === 'asc' ? (
              <>
                <SortAsc size={16} /> 从远到近
              </>
            ) : (
              <>
                <SortDesc size={16} /> 从近到远
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportAsImage}
            className="flex items-center gap-1 rounded-full"
          >
            <Download size={16} /> 导出图片
          </Button>
        </div>
      )}

      <div className="timeline-container backdrop-blur-lg bg-background/70 rounded-lg p-4 shadow-sm border border-border/30">
        <Timeline
          events={filteredEvents}
          isLoading={isLoading}
          onRequestDetails={handleRequestDetails}
          summary={timelineData.summary}
        />
      </div>

      <ApiSettings
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      {/* Floating API settings button */}
      {showFloatingButton && (
        <Button
          variant="secondary"
          size="sm"
          className="fixed bottom-4 right-4 z-50 rounded-full p-3 shadow-md sm:hidden backdrop-blur-lg bg-background/70 border border-border/30"
          onClick={() => setShowSettings(true)}
        >
          <Settings size={20} />
        </Button>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <ApiProvider>
      <MainContent />
    </ApiProvider>
  );
}
