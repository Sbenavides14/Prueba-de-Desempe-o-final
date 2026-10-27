// Mi mapa 3D interactivo: un globo real que gira, con los sismos ubicados por
// latitud/longitud. Uso globe.gl (sobre Three.js) por CDN, sin instalar nada.
let _globeInstance = null;

function magnitudeColor(mag) {
  if (mag >= 5) return "#e34948"; // rojo: fuerte
  if (mag >= 3) return "#eda100"; // ámbar: moderado
  return "#2a78d6"; // azul: leve
}

function initGlobe(containerId, onPointClick) {
  const el = document.getElementById(containerId);
  if (!el || typeof Globe === "undefined") return null;

  _globeInstance = Globe()(el)
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
    .backgroundColor("#000000")
    .pointsData([])
    .pointLat("latitude")
    .pointLng("longitude")
    .pointColor((d) => magnitudeColor(d.mag))
    .pointAltitude((d) => Math.min((d.mag || 1) / 40, 0.25))
    .pointRadius((d) => Math.max((d.mag || 1) / 12, 0.2))
    .pointLabel((d) => `<div style="background:#111;color:#fff;padding:6px 10px;border-radius:6px;font-size:12px">
        <strong>${d.place}</strong><br/>Magnitud: ${d.mag}
      </div>`)
    .onPointClick((d) => { if (onPointClick) onPointClick(d); })
    .atmosphereColor("#2a78d6")
    .atmosphereAltitude(0.18);

  _globeInstance.controls().autoRotate = true;
  _globeInstance.controls().autoRotateSpeed = 0.5;
  _globeInstance.pointOfView({ lat: 10, lng: 0, altitude: 2.2 });

  // Me ajusto si cambia el tamaño del contenedor (ej. al cambiar de pestaña).
  const resize = () => _globeInstance.width(el.clientWidth).height(el.clientHeight);
  window.addEventListener("resize", resize);
  resize();

  return _globeInstance;
}

function updateGlobeEvents(events) {
  if (!_globeInstance) return;
  const points = events.filter((e) => e.latitude != null && e.longitude != null);
  _globeInstance.pointsData(points);
}
