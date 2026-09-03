// ======================================================
// Project : GeoAI Terrain Intelligence Platform
// Module  : Machine Learning
// Script  : 05_ML_Model
// Author  : Prasanna Venkataramanan
// ======================================================


// ======================================================
// STEP 15A: LOAD STUDY AREA
// ======================================================

var districts = ee.FeatureCollection(
  "FAO/GAUL/2015/level2"
);

var nilgiris = districts.filter(
  ee.Filter.and(
    ee.Filter.eq('ADM1_NAME', 'Tamil Nadu'),
    ee.Filter.eq('ADM2_NAME', 'Nilgiris')
  )
);

print('Study Area:', nilgiris);


// ------------------------------------------------------
// Center map
// ------------------------------------------------------

Map.centerObject(nilgiris, 10);


// ------------------------------------------------------
// Display boundary
// ------------------------------------------------------

Map.addLayer(
  nilgiris,
  {color: 'black'},
  'Nilgiris Boundary'
);


// ======================================================
// STEP 15B: LANDSLIDE INVENTORY + BACKGROUND SAMPLES
// ======================================================

// Load landslide inventory
var landslideInventory = ee.FeatureCollection(
  "projects/practice1-capstone-project/assets/Nilgiris_Landslide_Inventory"
);


// ------------------------------------------------------
// Check landslide inventory
// ------------------------------------------------------

print(
  'Landslide Inventory:',
  landslideInventory
);

print(
  'Number of Landslide Points:',
  landslideInventory.size()
);


// ------------------------------------------------------
// Generate candidate background points
// ------------------------------------------------------

var candidateBackground = ee.FeatureCollection.randomPoints({
  region: nilgiris.geometry(),
  points: 1500,
  seed: 42,
  maxError: 100
});


// ------------------------------------------------------
// Geometry containing all known landslide locations
// ------------------------------------------------------

var landslideGeometry = landslideInventory.geometry();


// ------------------------------------------------------
// Calculate distance from every candidate point
// to nearest known landslide location
// ------------------------------------------------------

var backgroundWithDistance = candidateBackground.map(
  function(feature) {

    var distance = feature.geometry().distance(
      landslideGeometry,
      100
    );

    return feature.set(
      'distance_to_landslide',
      distance
    );
  }
);


// ------------------------------------------------------
// Keep points at least 500 m away
// from known landslide locations
// ------------------------------------------------------

var backgroundPoints = backgroundWithDistance.filter(
  ee.Filter.gte(
    'distance_to_landslide',
    500
  )
);


// ------------------------------------------------------
// Take 344 background samples
// ------------------------------------------------------

backgroundPoints = backgroundPoints.limit(344);


// ======================================================
// STEP 15C: ADD CLASS LABELS
// ======================================================

// Landslide = 1
var landslideSamples = landslideInventory.map(
  function(feature) {

    return feature.set(
      'landslide',
      1
    );
  }
);


// Background = 0
backgroundPoints = backgroundPoints.map(
  function(feature) {

    return feature.set(
      'landslide',
      0
    );
  }
);


// ======================================================
// STEP 15D: COMBINE BOTH CLASSES
// ======================================================

var allSamples = landslideSamples.merge(
  backgroundPoints
);


// ======================================================
// DATASET INFORMATION
// ======================================================

print(
  'Number of Landslide Samples:',
  landslideSamples.size()
);

print(
  'Number of Background Samples:',
  backgroundPoints.size()
);

print(
  'Total ML Samples:',
  allSamples.size()
);


// ======================================================
// DISPLAY SAMPLES
// ======================================================

Map.addLayer(
  landslideSamples,
  {color: 'red'},
  'Landslide Samples'
);

Map.addLayer(
  backgroundPoints,
  {color: 'yellow'},
  'Background Samples'
);


// ======================================================
// STEP 16A: COPERNICUS DEM
// ======================================================

var dem = ee.ImageCollection(
  "COPERNICUS/DEM/GLO30"
)
.select('DEM')
.mosaic()
.clip(nilgiris);


// ------------------------------------------------------
// Elevation predictor
// ------------------------------------------------------

var elevation = dem.rename(
  'elevation'
);


// ======================================================
// STEP 16B: MERIT HYDRO
// ======================================================

