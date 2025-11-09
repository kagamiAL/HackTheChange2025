// Mapbox3DMap.jsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import customStyle from "../styles/mapbox-style.json";
import LocationSearch from "./LocationSearch";
import { useOpportunities, VolunteerOpportunity } from "@/app/context/OpportunityContext";

// Use the correct env var for your setup
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapLoadedRef = useRef(false);
  const { setOpportunities } = useOpportunities();

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
      console.log("Map fully loaded and ready");
    });

    map.current.addControl(new mapboxgl.NavigationControl());
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const fetchVolunteerOpportunities = async (
    latitude: number,
    longitude: number,
    postalCode: string | null
  ) => {
    try {
      const maxDistance = 25; // 25km default

      // Build URL based on whether we have a postal code
      let url: string;
      if (postalCode) {
        // Use postal code format: pc=t3a+5k9&md=10
        const formattedPostalCode = postalCode.toLowerCase().replace(/(.{3})/, "$1+");
        url = `https://www.volunteerconnector.org/api/search/?pc=${formattedPostalCode}&md=${maxDistance}&so=Proximity`;
      } else {
        // Fallback to lat/lng if no postal code
        url = `https://www.volunteerconnector.org/api/search/?lat=${latitude}&lng=${longitude}&max_distance=${maxDistance}`;
      }

      console.log("Fetching opportunities from:", url);
      let response = await fetch(url);
      let data = await response.json();

      console.log("API Response:", data);
      console.log("Total results:", data.count);

      // Clear existing markers
      clearMarkers();

      // Helper function to create a marker for an opportunity
      const createMarker = (opp: VolunteerOpportunity) => {
        const lng = opp.audience.longitude!;
        const lat = opp.audience.latitude!;

        const marker = new mapboxgl.Marker({ color: "#8b5cf6" })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, maxWidth: "300px" }).setHTML(
              `
              <div class="p-2">
                <h3 class="font-semibold text-sm mb-1">${opp.title}</h3>
                <p class="text-xs text-gray-600 mb-2">${opp.organization.name}</p>
                <p class="text-xs text-gray-500 mb-2 line-clamp-2">${opp.description}</p>
                <div class="text-xs text-gray-500">
                  <div>Duration: ${opp.duration}</div>
                  ${
                    opp.dates?.start
                      ? `<div>Start: ${new Date(opp.dates.start).toLocaleDateString()}</div>`
                      : ""
                  }
                </div>
              </div>
              `
            )
          )
          .addTo(map.current!);

        markersRef.current.push(marker);
      };

      // Collect all results from all pages
      let fetchedResults = [...data.results];

      // Process first page results immediately
      data.results.forEach((opp: VolunteerOpportunity) => {
        const hasCoordinates =
          !opp.remote_or_online &&
          opp.audience?.latitude !== undefined &&
          opp.audience?.longitude !== undefined;

        if (hasCoordinates) {
          console.log("Found opportunity with coords:", {
            title: opp.title,
            lat: opp.audience.latitude,
            lng: opp.audience.longitude,
          });
          createMarker(opp);
        }
      });

      console.log(`Loaded ${markersRef.current.length} markers from first page`);

      // Fetch and process remaining pages
      while (data.next) {
        console.log("Fetching next page:", data.next);
        response = await fetch(data.next);
        data = await response.json();
        fetchedResults = [...fetchedResults, ...data.results];

        // Dynamically add markers as we fetch each page
        data.results.forEach((opp: VolunteerOpportunity) => {
          const hasCoordinates =
            !opp.remote_or_online &&
            opp.audience?.latitude !== undefined &&
            opp.audience?.longitude !== undefined;

          if (hasCoordinates) {
            console.log("Found opportunity with coords:", {
              title: opp.title,
              lat: opp.audience.latitude,
              lng: opp.audience.longitude,
            });
            createMarker(opp);
          }
        });

        console.log(
          `Fetched page, total results: ${fetchedResults.length}, total markers: ${markersRef.current.length}`
        );
      }

      console.log(`Fetched all pages, total results: ${fetchedResults.length}`);

      // Update global context with all results
      setOpportunities(fetchedResults);

      if (markersRef.current.length === 0) {
        console.warn("No volunteer opportunities with coordinates found in this area");
        return;
      }

      console.log(`Loaded ${markersRef.current.length} volunteer opportunities total`);
    } catch (error) {
      console.error("Error fetching volunteer opportunities:", error);
    }
  };

  const handleLocationSelect = (longitude: number, latitude: number, postalCode: string | null) => {
    if (!map.current) {
      console.error("Map not initialized");
      return;
    }

    if (!mapLoadedRef.current) {
      console.error("Map not fully loaded yet");
      return;
    }

    console.log("Flying to location:", { longitude, latitude, postalCode });

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
