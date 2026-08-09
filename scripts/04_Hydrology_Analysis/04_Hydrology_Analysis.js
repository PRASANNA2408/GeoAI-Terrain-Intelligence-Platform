// ======================================================
// Project : GeoAI Terrain Intelligence Platform
// Module  : Hydrology Analysis
// Script  : 04_Hydrology_Analysis
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

// ======================================================
// Module 4: Hydrology Analysis
// Step 1: Load MERIT Hydro
// ======================================================

// Load MERIT Hydro dataset
var meritHydro = ee.Image("MERIT/Hydro/v1_0_1");

// Print available bands
print("MERIT Hydro Bands:", meritHydro.bandNames());

// Clip to study area
// Select the elevation band
var meritDEM = meritHydro
                  .select("elv")
                  .clip(nilgiris);

// Display hydrologically corrected DEM
Map.addLayer(
  meritDEM,
  {
    min: 500,
    max: 3000,
    palette: ['blue', 'cyan', 'green', 'yellow', 'brown', 'white']
  },
  "MERIT Hydro DEM",
  false
);
// ======================================================
// Step 2: Flow Direction
// ======================================================

// Select Flow Direction band
var flowDirection = meritHydro
                      .select("dir")
                      .clip(nilgiris);

// Display Flow Direction
Map.addLayer(
    flowDirection,
    {
        min: 0,
        max: 255,
        palette: [
            '0000ff',
            '00ffff',
            '00ff00',
            'ffff00',
            'ff9900',
            'ff0000'
        ]
    },
    "Flow Direction",
    false
);
// ======================================================
// Step 3: Flow Accumulation (Log Scale)
// ======================================================

// Select Upstream Area band
var flowAccumulation = meritHydro
    .select("upa")
    .clip(nilgiris);

// Log transformation
var flowAccumulationLog = flowAccumulation.log();

// Display
Map.addLayer(
    flowAccumulationLog,
    {
        min: -2,
        max: 5,
        palette: [
            '000000',
            '1a9850',
            '91cf60',
            'd9ef8b',
            'fee08b',
            'fc8d59',
            'd73027'
        ]
    },
    "Flow Accumulation (Log)",
    false
);
// ======================================================
// Step 4: Stream Network Extraction
// ======================================================

// Extract upstream drainage area
var upstreamArea = meritHydro
    .select("upa")
    .clip(nilgiris);

// Define stream threshold
// Pixels with upstream drainage area >= 1 km²
// are classified as streams.
var streams = upstreamArea.gte(1);

// Display stream network
Map.addLayer(
    streams.selfMask(),
    {
        palette: ['0000FF']
    },
    "Stream Network",
    true
);
// ======================================================
// Step 5: Height Above Nearest Drainage (HAND)
// ======================================================

// Select HAND band
var hand = meritHydro
    .select("hnd")
    .clip(nilgiris);

// Display HAND
Map.addLayer(
    hand,
    {
        min: 0,
        max: 200,
        palette: [
            '0000FF',
            '00FFFF',
            '00FF00',
            'FFFF00',
            'FF9900',
            'FF0000'
        ]
    },
    "HAND",
    false
);
// ======================================================
// Step 6: River Channel Width
// ======================================================

// Select river width band
var riverWidth = meritHydro
    .select("wth")
    .clip(nilgiris);

// Display river channel width
Map.addLayer(
    riverWidth,
    {
        min: 0,
        max: 100,
        palette: [
            'FFFFFF',
            'ADD8E6',
            '4169E1',
            '000080'
        ]
    },
    "River Channel Width",
    false
);
// ======================================================
// STEP 7: DISTANCE TO RIVER / STREAM NETWORK
// ======================================================

// Create stream network from MERIT Hydro
var streams = meritHydro.select('upa').gt(10);

// Calculate distance to nearest stream
var distanceToStream = streams
  .fastDistanceTransform(30)
  .sqrt()
  .multiply(30);

// Clip to study area
distanceToStream = distanceToStream.clip(nilgiris);