// Load MERIT Hydro
var meritHydro = ee.Image(
  "MERIT/Hydro/v1_0_1"
);


// ------------------------------------------------------
// CHECK AVAILABLE MERIT HYDRO BANDS
// ------------------------------------------------------

print(
  'MERIT Hydro Bands:',
  meritHydro.bandNames()
);


// ======================================================
// MERIT HYDRO ELEVATION
// IMPORTANT:
// Correct band is 'elv', NOT 'el'
// ======================================================

var hydroElevation = meritHydro.select(
  'elv'
).rename(
  'hydro_elevation'
);


// ======================================================
// HAND
// ======================================================

var hand = meritHydro.select(
  'hnd'
).rename(
  'HAND'
);


// ======================================================
// UPSTREAM DRAINAGE AREA
// ======================================================

var drainageArea = meritHydro.select(
  'upa'
).rename(
  'drainage_area'
);


// ======================================================
// TERRAIN DERIVATIVES
// ======================================================

// Calculate slope from MERIT Hydro elevation
var hydroSlope = ee.Terrain.slope(
  meritHydro.select('elv')
).rename(
  'slope'
);


// Calculate aspect from MERIT Hydro elevation
var hydroAspect = ee.Terrain.aspect(
  meritHydro.select('elv')
).rename(
  'aspect'
);


// ======================================================
// CLIP HYDROLOGICAL VARIABLES
// ======================================================

hydroElevation = hydroElevation.clip(
  nilgiris
);

hydroSlope = hydroSlope.clip(
  nilgiris
);

hydroAspect = hydroAspect.clip(
  nilgiris
);

hand = hand.clip(
  nilgiris
);

drainageArea = drainageArea.clip(
  nilgiris
);


// ======================================================
// STEP 16C: TOPOGRAPHIC WETNESS INDEX
// ======================================================

// Convert slope from degrees to radians
var slopeRadians = hydroSlope
  .multiply(Math.PI)
  .divide(180);


// Prevent division by zero
var slopeTan = slopeRadians
  .tan()
  .max(0.001);


// Calculate TWI
var twi = drainageArea
  .divide(slopeTan)
  .add(0.001)
  .log()
  .rename(
    'TWI'
);


// ======================================================
// STEP 16D: FINAL PREDICTOR STACK
// ======================================================
//
// Predictor variables:
//
// 1. Elevation
// 2. Slope
// 3. Aspect
// 4. TWI
// 5. HAND
//
// Lithology is intentionally excluded.
// ======================================================

var predictorStack = ee.Image.cat([
  elevation,
  hydroSlope,
  hydroAspect,
  twi,
  hand
]);


// ======================================================
// CHECK PREDICTOR STACK
// ======================================================

print(
  'Predictor Stack:',
  predictorStack
);

print(
  'Predictor Bands:',
  predictorStack.bandNames()
);


// ======================================================
// STEP 16E: EXTRACT PREDICTOR VALUES
// ======================================================

var mlDataset = predictorStack.sampleRegions({
  collection: allSamples,
  properties: ['landslide'],
  scale: 90,
  geometries: true
});


// ======================================================
// CHECK EXTRACTED DATASET
// ======================================================

print(
  'ML Dataset:',
  mlDataset
);

print(
  'Total ML Samples:',
  mlDataset.size()
);


// ------------------------------------------------------
// Inspect first sample
// ------------------------------------------------------

print(
  'First ML Sample:',
  mlDataset.first()
);


// ======================================================
// STEP 16F: INDIVIDUAL PREDICTOR VALIDATION
// ======================================================

print(
  '========================================'
);

print(
  'STEP 16F: INDIVIDUAL PREDICTOR CHECK'
);

print(
  '========================================'
);


// ======================================================
// ELEVATION
// ======================================================

var elevationSamples = elevation.sampleRegions({
  collection: allSamples,
  properties: ['landslide'],
  scale: 90,
  geometries: true
});

print(
  'Elevation valid samples:',
  elevationSamples.size()
);


// ======================================================
// SLOPE
// ======================================================

var slopeSamples = hydroSlope.sampleRegions({
  collection: allSamples,
  properties: ['landslide'],
  scale: 90,
  geometries: true
});

