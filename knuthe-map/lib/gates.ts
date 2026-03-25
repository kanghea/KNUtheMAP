import type { FeatureCollection } from 'geojson'

export const GATES_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', id: 1,  properties: { name: '동문' },      geometry: { type: 'Point', coordinates: [128.61645900193326, 35.88851677385516] } },
    { type: 'Feature', id: 2,  properties: { name: '나리문' },    geometry: { type: 'Point', coordinates: [128.61622574614057, 35.88944622160905] } },
    { type: 'Feature', id: 4,  properties: { name: '택문' },      geometry: { type: 'Point', coordinates: [128.61482872981298, 35.892562243713954] } },
    { type: 'Feature', id: 5,  properties: { name: '누리문' },    geometry: { type: 'Point', coordinates: [128.61409182791306, 35.893838453347726] } },
    { type: 'Feature', id: 6,  properties: { name: '농장문' },    geometry: { type: 'Point', coordinates: [128.61183536465933, 35.89465456773638] } },
    { type: 'Feature', id: 7,  properties: { name: '북문' },      geometry: { type: 'Point', coordinates: [128.60944373482636, 35.89253439512375] } },
    { type: 'Feature', id: 8,  properties: { name: '어린이집문' }, geometry: { type: 'Point', coordinates: [128.6077324553562,  35.8915803330015] } },
    { type: 'Feature', id: 9,  properties: { name: '수영장문' },  geometry: { type: 'Point', coordinates: [128.60523926338516, 35.89036087855513] } },
    { type: 'Feature', id: 10, properties: { name: '자연대문' },  geometry: { type: 'Point', coordinates: [128.60648209735717, 35.89087844704963] } },
    { type: 'Feature', id: 11, properties: { name: '서문' },      geometry: { type: 'Point', coordinates: [128.6039704164827,  35.88847382922668] } },
    { type: 'Feature', id: 12, properties: { name: '솔로문' },    geometry: { type: 'Point', coordinates: [128.60556755945385, 35.886708678426274] } },
    { type: 'Feature', id: 13, properties: { name: '조은문' },    geometry: { type: 'Point', coordinates: [128.60724734724113, 35.88654606699008] } },
    { type: 'Feature', id: 14, properties: { name: '교수문' },    geometry: { type: 'Point', coordinates: [128.60951756260494, 35.885676465806796] } },
    { type: 'Feature', id: 15, properties: { name: '쪽문' },      geometry: { type: 'Point', coordinates: [128.61032870093243, 35.88630846102538] } },
    { type: 'Feature', id: 16, properties: { name: '수의대문' },  geometry: { type: 'Point', coordinates: [128.612989224336,   35.88611195588935] } },
    { type: 'Feature', id: 17, properties: { name: '정문' },      geometry: { type: 'Point', coordinates: [128.61460714764087, 35.88511272555985] } },
  ],
}
