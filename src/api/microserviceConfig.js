/**
 * Centralized configuration for GeoServer Microservice API
 * Following API Versioning guidelines (50-cross-service.md)
 */
export const GEOSERVER_BASE_URL = import.meta.env.VITE_GEOSERVER_MICROSERVICE_URL || "http://localhost:8005";
export const GEOSERVER_API_V1 = `${GEOSERVER_BASE_URL}/api/v1`;

// Default active API endpoint for spatial operations
export const MICROSERVICE_API = GEOSERVER_API_V1;