print(
  'Slope valid samples:',
  slopeSamples.size()
);


// ======================================================
// ASPECT
// ======================================================

var aspectSamples = hydroAspect.sampleRegions({
  collection: allSamples,
  properties: ['landslide'],
  scale: 90,
  geometries: true
});

print(
  'Aspect valid samples:',
  aspectSamples.size()
);


// ======================================================
// TWI
// ======================================================

var twiSamples = twi.sampleRegions({
  collection: allSamples,
  properties: ['landslide'],
  scale: 90,
  geometries: true
});

print(
  'TWI valid samples:',
  twiSamples.size()
);


// ======================================================
// HAND
// ======================================================

var handSamples = hand.sampleRegions({
  collection: allSamples,
  properties: ['landslide'],
  scale: 90,
  geometries: true
});

print(
  'HAND valid samples:',
  handSamples.size()
);


// ======================================================
// END OF STEP 16
// ======================================================
// ======================================================
// STEP 17: TRAIN / VALIDATION SPLIT
// ======================================================

print('========================================');
print('STEP 17: TRAIN / VALIDATION SPLIT');
print('========================================');

// ------------------------------------------------------
// Add a random column for reproducible splitting
// ------------------------------------------------------

var mlDatasetRandom = mlDataset.randomColumn(
  'random',
  42
);

// ------------------------------------------------------
// 80% Training / 20% Validation
// ------------------------------------------------------

var trainingSamples = mlDatasetRandom.filter(
  ee.Filter.lt('random', 0.8)
);

var validationSamples = mlDatasetRandom.filter(
  ee.Filter.gte('random', 0.8)
);

// ------------------------------------------------------
// Check dataset sizes
// ------------------------------------------------------

print(
  'Total ML Samples:',
  mlDatasetRandom.size()
);

print(
  'Training Samples:',
  trainingSamples.size()
);

print(
  'Validation Samples:',
  validationSamples.size()
);

// ------------------------------------------------------
// Check class distribution
// ------------------------------------------------------

print(
  'Training Class Distribution:',
  trainingSamples.aggregate_histogram('landslide')
);

print(
  'Validation Class Distribution:',
  validationSamples.aggregate_histogram('landslide')
);

// ------------------------------------------------------
// Check first training sample
// ------------------------------------------------------

print(
  'First Training Sample:',
  trainingSamples.first()
);

// ------------------------------------------------------
// Check first validation sample
// ------------------------------------------------------

print(
  'First Validation Sample:',
  validationSamples.first()
);

// ======================================================
// STEP 18: RANDOM FOREST MODEL TRAINING
// ======================================================

print('========================================');
print('STEP 18: RANDOM FOREST MODEL TRAINING');
print('========================================');

// ------------------------------------------------------
// Predictor variables
// ------------------------------------------------------

var predictorBands = [
  'elevation',
  'slope',
  'aspect',
  'TWI',
  'HAND'
];

print(
  'Model Predictors:',
  predictorBands
);


// ------------------------------------------------------
// Create Random Forest classifier
// ------------------------------------------------------

var randomForest = ee.Classifier.smileRandomForest({
  numberOfTrees: 200,
  variablesPerSplit: null,
  minLeafPopulation: 2,
  bagFraction: 0.7,
  seed: 42
});


// ------------------------------------------------------
// Train Random Forest
// ------------------------------------------------------

var trainedRF = randomForest.train({
  features: trainingSamples,
  classProperty: 'landslide',
  inputProperties: predictorBands
});


// ------------------------------------------------------
// Check trained model
// ------------------------------------------------------

print(
  'Trained Random Forest:',
  trainedRF
);


// ------------------------------------------------------
// Model explanation
// ------------------------------------------------------

print(
  'Random Forest Explanation:',
  trainedRF.explain()
);
// ======================================================
// STEP 19: MODEL VALIDATION
// ======================================================

print('========================================');
print('STEP 19: MODEL VALIDATION');
print('========================================');


// ------------------------------------------------------
// Classify validation samples
// ------------------------------------------------------

var validationPredictions = validationSamples.classify(
  trainedRF
);


// ------------------------------------------------------
// Inspect validation predictions
// ------------------------------------------------------

