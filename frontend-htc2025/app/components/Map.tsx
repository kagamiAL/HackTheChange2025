// Mapbox3DMap.jsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import customStyle from "../styles/mapbox-style.json";
import LocationSearch from "./LocationSearch";

// Use the correct env var for your setup
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface VolunteerOpportunity {
  id: number;
  url: string;
  title: string;
  description: string;
  remote_or_online: boolean;
  organization: {
    name: string;
    logo: string | null;
    url: string;
  };
  dates: {
    start: string;
    end: string;
  };
  duration: string;
  audience: {
    scope: string;
    longitude?: number;
    latitude?: number;
  };
}

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapLoadedRef = useRef(false);

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
      // Check if source already exists before adding
      if (!map.current.getSource("mapbox-dem")) {
        // Add 3D terrain
        map.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        // Enable terrain using the DEM source
        map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      }

      // Check if layer already exists before adding
      if (!map.current.getLayer("sky")) {
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
      }

      // 3D buildings are now included in the custom style JSON
      mapLoadedRef.current = true;
      console.log('Map fully loaded and ready');
    });

    map.current.addControl(new mapboxgl.NavigationControl());
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const fetchVolunteerOpportunities = async (latitude: number, longitude: number, postalCode: string | null) => {
    try {
      const maxDistance = 10; // 10km default

      // Build URL based on whether we have a postal code
      let url: string;
      if (postalCode) {
        // Use postal code format: pc=t3a+5k9&md=10
        const formattedPostalCode = postalCode.toLowerCase().replace(/(.{3})/, '$1+');
        url = `https://www.volunteerconnector.org/api/search/?pc=${formattedPostalCode}&md=${maxDistance}`;
      } else {
        // Fallback to lat/lng if no postal code
        url = `https://www.volunteerconnector.org/api/search/?lat=${latitude}&lng=${longitude}&max_distance=${maxDistance}`;
      }

      console.log('Fetching opportunities from:', url);
      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response:', data);
      console.log('Total results:', data.results?.length);

      // Clear existing markers
      clearMarkers();

      // Filter results that have coordinates (remote_or_online is false and has lat/lng)
      const opportunitiesWithLocation = data.results.filter(
        (opp: VolunteerOpportunity) => {
          const hasCoordinates = !opp.remote_or_online &&
            opp.audience?.latitude !== undefined &&
            opp.audience?.longitude !== undefined;

          if (hasCoordinates) {
            console.log('Found opportunity with coords:', {
              title: opp.title,
              lat: opp.audience.latitude,
              lng: opp.audience.longitude
            });
          }

          return hasCoordinates;
        }
      );

      console.log(`Filtered ${opportunitiesWithLocation.length} opportunities with coordinates`);

      if (opportunitiesWithLocation.length === 0) {
        console.warn('No volunteer opportunities with coordinates found in this area');
        return;
      }

      // Create markers for each opportunity
      opportunitiesWithLocation.forEach((opp: VolunteerOpportunity) => {
        const lng = opp.audience.longitude!;
        const lat = opp.audience.latitude!;

        console.log('Creating marker for:', opp.title, [lng, lat]);

        const marker = new mapboxgl.Marker({ color: "#8b5cf6" })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, maxWidth: '300px' }).setHTML(
              `
              <div class="p-2">
                <h3 class="font-semibold text-sm mb-1"><a href="${opp.url}" target="_blank" rel="noopener noreferrer" class="text-violet-700 opp-title-link duration-150">${opp.title}</a></h3>
                <p class="text-xs mb-2"><a href="${opp.organization.url}" target="_blank" rel="noopener noreferrer" class="text-[#ff1493] hover:text-violet-700 transition-colors duration-150">${opp.organization.name}</a></p>
                <p class="text-xs text-gray-500 mb-2 line-clamp-2">${opp.description}</p>
                <div class="text-xs text-gray-500">
                  <div>Duration: ${opp.duration}</div>
                  ${opp.dates?.start ? `<div>Start: ${new Date(opp.dates.start).toLocaleDateString()}</div>` : ''}
                </div>
              </div>
              `
            )
          )
          .addTo(map.current!);

        markersRef.current.push(marker);
        console.log('Marker added, total markers:', markersRef.current.length);
      });

      console.log(`Loaded ${opportunitiesWithLocation.length} volunteer opportunities`);
    } catch (error) {
      console.error("Error fetching volunteer opportunities:", error);
    }
  };

  const handleLocationSelect = (longitude: number, latitude: number, postalCode: string | null) => {
    if (!map.current) {
      console.error('Map not initialized');
      return;
    }

    if (!mapLoadedRef.current) {
      console.error('Map not fully loaded yet');
      return;
    }

    console.log('Flying to location:', { longitude, latitude, postalCode });

    map.current.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      duration: 2000,
      essential: true,
    });

    // Fetch opportunities immediately, don't wait for animation
    fetchVolunteerOpportunities(latitude, longitude, postalCode);
  };

  return (
    <div className="w-full h-full relative" ref={mapContainer}>
      <LocationSearch onLocationSelect={handleLocationSelect} />
    </div>
  );
};

export default Map;
