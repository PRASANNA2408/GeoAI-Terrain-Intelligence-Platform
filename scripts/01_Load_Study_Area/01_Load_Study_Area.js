// ===============================================
// GeoAI Terrain Intelligence Platform
// Script 01 - Load Study Area
// ===============================================

// Load India Administrative Boundaries
var districts = ee.FeatureCollection("FAO/GAUL/2015/level2");

// Filter Nilgiris District
var nilgiris = districts.filter(
  ee.Filter.and(
    ee.Filter.eq('ADM1_NAME', 'Tamil Nadu'),
    ee.Filter.eq('ADM2_NAME', 'Nilgiris')
  )
);

// Add to map
Map.addLayer(nilgiris, {color: 'red'}, 'Nilgiris Boundary');

// Zoom to study area
Map.centerObject(nilgiris, 9);

// Print
print('Study Area', nilgiris);