const $=id=>document.getElementById(id);
const state={unit:"C",weather:null};
const WMO={
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],
  56:["Light freezing drizzle","🌧️"],57:["Freezing drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
  66:["Freezing rain","🌧️"],67:["Heavy freezing rain","🌧️"],71:["Light snow","🌨️"],73:["Snow","❄️"],75:["Heavy snow","❄️"],
  77:["Snow grains","❄️"],80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy showers","⛈️"],
  85:["Snow showers","🌨️"],86:["Heavy snow showers","❄️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm + hail","⛈️"],99:["Thunderstorm + hail","⛈️"]
};
const setStatus=(msg,error=false)=>{$("status").textContent=msg;$("status").className=error?"status error":"status"};
const deg=c=>state.unit==="C"?Math.round(c):Math.round(c*9/5+32);
const wind=k=>state.unit==="C"?Math.round(k):Math.round(k*.621371);
function weatherMeta(code){return WMO[code]||["Unknown","🌤️"]}
function fmtTime(s){return new Date(s).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
function fmtDate(s,opts={weekday:"long",month:"long",day:"numeric"}){return new Date(s).toLocaleDateString([],opts)}
async function geocode(city){
  const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const r=await fetch(url); if(!r.ok) throw new Error("Could not reach geocoding service.");
  const d=await r.json(); if(!d.results?.length) throw new Error("City not found. Try another city.");
  return d.results[0];
}
async function getWeather(lat,lon){
  const p=new URLSearchParams({latitude:lat,longitude:lon,current:"temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",hourly:"temperature_2m,weather_code",daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",timezone:"auto",forecast_days:"7"});
  const r=await fetch("https://api.open-meteo.com/v1/forecast?"+p); if(!r.ok) throw new Error("Weather service is unavailable.");
  return r.json();
}
function render(place,d){
  state.weather={place,d};
  $("weather-info").hidden=false;$("empty-state").hidden=true;
  const c=d.current, meta=weatherMeta(c.weather_code);
  $("date").textContent=fmtDate(c.time);
  $("location").textContent=[place.name,place.admin1,place.country].filter(Boolean).join(", ");
  $("description").textContent=meta[0]; $("hero-icon").textContent=meta[1];
  $("temperature").textContent=deg(c.temperature_2m); $("feels-like").textContent=deg(c.apparent_temperature)+"°";
  $("humidity").textContent=c.relative_humidity_2m+"%"; $("wind-speed").textContent=wind(c.wind_speed_10m)+" "+(state.unit==="C"?"km/h":"mph");
  $("min-temp").textContent=deg(d.daily.temperature_2m_min[0])+"°"; $("max-temp").textContent=deg(d.daily.temperature_2m_max[0])+"°";
  $("sunrise").textContent=fmtTime(d.daily.sunrise[0]); $("sunset").textContent=fmtTime(d.daily.sunset[0]);
  $("forecast-items").innerHTML=d.daily.time.map((t,i)=>{const m=weatherMeta(d.daily.weather_code[i]);return `<article class="forecast-item"><div class="day">${i===0?"Today":fmtDate(t,{weekday:"short"})}</div><div class="date-small">${fmtDate(t,{month:"short",day:"numeric"})}</div><div class="icon">${m[1]}</div><div class="temps">${deg(d.daily.temperature_2m_max[i])}° <span>${deg(d.daily.temperature_2m_min[i])}°</span></div></article>`}).join("");
  const start=Math.max(0,d.hourly.time.findIndex(t=>t>=c.time)); const end=Math.min(start+24,d.hourly.time.length);
  $("hourly-items").innerHTML=d.hourly.time.slice(start,end).map((t,i)=>{const idx=start+i,m=weatherMeta(d.hourly.weather_code[idx]);return `<article class="hour-card"><div class="hour">${i===0?"Now":fmtTime(t)}</div><div class="icon">${m[1]}</div><div class="temp">${deg(d.hourly.temperature_2m[idx])}°</div></article>`}).join("");
}
async function loadCity(city){
  setStatus("Loading forecast…");
  try{const place=await geocode(city);render(place,await getWeather(place.latitude,place.longitude));setStatus("Updated just now");}
  catch(e){$("weather-info").hidden=true;$("empty-state").hidden=false;setStatus(e.message,true)}
}
async function loadLocation(){
  if(!navigator.geolocation)return setStatus("Location is not supported by this browser.",true);
  setStatus("Getting your location…");
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const {latitude,longitude}=pos.coords,d=await getWeather(latitude,longitude);
      const place={name:"Your location",country:""};
      render(place,d);setStatus("Updated from your current location");
    }catch(e){setStatus(e.message,true)}
  },()=>setStatus("Location permission was denied.",true));
}
function refreshUnits(){
  if(state.weather)render(state.weather.place,state.weather.d);
  $("unit-toggle").textContent="°"+state.unit;
}
$("search-btn").addEventListener("click",()=>{const v=$("city-input").value.trim();if(v)loadCity(v)});
$("city-input").addEventListener("keydown",e=>{if(e.key==="Enter"){const v=e.target.value.trim();if(v)loadCity(v)}});
$("location-btn").addEventListener("click",loadLocation);
$("unit-toggle").addEventListener("click",()=>{state.unit=state.unit==="C"?"F":"C";refreshUnits()});
document.querySelectorAll("[data-city]").forEach(b=>b.addEventListener("click",()=>{$("city-input").value=b.dataset.city;loadCity(b.dataset.city)}));
$("unit-toggle").textContent="°C";loadCity("Guntur");