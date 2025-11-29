import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useMemo, useState } from "react";

// 自訂兩種 icon
const shelterIcon = new L.DivIcon({
  className: "bg-white/90 rounded-full border border-gray-300 shadow px-2 py-1",
  html: "🏠",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -10],
});
const cafeIcon = new L.DivIcon({
  className: "bg-white/90 rounded-full border border-gray-300 shadow px-2 py-1",
  html: "☕️",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -10],
});

// TODO: 換成你的真實座標
const PLACES = [
  { id: 1, type: "cafe", name: "浪浪別哭", lat: 25.0455961, lng: 121.524575, addr: "100台北市中正區林森北路9巷13號" },
  { id: 2, type: "shelter", name: "新北動物保護防疫所", lat: 25.012, lng: 121.462, addr: "新北市板橋區…" },
  { id: 3, type: "cafe", name: "転運棧-貓咪中途咖啡廳", lat: 25.053346, lng: 121.5138082, addr: "103台北市大同區天水路2-3號" },
  { id: 4, type: "cafe", name: "喵喵屋", lat: 25.0326745, lng: 121.538048, addr: "106台北市大安區建國南路二段19號1樓" },
  { id: 5, type: "cafe", name: "朵朵嚐嚐", lat: 25.0594268, lng: 121.5479963, addr: "106台北市松山區敦化北路 222 巷 17-2 號" },
  { id: 6, type: "cafe", name: "貓食光", lat: 25.0176399, lng: 121.531706, addr: "106台北市大安區羅斯福路三段 297-1 號 1 樓" },
  { id: 7, type: "cafe", name: "咪途之家", lat: 25.0068031, lng: 121.4728223, addr: "23546新北市中和區中山路三段 170 巷 5 號" },
  { id: 8, type: "cafe", name: "貓．領事館", lat: 25.046374, lng: 121.4524025, addr: "242新北市新莊區中港路 360 之 9 號" },
  { id: 9, type: "cafe", name: "O CAT CAFÈ", lat: 25.0579369, lng: 121.48837, addr: "241新北市三重區重新路四段29號1樓" },
  { id: 10, type: "shelter", name: "台北市動物之家", lat: 25.0604633, lng: 121.6030395, addr: "114台北市內湖區安美街191號" },
  { id: 11, type: "shelter", name: "巴克幫-浪犬之家", lat: 25.1135264, lng: 121.526214, addr: "111 台北市士林區中山北路六段405巷2號" },
  { id: 12, type: "shelter", name: "好好善待動物協會", lat: 25.0054224, lng: 121.5137743, addr: "234新北市永和區自由街55號9樓" },
  { id: 13, type: "cafe", name: "FUFUCatCafe", lat: 25.0447147, lng: 121.5072992, addr: "234新北市永和區自由街55號9樓" },
];

function LocateButton() {
  const map = useMap();
  const locate = () => {
    if (!navigator.geolocation) return alert("此裝置不支援定位");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);
        L.marker([latitude, longitude], {
          icon: new L.DivIcon({
            className: "bg-[#00AA88] text-white rounded-full px-2 py-1 shadow ring-2 ring-white",
            html: "📍",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(map).bindPopup("你在這裡");
      },
      () => alert("無法取得定位")
    );
  };
  return (
    <button
      onClick={locate}
      className="absolute z-[1000] right-3 bottom-3 bg-white/90 backdrop-blur px-3 py-1 rounded shadow border text-sm"
    >
      我的定位
    </button>
  );
}

export default function MapPage() {
  const center = useMemo(() => [25.0436, 121.5360], []);
  const [showShelter, setShowShelter] = useState(true);
  const [showCafe, setShowCafe] = useState(true);

  const filtered = PLACES.filter(
    (p) => (p.type === "shelter" && showShelter) || (p.type === "cafe" && showCafe)
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/*<h1 className="text-2xl font-bold mb-3">地圖 🗺️</h1> */}

      {/* 篩選 */}
      <div className="mb-3 flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={showShelter} onChange={() => setShowShelter((prev) => !prev)} />
          <span>🏠 收容所</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={showCafe} onChange={() => setShowCafe((prev) => !prev)} />
          <span>☕️ 浪浪咖啡</span>
        </label>
      </div>

      {/* 地圖 */}
      <div className="relative rounded-xl overflow-hidden shadow">
        <MapContainer center={center} zoom={12} style={{ height: "70vh", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          {filtered.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={p.type === "shelter" ? shelterIcon : cafeIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{p.type === "shelter" ? "🏠" : "☕️"} {p.name}</div>
                  <div className="text-sm opacity-80">{p.addr}</div>
                </div>
              </Popup>
            </Marker>
          ))}
          <LocateButton />
        </MapContainer>
      </div>
    </div>
  );
}
