export const geojsonFormater = (data) => {


  const geojson = {
    id: "idPoligono",
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: data?.geojson ? [JSON.parse(data?.geojson)] : [JSON.parse(data)], 
    },
  };  
  return geojson;
};