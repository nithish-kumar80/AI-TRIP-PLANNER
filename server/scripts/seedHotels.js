/**
 * Hotel Seed Script — VoyageAI
 * Run: node scripts/seedHotels.js
 * Drops existing hotels + rooms, then seeds 50+ hotels across India and international.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

const HOTELS = [
  // ══════════════════════════════════════════════
  // CHENNAI
  // ══════════════════════════════════════════════
  {
    name: 'ITC Grand Chola',
    description: 'A LEED Platinum certified grand luxury hotel inspired by the magnificent Chola dynasty. Features South India\'s finest dining and a world-class spa.',
    address: '63, Mount Road, Guindy, Chennai 600032',
    city: 'chennai', country: 'India',
    coordinates: { lat: 13.0082, lng: 80.2206 },
    images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    starRating: 5, averageRating: 4.6, reviewCount: 1456, pricePerNight: 12000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'conference', 'business_center'],
    hotelType: 'hotel', isFeatured: true, tags: ['luxury', 'heritage', 'eco-friendly', 'business'],
  },
  {
    name: 'Taj Coromandel Chennai',
    description: 'An iconic landmark of Chennai, offering spacious rooms, an internationally renowned restaurant, and impeccable Taj hospitality.',
    address: '37, Mahatma Gandhi Road, Nungambakkam, Chennai 600034',
    city: 'chennai', country: 'India',
    coordinates: { lat: 13.0605, lng: 80.2427 },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 2100, pricePerNight: 10500,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge', 'airport_shuttle'],
    hotelType: 'hotel', isFeatured: false, tags: ['luxury', 'iconic', 'central'],
  },
  {
    name: 'The Raintree Hotel Anna Salai',
    description: 'An eco-friendly boutique hotel in the heart of Chennai, known for its lush greenery and sustainable practices.',
    address: '636, Anna Salai, Teynampet, Chennai 600006',
    city: 'chennai', country: 'India',
    coordinates: { lat: 13.0491, lng: 80.2551 },
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    starRating: 4, averageRating: 4.3, reviewCount: 870, pricePerNight: 5500,
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'bar', 'parking'],
    hotelType: 'boutique', isFeatured: false, tags: ['eco-friendly', 'boutique', 'central'],
  },
  {
    name: 'FabHotel Prime Chennai Airport',
    description: 'Budget-friendly comfort hotel with easy airport access. Great for transit travelers and business guests.',
    address: 'Meenambakkam, Chennai 600027',
    city: 'chennai', country: 'India',
    coordinates: { lat: 12.9942, lng: 80.1709 },
    images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    starRating: 3, averageRating: 3.9, reviewCount: 412, pricePerNight: 1800,
    amenities: ['wifi', 'airconditioning', 'parking', 'restaurant'],
    hotelType: 'hotel', isFeatured: false, tags: ['budget', 'airport', 'transit'],
  },

  // ══════════════════════════════════════════════
  // BANGALORE
  // ══════════════════════════════════════════════
  {
    name: 'The Oberoi Bengaluru',
    description: 'An oasis of calm amidst the bustle of Bangalore. Set amidst lush green gardens, this luxury hotel combines contemporary elegance with impeccable service.',
    address: '37-39, Mahatma Gandhi Road, Bengaluru 560001',
    city: 'bangalore', country: 'India',
    coordinates: { lat: 12.9758, lng: 77.6095 },
    images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 1820, pricePerNight: 16000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge', 'airport_shuttle'],
    hotelType: 'hotel', isFeatured: true, tags: ['luxury', 'garden', 'MG Road'],
  },
  {
    name: 'JW Marriott Hotel Bengaluru',
    description: 'Located in the heart of the city on Vittal Mallya Road, JW Marriott offers sophisticated luxury with stunning views of Bengaluru.',
    address: '24/1, Vittal Mallya Road, Bengaluru 560001',
    city: 'bangalore', country: 'India',
    coordinates: { lat: 12.9731, lng: 77.5945 },
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 2430, pricePerNight: 14000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'conference', 'business_center'],
    hotelType: 'hotel', isFeatured: true, tags: ['luxury', 'business', 'central'],
  },
  {
    name: 'Treebo Trend Prestige Bengaluru',
    description: 'Comfortable mid-range hotel ideal for business travelers and tourists in the tech hub of India.',
    address: 'Koramangala, Bengaluru 560095',
    city: 'bangalore', country: 'India',
    coordinates: { lat: 12.9352, lng: 77.6245 },
    images: ['https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80',
    starRating: 3, averageRating: 4.1, reviewCount: 567, pricePerNight: 2800,
    amenities: ['wifi', 'airconditioning', 'restaurant', 'parking'],
    hotelType: 'hotel', isFeatured: false, tags: ['budget', 'tech-hub', 'Koramangala'],
  },

  // ══════════════════════════════════════════════
  // HYDERABAD
  // ══════════════════════════════════════════════
  {
    name: 'Taj Falaknuma Palace',
    description: 'The most exclusive property in the Taj portfolio, perched atop a hill like a diamond at the ring of Hyderabad. A 19th century royal palace turned luxury hotel.',
    address: 'Engine Bowli, Falaknuma, Hyderabad 500053',
    city: 'hyderabad', country: 'India',
    coordinates: { lat: 17.3240, lng: 78.4659 },
    images: ['https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80',
    starRating: 5, averageRating: 4.9, reviewCount: 3100, pricePerNight: 35000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge', 'airport_shuttle'],
    hotelType: 'resort', isFeatured: true, tags: ['palace', 'heritage', 'royal', 'luxury'],
  },
  {
    name: 'Novotel Hyderabad Airport',
    description: 'Conveniently connected to Hyderabad International Airport. Perfect for business travelers with modern amenities and excellent dining.',
    address: 'Rajiv Gandhi International Airport, Shamshabad, Hyderabad 501218',
    city: 'hyderabad', country: 'India',
    coordinates: { lat: 17.2403, lng: 78.4294 },
    images: ['https://images.unsplash.com/photo-1543968332-f99478b1ebdc?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1543968332-f99478b1ebdc?w=800&q=80',
    starRating: 4, averageRating: 4.3, reviewCount: 1240, pricePerNight: 7000,
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'bar', 'parking', 'conference', 'business_center', 'airport_shuttle'],
    hotelType: 'hotel', isFeatured: false, tags: ['airport', 'business', 'modern'],
  },
  {
    name: 'Golkonda Boutique Hotel',
    description: 'A charming mid-range hotel near the historic Golkonda Fort, perfect for exploring Hyderabad\'s rich heritage.',
    address: 'Ibrahim Bagh, Khilwat, Hyderabad 500008',
    city: 'hyderabad', country: 'India',
    coordinates: { lat: 17.3833, lng: 78.4011 },
    images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    starRating: 3, averageRating: 4.0, reviewCount: 389, pricePerNight: 3200,
    amenities: ['wifi', 'restaurant', 'parking', 'airconditioning'],
    hotelType: 'boutique', isFeatured: false, tags: ['heritage', 'boutique', 'historic'],
  },

  // ══════════════════════════════════════════════
  // MUMBAI
  // ══════════════════════════════════════════════
  {
    name: 'The Taj Mahal Palace',
    description: 'An iconic luxury hotel in Mumbai with stunning views of the Gateway of India. Built in 1903, this heritage property offers unparalleled luxury and history.',
    address: 'Apollo Bunder, Colaba, Mumbai 400001',
    city: 'mumbai', country: 'India',
    coordinates: { lat: 18.9220, lng: 72.8347 },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 2847, pricePerNight: 25000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge', 'airport_shuttle'],
    hotelType: 'hotel', isFeatured: true, tags: ['luxury', 'heritage', 'waterfront', 'iconic'],
  },
  {
    name: 'The Oberoi Mumbai',
    description: 'An ultra-luxury hotel with breathtaking views of the Arabian Sea and Marine Drive. Located in Nariman Point, the hotel offers unmatched sophistication.',
    address: 'Nariman Point, Mumbai 400021',
    city: 'mumbai', country: 'India',
    coordinates: { lat: 18.9270, lng: 72.8236 },
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    starRating: 5, averageRating: 4.9, reviewCount: 1950, pricePerNight: 30000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge'],
    hotelType: 'hotel', isFeatured: true, tags: ['luxury', 'sea-view', 'Marine Drive'],
  },
  {
    name: 'Trident BKC Mumbai',
    description: 'A contemporary luxury hotel in the Bandra Kurla Complex, Mumbai\'s new financial hub. Ideal for corporate travelers.',
    address: 'G Block, Bandra Kurla Complex, Mumbai 400051',
    city: 'mumbai', country: 'India',
    coordinates: { lat: 19.0596, lng: 72.8656 },
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    starRating: 5, averageRating: 4.6, reviewCount: 1324, pricePerNight: 12000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'conference', 'business_center'],
    hotelType: 'hotel', isFeatured: false, tags: ['business', 'BKC', 'corporate'],
  },
  {
    name: 'Backpacker Panda Mumbai',
    description: 'Social and vibrant hostel in the heart of Colaba. Perfect for budget travelers wanting to explore Mumbai\'s iconic sights.',
    address: 'Colaba, Mumbai 400005',
    city: 'mumbai', country: 'India',
    coordinates: { lat: 18.9155, lng: 72.8310 },
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    starRating: 2, averageRating: 4.2, reviewCount: 2100, pricePerNight: 600,
    amenities: ['wifi', 'airconditioning'],
    hotelType: 'hostel', isFeatured: false, tags: ['budget', 'backpacker', 'social', 'Colaba'],
  },

  // ══════════════════════════════════════════════
  // DELHI / NEW DELHI
  // ══════════════════════════════════════════════
  {
    name: 'Leela Palace New Delhi',
    description: 'A grand palace hotel in Lutyens Delhi, surrounded by embassies. Combines Indian architectural grandeur with modern luxury.',
    address: 'Diplomatic Enclave, Chanakyapuri, New Delhi 110023',
    city: 'new delhi', country: 'India',
    coordinates: { lat: 28.5983, lng: 77.1889 },
    images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 1923, pricePerNight: 18000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge', 'airport_shuttle', 'business_center'],
    hotelType: 'hotel', isFeatured: true, tags: ['luxury', 'diplomatic', 'palace'],
  },
  {
    name: 'The Imperial New Delhi',
    description: 'A heritage luxury hotel from 1931, a masterpiece of colonial architecture. Located on Janpath, walking distance from Connaught Place.',
    address: 'Janpath, New Delhi 110001',
    city: 'new delhi', country: 'India',
    coordinates: { lat: 28.6245, lng: 77.2151 },
    images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 2200, pricePerNight: 22000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge'],
    hotelType: 'hotel', isFeatured: true, tags: ['heritage', 'colonial', 'central', 'luxury'],
  },
  {
    name: 'Ibis New Delhi Aerocity',
    description: 'Smart budget hotel with great connectivity to Indira Gandhi International Airport. Clean, modern rooms at excellent value.',
    address: 'Asset 7, Hospitality District, Aerocity, New Delhi 110037',
    city: 'new delhi', country: 'India',
    coordinates: { lat: 28.5561, lng: 77.0862 },
    images: ['https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80',
    starRating: 3, averageRating: 4.1, reviewCount: 3450, pricePerNight: 3500,
    amenities: ['wifi', 'restaurant', 'bar', 'gym', 'airport_shuttle'],
    hotelType: 'hotel', isFeatured: false, tags: ['budget', 'airport', 'aerocity'],
  },

  // ══════════════════════════════════════════════
  // GOA
  // ══════════════════════════════════════════════
  {
    name: 'Taj Exotica Resort & Spa Goa',
    description: 'Nestled on a secluded stretch of Benaulim Beach, this five-star resort offers a serene haven with lush tropical gardens and the finest Goan cuisine.',
    address: 'Calvaddo, Benaulim, South Goa 403716',
    city: 'goa', country: 'India',
    coordinates: { lat: 15.2559, lng: 73.9300 },
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 2680, pricePerNight: 20000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'beach_access', 'room_service', 'concierge', 'kids_club'],
    hotelType: 'resort', isFeatured: true, tags: ['beach', 'luxury', 'resort', 'south-goa'],
  },
  {
    name: 'W Goa',
    description: 'A bold and vibrant resort on Vagator Beach. W Goa offers a contemporary design experience with stunning cliff-top views and infinity pools.',
    address: 'Vagator Beach, Bardez, North Goa 403509',
    city: 'goa', country: 'India',
    coordinates: { lat: 15.6023, lng: 73.7408 },
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 1870, pricePerNight: 18000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'beach_access', 'room_service', 'concierge'],
    hotelType: 'resort', isFeatured: true, tags: ['party', 'beach', 'trendy', 'north-goa'],
  },
  {
    name: 'Zostel Goa Anjuna',
    description: 'A vibrant backpacker hostel with a stunning pool and social vibe, perfectly located near Anjuna Beach.',
    address: 'Anjuna Beach Road, North Goa 403509',
    city: 'goa', country: 'India',
    coordinates: { lat: 15.5748, lng: 73.7454 },
    images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    starRating: 3, averageRating: 4.3, reviewCount: 3421, pricePerNight: 800,
    amenities: ['wifi', 'pool', 'bar', 'restaurant'],
    hotelType: 'hostel', isFeatured: false, tags: ['budget', 'backpacker', 'party', 'beach'],
  },
  {
    name: 'Leela Goa',
    description: 'Set on the golden sands of Mobor Beach, surrounded by a private lagoon and the Sal River, Leela Goa is synonymous with Goan luxury.',
    address: 'Mobor, Cavelossim, South Goa 403731',
    city: 'goa', country: 'India',
    coordinates: { lat: 15.1650, lng: 73.9485 },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    starRating: 5, averageRating: 4.6, reviewCount: 2100, pricePerNight: 17000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'beach_access', 'kids_club', 'concierge'],
    hotelType: 'resort', isFeatured: false, tags: ['beach', 'luxury', 'lagoon', 'south-goa'],
  },

  // ══════════════════════════════════════════════
  // JAIPUR
  // ══════════════════════════════════════════════
  {
    name: 'Rambagh Palace',
    description: 'Once the residence of the Maharaja of Jaipur, now a magnificent heritage luxury hotel. Experience royal Rajputana hospitality at its finest.',
    address: 'Bhawani Singh Road, Jaipur, Rajasthan 302005',
    city: 'jaipur', country: 'India',
    coordinates: { lat: 26.8876, lng: 75.8025 },
    images: ['https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 2134, pricePerNight: 30000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge'],
    hotelType: 'resort', isFeatured: true, tags: ['heritage', 'royal', 'palace', 'rajputana'],
  },
  {
    name: 'Samode Palace',
    description: 'A stunning 400-year-old palace turned luxury hotel in the town of Samode, near Jaipur. Hand-painted murals, intricate mirror work, and royal suites.',
    address: 'Samode Village, District Jaipur, Rajasthan 303806',
    city: 'jaipur', country: 'India',
    coordinates: { lat: 27.1476, lng: 75.4777 },
    images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 980, pricePerNight: 25000,
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'room_service', 'concierge'],
    hotelType: 'resort', isFeatured: false, tags: ['heritage', 'palace', 'royal', 'historic'],
  },
  {
    name: 'Zostel Jaipur',
    description: 'Budget-friendly hostel in the Pink City with vibrant dorm rooms and a rooftop terrace with views of Jaipur\'s forts.',
    address: 'Moti Doongri Road, Jaipur, Rajasthan 302004',
    city: 'jaipur', country: 'India',
    coordinates: { lat: 26.8898, lng: 75.8089 },
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    starRating: 2, averageRating: 4.2, reviewCount: 1875, pricePerNight: 700,
    amenities: ['wifi', 'restaurant'],
    hotelType: 'hostel', isFeatured: false, tags: ['budget', 'backpacker', 'pink-city'],
  },

  // ══════════════════════════════════════════════
  // KOCHI (COCHIN)
  // ══════════════════════════════════════════════
  {
    name: 'Taj Malabar Resort & Spa',
    description: 'Spectacularly positioned on Willingdon Island, this iconic colonial hotel overlooks the bustling Kochi harbor and the Arabian Sea.',
    address: 'Willingdon Island, Kochi, Kerala 682009',
    city: 'kochi', country: 'India',
    coordinates: { lat: 9.9643, lng: 76.2743 },
    images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 1560, pricePerNight: 14000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge', 'airport_shuttle'],
    hotelType: 'resort', isFeatured: true, tags: ['waterfront', 'heritage', 'luxury', 'harbor'],
  },
  {
    name: 'Old Harbour Hotel Kochi',
    description: 'A beautifully restored 300-year-old Dutch house in Fort Kochi. The 13-room boutique hotel offers heritage charm, a pool, and exceptional service.',
    address: '1/328, Tower Road, Fort Kochi, Kerala 682001',
    city: 'kochi', country: 'India',
    coordinates: { lat: 9.9641, lng: 76.2434 },
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    starRating: 4, averageRating: 4.5, reviewCount: 720, pricePerNight: 8000,
    amenities: ['wifi', 'pool', 'restaurant', 'concierge'],
    hotelType: 'boutique', isFeatured: false, tags: ['heritage', 'fort-kochi', 'boutique', 'colonial'],
  },

  // ══════════════════════════════════════════════
  // OOTY (UDHAGAMANDALAM)
  // ══════════════════════════════════════════════
  {
    name: 'Savoy Hotel Ooty',
    description: 'A 200-year-old colonial hill station hotel nestled in a forest of eucalyptus and pine trees. An iconic Ooty landmark with warm fireplaces and butler service.',
    address: '77 Sylks Road, Ooty, Tamil Nadu 643001',
    city: 'ooty', country: 'India',
    coordinates: { lat: 11.4132, lng: 76.6929 },
    images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    starRating: 4, averageRating: 4.4, reviewCount: 890, pricePerNight: 6000,
    amenities: ['wifi', 'restaurant', 'bar', 'room_service', 'parking'],
    hotelType: 'hotel', isFeatured: true, tags: ['colonial', 'hill-station', 'heritage', 'forest'],
  },
  {
    name: 'Sterling Ooty Elk Hill',
    description: 'A serene hill resort perched atop Elk Hill with panoramic views of the Nilgiri mountains. Popular with families for weekend getaways.',
    address: 'Elk Hill, Ooty, Tamil Nadu 643002',
    city: 'ooty', country: 'India',
    coordinates: { lat: 11.4080, lng: 76.6985 },
    images: ['https://images.unsplash.com/photo-1601918774516-b5d20a37ab80?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1601918774516-b5d20a37ab80?w=800&q=80',
    starRating: 3, averageRating: 4.1, reviewCount: 540, pricePerNight: 4500,
    amenities: ['wifi', 'restaurant', 'parking', 'kids_club'],
    hotelType: 'resort', isFeatured: false, tags: ['family', 'hill-station', 'mountain-view'],
  },

  // ══════════════════════════════════════════════
  // MANALI
  // ══════════════════════════════════════════════
  {
    name: 'The Himalayan Manali',
    description: 'A luxury mountain resort perched at 8,500 feet, offering breathtaking views of the Himalayan peaks. Warm wooden interiors and a rejuvenating spa.',
    address: 'Hadimba Temple Road, Manali, Himachal Pradesh 175131',
    city: 'manali', country: 'India',
    coordinates: { lat: 32.2432, lng: 77.1892 },
    images: ['https://images.unsplash.com/photo-1601918774516-b5d20a37ab80?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1601918774516-b5d20a37ab80?w=800&q=80',
    starRating: 5, averageRating: 4.6, reviewCount: 1120, pricePerNight: 15000,
    amenities: ['wifi', 'spa', 'restaurant', 'bar', 'room_service', 'parking'],
    hotelType: 'resort', isFeatured: true, tags: ['luxury', 'mountain', 'himalayan', 'spa'],
  },
  {
    name: 'Snow Valley Resorts Manali',
    description: 'A cozy mid-range mountain retreat set amidst apple orchards and deodar forests. Ideal base for treks, skiing, and exploring the Kullu Valley.',
    address: 'Old Manali Road, Manali, Himachal Pradesh 175131',
    city: 'manali', country: 'India',
    coordinates: { lat: 32.2660, lng: 77.1786 },
    images: ['https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
    starRating: 3, averageRating: 4.2, reviewCount: 680, pricePerNight: 3500,
    amenities: ['wifi', 'restaurant', 'parking'],
    hotelType: 'resort', isFeatured: false, tags: ['budget', 'mountain', 'trek', 'apple-orchards'],
  },
  {
    name: 'Zostel Manali',
    description: 'Social backpacker hostel with mountain views, a chill bonfire area, and a great crowd of travelers. Budget accommodation done right.',
    address: 'Old Manali, Manali, Himachal Pradesh 175131',
    city: 'manali', country: 'India',
    coordinates: { lat: 32.2690, lng: 77.1770 },
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    starRating: 2, averageRating: 4.3, reviewCount: 2100, pricePerNight: 600,
    amenities: ['wifi', 'restaurant'],
    hotelType: 'hostel', isFeatured: false, tags: ['budget', 'backpacker', 'bonfire', 'social'],
  },

  // ══════════════════════════════════════════════
  // UDAIPUR
  // ══════════════════════════════════════════════
  {
    name: 'Taj Lake Palace',
    description: 'A floating marble palace in the middle of Lake Pichola, considered one of the most romantic hotels in the world. An 18th century royal residence turned magical hotel.',
    address: 'Lake Pichola, Udaipur, Rajasthan 313001',
    city: 'udaipur', country: 'India',
    coordinates: { lat: 24.5757, lng: 73.6835 },
    images: ['https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80',
    starRating: 5, averageRating: 4.9, reviewCount: 3890, pricePerNight: 40000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge'],
    hotelType: 'resort', isFeatured: true, tags: ['palace', 'lake', 'romantic', 'royal', 'iconic'],
  },
  {
    name: 'Fateh Garh Heritage Hotel',
    description: 'A hilltop heritage hotel overlooking Lake Fateh Sagar and the Aravallis. Stunning views, royal architecture, and warm Rajasthani hospitality.',
    address: 'Fateh Garh, Sevashram Road, Udaipur, Rajasthan 313001',
    city: 'udaipur', country: 'India',
    coordinates: { lat: 24.5979, lng: 73.6744 },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    starRating: 4, averageRating: 4.5, reviewCount: 760, pricePerNight: 8500,
    amenities: ['wifi', 'pool', 'restaurant', 'bar', 'parking', 'concierge'],
    hotelType: 'boutique', isFeatured: false, tags: ['heritage', 'lake-view', 'hilltop', 'boutique'],
  },

  // ══════════════════════════════════════════════
  // KOLKATA
  // ══════════════════════════════════════════════
  {
    name: 'The Oberoi Grand Kolkata',
    description: 'A legendary Victorian colonial hotel in the heart of Kolkata, facing the maidan. Since 1880, this grand dame has been synonymous with Calcutta hospitality.',
    address: '15, Jawaharlal Nehru Road, Kolkata 700013',
    city: 'kolkata', country: 'India',
    coordinates: { lat: 22.5676, lng: 88.3538 },
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 1750, pricePerNight: 14000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge'],
    hotelType: 'hotel', isFeatured: true, tags: ['heritage', 'colonial', 'luxury', 'iconic'],
  },
  {
    name: 'Taj Bengal Kolkata',
    description: 'A premier luxury hotel in the cultural capital of India, housed in a striking contemporary structure in Alipore.',
    address: '34B, Belvedere Road, Alipore, Kolkata 700027',
    city: 'kolkata', country: 'India',
    coordinates: { lat: 22.5460, lng: 88.3377 },
    images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    starRating: 5, averageRating: 4.6, reviewCount: 1340, pricePerNight: 11000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'conference', 'business_center'],
    hotelType: 'hotel', isFeatured: false, tags: ['luxury', 'alipore', 'business'],
  },

  // ══════════════════════════════════════════════
  // INTERNATIONAL — PARIS
  // ══════════════════════════════════════════════
  {
    name: 'Hotel Le Meurice Paris',
    description: 'Known as the palace of kings, Le Meurice has been welcoming royalty and celebrities since 1835. Overlooking the Tuileries Garden, its Dalí Bar and two Michelin-starred restaurant are legendary.',
    address: '228 Rue de Rivoli, 75001 Paris, France',
    city: 'paris', country: 'France',
    coordinates: { lat: 48.8648, lng: 2.3303 },
    images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 3200, pricePerNight: 45000,
    amenities: ['wifi', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge', 'laundry'],
    hotelType: 'hotel', isFeatured: true, tags: ['luxury', 'iconic', 'Tuileries', 'Paris'],
    currency: 'INR',
  },
  {
    name: 'Hotel Fabric Paris',
    description: 'A chic boutique hotel in a converted 19th century textile factory in the vibrant Oberkampf neighborhood. Hip, artsy design with a central location.',
    address: '31 Rue de la Folie Méricourt, 75011 Paris, France',
    city: 'paris', country: 'France',
    coordinates: { lat: 48.8632, lng: 2.3725 },
    images: ['https://images.unsplash.com/photo-1521016571752-81e886e1c9a7?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1521016571752-81e886e1c9a7?w=800&q=80',
    starRating: 4, averageRating: 4.5, reviewCount: 1120, pricePerNight: 18000,
    amenities: ['wifi', 'bar', 'restaurant', 'concierge'],
    hotelType: 'boutique', isFeatured: false, tags: ['boutique', 'artsy', 'hip', 'Paris'],
    currency: 'INR',
  },
  {
    name: 'Generator Paris',
    description: 'A design-forward budget hostel in the 10th arrondissement of Paris, with a vibrant rooftop bar and comfortable pod-style rooms.',
    address: '9-11 Place du Colonel Fabien, 75010 Paris, France',
    city: 'paris', country: 'France',
    coordinates: { lat: 48.8718, lng: 2.3724 },
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    starRating: 2, averageRating: 4.0, reviewCount: 4500, pricePerNight: 3500,
    amenities: ['wifi', 'bar', 'restaurant'],
    hotelType: 'hostel', isFeatured: false, tags: ['budget', 'backpacker', 'rooftop', 'Paris'],
    currency: 'INR',
  },

  // ══════════════════════════════════════════════
  // INTERNATIONAL — DUBAI
  // ══════════════════════════════════════════════
  {
    name: 'Burj Al Arab Jumeirah',
    description: 'The world\'s most luxurious hotel, soaring 321 metres above the Arabian Gulf on a private island. An icon of modern Dubai with all butler-serviced suites.',
    address: 'Jumeirah Road, Umm Suqeim 3, Dubai, UAE',
    city: 'dubai', country: 'UAE',
    coordinates: { lat: 25.1412, lng: 55.1853 },
    images: ['https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=800&q=80',
    starRating: 5, averageRating: 4.9, reviewCount: 5600, pricePerNight: 85000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'beach_access', 'room_service', 'concierge', 'airport_shuttle'],
    hotelType: 'hotel', isFeatured: true, tags: ['iconic', 'ultra-luxury', 'sea', 'Dubai'],
    currency: 'INR',
  },
  {
    name: 'Atlantis The Palm Dubai',
    description: 'A stunning resort at the apex of the Palm Jumeirah with a private beach, the world-famous Aquaventure Waterpark, and 17,000 marine animals in The Lost Chambers.',
    address: 'Palm Jumeirah, Dubai, UAE',
    city: 'dubai', country: 'UAE',
    coordinates: { lat: 25.1304, lng: 55.1173 },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 8900, pricePerNight: 40000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'beach_access', 'room_service', 'concierge', 'kids_club', 'airport_shuttle'],
    hotelType: 'resort', isFeatured: true, tags: ['resort', 'Palm', 'waterpark', 'family', 'Dubai'],
    currency: 'INR',
  },

  // ══════════════════════════════════════════════
  // INTERNATIONAL — BALI
  // ══════════════════════════════════════════════
  {
    name: 'Four Seasons Resort Bali at Sayan',
    description: 'Set above a bend in the Ayung River in the heart of Ubud\'s sacred river valley, this resort combines breathtaking natural beauty with authentic Balinese culture.',
    address: 'Sayan, Ubud, Gianyar, Bali 80571, Indonesia',
    city: 'bali', country: 'Indonesia',
    coordinates: { lat: -8.5069, lng: 115.2442 },
    images: ['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
    starRating: 5, averageRating: 4.9, reviewCount: 2100, pricePerNight: 38000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge'],
    hotelType: 'resort', isFeatured: true, tags: ['luxury', 'jungle', 'river', 'Ubud', 'Bali'],
    currency: 'INR',
  },
  {
    name: 'Potato Head Suites & Studios Bali',
    description: 'An iconic design hotel in Seminyak with a famous beach club. Creative Indonesian architecture, curated art, and a legendary sunset cocktail experience.',
    address: 'Jl. Petitenget 51B, Seminyak, Bali 80361, Indonesia',
    city: 'bali', country: 'Indonesia',
    coordinates: { lat: -8.6837, lng: 115.1569 },
    images: ['https://images.unsplash.com/photo-1540541338537-71cf95e6b50b?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1540541338537-71cf95e6b50b?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 1650, pricePerNight: 22000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'beach_access', 'concierge'],
    hotelType: 'boutique', isFeatured: false, tags: ['design', 'beach-club', 'Seminyak', 'Bali'],
    currency: 'INR',
  },
  {
    name: 'Katamama Boutique Hotel Bali',
    description: 'A 58-suite luxury boutique hotel celebrating Balinese artisanship. Each suite is handcrafted by local artisans using traditional techniques.',
    address: 'Jl. Petitenget 51, Seminyak, Bali 80361, Indonesia',
    city: 'bali', country: 'Indonesia',
    coordinates: { lat: -8.6840, lng: 115.1565 },
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 890, pricePerNight: 28000,
    amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar', 'concierge'],
    hotelType: 'boutique', isFeatured: false, tags: ['artisan', 'boutique', 'luxury', 'Bali'],
    currency: 'INR',
  },

  // ══════════════════════════════════════════════
  // INTERNATIONAL — SINGAPORE
  // ══════════════════════════════════════════════
  {
    name: 'Marina Bay Sands Singapore',
    description: 'The iconic integrated resort atop three towers with the world-famous infinity pool overlooking Singapore\'s skyline. A landmark of modern Singapore.',
    address: '10 Bayfront Avenue, Singapore 018956',
    city: 'singapore', country: 'Singapore',
    coordinates: { lat: 1.2837, lng: 103.8607 },
    images: ['https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80',
    starRating: 5, averageRating: 4.7, reviewCount: 12000, pricePerNight: 35000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'conference', 'business_center', 'concierge'],
    hotelType: 'hotel', isFeatured: true, tags: ['iconic', 'infinity-pool', 'skyline', 'Singapore'],
    currency: 'INR',
  },
  {
    name: 'The Fullerton Hotel Singapore',
    description: 'A heritage landmark and Singapore\'s most prestigious address, housed in a 1928 neo-classical building on the Singapore River.',
    address: '1 Fullerton Square, Singapore 049178',
    city: 'singapore', country: 'Singapore',
    coordinates: { lat: 1.2863, lng: 103.8528 },
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'],
    coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    starRating: 5, averageRating: 4.8, reviewCount: 4200, pricePerNight: 28000,
    amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'room_service', 'concierge'],
    hotelType: 'hotel', isFeatured: false, tags: ['heritage', 'riverside', 'luxury', 'Singapore'],
    currency: 'INR',
  },
];

// ─── Room types to auto-create per hotel ─────────────────────────────────────
const getRoomTypes = (hotel) => [
  {
    roomType: 'standard',
    name: 'Standard Room',
    maxOccupancy: 2,
    pricePerNight: Math.round(hotel.pricePerNight * 0.75),
    bedType: 'double',
    size: 280,
    view: 'city',
    bedCount: 1,
    totalRooms: 15,
    availableRooms: 12,
  },
  {
    roomType: 'deluxe',
    name: 'Deluxe Room',
    maxOccupancy: 3,
    pricePerNight: hotel.pricePerNight,
    bedType: 'king',
    size: 420,
    view: 'garden',
    bedCount: 1,
    totalRooms: 10,
    availableRooms: 8,
  },
  {
    roomType: 'suite',
    name: 'Executive Suite',
    maxOccupancy: 4,
    pricePerNight: Math.round(hotel.pricePerNight * 1.9),
    bedType: 'king',
    size: 680,
    view: 'city',
    bedCount: 2,
    totalRooms: 5,
    availableRooms: 4,
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Drop existing hotels and rooms
    const existingHotels = await Hotel.countDocuments();
    const existingRooms = await Room.countDocuments();
    if (existingHotels > 0 || existingRooms > 0) {
      console.log(`🗑️  Removing ${existingHotels} existing hotels and ${existingRooms} rooms...`);
      await Hotel.deleteMany({});
      await Room.deleteMany({});
      console.log('   Done.\n');
    }

    // Insert hotels
    console.log(`🏨 Inserting ${HOTELS.length} hotels...`);
    const insertedHotels = await Hotel.insertMany(HOTELS.map(h => ({
      ...h,
      isActive: true,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      policies: {
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
        smokingPolicy: 'Non-smoking property',
        ageRestriction: 18,
      },
    })));
    console.log(`   ✅ ${insertedHotels.length} hotels inserted.\n`);

    // Create rooms for each hotel
    const roomsToCreate = [];
    insertedHotels.forEach((hotel) => {
      const types = getRoomTypes(hotel);
      types.forEach((rt) => {
        roomsToCreate.push({
          hotel: hotel._id,
          ...rt,
          amenities: ['Air Conditioning', 'Flat Screen TV', 'Mini Bar', 'Safe', 'Premium Toiletries', 'High-Speed WiFi'],
          currency: hotel.currency || 'INR',
          isAvailable: true,
          smokingAllowed: false,
        });
      });
    });

    console.log(`🛏️  Creating ${roomsToCreate.length} rooms (3 types × ${insertedHotels.length} hotels)...`);
    await Room.insertMany(roomsToCreate);
    console.log(`   ✅ ${roomsToCreate.length} rooms created.\n`);

    // Summary by city
    const cities = [...new Set(HOTELS.map(h => h.city))];
    console.log('📊 Summary by city:');
    cities.forEach(city => {
      const count = HOTELS.filter(h => h.city === city).length;
      console.log(`   ${city.padEnd(15)} ${count} hotels`);
    });

    console.log('\n🎉 Hotel seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