// Display
Map.addLayer(
  distanceToStream,
  {
    min: 0,
    max: 5000,
    palette: [
      '0000FF',
      '00FFFF',
      '00FF00',
      'FFFF00',
      'FF0000'
    ]
  },
  'Distance to Stream',
  false
);

// Statistics
var distanceStats = distanceToStream.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nilgiris,
  scale: 90,
  maxPixels: 1e9
});

print('Distance to Stream Statistics:', distanceStats);
// ======================================================
// STEP 8: DRAINAGE DENSITY
// ======================================================

// Stream network from MERIT Hydro
var streamNetwork = meritHydro.select('upa').gt(10);

// Calculate stream length contribution
var streamLength = streamNetwork
  .selfMask()
  .multiply(ee.Image.pixelArea().sqrt());

// Calculate drainage density using a neighborhood
var drainageDensity = streamLength
  .reduceNeighborhood({
    reducer: ee.Reducer.sum(),
    kernel: ee.Kernel.circle({
      radius: 500,
      units: 'meters'
    })
  })
  .divide(ee.Image.constant(Math.PI).multiply(500 * 500))
  .clip(nilgiris);

// Display drainage density
Map.addLayer(
  drainageDensity,
  {
    min: 0,
    max: 0.01,
    palette: [
      'FFFFFF',
      'FFFF00',
      'FFA500',
      'FF0000'
    ]
  },
  'Drainage Density',
  false
);

// Statistics
var drainageStats = drainageDensity.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nilgiris,
  scale: 90,
  maxPixels: 1e9
});

print('Drainage Density Statistics:', drainageStats);
// ======================================================
// STEP 9: TOPOGRAPHIC WETNESS INDEX (TWI)
// ======================================================

// Use MERIT Hydro elevation
var hydroElevation = meritHydro.select('elv');

// Calculate slope from MERIT Hydro elevation
var hydroSlope = ee.Terrain.slope(hydroElevation);

// Convert slope to radians
var hydroSlopeRadians = hydroSlope
  .multiply(Math.PI)
  .divide(180);

// Prevent division by zero
var slopeTan = hydroSlopeRadians
  .tan()
  .max(0.001);

// MERIT Hydro upstream drainage area
var contributingArea = meritHydro
  .select('upa')
  .max(0.001);

// Calculate TWI
var twi = contributingArea
  .divide(slopeTan)
  .log()
  .rename('TWI')
  .clip(nilgiris);

// Display TWI
Map.addLayer(
  twi,
  {
    min: -6,
    max: 14,
    palette: [
      '8c510a',
      'd8b365',
      'f6e8c3',
      'c7eae5',
      '5ab4ac',
      '01665e'
    ]
  },
  'Topographic Wetness Index',
  false
);

// TWI statistics
var twiStats = twi.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nilgiris,
  scale: 90,
  maxPixels: 1e9
});

print('TWI Statistics:', twiStats);
// ======================================================
// STEP 10: HYDROLOGICAL WETNESS INDEX
// ======================================================

// ------------------------------------------------------
// 10.1 Normalize TWI
// Higher TWI = Higher wetness
// ------------------------------------------------------

var twiMinMax = twi.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nilgiris,
  scale: 90,
  maxPixels: 1e9
});

var twiMin = ee.Number(twiMinMax.get('TWI_min'));
var twiMax = ee.Number(twiMinMax.get('TWI_max'));

var twiNormalized = twi
  .subtract(twiMin)
  .divide(twiMax.subtract(twiMin))
  .rename('TWI_Normalized');


// ------------------------------------------------------
// 10.2 Normalize HAND
// Lower HAND = Higher wetness
// ------------------------------------------------------

var handMinMax = hand.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nilgiris,
  scale: 90,
  maxPixels: 1e9
});

var handMin = ee.Number(handMinMax.get('hnd_min'));
var handMax = ee.Number(handMinMax.get('hnd_max'));

var handNormalized = hand
  .subtract(handMin)
  .divide(handMax.subtract(handMin))
  .rename('HAND_Normalized');

// Invert HAND
// Low HAND = High wetness

var handWetness = ee.Image(1)
  .subtract(handNormalized)
  .rename('HAND_Wetness');


