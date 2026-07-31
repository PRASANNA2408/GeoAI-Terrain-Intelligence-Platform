// ======================================================
// Project : GeoAI Terrain Intelligence Platform
// Module  : Terrain Analysis
// Script  : 03_Terrain_Analysis
// Author  : Prasanna Venkataramanan
// ======================================================

// ------------------------------------------------------
// Load Study Area
// ------------------------------------------------------

var districts = ee.FeatureCollection("FAO/GAUL/2015/level2");

var nilgiris = districts.filter(
  ee.Filter.and(
    ee.Filter.eq('ADM1_NAME', 'Tamil Nadu'),
    ee.Filter.eq('ADM2_NAME', 'Nilgiris')
  )
);

// ------------------------------------------------------
// Load DEM
// ------------------------------------------------------

var dem = ee.ImageCollection("COPERNICUS/DEM/GLO30")
  .select('DEM')
  .mosaic()
  .clip(nilgiris);

// ------------------------------------------------------
// Generate Terrain Layers
// ------------------------------------------------------

var terrain = ee.Algorithms.Terrain(dem);

var slope = terrain.select('slope');
var aspect = terrain.select('aspect');
var hillshade = terrain.select('hillshade');

// ------------------------------------------------------
// Print Information
// ------------------------------------------------------

print("DEM", dem);
print("Terrain", terrain);
print("Slope", slope);
print("Aspect", aspect);
print("Hillshade", hillshade);

// ------------------------------------------------------
// Visualization
// ------------------------------------------------------

Map.centerObject(nilgiris, 10);

// DEM
Map.addLayer(
  dem,
  {
    min: 800,
    max: 2600,
    palette: ['blue','green','yellow','orange','red']
  },
  "DEM"
);

// Slope
Map.addLayer(
  slope,
  {
    min:0,
    max:60,
    palette:['white','yellow','orange','red']
  },
  "Slope"
);

// Aspect
Map.addLayer(
  aspect,
  {
    min:0,
    max:360,
    palette:['red','yellow','green','cyan','blue','magenta','red']
  },
  "Aspect"
);

// Hillshade
Map.addLayer(
  hillshade,
  {
    min:0,
    max:255
  },
  "Hillshade"
);

// Boundary
Map.addLayer(
  nilgiris,
  {color:'black'},
  "Boundary"
);