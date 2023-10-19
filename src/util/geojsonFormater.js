export const geojsonFormater = (data) => {

  const geojson = {
    id: "idPoligono",
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [JSON.parse(data?.geojson)], //REVISAR, al editar, estas coordenadas las tengo que sacar de la respuesta del backend.
    },
  };  
  return geojson;
};