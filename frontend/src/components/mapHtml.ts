import { CENTER, PATCHES, YEARS } from "@/src/data/vegetation";
import { colors } from "@/src/theme";

export type MapReport = { id: string; lat: number; lng: number; label: string };

export type MapState = {
  year: number;
  base: "sat" | "map";
  reports: MapReport[];
};

export function buildMapHtml(initial: MapState, interactive = true) {
  const data = JSON.stringify({ patches: PATCHES, years: YEARS, center: CENTER });
  const c = {
    forest: colors.forest,
    mangrove: colors.mangrove,
    restinga: colors.brandSecondary,
    lost: colors.lost,
    warn: colors.warning,
  };
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#m{margin:0;padding:0;height:100%;width:100%;background:#d9d3c4}
.leaflet-control-attribution{font-size:8px}
.rp{width:22px;height:22px;border-radius:11px;background:${c.lost};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.leaflet-popup-content{font-family:sans-serif;font-size:13px}</style>
</head><body><div id="m"></div><script>
var D=${data};var S=${JSON.stringify(initial)};
var map=L.map('m',{zoomControl:false,attributionControl:true,dragging:${interactive},scrollWheelZoom:${interactive},touchZoom:${interactive},doubleClickZoom:${interactive}}).setView(D.center,15);
var sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Esri'});
var osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
var veg=L.layerGroup().addTo(map);var rep=L.layerGroup().addTo(map);
function blob(p,rad){var pts=[];var seed=0;for(var i=0;i<p.id.length;i++)seed+=p.id.charCodeAt(i)*(i+3);
var n=18;for(var k=0;k<n;k++){var a=k/n*Math.PI*2;var j=0.78+0.22*Math.abs(Math.sin(seed*(k+1)*0.37));
var dl=rad*j*Math.cos(a)/111320;var dg=rad*j*Math.sin(a)/(111320*Math.cos(p.center[0]*Math.PI/180));pts.push([p.center[0]+dl,p.center[1]+dg]);}return pts;}
var col={mata:'${c.forest}',mangue:'${c.mangrove}',restinga:'${c.restinga}'};
var tname={mata:'Mata',mangue:'Manguezal',restinga:'Restinga'};
function draw(){veg.clearLayers();var idx=D.years.indexOf(S.year);if(idx<0)idx=D.years.length-1;
D.patches.forEach(function(p){var r0=p.r[0],ri=p.r[idx];
if(ri<r0){L.polygon(blob(p,r0),{color:'${c.lost}',weight:2,dashArray:'5 5',fillColor:'${c.lost}',fillOpacity:0.18}).addTo(veg)
.bindPopup('<b>'+p.name+'</b><br>Área perdida desde 1994: '+Math.round((1-(ri*ri)/(r0*r0))*100)+'%<br>Causa provável: '+(p.cause||'-'));}
if(ri>0){L.polygon(blob(p,ri),{color:col[p.type],weight:1.5,fillColor:col[p.type],fillOpacity:0.62}).addTo(veg)
.bindPopup('<b>'+p.name+'</b><br>'+tname[p.type]+' em '+S.year);}});}
function drawReports(){rep.clearLayers();(S.reports||[]).forEach(function(r){L.marker([r.lat,r.lng],{icon:L.divIcon({className:'',html:'<div class="rp"></div>',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(rep).bindPopup('<b>Denúncia</b><br>'+r.label);});}
function setBase(){if(S.base==='sat'){map.removeLayer(osm);sat.addTo(map);}else{map.removeLayer(sat);osm.addTo(map);}}
window.handle=function(m){if(typeof m==='string'){try{m=JSON.parse(m)}catch(e){return}}
if(m.year!==undefined&&m.year!==S.year){S.year=m.year;draw();}
if(m.base&&m.base!==S.base){S.base=m.base;setBase();}
if(m.reports){S.reports=m.reports;drawReports();}
if(m.recenter){map.flyTo(D.center,15);}
if(m.flyTo){map.flyTo(m.flyTo,17);}};
window.addEventListener('message',function(e){window.handle(e.data)});
document.addEventListener('message',function(e){window.handle(e.data)});
setBase();draw();drawReports();
</script></body></html>`;
}
