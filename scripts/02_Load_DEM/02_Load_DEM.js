// ===============================================
// GeoAI Terrain Intelligence Platform
// Script 02 - Load DEM
// ===============================================

// Load India Administrative Boundaries
var districts = ee.FeatureCollection("FAO/GAUL/2015/level2");

// Select Nilgiris District
var nilgiris = districts.filter(
  ee.Filter.and(
    ee.Filter.eq('ADM1_NAME', 'Tamil Nadu'),
    ee.Filter.eq('ADM2_NAME', 'Nilgiris')
  )
);

// Load Copernicus DEM (30 m)
var dem = ee.ImageCollection("COPERNICUS/DEM/GLO30")
              .select("DEM")
              .mosaic();

// Clip DEM to study area
var demClip = dem.clip(nilgiris);

// Elevation visualization
var demVis = {
  min: 500,
  max: 2700,
  palette: [
    '#006400',
    '#7FFF00',
    '#FFFF00',
    '#FFA500',
    '#A52A2A',
    '#FFFFFF'
  ]
};

// Display layers
Map.centerObject(nilgiris, 9);
Map.addLayer(demClip, demVis, "Elevation");
Map.addLayer(nilgiris, {color: "red"}, "Study Area");

// Print information
print("DEM", demClip);