// ------------------------------------------------------
// 10.3 Normalize Distance to Stream
// Lower distance = Higher wetness
// ------------------------------------------------------

// Give the distance image an explicit band name
var distance = distanceToStream.rename('Distance');

var distanceMinMax = distance.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nilgiris,
  scale: 90,
  maxPixels: 1e9
});

var distanceMin = ee.Number(
  distanceMinMax.get('Distance_min')
);

var distanceMax = ee.Number(
  distanceMinMax.get('Distance_max')
);

var distanceNormalized = distance
  .subtract(distanceMin)
  .divide(distanceMax.subtract(distanceMin))
  .rename('Distance_Normalized');

// Invert distance
// Low distance = High wetness

var distanceWetness = ee.Image(1)
  .subtract(distanceNormalized)
  .rename('Distance_Wetness');


// ------------------------------------------------------
// 10.4 Combine the three hydrological factors
// Equal weighting
// ------------------------------------------------------

var hydrologicalWetnessIndex = twiNormalized
  .add(handWetness)
  .add(distanceWetness)
  .divide(3)
  .rename('Hydrological_Wetness_Index')
  .clip(nilgiris);


// ------------------------------------------------------
// 10.5 Display Hydrological Wetness Index
// ------------------------------------------------------

Map.addLayer(
  hydrologicalWetnessIndex,
  {
    min: 0,
    max: 1,
    palette: [
      '313695',
      '4575b4',
      '74add1',
      'abd9e9',
      'e0f3f8',
      'ffffbf',
      'fee090',
      'fdae61',
      'f46d43',
      'd73027'
    ]
  },
  'Hydrological Wetness Index',
  false
);


// ------------------------------------------------------
// 10.6 Statistics
// ------------------------------------------------------

var hwiStats = hydrologicalWetnessIndex.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nilgiris,
  scale: 90,
  maxPixels: 1e9
});

print(
  'Hydrological Wetness Index Statistics:',
  hwiStats
);
// ======================================================
// STEP 11: HYDROLOGICAL FEATURE STACK
// Purpose: Prepare landslide-relevant hydrological
//          predictors for the future ML dataset
// ======================================================

// Rename hydrological predictors clearly

var twiFeature = twi.rename('TWI');

var distanceFeature = distanceToStream
  .rename('Distance_to_Stream');

var drainageFeature = drainageDensity
  .rename('Drainage_Density');

var handFeature = hand
  .rename('HAND');

// Combine selected hydrological predictors

var hydrologyFeatureStack = ee.Image.cat([
  twiFeature,
  distanceFeature,
  drainageFeature,
  handFeature
]).clip(nilgiris);

// Print feature stack information

print(
  'Hydrological Feature Stack:',
  hydrologyFeatureStack
);

print(
  'Hydrological Feature Bands:',
  hydrologyFeatureStack.bandNames()
);

// Display individual predictors for verification

Map.addLayer(
  hydrologyFeatureStack.select('TWI'),
  {
    min: -6,
    max: 14,
    palette: [
      '8c510a',
      'd8b365',
      'f6e8c3',
      'c7eae5',
      '5ab4ac',
      '01665e'
    ]
  },
  'ML Feature - TWI',
  false
);

Map.addLayer(
  hydrologyFeatureStack.select('Distance_to_Stream'),
  {
    min: 0,
    max: 5000,
    palette: [
      '0000FF',
      '00FFFF',
      '00FF00',
      'FFFF00',
      'FF0000'
    ]
  },
  'ML Feature - Distance to Stream',
  false
);

Map.addLayer(
  hydrologyFeatureStack.select('Drainage_Density'),
  {
    min: 0,
    max: 0.01,
    palette: [
      'FFFFFF',
      'FFFF00',
      'FFA500',
      'FF0000'
    ]
  },
  'ML Feature - Drainage Density',
  false
);

Map.addLayer(
  hydrologyFeatureStack.select('HAND'),
  {
    min: 0,
    max: 200,
    palette: [
      '0000FF',
      '00FFFF',
      '00FF00',
      'FFFF00',
      'FF0000'
    ]
  },
  'ML Feature - HAND',
  false
);