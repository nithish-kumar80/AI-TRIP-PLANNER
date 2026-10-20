const mongoose = require('mongoose');

/**
 * Place — a tourist attraction, natural site, or activity location.
 *
 * Feature scores (0–1) are derived from OpenStreetMap tags during the data pipeline.
 * They represent how strongly a place matches each travel interest dimension.
 * These vectors are used by the recommendation engine for cosine-similarity scoring.
 *
 * dataSource: 'OpenStreetMap' | 'seeded' | 'manual'
 * osmId: original OSM node/way/relation ID — used to prevent duplicate insertions.
 */
const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    city: { type: String, required: true, lowercase: true, trim: true },
    country: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    // OSM classification tags
    category: {
      type: String,
      enum: [
        'museum', 'viewpoint', 'attraction', 'gallery', 'zoo', 'aquarium', 'theme_park',
        'fort', 'monument', 'memorial', 'ruins', 'archaeological_site', 'temple', 'church', 'mosque',
        'beach', 'park', 'garden', 'nature_reserve', 'waterfall', 'peak', 'cave', 'lake', 'forest',
        'market', 'street', 'neighborhood', 'restaurant_area', 'nightlife',
        'amusement', 'sports', 'other',
      ],
      default: 'attraction',
    },
    placeType: {
      type: String,
      enum: ['culture', 'nature', 'adventure', 'food', 'relaxation', 'nightlife', 'photography', 'other'],
      default: 'other',
    },

    // ─── Feature Vector (0–1) ────────────────────────────────────────────────
    // These are the dimensions used for cosine-similarity with user preference vectors.
    // Derived from OSM tags + category in the data pipeline (clean_places.py).
    natureScore:       { type: Number, min: 0, max: 1, default: 0 },
    adventureScore:    { type: Number, min: 0, max: 1, default: 0 },
    cultureScore:      { type: Number, min: 0, max: 1, default: 0 },
    foodScore:         { type: Number, min: 0, max: 1, default: 0 },
    relaxationScore:   { type: Number, min: 0, max: 1, default: 0 },
    nightlifeScore:    { type: Number, min: 0, max: 1, default: 0 },
    photographyScore:  { type: Number, min: 0, max: 1, default: 0 },
    accessibilityScore:{ type: Number, min: 0, max: 1, default: 0.5 },

    // ─── Practical Information ───────────────────────────────────────────────
    averageCost:    { type: Number, default: 0 },     // INR per person
    visitDuration:  { type: Number, default: 60 },    // minutes
    rating:         { type: Number, min: 0, max: 5, default: 4.0 },
    reviewCount:    { type: Number, default: 0 },
    // popularity: normalized 0–1, computed from reviewCount + rating in pipeline
    popularity:     { type: Number, min: 0, max: 1, default: 0.5 },

    bestSeason: {
      type: [String],
      enum: ['spring', 'summer', 'monsoon', 'autumn', 'winter', 'all'],
      default: ['all'],
    },
    indoorOutdoor: {
      type: String,
      enum: ['indoor', 'outdoor', 'both'],
      default: 'outdoor',
    },
    openingHours: {
      open:       { type: String, default: '06:00' },
      close:      { type: String, default: '20:00' },
      closedDays: { type: [String], default: [] },
      note:       { type: String, default: '' },
    },

    // ─── Meta ────────────────────────────────────────────────────────────────
    images:     { type: [String], default: [] },
    tags:       { type: [String], default: [] },  // raw OSM tags retained for reference
    dataSource: {
      type: String,
      enum: ['OpenStreetMap', 'seeded', 'manual', 'wikidata'],
      default: 'OpenStreetMap',
    },
    osmId: { type: String, default: null, index: true, sparse: true }, // e.g. "node/12345"

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

placeSchema.index({ city: 1, category: 1 });
placeSchema.index({ city: 1, placeType: 1 });
placeSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Place', placeSchema);
