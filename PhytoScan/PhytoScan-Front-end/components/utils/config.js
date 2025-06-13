// config.js

// Default API base URL for server.js endpoints
let API_BASE_URL = "http://192.168.104.80:3000";

// Default API base URL for Flask endpoints (app.py)
let FLASK_API_BASE_URL = "http://192.168.104.80:5000";

/**
 * Set the API Base URL for server.js endpoints.
 * @param {string} url - The new API base URL to set.
 */
export const setApiBaseUrl = (url) => {
    if (url && typeof url === "string") {
        API_BASE_URL = url;
    } else {
        console.warn("Invalid URL provided to setApiBaseUrl.");
    }
};

/**
 * Get the current API Base URL for server.js endpoints.
 * @returns {string} - The current API base URL.
 */
export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Set the API Base URL for Flask endpoints.
 * @param {string} url - The new Flask API base URL.
 */
export const setFlaskApiBaseUrl = (url) => {
    if (url && typeof url === "string") {
        FLASK_API_BASE_URL = url;
    } else {
        console.warn("Invalid URL provided to setFlaskApiBaseUrl.");
    }
};

/**
 * Get the current Flask API Base URL.
 * @returns {string} - The current Flask API base URL.
 */
export const getFlaskApiBaseUrl = () => FLASK_API_BASE_URL;
