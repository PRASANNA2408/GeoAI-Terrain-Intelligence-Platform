# GeoAI Terrain Intelligence Platform

## Landslide Susceptibility Modelling for the Nilgiris, Tamil Nadu, India

A geospatial intelligence and machine learning project integrating **GIS, Remote Sensing, Google Earth Engine, terrain analysis, hydrological modelling, and Random Forest machine learning** to assess spatial landslide susceptibility across the Nilgiris district of Tamil Nadu, India.

The platform processes terrain and hydrological characteristics, combines them with a field-validated landslide inventory, trains a machine learning model, and produces both a continuous landslide probability surface and a five-class landslide susceptibility map.

---

## 1. Project Overview

Landslides are complex spatial phenomena influenced by terrain characteristics, topography, hydrological conditions, and other environmental factors.

This project demonstrates an end-to-end **GeoAI workflow for landslide susceptibility modelling**, using the Nilgiris district as the study area.

The workflow combines:

- Geographic Information Systems (GIS)
- Remote Sensing
- Digital Elevation Models (DEM)
- Terrain analysis
- Hydrological analysis
- Spatial sampling
- Machine Learning
- Google Earth Engine
- Random Forest classification
- Spatial statistics
- Git and GitHub

The final system generates a spatial susceptibility surface that categorises the landscape into five relative susceptibility levels:

**Very Low → Low → Moderate → High → Very High**

---

# 2. Project Objectives

The primary objectives of this project are to:

- Define and prepare the Nilgiris study area.
- Prepare a Digital Elevation Model for terrain analysis.
- Derive terrain characteristics such as elevation, slope, and aspect.
- Perform hydrological and wetness-related analysis.
- Prepare a field-validated landslide inventory.
- Generate representative background samples.
- Construct a machine learning dataset.
- Train a Random Forest landslide susceptibility model.
- Evaluate the model using independent validation samples.
- Determine the relative contribution of predictor variables.
- Generate a continuous landslide probability surface.
- Convert continuous probability into five susceptibility classes.
- Calculate area and percentage statistics for each susceptibility class.
- Produce final GIS-ready outputs for interpretation and reporting.

---

# 3. Study Area

### Nilgiris District, Tamil Nadu, India

The Nilgiris district is a mountainous region in Tamil Nadu characterised by substantial variation in elevation and terrain conditions.

Its mountainous landscape provides an appropriate environment for demonstrating spatial landslide susceptibility modelling using terrain and hydrological variables.

The study area boundary was prepared using the **FAO GAUL Level 2 administrative boundary dataset**.

### Study Area

- **Location:** Nilgiris District, Tamil Nadu, India
- **Final study area:** approximately **2,561.55 km²**
- **Final classified valid area:** approximately **2,551.44 km²**

The small difference between the derived study-area extent and classified valid raster area is associated with raster masking and valid-pixel coverage.

---

# 4. Overall Methodology

The project follows a modular geospatial machine learning workflow:

```text
                    STUDY AREA
                        │
                        ▼
                DEM PREPARATION
                        │
                        ▼
                TERRAIN ANALYSIS
                        │
                        ▼
              HYDROLOGICAL ANALYSIS
                        │
                        ▼
              PREDICTOR PREPARATION
                        │
                        ▼
              LANDSLIDE INVENTORY
                        │
                        ▼
            BACKGROUND SAMPLE GENERATION
                        │
                        ▼
                ML DATASET CREATION
                        │
                        ▼
              RANDOM FOREST MODEL
                        │
                        ▼
                 MODEL VALIDATION
                        │
                        ▼
           CONTINUOUS LANDSLIDE PROBABILITY
                        │
                        ▼
             FIVE-CLASS SUSCEPTIBILITY
                        │
                        ▼
             AREA & PERCENTAGE ANALYSIS
                        │
                        ▼
                  FINAL OUTPUTS