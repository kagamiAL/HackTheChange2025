// Mapbox3DMap.jsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import customStyle from "../styles/mapbox-style.json";
import LocationSearch from "./LocationSearch";
import DistanceSlider from "./DistanceSlider";
import { useOpportunities, VolunteerOpportunity } from "@/app/context/OpportunityContext";

// Use the correct env var for your setup
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const homeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const mapLoadedRef = useRef(false);
  const { setOpportunities, setSelectedOpportunity, selectedOpportunity, maxDistance } = useOpportunities();

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

  // Pan camera to selected opportunity
  useEffect(() => {
    if (selectedOpportunity && map.current && mapLoadedRef.current) {
      const { longitude, latitude } = selectedOpportunity.audience;

      if (longitude && latitude) {
        map.current.easeTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1000,
          essential: true,
        });
      }
    }
  }, [selectedOpportunity]);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const setHomeMarker = (longitude: number, latitude: number) => {
    // Remove previous home marker if it exists
    if (homeMarkerRef.current) {
      homeMarkerRef.current.remove();
    }

    // Create a new home marker with a distinct color (red/pink)
    homeMarkerRef.current = new mapboxgl.Marker({ color: "#ec4899" })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2"><p class="font-semibold text-sm">Your Search Location</p></div>`
        )
      )
      .addTo(map.current!);

    // Add fade-in animation class
    const markerElement = homeMarkerRef.current.getElement();
    if (markerElement) {
      markerElement.classList.add('marker-fade-in');
    }
  };

  const fetchVolunteerOpportunities = async (
    latitude: number,
    longitude: number,
    postalCode: string | null
  ) => {
    try {
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
            new mapboxgl.Popup({
              offset: 25,
              maxWidth: "340px",
              className: "volunteer-popup"
            }).setHTML(
              `
              <div class="bg-background rounded-lg overflow-hidden">
                <div class="bg-gradient-to-r from-violet-500 to-purple-600 h-1.5"></div>
                <div class="px-4 pt-4 pb-3">
                  <h3 class="font-semibold text-base leading-tight text-foreground mb-3">${opp.title}</h3>
                </div>

                ${
                  opp.organization.logo
                    ? `<img src="${opp.organization.logo}" alt="${opp.organization.name}" class="w-full h-40 object-contain bg-muted/30" />`
                    : ''
                }

                <div class="px-4 pb-4 space-y-3 ${opp.organization.logo ? 'pt-3' : ''}">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>${opp.organization.name}</span>
                  </div>

                  <p class="text-sm text-muted-foreground leading-relaxed line-clamp-3">${opp.description}</p>

                  <div class="flex flex-wrap gap-2 pt-1">
                    ${
                      opp.duration
                        ? `
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-950/30 rounded-md">
                      <svg class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-xs font-medium text-violet-700 dark:text-violet-300">${opp.duration}</span>
                    </div>
                        `
                        : ""
                    }
                    ${
                      opp.dates?.start
                        ? `
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/30 rounded-md">
                      <svg class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span class="text-xs font-medium text-purple-700 dark:text-purple-300">${new Date(opp.dates.start).toLocaleDateString()}</span>
                    </div>
                        `
                        : ""
                    }
                  </div>
                </div>
              </div>
              `
            )
          )
          .addTo(map.current!);

        // Add click event to marker to select the opportunity in SwipeView
        marker.getElement().addEventListener('click', () => {
          setSelectedOpportunity(opp);
        });

        // Add fade-in animation class
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.classList.add('marker-fade-in');
        }

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

    // Set the home marker at the searched location
    setHomeMarker(longitude, latitude);

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
      <div className="absolute bottom-4 left-4 z-10 w-72 sm:w-80 transition-all duration-300 ease-in-out"
        style={{
          left: 'calc(max(1rem, env(safe-area-inset-left)) + var(--left-sidebar-width, 0px))'
        }}>
        <DistanceSlider />
      </div>
    </div>
  );
};

export default Map;
