export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  category: 'Leadership' | 'Core Team' | 'Faculty' | 'Officer' | 'Committee';
  photoPath: string;
  description?: string;
  organization?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  location: string;
  metric: string;
  gallery: string[];
  organization?: string;
}

export interface Advisor {
  id: string;
  name: string;
  role: string;
  department: string;
  photoPath?: string;
}

export interface SiteConfig {
  club: {
    name: string;
    badge: string;
    tagline: string;
    description: string;
    logoPath: string;
    logoViolet?: string;
    logoInferno?: string;
    logoFrost?: string;
  };
  department: {
    name: string;
    college: string;
  };
  contact: {
    email: string;
    phone: string;
  };
}

export type Theme = 'violet' | 'inferno' | 'frost';
