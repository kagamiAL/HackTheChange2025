// Mapbox3DMap.jsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import customStyle from "../styles/mapbox-style.json";
import LocationSearch from "./LocationSearch";

// Use the correct env var for your setup
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: customStyle, // Custom style matching app design system
      center: [-114.0719, 51.0447], // Calgary, AB
      zoom: 12,
      pitch: 60, // tilt for 3D perspective
      bearing: -17.6, // angle rotation
      antialias: true, // smoother 3D
    });

    map.current.on("style.load", () => {
      // Add 3D terrain
      map.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });

      // Enable terrain using the DEM source
      map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      // Add a sky layer with brand-colored atmosphere
      map.current.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 10,
          "sky-atmosphere-color": "rgba(200, 220, 240, 1)",
          "sky-atmosphere-halo-color": "rgba(236, 72, 153, 0.3)", // Pink glow
        },
      });

      // 3D buildings are now included in the custom style JSON
    });

    map.current.addControl(new mapboxgl.NavigationControl());
  }, []);

  const handleLocationSelect = (longitude: number, latitude: number, placeName: string) => {
    if (map.current) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 2000,
        essential: true,
      });

      // Add a marker at the selected location
      new mapboxgl.Marker({ color: "#ec4899" })
        .setLngLat([longitude, latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="font-medium">${placeName}</div>`
          )
        )
        .addTo(map.current);
    }
  };

  return (
    <div className="w-full h-full relative" ref={mapContainer}>
      <LocationSearch onLocationSelect={handleLocationSelect} />
    </div>
  );
};

export default Map;
