
export const GAMING_STREAM_IMAGES = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', // Esports arena
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80', // Gaming setup with RGB
  'https://images.unsplash.com/photo-1548484352-ea579e5233a8?auto=format&fit=crop&w=800&q=80', // Gamer with headset
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', // Console controller
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80', // Neon gaming abstract
  'https://images.unsplash.com/photo-1519669556878-63bdd230f34a?auto=format&fit=crop&w=800&q=80', // Retro arcade
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', // Arcade games
  'https://images.unsplash.com/photo-1511882150645-8278839d4303?auto=format&fit=crop&w=800&q=80', // Xbox controller
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', // Retro tech
  'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80', // Console TV
  'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80', // Streaming mic
  'https://images.unsplash.com/photo-1628151016027-e175cf64d399?auto=format&fit=crop&w=800&q=80', // PS5 controller lighting
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80', // Abstract digital
  'https://images.unsplash.com/photo-1612287230217-969869806073?auto=format&fit=crop&w=800&q=80', // Gaming mouse
  'https://images.unsplash.com/photo-1593305841991-05c2e40191d7?auto=format&fit=crop&w=800&q=80', // Switch
];

export const getGamingImage = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GAMING_STREAM_IMAGES.length;
  return GAMING_STREAM_IMAGES[index];
};
