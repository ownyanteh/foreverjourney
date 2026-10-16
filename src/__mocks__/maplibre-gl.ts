// Mock maplibre-gl for Jest (requires canvas which is not available in jsdom)
const maplibregl = {
  Map: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    remove: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(),
    fitBounds: jest.fn(),
    flyTo: jest.fn(),
    getCanvas: jest.fn().mockReturnValue({ style: {} }),
    addControl: jest.fn(),
  })),
  Marker: jest.fn().mockImplementation(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    setPopup: jest.fn().mockReturnThis(),
  })),
  Popup: jest.fn().mockImplementation(() => ({
    setText: jest.fn().mockReturnThis(),
  })),
  LngLatBounds: jest.fn().mockImplementation(() => ({
    extend: jest.fn().mockReturnThis(),
  })),
  NavigationControl: jest.fn(),
  AttributionControl: jest.fn(),
}

export default maplibregl
