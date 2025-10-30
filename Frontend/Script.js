/* FRONTEND SPA + Google Maps + conexión a backend REST
   -- Reemplaza URLs de API por las de tu backend si difieren.
*/

const API_BASE = "http://localhost:3000/api"; // <-- cambia a tu backend
const splash = document.getElementById("splash");
const screenLogin = document.getElementById("screen-login");
const screenRegister = document.getElementById("screen-register");
const screenDashboard = document.getElementById("screen-dashboard");
const toast = document.getElementById("toast");

// simple toast
function showToast(msg, ms = 3000){
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(()=> toast.style.display="none", ms);
}

/* -------- SPLASH to Login -------- */
setTimeout(()=>{
  splash.style.display = "none";
  screenLogin.style.display = "block";
}, 900);

/* -------- NAV between login/register -------- */
document.getElementById("go-register").addEventListener("click", (e)=>{
  e.preventDefault();
  screenLogin.style.display = "none";
  screenRegister.style.display = "block";
});
document.getElementById("go-login").addEventListener("click", (e)=>{
  e.preventDefault();
  screenRegister.style.display = "none";
  screenLogin.style.display = "block";
});

/* -------- AUTH: Register & Login (connect to backend) -------- */
const formRegister = document.getElementById("formRegister");
formRegister.addEventListener("submit", async e=>{
  e.preventDefault();
  const fd = new FormData(formRegister);
  const payload = {
    nombre: fd.get("nombre"),
    email: fd.get("email"),
    password: fd.get("password"),
    fechaNacimiento: fd.get("fechaNacimiento")
  };
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Error registro");
    showToast("Registro exitoso. Por favor inicia sesión.");
    screenRegister.style.display="none";
    screenLogin.style.display="block";
  } catch(err){
    showToast(err.message);
  }
});

const formLogin = document.getElementById("formLogin");
formLogin.addEventListener("submit", async e=>{
  e.preventDefault();
  const form = new FormData(formLogin);
  const payload = { email: form.get("email"), password: form.get("password") };
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Error login");
    // backend should return { token, user }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    initDashboard();
  } catch(err){
    showToast(err.message);
  }
});

/* -------- DASHBOARD init -------- */
function initDashboard(){
  screenLogin.style.display = "none";
  screenRegister.style.display = "none";
  screenDashboard.style.display = "block";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  document.getElementById("profileName").textContent = user.nombre || "";
  document.getElementById("profileEmail").textContent = user.email || "";
  document.getElementById("avatarPreview").textContent = (user.nombre ? user.nombre[0].toUpperCase() : "U");
  initializeMap();
}

/* -------- LOGOUT -------- */
document.getElementById("menu-logout").addEventListener("click", ()=>{
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  screenDashboard.style.display = "none";
  screenLogin.style.display = "block";
});

/* -------- MENU toggle (mobile) -------- */
const menuToggle = document.getElementById("menu-toggle");
const sideMenu = document.getElementById("side-menu");
menuToggle.addEventListener("click", ()=> {
  const shown = sideMenu.style.display === "block";
  sideMenu.style.display = shown ? "none" : "block";
});

