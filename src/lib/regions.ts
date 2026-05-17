// Cuisine → country → states/cities mapping for region-aware meal planning.
// Kept compact; used to ask "are you from there?" in the wizard.

export interface RegionInfo {
  country: string;
  states: { name: string; cities: string[] }[];
}

export const CUISINE_REGIONS: Record<string, RegionInfo> = {
  Indian: {
    country: "India",
    states: [
      { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik"] },
      { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai"] },
      { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Mangaluru"] },
      { name: "Kerala", cities: ["Kochi", "Thiruvananthapuram", "Kozhikode"] },
      { name: "Punjab", cities: ["Amritsar", "Ludhiana", "Chandigarh"] },
      { name: "Delhi", cities: ["New Delhi"] },
      { name: "West Bengal", cities: ["Kolkata", "Howrah"] },
      { name: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara"] },
      { name: "Rajasthan", cities: ["Jaipur", "Udaipur", "Jodhpur"] },
      { name: "Telangana", cities: ["Hyderabad", "Warangal"] },
      { name: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada"] },
      { name: "Uttar Pradesh", cities: ["Lucknow", "Varanasi", "Agra", "Noida"] },
    ],
  },
  Italian: {
    country: "Italy",
    states: [
      { name: "Lazio", cities: ["Rome"] },
      { name: "Lombardy", cities: ["Milan", "Bergamo"] },
      { name: "Tuscany", cities: ["Florence", "Pisa"] },
      { name: "Campania", cities: ["Naples"] },
      { name: "Sicily", cities: ["Palermo", "Catania"] },
      { name: "Veneto", cities: ["Venice", "Verona"] },
    ],
  },
  Mexican: {
    country: "Mexico",
    states: [
      { name: "CDMX", cities: ["Mexico City"] },
      { name: "Jalisco", cities: ["Guadalajara"] },
      { name: "Yucatán", cities: ["Mérida"] },
      { name: "Oaxaca", cities: ["Oaxaca City"] },
    ],
  },
  Chinese: {
    country: "China",
    states: [
      { name: "Sichuan", cities: ["Chengdu"] },
      { name: "Guangdong", cities: ["Guangzhou", "Shenzhen"] },
      { name: "Beijing", cities: ["Beijing"] },
      { name: "Shanghai", cities: ["Shanghai"] },
      { name: "Hunan", cities: ["Changsha"] },
    ],
  },
  Japanese: {
    country: "Japan",
    states: [
      { name: "Tokyo", cities: ["Tokyo"] },
      { name: "Osaka", cities: ["Osaka"] },
      { name: "Kyoto", cities: ["Kyoto"] },
      { name: "Hokkaido", cities: ["Sapporo"] },
    ],
  },
  Thai: {
    country: "Thailand",
    states: [
      { name: "Bangkok", cities: ["Bangkok"] },
      { name: "Chiang Mai", cities: ["Chiang Mai"] },
      { name: "Phuket", cities: ["Phuket"] },
    ],
  },
  French: {
    country: "France",
    states: [
      { name: "Île-de-France", cities: ["Paris"] },
      { name: "Provence", cities: ["Marseille", "Nice"] },
      { name: "Lyon", cities: ["Lyon"] },
    ],
  },
  Spanish: {
    country: "Spain",
    states: [
      { name: "Catalonia", cities: ["Barcelona"] },
      { name: "Madrid", cities: ["Madrid"] },
      { name: "Andalusia", cities: ["Seville", "Granada"] },
      { name: "Valencia", cities: ["Valencia"] },
    ],
  },
  Greek: {
    country: "Greece",
    states: [
      { name: "Attica", cities: ["Athens"] },
      { name: "Crete", cities: ["Heraklion"] },
      { name: "Thessaloniki", cities: ["Thessaloniki"] },
    ],
  },
  Turkish: {
    country: "Türkiye",
    states: [
      { name: "Istanbul", cities: ["Istanbul"] },
      { name: "Ankara", cities: ["Ankara"] },
      { name: "Izmir", cities: ["Izmir"] },
    ],
  },
  Lebanese: {
    country: "Lebanon",
    states: [{ name: "Beirut", cities: ["Beirut"] }],
  },
  Moroccan: {
    country: "Morocco",
    states: [
      { name: "Marrakesh", cities: ["Marrakesh"] },
      { name: "Casablanca", cities: ["Casablanca"] },
    ],
  },
  Vietnamese: {
    country: "Vietnam",
    states: [
      { name: "Hanoi", cities: ["Hanoi"] },
      { name: "Ho Chi Minh", cities: ["Ho Chi Minh City"] },
      { name: "Hue", cities: ["Hue"] },
    ],
  },
  Korean: {
    country: "South Korea",
    states: [
      { name: "Seoul", cities: ["Seoul"] },
      { name: "Busan", cities: ["Busan"] },
    ],
  },
  American: {
    country: "United States",
    states: [
      { name: "California", cities: ["Los Angeles", "San Francisco"] },
      { name: "New York", cities: ["New York City"] },
      { name: "Texas", cities: ["Austin", "Houston"] },
      { name: "Louisiana", cities: ["New Orleans"] },
    ],
  },
  British: {
    country: "United Kingdom",
    states: [
      { name: "England", cities: ["London", "Manchester"] },
      { name: "Scotland", cities: ["Edinburgh", "Glasgow"] },
    ],
  },
  Ethiopian: {
    country: "Ethiopia",
    states: [{ name: "Addis Ababa", cities: ["Addis Ababa"] }],
  },
  Brazilian: {
    country: "Brazil",
    states: [
      { name: "São Paulo", cities: ["São Paulo"] },
      { name: "Rio de Janeiro", cities: ["Rio de Janeiro"] },
      { name: "Bahia", cities: ["Salvador"] },
    ],
  },
  Persian: {
    country: "Iran",
    states: [
      { name: "Tehran", cities: ["Tehran"] },
      { name: "Isfahan", cities: ["Isfahan"] },
    ],
  },
  Caribbean: {
    country: "Caribbean",
    states: [
      { name: "Jamaica", cities: ["Kingston"] },
      { name: "Trinidad", cities: ["Port of Spain"] },
    ],
  },
};

// Indian + American first per request, then alphabetical-ish for the rest.
const _allCuisines = Object.keys(CUISINE_REGIONS);
const _priority = ["Indian", "American"];
export const FAMOUS_CUISINES = [
  ..._priority.filter((c) => _allCuisines.includes(c)),
  ..._allCuisines.filter((c) => !_priority.includes(c)),
];

// Emoji thumbnails so cuisine chips look appetizing on the home page.
export const CUISINE_EMOJI: Record<string, string> = {
  Indian: "🍛",
  American: "🍔",
  Italian: "🍝",
  Mexican: "🌮",
  Chinese: "🥡",
  Japanese: "🍣",
  Thai: "🍜",
  French: "🥐",
  Spanish: "🥘",
  Greek: "🥙",
  Turkish: "🥙",
  Lebanese: "🧆",
  Moroccan: "🍲",
  Vietnamese: "🍲",
  Korean: "🍱",
  British: "🥧",
  Ethiopian: "🫓",
  Brazilian: "🍖",
  Persian: "🍢",
  Caribbean: "🍤",
};
