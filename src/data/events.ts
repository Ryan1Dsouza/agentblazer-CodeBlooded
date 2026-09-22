import { Event } from '../types';

export const events: Event[] = [
  {
    id: '1',
    title: 'Cybersecurity & Career Pathways',
    date: 'March 26, 2026',
    category: 'Masterclass',
    description: 'A comprehensive session on cybersecurity fundamentals and career opportunities in the tech industry, featuring industry experts.',
    location: 'St Joseph Engineering College',
    metric: '50+ Participants',
    gallery: [
      '/Cybersecurity & Career Pathways-20260915T115546Z-1-001/Cybersecurity & Career Pathways/c1.jpg',
      '/Cybersecurity & Career Pathways-20260915T115546Z-1-001/Cybersecurity & Career Pathways/c2.JPG',
      '/Cybersecurity & Career Pathways-20260915T115546Z-1-001/Cybersecurity & Career Pathways/c3.JPG',
      '/Cybersecurity & Career Pathways-20260915T115546Z-1-001/Cybersecurity & Career Pathways/c4.JPG',
      '/Cybersecurity & Career Pathways-20260915T115546Z-1-001/Cybersecurity & Career Pathways/c5.JPG',
      '/Cybersecurity & Career Pathways-20260915T115546Z-1-001/Cybersecurity & Career Pathways/c6.JPG'
    ]
  },
  {
    id: '2',
    title: 'GSoC and LLM Workshop',
    date: 'February 13, 2026',
    category: 'Workshop',
    description: 'An intensive workshop covering Google Summer of Code preparation and Large Language Model applications for engineering students.',
    location: 'St Joseph Engineering College',
    metric: '60+ Participants',
    gallery: Array.from({ length: 29 }, (_, i) => {
      const num = i + 1;
      const ext = (num === 25 || num === 26 || num === 27 || num === 28) ? 'JPG' : 'jpg';
      return `/GSoc and LLM Workshop-20260915T115544Z-1-001/GSoc and LLM Workshop/a${num}.${ext}`;
    })
  },
  {
    id: '3',
    title: 'PromptOps 2026',
    date: 'March 25, 2026',
    category: 'Contest',
    description: 'A challenging prompt engineering competition where students showcased their skills in optimizing AI outputs and building agentic workflows.',
    location: 'St Joseph Engineering College',
    metric: '80+ Participants',
    gallery: Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      const ext = (num >= 4 && num <= 7) ? 'JPG' : 'jpg';
      return `/PromptOps 2026-20260915T115542Z-1-001/PromptOps 2026/p${num}.${ext}`;
    })
  }
];
