# GeoAI Terrain Intelligence Platform

## Landslide Susceptibility Modelling — Nilgiris, Tamil Nadu

A GIS, Remote Sensing, Google Earth Engine, and Machine Learning project for assessing landslide susceptibility across the Nilgiris district of Tamil Nadu, India.

The project integrates terrain and hydrological variables with a field-validated landslide inventory and a Random Forest model to generate a continuous landslide probability surface and a five-class susceptibility map.

---

## 🎯 Objectives

- Analyse terrain and hydrological conditions related to landslides.
- Prepare a field-validated landslide inventory.
- Develop a machine learning dataset using landslide and background samples.
- Train and validate a Random Forest model.
- Generate continuous landslide probability.
- Produce a five-class landslide susceptibility map.
- Calculate susceptibility area and percentage statistics.

---

## 🗺️ Study Area

**Nilgiris District, Tamil Nadu, India**

Approximate study area: **2,561.55 km²**

The Nilgiris was selected because of its mountainous terrain and susceptibility to landslide-related hazards.

---

## 🛠️ Technology Stack

- Google Earth Engine
- JavaScript
- GIS & Remote Sensing
- Digital Elevation Models
- Hydrological Analysis
- Random Forest Machine Learning
- Spatial Analysis
- Git & GitHub

---

## 📊 Data & Predictors

### Data Sources

- **FAO GAUL Level 2** — Study area boundary
- **Copernicus DEM GLO-30** — Elevation and terrain analysis
- **MERIT Hydro** — Hydrological analysis
- **Geological Survey of India (GSI)** — Field-validated landslide inventory

### Final ML Predictors

| Predictor |
|---|
| Elevation |
| Slope |
| Aspect |
| TWI |
| HAND |

Lithology was not included in the final model.

---

## 🤖 Machine Learning

A **Random Forest classifier** was implemented in Google Earth Engine.

### Dataset

- Landslide samples: **344**
- Background samples: **344**
- Total samples: **688**
- Training samples: **537**
- Validation samples: **151**

### Model Configuration

- Trees: **200**
- Minimum leaf population: **2**
- Bag fraction: **0.7**
- Random seed: **42**

---

## 📈 Model Performance

| Metric | Result |
|---|---:|
| Validation Accuracy | **69.54%** |
| Kappa | **0.383** |
| Landslide Producer Accuracy | **71.76%** |
| Landslide Consumer Accuracy | **73.49%** |

The model provides a **moderate baseline** for the implemented predictor set and sampling strategy.

---

## 🔍 Feature Importance

| Rank | Predictor |
|---:|---|
| 1 | Elevation |
| 2 | Aspect |
| 3 | TWI |
| 4 | Slope |
| 5 | HAND |

Elevation had the highest relative importance in the trained Random Forest model.

---

## 🗺️ Final Susceptibility Results

The continuous probability surface was classified into five susceptibility levels.

| Susceptibility | Area (km²) | Percentage |
|---|---:|---:|
| Very Low | 592.93 | 23.24% |
| Low | 694.21 | 27.21% |
| Moderate | 736.27 | 28.86% |
| High | 482.56 | 18.91% |
| Very High | 45.47 | 1.78% |

**High + Very High:** 527.99 km² (**20.69%**)

### Final Landslide Susceptibility Map

![Nilgiris Landslide Susceptibility Map](E:\data_science\projects\GeoAI-Terrain-Intelligence-Platform\images\final_susceptibility_map.png)

---

## 🔄 Workflow

```text
Study Area
    ↓
DEM Preparation
    ↓
Terrain Analysis
    ↓
Hydrological Analysis
    ↓
Predictor Preparation
    ↓
Landslide Inventory
    ↓
Background Sampling
    ↓
Random Forest
    ↓
Validation
    ↓
Landslide Probability
    ↓
5-Class Susceptibility Map
    ↓
Area Statistics

⚠️ Limitations

This is a GeoAI/GIS portfolio and analytical modelling project, not an operational landslide early-warning or engineering system.

The model uses a limited set of predictors and pseudo-background samples. Results depend on the quality and spatial distribution of the available landslide inventory.

The susceptibility map represents relative model-estimated susceptibility and should not replace detailed field or engineering investigations.

🚀 Future Improvements
Add additional environmental predictors.
Test alternative machine learning algorithms.
Apply spatial cross-validation.
Improve sampling strategies.
Perform hyperparameter optimisation.
Evaluate model transferability to other regions.