print(
  'Validation Predictions:',
  validationPredictions
);


// ------------------------------------------------------
// Confusion Matrix
// ------------------------------------------------------

var confusionMatrix = validationPredictions.errorMatrix(
  'landslide',
  'classification'
);

print(
  'Confusion Matrix:',
  confusionMatrix
);


// ------------------------------------------------------
// Overall Accuracy
// ------------------------------------------------------

var overallAccuracy = confusionMatrix.accuracy();

print(
  'Overall Accuracy:',
  overallAccuracy
);


// ------------------------------------------------------
// Kappa
// ------------------------------------------------------

var kappa = confusionMatrix.kappa();

print(
  'Kappa:',
  kappa
);


// ------------------------------------------------------
// Producer Accuracy
// ------------------------------------------------------

var producerAccuracy = confusionMatrix.producersAccuracy();

print(
  'Producer Accuracy:',
  producerAccuracy
);


// ------------------------------------------------------
// Consumer Accuracy
// ------------------------------------------------------

var consumerAccuracy = confusionMatrix.consumersAccuracy();

print(
  'Consumer Accuracy:',
  consumerAccuracy
);


// ------------------------------------------------------
// Validation sample count
// ------------------------------------------------------

print(
  'Validation Sample Count:',
  validationPredictions.size()
);


// ------------------------------------------------------
// First validation prediction
// ------------------------------------------------------

print(
  'First Validation Prediction:',
  validationPredictions.first()
);
// ======================================================
// STEP 20: FEATURE IMPORTANCE
// ======================================================

print('========================================');
print('STEP 20: FEATURE IMPORTANCE');
print('========================================');


// ------------------------------------------------------
// Get Random Forest explanation
// ------------------------------------------------------

var rfExplanation = trainedRF.explain();


// ------------------------------------------------------
// Extract variable importance
// ------------------------------------------------------

var variableImportance = ee.Dictionary(
  rfExplanation.get('importance')
);


// ------------------------------------------------------
// Print variable importance
// ------------------------------------------------------

print(
  'Random Forest Variable Importance:',
  variableImportance
);


// ------------------------------------------------------
// Print number of trees
// ------------------------------------------------------

print(
  'Number of Trees:',
  rfExplanation.get('numberOfTrees')
);


// ------------------------------------------------------
// Print Out-of-Bag Error
// ------------------------------------------------------

print(
  'Out-of-Bag Error Estimate:',
  rfExplanation.get('outOfBagErrorEstimate')
);


// ------------------------------------------------------
// Convert importance dictionary to FeatureCollection
// ------------------------------------------------------

var importanceFeatures = ee.FeatureCollection(
  predictorBands.map(function(band) {
    
    return ee.Feature(null, {
      predictor: band,
      importance: variableImportance.get(band)
    });
    
  })
);


// ------------------------------------------------------
// Print importance table
// ------------------------------------------------------

print(
  'Feature Importance Table:',
  importanceFeatures
);


// ======================================================
// FEATURE IMPORTANCE CHART
// ======================================================

var importanceChart = ui.Chart.feature.byFeature({
  features: importanceFeatures,
  xProperty: 'predictor',
  yProperties: ['importance']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Random Forest Feature Importance',
  hAxis: {
    title: 'Predictor'
  },
  vAxis: {
    title: 'Importance'
  },
  legend: {
    position: 'none'
  }
});


// ------------------------------------------------------
// Display chart
// ------------------------------------------------------

print(importanceChart);
// ======================================================
// STEP 21: LANDSLIDE SUSCEPTIBILITY PREDICTION
// ======================================================

print('========================================');
print('STEP 21: LANDSLIDE SUSCEPTIBILITY MAP');
print('========================================');


// ------------------------------------------------------
// Apply trained Random Forest to predictor stack
// ------------------------------------------------------

var susceptibility = predictorStack
  .classify(trainedRF)
  .rename('landslide_susceptibility');


// ------------------------------------------------------
// Check prediction image
// ------------------------------------------------------

print(
  'Landslide Susceptibility:',
  susceptibility
);


// ------------------------------------------------------
// Check prediction classes
// ------------------------------------------------------

print(
  'Susceptibility Classes:',
  susceptibility.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    geometry: nilgiris.geometry(),
    scale: 90,
    maxPixels: 1e9
  })
);


