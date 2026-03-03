import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GeneratedActivityContent {
  description: string;
  requirements: string;
}

export interface GeneratedActivity {
  name: string;
  description: string;
  requirements: string;
}

@Injectable({ providedIn: 'root' })
export class GroqService {

  private readonly API_KEY = '';
  private readonly API_URL = '';

  constructor() {}

  // ── 1. Generate event description ───────────────────────
  generateEventDescription(title: string): Observable<string> {
    const prompt = `You are an expert assistant in professional event organization.
Generate a professional and engaging description in English for an event titled: "${title}".
The description must be between 80 and 150 words.
It must be clear, attractive, and contain no special symbols such as curly apostrophes or special dashes.
Respond ONLY with the description, without any introduction, title, or commentary.`;

    return new Observable(observer => {
      fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7
        })
      })
        .then(res => res.json())
        .then(data => {
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            const truncated = text.trim().substring(0, 2000);
            observer.next(truncated);
            observer.complete();
          } else if (data?.error) {
            observer.error(data.error.message || 'API error');
          } else {
            observer.error('Unexpected response');
          }
        })
        .catch(err => observer.error('Network error: ' + (err.message || err)));
    });
  }

  // ── 2. Generate description + requirements for an activity ────────
  generateActivityDescription(activityName: string): Observable<GeneratedActivityContent> {
    const prompt = `You are an expert assistant in professional event organization.
For an activity titled: "${activityName}"
Generate valid JSON ONLY (no markdown, no backticks, no text before or after).
Use only simple characters without curly apostrophes or special symbols.
Exact JSON structure:
{
  "description": "activity description in English between 60 and 100 words",
  "requirements": "required prerequisites in English between 15 and 30 words"
}
Respond ONLY with the JSON.`;

    return new Observable(observer => {
      fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.7
        })
      })
        .then(res => res.json())
        .then(data => {
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            const cleaned = text
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();
            const parsed = JSON.parse(cleaned) as GeneratedActivityContent;
            observer.next(parsed);
            observer.complete();
          } else if (data?.error) {
            observer.error(data.error.message || 'API error');
          } else {
            observer.error('Unexpected response');
          }
        })
        .catch(err => observer.error('Network error: ' + (err.message || err)));
    });
  }

  // ── 3. Generate full activities for an event ────────────
  generateEventActivities(eventTitle: string): Observable<GeneratedActivity[]> {
    const prompt = `You are an expert assistant in professional event organization.
For an event titled: "${eventTitle}"
Generate a list of 3 relevant activities in valid JSON ONLY (no markdown, no backticks, no text before or after).
Use only simple characters without curly apostrophes or special symbols.
Exact JSON structure:
[
  {
    "name": "activity name in English, maximum 80 characters, letters and numbers only",
    "description": "description in English between 60 and 100 words",
    "requirements": "prerequisites in English between 15 and 30 words"
  }
]
Respond ONLY with the JSON array.`;

    return new Observable(observer => {
      fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      })
        .then(res => res.json())
        .then(data => {
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            const cleaned = text
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();
            const parsed = JSON.parse(cleaned) as GeneratedActivity[];
            observer.next(parsed);
            observer.complete();
          } else if (data?.error) {
            observer.error(data.error.message || 'API error');
          } else {
            observer.error('Unexpected response');
          }
        })
        .catch(err => observer.error('Network error: ' + (err.message || err)));
    });
  }
}