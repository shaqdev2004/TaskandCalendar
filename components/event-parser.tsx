"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParsedEvent {
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  description: string;
  category: string;
  isAllDay: boolean;
}

export default function EventParser() {
  const [input, setInput] = useState("");
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/parse-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskInput: input }),
      });

      const data = await response.json();
      if (data.event) {
        setParsedEvent(data.event);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            placeholder="e.g., Meeting with boss today at 4pm, Yoga class at 6pm next Tuesday..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Parsing..." : "Parse Event"}
        </Button>
      </form>

      {parsedEvent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{parsedEvent.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><strong>Start:</strong> {formatDateTime(parsedEvent.startTime)}</div>
            <div><strong>End:</strong> {formatDateTime(parsedEvent.endTime)}</div>
            <div><strong>Duration:</strong> {parsedEvent.duration} minutes</div>
            <div><strong>Location:</strong> {parsedEvent.location}</div>
            <div><strong>Category:</strong> {parsedEvent.category}</div>
            <div><strong>Description:</strong> {parsedEvent.description}</div>
            <div><strong>All Day:</strong> {parsedEvent.isAllDay ? "Yes" : "No"}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}