// ======================================================
// DISPLAY SUSCEPTIBILITY MAP
// ======================================================

Map.addLayer(
  susceptibility.clip(nilgiris),
  {
    min: 0,
    max: 1,
    palette: [
      '006400',
      '7FFF00',
      'FFFF00',
      'FFA500',
      'FF0000'
    ]
  },
  'Landslide Susceptibility'
);


// ------------------------------------------------------
// Re-display study area boundary
// ------------------------------------------------------

Map.addLayer(
  nilgiris,
  {color: 'black'},
  'Nilgiris Boundary'
);


// ------------------------------------------------------
// Center map
// ------------------------------------------------------

Map.centerObject(
  nilgiris,
  10
);


// ======================================================
// STEP 21B: SUSCEPTIBILITY AREA STATISTICS
// ======================================================

print('========================================');
print('STEP 21B: SUSCEPTIBILITY AREA');
print('========================================');


// ------------------------------------------------------
// Create susceptibility classes
// ------------------------------------------------------

// 0 = Low
// 1 = High

var lowSusceptibility = susceptibility.eq(0);

var highSusceptibility = susceptibility.eq(1);


// ------------------------------------------------------
// Calculate area in square kilometres
// ------------------------------------------------------

var pixelArea = ee.Image.pixelArea();

var lowArea = pixelArea
  .updateMask(lowSusceptibility)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: nilgiris.geometry(),
    scale: 90,
    maxPixels: 1e10
  })
  .get('area');

var highArea = pixelArea
  .updateMask(highSusceptibility)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: nilgiris.geometry(),
    scale: 90,
    maxPixels: 1e10
  })
  .get('area');


// ------------------------------------------------------
// Convert m² to km²
// ------------------------------------------------------

var lowAreaKm2 = ee.Number(lowArea)
  .divide(1e6);

var highAreaKm2 = ee.Number(highArea)
  .divide(1e6);


// ------------------------------------------------------
// Print area statistics
// ------------------------------------------------------

print(
  'Low Susceptibility Area (km²):',
  lowAreaKm2
);

print(
  'High Susceptibility Area (km²):',
  highAreaKm2
);


// ======================================================
// STEP 21C: AREA PERCENTAGE
// ======================================================

var totalAreaKm2 = ee.Number(
  nilgiris.geometry().area()
).divide(1e6);

var lowPercentage = lowAreaKm2
  .divide(totalAreaKm2)
  .multiply(100);

var highPercentage = highAreaKm2
  .divide(totalAreaKm2)
  .multiply(100);


print(
  'Total Study Area (km²):',
  totalAreaKm2
);

print(
  'Low Susceptibility (%):',
  lowPercentage
);

print(
  'High Susceptibility (%):',
  highPercentage
);


// ======================================================
// END OF STEP 21
// ======================================================
// ============================================================
// STEP 22: CONTINUOUS LANDSLIDE SUSCEPTIBILITY PROBABILITY
// ============================================================

print('================================================');
print('STEP 22: CONTINUOUS SUSCEPTIBILITY PROBABILITY');
print('================================================');

// ------------------------------------------------------------
// Set Random Forest to output class probabilities
// ------------------------------------------------------------

var probabilityClassifier = trainedRF.setOutputMode('MULTIPROBABILITY');

// ------------------------------------------------------------
// Generate probability prediction
// ------------------------------------------------------------

var probabilityArray = predictorStack.classify(probabilityClassifier);

// ------------------------------------------------------------
// Convert probability array into separate class bands
// Class 0 = Non-landslide / Low
// Class 1 = Landslide / High
// ------------------------------------------------------------

var probabilityBands = probabilityArray.arrayFlatten([
  ['probability_0', 'probability_1']
]);

// Select landslide probability (Class 1)

var landslideProbability = probabilityBands
  .select('probability_1')
  .rename('landslide_probability')
  .clip(nilgiris);

// ------------------------------------------------------------
// CHECK PROBABILITY IMAGE
// ------------------------------------------------------------

print(
  'Landslide Probability Image:',
  landslideProbability
);

print(
  'Probability Band Names:',
  landslideProbability.bandNames()
);

