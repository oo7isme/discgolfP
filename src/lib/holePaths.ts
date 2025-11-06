// Utility to extract disc golf hole paths from GeoJSON
// This file contains the disc golf hole LineString data from map/lines.geojson

interface HolePath {
  hole: number;
  coordinates: [number, number][]; // [lat, lon] format
}
[59.8940167, 10.7879838]
// Extract disc golf hole paths from the GeoJSON data
// The GeoJSON features have "disc_golf"=>"hole" in other_tags and "ref" for hole number
// Coordinates are stored as [lon, lat] in GeoJSON, so we convert to [lat, lon] for Leaflet
export const ekebergHolePaths: HolePath[] = [
  { hole: 1, coordinates: [[59.8949319, 10.7871644], [59.8942663, 10.7877485]] },
  { hole: 2, coordinates: [[59.8945078, 10.7882011],[59.8940167, 10.7879838] ] },
  { hole: 3, coordinates: [[59.8935519, 10.7888656], [59.8930977, 10.7882853], [59.8926336, 10.788934]] },
  { hole: 4, coordinates: [[59.8918455, 10.789687], [59.8915186, 10.79032]] },
  { hole: 5, coordinates: [[59.8913356, 10.7906104], [59.8908404, 10.7910073]] },
  { hole: 6, coordinates: [[59.8907458, 10.7919406], [59.890146, 10.792633]] },
  { hole: 7, coordinates: [[59.8898562, 10.792783], [59.8896019, 10.7930418]] },
  { hole: 8, coordinates: [[59.8894145, 10.7931498], [59.8891965, 10.7920554]] },
  { hole: 9, coordinates: [[59.8894966, 10.7917175], [59.8891992, 10.7909852]] },
  { hole: 10, coordinates: [[59.8895376, 10.7909074], [59.8897744, 10.7915083]] },
  { hole: 11, coordinates: [[59.8902588, 10.7917658], [59.8900705, 10.7905051]] },
  { hole: 12, coordinates: [[59.8906931, 10.790766], [59.890902, 10.7893793]] },
  { hole: 13, coordinates: [[59.8915838, 10.7887127], [59.8915193, 10.7896247]] },
  { hole: 14, coordinates: [[59.8922347, 10.7886879], [59.8925175, 10.7894857], [59.892745, 10.7896059]] },
  { hole: 15, coordinates: [[59.8936713, 10.788598], [59.8934883, 10.7867259]] },
  { hole: 16, coordinates: [[59.8927554, 10.7871255], [59.8929098, 10.7879164], [59.8931052, 10.7878625]] },
  { hole: 17, coordinates: [[59.8935913, 10.7863913], [59.8927241, 10.7869177]] },
  { hole: 18, coordinates: [[59.8937958, 10.7866836], [59.8941059, 10.7876385]] },
];

// Get the path for a specific hole number
export function getHolePath(holeNumber: number): [number, number][] | null {
  const path = ekebergHolePaths.find(p => p.hole === holeNumber);
  return path ? path.coordinates : null;
}

