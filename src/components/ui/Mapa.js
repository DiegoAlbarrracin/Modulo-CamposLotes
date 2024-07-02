/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, Fragment, useContext } from "react";
import PitchToggle from "../Hooks/pitchToggle";
import * as MapboxDraw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { GlobalContext } from "../context/GlobalContext";
import { numberFormater } from "../../util/numberFormater";
import "./Mapa.css";
// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from "!mapbox-gl";


const Mapa = ({ editarArea, dataCamposLotes, editarLoteValues, switchValue, mostrarCampoSelec, datosFiltrados, coordinates, setCoordinates, editarCampoValues }) => {


  const MAPBOXTOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
  const URL = process.env.REACT_APP_URL;

  const map = useRef(null); // Utilizamos una ref para almacenar la instancia del mapa
  const draw = useRef(null); // Utilizamos una ref para almacenar la instancia de draw (herramientas)

  const [mapContainter, setMap] = useState(null);
  const mapDiv = useRef(null);
  const [clienteParams, setClienteParams] = useState();
  const [layers, setLayers] = useState([]); // Layer general que almacena todos los campos y lotes.
  const [layersFill, setLayersFill] = useState([]); // Layer que pinta el lote seleccionado
  const [mapReady, setMapReady] = useState(false);

  const [isControlAdded, setIsControlAdded] = useState(false);


  const { setAreaMapa, polygonEdit, reloadMap, setGeojson, ubicacionCampo, ubicacionLote, ubicacionMapa, zoomMapa, guardar, setMapLoaded, status } = useContext(GlobalContext);


  useEffect(() => {

    fetchParamCliente();
  }, []);

  const fetchParamCliente = async () => {
    const data = await fetch(`${URL}cam_clienteParametros.php`);
    const jsonData = await data.json();
    setClienteParams(jsonData);
    //console.log(jsonData)
  };


  const getCentroide = (geojson) => {
    // console.log(geojson)
    if (geojson.length === 2) return geojson;

    let polygon = turf.polygon([geojson]);
    let centroid = turf.centroid(polygon);
    // console.log('getCentroide', centroid.geometry.coordinates)
    return centroid.geometry.coordinates;
  };


  useEffect(() => {
    mapboxgl.accessToken = MAPBOXTOKEN;

    //Valores INICIALES del mapa. ESTO ES LO MAS BASICO DE MAPBOX. 
    map.current = new mapboxgl.Map({
      container: mapDiv.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center: clienteParams ? JSON.parse(clienteParams[0].coordinates) : [-62.67741539, -31.8276833],
      //Ubicacion apenas carga el mapa - ubicacionMapa
      zoom: zoomMapa, //zoom inicial - zoomMapa
    });


    // Add zoom and rotation controls to the map.
    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.addControl(new mapboxgl.FullscreenControl());
    map.current.addControl(new PitchToggle({ minpitchzoom: 14 }), "top-right");


    //Funcion que marca con poligonos y colorea una zona del mapa
    map.current.on("load", async () => {
      setMap(map.current);
      map.current.resize();

      // instancia herramientas
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true, //polygonEdit,
          trash: true, //polygonEdit,
          //point: polygonEdit,
        },
        styles: [
          {
            id: 'gl-draw-line-static',
            type: 'line',
            // filter: ['all', ['==', 'mode', 'static'],
            // ['==', '$type', 'LineString']
            // ],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': 'skyblue',
              'line-width': 3
            }
          },

          {
            'id': 'gl-draw-polygon-fill-inactive',
            'type': 'fill',
            // 'filter': ['all', ['==', 'active', 'false'],
            //     ['==', '$type', 'Polygon'],
            //     ['!=', 'mode', 'static']
            // ],
            'paint': {
              'fill-color': 'skyblue',
              //'fill-outline-color': '#fbb03b',
              'fill-opacity': 0.4
            }
          },
          {
            'id': 'gl-draw-polygon-fill-active',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'true'],
              ['==', '$type', 'Polygon']
            ],
            'paint': {
              'fill-color': 'skyblue',
              'fill-outline-color': '#fbb03b',
              'fill-opacity': 0.5
            }
          },
          {
            'id': 'gl-draw-polygon-and-line-vertex-inactive',
            'type': 'circle',
            // 'filter': ['all', ['==', 'meta', 'vertex'],
            //     ['==', '$type', 'Point'],
            //     ['!=', 'mode', 'static']
            // ],
            'paint': {
              'circle-radius': 4,
              'circle-color': '#fbb03b'
            }
          },
        ]
      });


      //Calcular area del poligono.
      map.current.on('draw.create', updateArea);
      map.current.on('draw.delete', updateArea);
      map.current.on('draw.update', updateArea);

      // // Dibuja todos los campos con sus lotes, ademas de los lotes sin asignar.
      await drawAllLayers();
      setMapReady(true);
    });
    //fin Funcion map.current.on("load").


    // geometria dibujada al CREAR
    map.current.on("draw.create", (e) => {
      console.log(e);
      setGeojson(JSON.stringify(e.features[0].geometry.coordinates[0]));
    });

    // geometria dibujada al EDITAR
    map.current.on("draw.update", (e) => {
      console.log(e);
      //console.log(e.features[0].geometry.coordinates[0]);
      setGeojson(JSON.stringify(e.features[0].geometry.coordinates[0]));
    });

    // evento disparado al ELIMINAR un area marcada
    map.current.on("draw.delete", (e) => {
      console.log(e);
      setGeojson(undefined);
    });

    setMapLoaded(true);

  }, []); // reloadMap




  function updateArea(e) {
    const data = draw.current.getAll();

    if (data.features.length > 0) {
      let area = turf.area(data);
      // Conversion a has.
      let rounded_area = Math.round(area * 100) / 100;
      let has = numberFormater(rounded_area / 10000) //formateado con punto y sin decimales.
      //console.log(e?.features[0].geometry.coordinates[0]) //coordenadas al modificar mi polygon en editar lote, si no estoy editando, traigo las coordenadas de la base, ya que no varia.
      setAreaMapa(has);
    } else {

      if (e.type !== 'draw.delete')
        alert('Click the map to draw a polygon.');
    }
  };


  //------------------------------------ MAPA YA CARGADO----------------------------------//
  useEffect(() => {

    if (ubicacionMapa && !editarArea) {
      //console.log('UE NO DESEADO')
      map.current.flyTo({ center: getCentroide(ubicacionMapa), zoom: zoomMapa, speed: 1.5 });
    };

    if (ubicacionLote && !editarArea) {
      // console.log('if (ubicacionLote)')
      // Limpia lote pintado previamente
      clearLayersFill();

      const sourceId = "idSourceFillLote" + editarLoteValues?.key;
      const layerId = "idLayerFillLote" + editarLoteValues?.key;

      setLayersFill(prevLayers => [...prevLayers, { sourceId, layerId }]); // Siempre primero Layers, luego Source, ya que esta ultima es contenedor.

      //Marcamos el area del Lote en su modo solo visualizacion (no editable).
      map.current.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                coordinates: [
                  ubicacionLote,
                ],
                type: "Polygon",
              },
            },
          ],
        },
      });

      map.current.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": editarCampoValues?.key === 0 ? "rgba(235, 135, 135, 0.6)" : "rgba(135, 207, 235, 0.6)",
        },
      });



    } else { // Cuando presionamos la flecha volver para salir del campo.
      clearLayersFill();
    };

  }, [reloadMap, ubicacionMapa, ubicacionLote, ubicacionCampo]);


  useEffect(() => {

    if (mapReady) {
      clearLayers();
    }

  }, [datosFiltrados, guardar, dataCamposLotes])


  useEffect(() => {

    // Buscador de ciudades mapa.
    if (coordinates) {
      //console.log('BUSCADOR COORDINATEEEEES', coordinates)
      map.current.flyTo({
        center: coordinates,
        zoom: 11
      });
      setCoordinates(undefined);
      //return;
    };

  }, [coordinates]);

  //console.log('status Mapa componente: ', status)
  //Mostrar/Ocultar controles para dibujar poligono
  useEffect(() => {
    // console.log('editarArea UE: ', editarArea)
    //Si queremos crear Campo o Lote
    if (editarArea || editarArea === 0) {

      if (!isControlAdded) {
        map.current.addControl(draw.current);
        setIsControlAdded(true);
      }

      //Si estamos editando Campo o Lote
      if (Object.keys(editarArea).length > 1) {
        draw.current.add(editarArea); //Esto permite setear un draw, es decir lo voy a usar para la funcionalidad de editar, NECESITA CIERTO FORMATO. Las has al modificar, van a mostrarse en un principio por la res del backend que las contenga, aunque aun no existe dicha col en la base, preguntar.

        updateArea(); //Esto ejecuta la funcion que calcula el area del polygon apenas empieza la app, asi se muestra en el modal de la esquina inferior izq, ya que no esta almecenada en el la base de datos. En el caso de LOTES si esta alamecenada y ahi si vamos a mostrar la que viene en la respuesta del backend.

        // console.log('EDITAR AREAA AA ', editarArea)
        map.current.flyTo({
          center: getCentroide(editarArea.geometry.coordinates[0]),
          zoom: 15
        });
      };



    } else {
      //console.log("SACAR CONTROLES")
      if (draw.current && isControlAdded) {
        map.current.removeControl(draw.current);
        setIsControlAdded(false);
      }
    };

  }, [editarArea])


  const drawAllLayers = async () => {
    // Dibuja todos los campos con sus lotes, ademas de los lotes sin asignar.
    //let dataDibujar = datosFiltrados;
    for (const [index, campo] of datosFiltrados.entries()) {
      //console.log(campo)
      const sourceIdCampo = "idSourceCampo" + campo?.key;
      const layerIdCampo = "idLayerLineCampo" + campo?.key;

      if (campo?.key !== 0) {

        map.current.addSource(sourceIdCampo, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  coordinates: [
                    JSON.parse(campo?.geojson),
                  ],
                  type: "Polygon",
                },
              },
            ],
          },
        });

        map.current.addLayer({
          id: layerIdCampo,
          type: "line",
          source: sourceIdCampo,
          paint: {
            "line-color": "#56b43c",
            "line-width": 5,
          },
        });

      }

      const lotesLayers = [];
      campo?.lotes?.forEach((lote, index) => {

        const sourceIdLote = "idSourceLote" + lote?.key;
        const layerIdLote = "idLayerLineLote" + lote?.key;
        const layerIdLoteBg = "idLayerBgLote" + lote?.key;
        lotesLayers[index] = [layerIdLote, layerIdLoteBg, sourceIdLote];

        map.current.addSource(sourceIdLote, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  coordinates: [
                    JSON.parse(lote?.geojson),
                  ],
                  type: "Polygon",
                },
              },
            ],
          },
        });

        // Bordes de poligono.
        map.current.addLayer({
          id: layerIdLote,
          type: "line",
          source: sourceIdLote,
          paint: {
            "line-color": campo?.key === 0 ? "red" : "skyblue",
            "line-width": 2,
          },
        });

        // Texto + fondo blanco
        map.current.addLayer({
          id: layerIdLoteBg,
          type: "symbol",
          source: {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: getCentroide(JSON.parse(lote?.geojson)),
              },
              properties: {
                text: lote?.nombreLote,
              },
            },
          },
          layout: {
            "symbol-placement": "point",
            "text-field": lote?.nombreLote,
            "text-size": 15,
            "text-offset": [0, 0],
            "text-allow-overlap": true,
            "icon-allow-overlap": true,
          },
          paint: {
            "text-color": "#fff", // Color del texto
            "text-halo-color": "#000", // Color del halo (fondo blanco)
            "text-halo-width": 1,
          },
        });


      });
      setLayers(prevLayers => [...prevLayers, { sourceIdCampo, layerIdCampo, lotesLayers, "idCampo": campo.key }]);
    };
  };


  // Función para eliminar todas las capas y fuentes de polígonos
  const removeAllLayersAndSources = async () => {

    setLayers([]);
    // Obtener una lista de todas las capas en el mapa
    const layers = map.current.getStyle().layers;
    // Iterar sobre las capas y eliminar las relacionadas con polígonos
    layers.forEach(layer => {
      // console.log('layer: ', layer)
      if (layer.id.startsWith('idLayer')) {
        if (map.current.getLayer(layer.id)) {
          map.current.removeLayer(layer.id);
        }
      }
    });

    // Obtener una lista de todas las fuentes en el mapa
    const sources = map.current.getStyle().sources;
    // Iterar sobre las fuentes y eliminar las relacionadas con polígonos
    Object.keys(sources).forEach(source => {
      //console.log('source :', source)
      if (source.startsWith('idSource') || source.startsWith('idLayerBg')) {
        if (map.current.getSource(source)) {
          map.current.removeSource(source);
        }
      }
    });
  };



  const clearLayers = async () => { // Limpia campos y lotes filtrados.

    if (datosFiltrados) {
      await removeAllLayersAndSources();
      await drawAllLayers();
    }
  };

  //console.log('layersFill', layersFill)
  const clearLayersFill = async () => { // Limpia lote pintado previamente

    for (const element of layersFill) {
      //console.log('layersFill', element)
      if (map.current.getLayer(element.layerId)) {
        map.current.removeLayer(element.layerId);
      }
      if (map.current.getSource(element.sourceId)) {
        map.current.removeSource(element.sourceId);
      }

    };

    // Dejamos el state vacio para que no crezca indefinidamente
    setLayersFill([]);
  };


  return (
    <>
      <div ref={mapDiv} className="map-style" />
    </>
  );
};

export default Mapa;