// ------------------------------------------------------------
// Probability statistics
// ------------------------------------------------------------

var probabilityStats = landslideProbability.reduceRegion({
  reducer: ee.Reducer.minMax()
    .combine({
      reducer2: ee.Reducer.mean(),
      sharedInputs: true
    })
    .combine({
      reducer2: ee.Reducer.stdDev(),
      sharedInputs: true
    }),
  geometry: nilgiris.geometry(),
  scale: 30,
  maxPixels: 1e9
});

print(
  'Landslide Probability Statistics:',
  probabilityStats
);

// ------------------------------------------------------------
// DISPLAY CONTINUOUS PROBABILITY MAP
// ------------------------------------------------------------

Map.addLayer(
  landslideProbability,
  {
    min: 0,
    max: 1,
    palette: [
      'green',
      'yellow',
      'orange',
      'red',
      'darkred'
    ]
  },
  'Continuous Landslide Probability'
);

// ------------------------------------------------------------
// CENTER MAP
// ------------------------------------------------------------

Map.centerObject(nilgiris, 10);

print('================================================');
print('STEP 22 COMPLETE');
print('================================================');
// ============================================================
// STEP 23: FIVE-CLASS LANDSLIDE SUSCEPTIBILITY MAP
// ============================================================

print('================================================');
print('STEP 23: FIVE-CLASS SUSCEPTIBILITY');
print('================================================');

// ------------------------------------------------------------
// CLASSIFICATION THRESHOLDS
// ------------------------------------------------------------
// 1 = Very Low
// 2 = Low
// 3 = Moderate
// 4 = High
// 5 = Very High
// ------------------------------------------------------------

var susceptibilityClass = ee.Image(1)
  .where(landslideProbability.gte(0.20), 2)
  .where(landslideProbability.gte(0.40), 3)
  .where(landslideProbability.gte(0.60), 4)
  .where(landslideProbability.gte(0.80), 5)
  .rename('susceptibility_class')
  .clip(nilgiris);

// ------------------------------------------------------------
// CHECK CLASSIFICATION
// ------------------------------------------------------------

print(
  'Five-Class Susceptibility Map:',
  susceptibilityClass
);

print(
  'Susceptibility Band:',
  susceptibilityClass.bandNames()
);

// ------------------------------------------------------------
// CHECK CLASS DISTRIBUTION
// ------------------------------------------------------------

var classDistribution = susceptibilityClass.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: nilgiris.geometry(),
  scale: 30,
  maxPixels: 1e9
});

print(
  'Susceptibility Class Distribution:',
  classDistribution
);

// ------------------------------------------------------------
// DISPLAY FIVE-CLASS MAP
// ------------------------------------------------------------

Map.addLayer(
  susceptibilityClass,
  {
    min: 1,
    max: 5,
    palette: [
      '006400',
      '7FFF00',
      'FFFF00',
      'FFA500',
      'FF0000'
    ]
  },
  '5-Class Landslide Susceptibility'
);

// ------------------------------------------------------------
// LEGEND INFORMATION
// ------------------------------------------------------------

print('Class 1 = Very Low (0.00 - 0.20)');
print('Class 2 = Low (0.20 - 0.40)');
print('Class 3 = Moderate (0.40 - 0.60)');
print('Class 4 = High (0.60 - 0.80)');
print('Class 5 = Very High (0.80 - 1.00)');

print('================================================');
print('STEP 23 COMPLETE');
print('================================================');
// ============================================================
// STEP 24: SUSCEPTIBILITY CLASS AREA ANALYSIS
// ============================================================

print('================================================');
print('STEP 24: SUSCEPTIBILITY CLASS AREA');
print('================================================');

// ------------------------------------------------------------
// PIXEL AREA
// ------------------------------------------------------------

var pixelArea = ee.Image.pixelArea();

// ------------------------------------------------------------
// CALCULATE AREA BY SUSCEPTIBILITY CLASS
// ------------------------------------------------------------

var classArea = pixelArea
  .addBands(susceptibilityClass)
  .reduceRegion({
    reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class'
    }),
    geometry: nilgiris.geometry(),
    scale: 30,
    maxPixels: 1e10
  });

// ------------------------------------------------------------
// EXTRACT GROUP RESULTS
// ------------------------------------------------------------

