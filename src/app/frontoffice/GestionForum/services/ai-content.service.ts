import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiContentService {

  // ✅ Free API key from https://console.groq.com → API Keys → Create API Key (starts with gsk_...)
  private readonly API_KEY = '';

  private readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {}

  generateContent(titre: string, type: string): Observable<string> {
    const typeLabel =
      type === 'QUESTION' ? 'a forum question post' :
      type === 'REVIEW'   ? 'a detailed review'     :
                            'an informative article';

    const prompt = `You are an assistant that helps write forum publications.

Generate the content for ${typeLabel} with the following title: "${titre}"

Instructions:
- IMPORTANT: Detect the language of the title and write the content in that SAME language (if the title is in French, write in French; if in English, write in English; etc.)
- The content must be relevant to the title
- For a question: DO NOT answer the question. Instead, explain the problem in more detail, provide context about why it is being asked, describe what has already been tried or what is unclear, and help other users better understand the issue
- For an article: write a well-structured informative article
- For a review: write a detailed and balanced critique
- Between 100 and 300 words
- Natural and engaging writing style
- Do NOT repeat the title in the content
- Reply with the content ONLY, no introduction or explanation`;

    const body = {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7
    };

    return new Observable(observer => {
      fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify(body)
      })
        .then(res => res.json())
        .then(data => {
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            observer.next(text.trim());
            observer.complete();
          } else if (data?.error) {
            observer.error(data.error.message || 'API error');
          } else {
            observer.error('Unexpected response: ' + JSON.stringify(data));
          }
        })
        .catch(err => observer.error('Network error: ' + (err.message || err)));
    });
  }
}