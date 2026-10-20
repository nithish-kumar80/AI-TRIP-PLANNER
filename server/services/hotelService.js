const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const { AppError } = require('../middleware/errorHandler');

exports.searchHotels = async (query) => {
  const {
    city, minPrice, maxPrice, rating, amenities, hotelType,
    page = 1, limit = 12, sort = 'createdAt:-1', search,
  } = query;

  const filter = { isActive: true };
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = parseInt(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = parseInt(maxPrice);
  }
  if (rating) filter.averageRating = { $gte: parseFloat(rating) };
  if (amenities) {
    const amenityList = amenities.split(',').map((a) => a.trim());
    filter.amenities = { $all: amenityList };
  }
  if (hotelType) filter.hotelType = hotelType;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [field, dir] = (sort || 'createdAt:-1').split(':');
  const sortObj = { [field]: dir === '1' ? 1 : -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [hotels, total] = await Promise.all([
    Hotel.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)),
    Hotel.countDocuments(filter),
  ]);

  return { hotels, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) };
};

exports.getHotelById = async (hotelId) => {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new AppError('Hotel not found.', 404);
  const rooms = await Room.find({ hotel: hotelId, isAvailable: true });
  return { ...hotel.toObject(), rooms };
};

exports.getFeaturedHotels = async () => {
  return Hotel.find({ isFeatured: true, isActive: true }).limit(6).sort({ averageRating: -1 });
};

exports.seedSampleHotels = async () => {
  const count = await Hotel.countDocuments();
  if (count > 0) {
    console.log(`ℹ️  Hotel seed skipped — ${count} hotels already in DB. Run 'node scripts/seedHotels.js' to re-seed.`);
    return;
  }

  const sampleHotels = [
    {
      name: 'The Taj Mahal Palace',
      description: 'An iconic luxury hotel in Mumbai with stunning views of the Gateway of India. Built in 1903, this heritage property offers unparalleled luxury.',
      address: 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
      city: 'mumbai',
      country: 'India',
      coordinates: { lat: 18.9220, lng: 72.8347 },
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      starRating: 5,
      averageRating: 4.8,
      reviewCount: 2847,
      pricePerNight: 25000,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge', 'airport_shuttle'],
      hotelType: 'hotel',
      isFeatured: true,
      tags: ['luxury', 'heritage', 'waterfront', 'iconic'],
    },
    {
      name: 'Leela Palace New Delhi',
      description: 'A grand palace hotel offering luxury accommodations in the heart of Lutyens Delhi, surrounded by embassies and government buildings.',
      address: 'Diplomatic Enclave, Chanakyapuri, New Delhi 110023',
      city: 'new delhi',
      country: 'India',
      coordinates: { lat: 28.5983, lng: 77.1889 },
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      starRating: 5,
      averageRating: 4.7,
      reviewCount: 1923,
      pricePerNight: 18000,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge', 'airport_shuttle', 'business_center'],
      hotelType: 'hotel',
      isFeatured: true,
      tags: ['luxury', 'diplomatic', 'business', 'palace'],
    },
    {
      name: 'Ananda in the Himalayas',
      description: 'A world-class destination spa retreat nestled in the Himalayan foothills above Rishikesh. Famous for Ayurveda, yoga, and breathtaking mountain views.',
      address: 'The Palace Estate, Narendra Nagar, Tehri Garhwal, Uttarakhand 249175',
      city: 'rishikesh',
      country: 'India',
      coordinates: { lat: 30.1158, lng: 78.3218 },
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
      starRating: 5,
      averageRating: 4.9,
      reviewCount: 876,
      pricePerNight: 35000,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'room_service'],
      hotelType: 'resort',
      isFeatured: true,
      tags: ['wellness', 'himalayan', 'yoga', 'spa', 'ayurveda'],
    },
    {
      name: 'Rambagh Palace Jaipur',
      description: 'Once the residence of the Maharaja of Jaipur, now a magnificent heritage luxury hotel. Experience royal Rajputana hospitality at its finest.',
      address: 'Bhawani Singh Road, Jaipur, Rajasthan 302005',
      city: 'jaipur',
      country: 'India',
      coordinates: { lat: 26.8876, lng: 75.8025 },
      images: [
        'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&q=80',
      starRating: 5,
      averageRating: 4.8,
      reviewCount: 2134,
      pricePerNight: 30000,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'concierge'],
      hotelType: 'resort',
      isFeatured: true,
      tags: ['heritage', 'royal', 'palace', 'rajputana', 'luxury'],
    },
    {
      name: 'Zostel Goa - Anjuna',
      description: 'A vibrant backpacker hostel with a stunning pool and social vibe, perfectly located near Anjuna Beach. Ideal for solo travelers and groups.',
      address: 'Anjuna Beach Road, Anjuna, North Goa 403509',
      city: 'goa',
      country: 'India',
      coordinates: { lat: 15.5748, lng: 73.7454 },
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
      starRating: 3,
      averageRating: 4.3,
      reviewCount: 3421,
      pricePerNight: 800,
      amenities: ['wifi', 'pool', 'bar', 'restaurant'],
      hotelType: 'hostel',
      isFeatured: true,
      tags: ['budget', 'backpacker', 'party', 'beach', 'social'],
    },
    {
      name: 'ITC Grand Chola Chennai',
      description: 'A LEED Platinum certified grand luxury hotel inspired by the magnificent Chola dynasty. Features South India\'s finest dining and largest convention centre.',
      address: '63, Mount Road, Guindy, Chennai, Tamil Nadu 600032',
      city: 'chennai',
      country: 'India',
      coordinates: { lat: 13.0082, lng: 80.2206 },
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      ],
      coverImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
      starRating: 5,
      averageRating: 4.6,
      reviewCount: 1456,
      pricePerNight: 12000,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'room_service', 'conference', 'business_center'],
      hotelType: 'hotel',
      isFeatured: true,
      tags: ['luxury', 'heritage', 'eco-friendly', 'business', 'convention'],
    },
  ];

  const hotels = await Hotel.insertMany(sampleHotels);

  // Create rooms for each hotel
  const roomsToCreate = [];
  hotels.forEach((hotel) => {
    const roomTypes = [
      {
        roomType: 'standard',
        name: 'Standard Room',
        maxOccupancy: 2,
        pricePerNight: Math.round(hotel.pricePerNight * 0.8),
        bedType: 'double',
        size: 300,
        view: 'city',
      },
      {
        roomType: 'deluxe',
        name: 'Deluxe Room',
        maxOccupancy: 2,
        pricePerNight: hotel.pricePerNight,
        bedType: 'king',
        size: 450,
        view: 'garden',
      },
      {
        roomType: 'suite',
        name: 'Executive Suite',
        maxOccupancy: 4,
        pricePerNight: Math.round(hotel.pricePerNight * 1.8),
        bedType: 'king',
        size: 700,
        view: 'city',
      },
    ];
    roomTypes.forEach((rt) => {
      roomsToCreate.push({
        hotel: hotel._id,
        ...rt,
        amenities: ['Air Conditioning', 'Flat Screen TV', 'Mini Bar', 'Safe', 'Premium Toiletries', 'High-Speed WiFi'],
        totalRooms: 10,
        availableRooms: 8,
        currency: 'INR',
        isAvailable: true,
      });
    });
  });
  await Room.insertMany(roomsToCreate);
  console.log('✅ Sample hotels and rooms seeded successfully.');
};
