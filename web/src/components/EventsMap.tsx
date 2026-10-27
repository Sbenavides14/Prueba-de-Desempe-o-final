import { useEffect, useRef } from "react";

declare global {
  interface Window {
    L: any;
  }
}

type MapEvent = { id: string; mag: number; place: string; latitude: number; longitude: number };

/** Dibujo mis eventos sísmicos en un mapa real, con el tamaño del punto según la magnitud. */
export function EventsMap({ events }: { events: MapEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !window.L) return;

    if (!mapRef.current) {
      mapRef.current = window.L.map(containerRef.current).setView([10, 0], 2);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(mapRef.current);
      layerRef.current = window.L.layerGroup().addTo(mapRef.current);
    }

    layerRef.current.clearLayers();

    events
      .filter((e) => e.latitude != null && e.longitude != null)
      .forEach((e) => {
        // El radio crece con la magnitud, así el ojo capta de inmediato cuáles son los eventos grandes.
        const radius = Math.max(4, (e.mag || 1) * 2.5);
        const color = e.mag >= 5 ? "#1c5cab" : e.mag >= 3 ? "#2a78d6" : "#86b6ef";
        window.L.circleMarker([e.latitude, e.longitude], {
          radius,
          fillColor: color,
          fillOpacity: 0.7,
          color: "#fcfcfb",
          weight: 2,
        })
          .bindPopup(`<strong>${e.place}</strong><br/>Magnitud: ${e.mag}`)
          .addTo(layerRef.current);
      });
  }, [events]);

  return <div ref={containerRef} style={{ height: 360, borderRadius: 8, border: "1px solid #e1e0d9" }} />;
}