/* -------- Map: Google Maps + Places + Directions -------- */
let map, directionsService, directionsRenderer, originMarker;
function initializeMap(){
  const mapEl = document.getElementById("map");
  map = new google.maps.Map(mapEl, {
    center: { lat: 4.7110, lng: -74.0721 }, // Bogotá por defecto
    zoom: 13,
    disableDefaultUI: false
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({map});
  // Try user geolocation
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      map.setCenter({lat,lng});
      map.setZoom(14);
      originMarker = new google.maps.Marker({position:{lat,lng}, map, title:"Tu ubicación"});
      document.getElementById("input-origin").value = "Mi ubicación";
      // store origin for request
      map.__origin = {lat,lng};
    }, err => {
      console.warn("Geo err", err);
    }, {timeout:8000});
  }

  // Places Autocomplete for destination
  const destInput = document.getElementById("input-destination");
  const originInput = document.getElementById("input-origin");
  const autocompleteDest = new google.maps.places.Autocomplete(destInput);
  const autocompleteOrigin = new google.maps.places.Autocomplete(originInput);

  // if user types origin, update origin coordinates
  autocompleteOrigin.addListener('place_changed', () => {
    const place = autocompleteOrigin.getPlace();
    if(!place.geometry) return;
    map.setCenter(place.geometry.location);
    map.__origin = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    if(originMarker) originMarker.setPosition(place.geometry.location);
    else originMarker = new google.maps.Marker({position: place.geometry.location, map});
  });

  // when user selects destination, draw route
  autocompleteDest.addListener('place_changed', () => {
    const place = autocompleteDest.getPlace();
    if(!place.geometry) return;
    map.setCenter(place.geometry.location);
    map.__destination = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    // optionally draw immediate route if origin exists
    if(map.__origin) drawRoute(map.__origin, map.__destination);
  });

  // request button
  document.getElementById("btn-request").addEventListener("click", async ()=>{
    if(!map.__origin || !map.__destination) {
      showToast("Debes indicar origen y destino.");
      return;
    }
    // Calculate route and price estimation (example simple)
    const distanceKm = await estimateDistanceKm(map.__origin, map.__destination);
    const tipo = document.getElementById("tipoServicio").value;
    const price = estimatePrice(distanceKm, tipo);
    // Confirm & call backend to create ride
    if(!confirm(`Distancia aprox ${distanceKm.toFixed(2)} km. Precio estimado $${price}. Solicitar viaje?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/rides/request`, {
        method:"POST",
        headers: {
          "Content-Type":"application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          origin: map.__origin,
          destination: map.__destination,
          tipo, price,
          metodoPago: document.getElementById("metodoPago").value
        })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message||"Error solicitando viaje");
      showToast("Viaje solicitado. Esperando conductor...");
      // backend may return tracking id, driver info etc.
    } catch(err){
      showToast(err.message);
    }
  });

  document.getElementById("btn-cancel").addEventListener("click", ()=>{
    directionsRenderer.set('directions', null);
    showToast("Ruta cancelada");
  });
}

function drawRoute(origin, destination){
  directionsService.route({
    origin: new google.maps.LatLng(origin.lat, origin.lng),
    destination: new google.maps.LatLng(destination.lat, destination.lng),
    travelMode: google.maps.TravelMode.DRIVING
  }, (response, status) => {
    if(status === 'OK') directionsRenderer.setDirections(response);
    else console.error('Directions failed:', status);
  });
}

function estimateDistanceKm(origin, destination){
  // Use Distance Matrix / Directions legs for real values; here we compute haversine as fallback
  return new Promise((resolve) => {
    // try using DirectionsService synchronous length
    directionsService.route({
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
      if(status === 'OK'){
        const route = response.routes[0];
        let meters = 0;
        route.legs.forEach(leg => meters += leg.distance.value);
        resolve(meters/1000);
      } else {
        // haversine fallback
        const R = 6371;
        const dLat = toRad(destination.lat - origin.lat);
        const dLon = toRad(destination.lng - origin.lng);
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(origin.lat))*Math.cos(toRad(destination.lat))*Math.sin(dLon/2)*Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        resolve(R*c);
      }
    });
  });
}
function toRad(v){ return v * Math.PI/180; }

function estimatePrice(km, tipo){
  // ejemplo sencillo: base + por km; ajustar según tu negocio
  const base = tipo === 'uberYa' ? 3000 : 2500;
  const perKm = tipo === 'uberYa' ? 1200 : 900;
  return Math.round(base + perKm * km);
}

/* -------- UPLOADS (FormData) -------- */
document.getElementById("btn-upload").addEventListener("click", async (e)=>{
  e.preventDefault();
  const foto = document.getElementById("fotoPerfil").files[0];
  const doc = document.getElementById("documentoId").files[0];
  if(!foto && !doc){ showToast("Selecciona al menos un archivo"); return; }

  const fd = new FormData();
  if(foto) fd.append("foto", foto);
  if(doc) fd.append("documento", doc);

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/users/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }, // no Content-Type -> browser sets multipart
      body: fd
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Error subir archivos");
    showToast("Archivos subidos correctamente");
    // actualizar avatar si el backend devuelve URL
    if(data.avatarUrl){
      document.getElementById("avatarPreview").textContent = "";
      document.getElementById("avatarPreview").style.backgroundImage = `url(${data.avatarUrl})`;
      document.getElementById("avatarPreview").style.backgroundSize = "cover";
    }
  } catch(err){
    showToast(err.message);
  }
});

/* -------- UTIL: payments simulation (calls backend) -------- */
async function sendPayment(method, amount){
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/payments`, {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ method, amount })
  });
  return res.json();
}

/* -------- if user already logged (persistent) -------- */
if(localStorage.getItem("token")){
  // try to initialize dashboard immediately
  initDashboard();
}