var classGroups = ee.List(classArea.get('groups'));

// ------------------------------------------------------------
// CONVERT AREA TO KM2
// ------------------------------------------------------------

var classAreaTable = ee.FeatureCollection(
  classGroups.map(function(item) {

    item = ee.Dictionary(item);

    var classNumber = ee.Number(item.get('class'));

    var areaKm2 = ee.Number(item.get('sum'))
      .divide(1e6);

    return ee.Feature(null, {
      'class': classNumber,
      'area_km2': areaKm2
    });

  })
);

// ------------------------------------------------------------
// TOTAL STUDY AREA
// ------------------------------------------------------------

var totalStudyAreaKm2 = ee.Number(
  nilgiris.geometry().area()
).divide(1e6);

// ------------------------------------------------------------
// ADD PERCENTAGE
// ------------------------------------------------------------

var classAreaWithPercentage = classAreaTable.map(
  function(feature) {

    var percentage = ee.Number(
      feature.get('area_km2')
    )
      .divide(totalStudyAreaKm2)
      .multiply(100);

    return feature.set(
      'percentage',
      percentage
    );

  }
);

// ------------------------------------------------------------
// SORT BY CLASS
// ------------------------------------------------------------

classAreaWithPercentage =
  classAreaWithPercentage.sort('class');

// ------------------------------------------------------------
// PRINT RESULTS
// ------------------------------------------------------------

print(
  'Susceptibility Class Area Table:',
  classAreaWithPercentage
);

print(
  'Total Study Area (km²):',
  totalStudyAreaKm2
);

// ------------------------------------------------------------
// CLASS NAMES
// ------------------------------------------------------------

print('Class 1 = Very Low');
print('Class 2 = Low');
print('Class 3 = Moderate');
print('Class 4 = High');
print('Class 5 = Very High');

// ------------------------------------------------------------
// AREA CHART
// ------------------------------------------------------------

var areaChart = ui.Chart.feature.byFeature({
  features: classAreaWithPercentage,
  xProperty: 'class',
  yProperties: ['area_km2']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Landslide Susceptibility Area by Class',
  hAxis: {
    title: 'Susceptibility Class'
  },
  vAxis: {
    title: 'Area (km²)'
  },
  legend: {
    position: 'none'
  }
});

print(areaChart);

// ------------------------------------------------------------
// PERCENTAGE CHART
// ------------------------------------------------------------

var percentageChart = ui.Chart.feature.byFeature({
  features: classAreaWithPercentage,
  xProperty: 'class',
  yProperties: ['percentage']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Landslide Susceptibility Percentage by Class',
  hAxis: {
    title: 'Susceptibility Class'
  },
  vAxis: {
    title: 'Area (%)'
  },
  legend: {
    position: 'none'
  }
});

print(percentageChart);

// ------------------------------------------------------------
// COMPLETE
// ------------------------------------------------------------

print('================================================');
print('STEP 24 COMPLETE');
print('================================================');
// ============================================================
// STEP 25: EXPORT FINAL ML OUTPUTS
// ============================================================

print('==============================================');
print('STEP 25: EXPORT FINAL ML OUTPUTS');
print('==============================================');

// ------------------------------------------------------------
// Export 1: Continuous Landslide Probability
// ------------------------------------------------------------

Export.image.toAsset({
  image: landslideProbability,
  description: 'Nilgiris_Landslide_Probability',
  assetId: 'projects/practice1-capstone-project/assets/Nilgiris_Landslide_Probability',
  region: nilgiris.geometry(),
  scale: 30,
  maxPixels: 1e13
});

print('Probability export task created.');

// ------------------------------------------------------------
// Export 2: Five-Class Landslide Susceptibility
// ------------------------------------------------------------

Export.image.toAsset({
  image: susceptibilityClass,
  description: 'Nilgiris_Landslide_Susceptibility_5Class',
  assetId: 'projects/practice1-capstone-project/assets/Nilgiris_Landslide_Susceptibility_5Class',
  region: nilgiris.geometry(),
  scale: 30,
  maxPixels: 1e13
});

print('5-Class susceptibility export task created.');

print('==============================================');
print('STEP 25 COMPLETE');
print('==============================================');