/**
 * NASA Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAsteroidNeoBrowseSchema = require('./resource_asteroid_neo_browse/index.schema');
const getAsteroidNeoFeedSchema = require('./resource_asteroid_neo_feed/index.schema');
const getAsteroidNeoLookupSchema = require('./resource_asteroid_neo_lookup/index.schema');
const getAstronomyPictureOfTheDaySchema = require('./resource_astronomy_picture_of_the_day/index.schema');
const getDonkiCoronalMassEjectionSchema = require('./resource_donki_coronal_mass_ejection/index.schema');
const getDonkiHighSpeedStreamSchema = require('./resource_donki_high_speed_stream/index.schema');
const getDonkiInterplanetaryShockSchema = require('./resource_donki_interplanetary_shock/index.schema');
const getDonkiMagnetopauseCrossingSchema = require('./resource_donki_magnetopause_crossing/index.schema');
const getDonkiNotificationsSchema = require('./resource_donki_notifications/index.schema');
const getDonkiRadiationBeltEnhancementSchema = require('./resource_donki_radiation_belt_enhancement/index.schema');
const getDonkiSolarEnergeticParticleSchema = require('./resource_donki_solar_energetic_particle/index.schema');
const getDonkiSolarFlareSchema = require('./resource_donki_solar_flare/index.schema');
const getDonkiWsaEnlilSimulationSchema = require('./resource_donki_wsa_enlil_simulation/index.schema');
const getEarthAssetsSchema = require('./resource_earth_assets/index.schema');
const getEarthImagerySchema = require('./resource_earth_imagery/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'astronomyPictureOfTheDay' } : parameters;
  return z.union([
    getAsteroidNeoBrowseSchema({ ...helpers, parameters: effectiveParams }),
    getAsteroidNeoFeedSchema({ ...helpers, parameters: effectiveParams }),
    getAsteroidNeoLookupSchema({ ...helpers, parameters: effectiveParams }),
    getAstronomyPictureOfTheDaySchema({ ...helpers, parameters: effectiveParams }),
    getDonkiCoronalMassEjectionSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiHighSpeedStreamSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiInterplanetaryShockSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiMagnetopauseCrossingSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiNotificationsSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiRadiationBeltEnhancementSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiSolarEnergeticParticleSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiSolarFlareSchema({ ...helpers, parameters: effectiveParams }),
    getDonkiWsaEnlilSimulationSchema({ ...helpers, parameters: effectiveParams }),
    getEarthAssetsSchema({ ...helpers, parameters: effectiveParams }),
    getEarthImagerySchema({ ...helpers, parameters: effectiveParams }),
  ]);
};