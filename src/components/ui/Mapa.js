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


const Mapa = ({ editarArea, dataCamposLotes }) => {


  const MAPBOXTOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
  const URL = process.env.REACT_APP_URL;
  const [map, setMap] = useState(null);
  const mapDiv = useRef(null);
  const [clienteParams, setClienteParams] = useState();

  const { setAreaMapa, polygonEdit, reloadMap, setGeojson, ubicacionCampo, ubicacionLote, idCampoS, setIdCampoS } = useContext(GlobalContext);


  useEffect(() => {

    fetchParamCliente();
  }, []);

  const fetchParamCliente = async () => {
    const data = await fetch(`${URL}cam_clienteParametros.php`);
    const jsonData = await data.json();
    setClienteParams(jsonData);
    //console.log(jsonData)
  };


  useEffect(() => {
    mapboxgl.accessToken = MAPBOXTOKEN;

    //Valores INICIALES del mapa. ESTO ES LO MAS BASICO DE MAPBOX.
    const map = new mapboxgl.Map({
      container: mapDiv.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center: clienteParams ? JSON.parse(clienteParams[0].coordinates) : [-62.67741539, -31.8276833], //Ubicacion apenas carga el mapa
      zoom: 8, //zoom inicial
    });


    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());
    map.addControl(new PitchToggle({ minpitchzoom: 14 }), "top-right");


    //Funcion que marca con poligonos y colorea una zona del mapa
    map.on("load", () => {
      setMap(map);
      map.resize();

      // instancia herramientas
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: polygonEdit,
          trash: polygonEdit,
          //point: polygonEdit,
        },
      });


      if (editarArea) {

        map.addControl(draw);

        draw.add(editarArea); //Esto permite setear un draw, es decir lo voy a usar para la funcionalidad de editar, NECESITA CIERTO FORMATO. Las has al modificar, van a mostrarse en un principio por la res del backend que las contenga, aunque aun no existe dicha col en la base, preguntar.

        updateArea(); //Esto ejecuta la funcion que calcula el area del polygon apenas empieza la app, asi se muestra en el modal de la esquina inferior izq, ya que no esta almecenada en el la base de datos. En el caso de LOTES si esta alamecenada y ahi si vamos a mostrar la que viene en la respuesta del backend.

        //Ocultar botones crear y eliminar polygon
        showHideBtnsMapa();
      };

      if (!editarArea) {

        map.addControl(draw);
        if (polygonEdit === false) {

          //Ocultar botones crear y eliminar polygon
          showHideBtnsMapa();
        }
      };


      if (ubicacionCampo) {
        //Marcamos el area del Campo al cual pertenece el lote, para guiar al usuario.
        map.addSource("idSourceCampo", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  coordinates: [
                    ubicacionCampo,
                  ],
                  type: "Polygon",
                },
              },
            ],
          },
        });

        map.addLayer({
          id: "idLayerLineCampo",
          type: "line",
          source: "idSourceCampo",
          paint: {
            "line-color": "#56b43c",
            "line-width": 4,
          },
        });

        //Si no hay un lote seleccionado para visualizar, centramos en el campo seleccionado. 
        let polygon = turf.polygon([ubicacionCampo]);
        let centroid = turf.centroid(polygon);
        if (!ubicacionLote & !editarArea) map.flyTo({ center: centroid.geometry.coordinates, zoom: 13 });


        //Muestra en el mapa, todos los lotes del campo seleccionado.
        const lotesDelCampo = dataCamposLotes?.filter((campo) => campo.key == idCampoS)

        if (lotesDelCampo[0].lotes) {
          lotesDelCampo[0].lotes.forEach(lote => {
            map.addSource("idSourceCampo" + `${lote?.key}`, {
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

            map.addLayer({
              id: "idLayerLineCampo" + `${lote?.key}`,
              type: "line",
              source: "idSourceCampo" + `${lote?.key}`,
              paint: {
                "line-color": "skyblue",
                "line-width": 3,
              },
            });
          });
        }

      };

      if (ubicacionLote) {
        //Marcamos el area del Lote en su modo solo viusalizacion (no editable).

        map.addSource("idSourceLote", {
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

        map.addLayer({
          id: "idLayerFillLote",
          type: "fill",
          source: "idSourceLote",
          paint: {
            "fill-color": "rgba(135, 207, 235, 0.4)",
          },
        });

        map.addLayer({
          id: "idLayerLineLote",
          type: "line",
          source: "idSourceLote",
          paint: {
            "line-color": "skyblue",
            "line-width": 3,
          },
        });

        //Centramos en el lote seleccionado. 
        let polygon = turf.polygon([ubicacionLote]);
        let centroid = turf.centroid(polygon);
        map.flyTo({ center: centroid.geometry.coordinates, zoom: 13 });

      };


      //Calcular area del poligono.
      map.on('draw.create', updateArea);
      map.on('draw.delete', updateArea);
      map.on('draw.update', updateArea);

      function updateArea(e) {
        const data = draw.getAll();

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
      }

    });
    //fin Funcion map.on("load").


    //POSICION RELACIONADA A SELECCION (ya seleccionado Campo o Lote)
    if (editarArea) {
      // centrado de viewport con turf (Esto hace que el mapa de mueva al lugar que queramos.)

      //Si no hay un lote seleccionado para visualizar, centramos en el campo seleccionado. 
      let polygon = turf.polygon(editarArea.geometry.coordinates);
      let centroid = turf.centroid(polygon);
      map.flyTo({ center: centroid.geometry.coordinates, zoom: 13 });

    };


    //POSICION GENERICA (previo a seleccionar Campo o Lote)
    // centrado de viewport con turf (Esto hace que el mapa se mueva al lugar que queramos). 
    if (!editarArea) {

      if (!ubicacionCampo & !ubicacionLote) {

        map.flyTo({ center: clienteParams ? JSON.parse(clienteParams[0].coordinates) : [-62.67741539, -31.8276833], zoom: clienteParams ? 13 : 4 });
      }

    };

    // geometria dibujada al CREAR
    map.on("draw.create", (e) => {
      console.log(e);
      setGeojson(JSON.stringify(e.features[0].geometry.coordinates[0]));
    });

    // geometria dibujada al EDITAR
    map.on("draw.update", (e) => {
      console.log(e);
      console.log(e.features[0].geometry.coordinates[0]);
      setGeojson(JSON.stringify(e.features[0].geometry.coordinates[0]));
    });

    // evento disparado al ELIMINAR un area marcada
    map.on("draw.delete", (e) => {
      console.log(e);
      setGeojson(undefined);
    });

  }, [reloadMap, dataCamposLotes]);


  const showHideBtnsMapa = () => {
    //Ocultar botones crear y eliminar polygon
    let polygonIcon = document.getElementsByClassName("mapbox-gl-draw_polygon");
    for (let i = 0; i < polygonIcon.length; i++) {
      polygonIcon[i].style.display = 'none';
    };

    let trashIcon = document.getElementsByClassName("mapbox-gl-draw_trash");
    for (let i = 0; i < trashIcon.length; i++) {
      trashIcon[i].style.display = 'none';
    };
  };


  return (
    <>
      <div ref={mapDiv} className="map-style" />
    </>
  );
};

export default Mapa;