"use client";

import React, { useState } from 'react';
import type { TimelineEvent, Person } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  onRequestDetails: (event: TimelineEvent) => Promise<string>; // Updated to return a Promise
  summary?: string;
}

export function Timeline({ events, isLoading = false, onRequestDetails, summary }: TimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [detailsContent, setDetailsContent] = useState<string>('');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false); // New state for loading details

  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleShowDetails = async (event: TimelineEvent) => {
    setSelectedEvent(event);
    setDetailsContent('');
    setShowDetails(true);
    setIsLoadingDetails(true);

    try {
      const details = await onRequestDetails(event);
      if (details) {
        setDetailsContent(details);
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Function to render people badges
  const renderPeople = (people: Person[]) => {
    return (
      <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
        {people.map((person, index) => (
          <div
            key={`${person.name}-${index}`}
            className="flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs backdrop-blur-sm"
            style={{
              backgroundColor: `${person.color}20`,
              borderLeft: `3px solid ${person.color}`,
            }}
          >
            <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
              <div
                className="h-full w-full rounded-full"
                style={{ backgroundColor: person.color }}
              />
            </Avatar>
            <span style={{ color: person.color }} className="text-xs">
              {person.name}
            </span>
            {person.role && (
              <span className="text-xs opacity-70 hidden sm:inline"> - {person.role}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Function to render markdown content properly
  const renderMarkdown = (content: string) => {
    // Helper function to format text with markdown-like features
    const formatMarkdownText = (text: string) => {
      // Bold text
      const boldRegex = /\*\*(.*?)\*\*/g;
      let formatted = text.replace(boldRegex, '<strong>$1</strong>');

      // Italic text
      const italicRegex = /\*(.*?)\*/g;
      formatted = formatted.replace(italicRegex, '<em>$1</em>');

      // Inline code
      const codeRegex = /`(.*?)`/g;
      formatted = formatted.replace(codeRegex, '<code>$1</code>');

      return formatted;
    };

    // Split content by sections (=== Section ===)
    const sectionsRegex = /===(.*?)===(?:\r?\n|$)/g;
    let sections = [];
    let match;
    let lastIndex = 0;

    // Extract all section headers and their positions
    while ((match = sectionsRegex.exec(content)) !== null) {
      const sectionTitle = match[1].trim();
      const sectionStart = match.index + match[0].length;

      // Push the section title and its content start position
      sections.push({
        title: sectionTitle,
        start: sectionStart,
        isTitle: true,
      });

      // Update the last matched index
      lastIndex = sectionStart;
    }

    // Now extract the content for each section
    for (let i = 0; i < sections.length; i++) {
      const currentSection = sections[i];
      const nextSectionIndex = i < sections.length - 1 ? sections[i + 1].start - 6 : content.length; // -6 for the "===" part

      // Extract content from current section start to next section start (or end of content)
      const sectionContent = content.substring(currentSection.start, nextSectionIndex).trim();

      // Add the content as a separate item
      sections.splice(i + 1, 0, {
        content: sectionContent,
        isTitle: false,
      });

      // Skip the newly added content in the next iteration
      i++;
    }

    // If no sections were found, just return the whole content as paragraphs
    if (sections.length === 0) {
      return (
        <div className="space-y-4">
          {content.split("\n\n").map((paragraph, index) => (
            <div
              key={`paragraph-${index}`}
              className="text-sm"
              dangerouslySetInnerHTML={{
                __html: formatMarkdownText(paragraph.replace(/\n/g, '<br />'))
              }}
            />
          ))}
        </div>
      );
    }

    // Render the sections
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          if (section.isTitle) {
            return (
              <div key={`section-title-${index}`} className="mt-6 first:mt-0">
                <h3 className="text-base font-semibold mb-2">{section.title}</h3>
              </div>
            );
          } else {
            return (
              <div key={`section-content-${index}`} className="space-y-3">
                {section.content.split("\n\n").map((paragraph, pIndex) => (
                  <div
                    key={`p-${index}-${pIndex}`}
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownText(paragraph.replace(/\n/g, '<br />'))
                    }}
                  />
                ))}
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (isLoading) {
    // Use predefined skeleton items with unique ids
    const skeletonItems = [
      { id: 'skeleton-1' },
      { id: 'skeleton-2' },
      { id: 'skeleton-3' },
      { id: 'skeleton-4' },
      { id: 'skeleton-5' }
    ];

    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex flex-col gap-4 sm:gap-6 py-4 sm:py-8">
          {skeletonItems.map((item) => (
            <div key={item.id} className="flex gap-2 sm:gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-5 sm:h-6 w-16 sm:w-24 mb-2 rounded-lg" />
                <div className="w-px h-full bg-border/50 rounded-full" />
              </div>
              <div className="flex-1">
                <Card className="backdrop-blur-lg bg-background/70 border border-border/30 rounded-lg shadow-sm">
                  <CardHeader className="p-3 sm:p-6">
                    <Skeleton className="h-5 sm:h-6 w-3/4 mb-2 rounded-lg" />
                    <Skeleton className="h-3 sm:h-4 w-1/2 rounded-lg" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <Skeleton className="h-16 sm:h-20 w-full rounded-lg" />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <Card className="border-dashed backdrop-blur-lg bg-background/70 border border-border/30 rounded-lg shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-40 sm:min-h-48">
            <p className="text-center text-muted-foreground text-sm sm:text-base">
              请输入关键词，开始生成时间轴
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {summary && (
        <Card className="mb-6 sm:mb-8 backdrop-blur-lg bg-background/70 border border-border/30 rounded-lg shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">事件总结</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <p className="text-sm sm:text-base">{summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:gap-6 py-4 sm:py-8">
        {events.map((event, index) => {
          const isExpanded = expandedEvents.has(event.id);
          return (
            <div key={event.id} className="flex gap-2 sm:gap-4">
              <div className="flex flex-col items-center">
                <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap mb-1 sm:mb-2 px-2 py-1 rounded-full backdrop-blur-sm bg-background/50 border border-border/30">
                  {event.date}
                </div>
                <div className="w-px grow bg-border/50 mx-auto rounded-full" />
                {index < events.length - 1 && (
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary mt-3 sm:mt-4" />
                )}
              </div>
              <div className="flex-1 pb-3 sm:pb-4">
                <Card className="transition-all backdrop-blur-lg bg-background/70 border border-border/30 rounded-lg shadow-sm hover:shadow-md">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">{event.title}</CardTitle>
                    {event.source && (
                      <CardDescription className="text-xs mt-1">
                        来源: {event.source}
                      </CardDescription>
                    )}
                    {renderPeople(event.people)}
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <p className={`text-sm sm:text-base ${isExpanded ? '' : 'line-clamp-3'}`}>
                      {event.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-3 sm:p-6 pt-0 sm:pt-0 flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(event.id)}
                      className="text-xs sm:text-sm rounded-full"
                    >
                      {isExpanded ? '收起' : '展开'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowDetails(event)}
                      className="text-xs sm:text-sm rounded-full"
                    >
                      AI分析
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md sm:max-w-2xl p-4 sm:p-6 backdrop-blur-lg bg-background/90 border border-border/30 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{selectedEvent?.title}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedEvent?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 sm:mt-4 max-h-[60vh] overflow-y-auto">
            {!isLoadingDetails && detailsContent ? (
              renderMarkdown(detailsContent)
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-full rounded-md" />
                <Skeleton className="h-3 sm:h-4 w-full rounded-md" />
                <Skeleton className="h-3 sm:h-4 w-5/6 rounded-md" />
                <Skeleton className="h-3 sm:h-4 w-4/5 rounded-md" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
