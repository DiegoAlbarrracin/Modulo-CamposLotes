/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, Fragment, useContext } from "react";
import mapboxgl from "mapbox-gl";
import PitchToggle from "../Hooks/pitchToggle";
import * as MapboxDraw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { GlobalContext } from "../context/GlobalContext";
import { numberFormater } from "../../util/numberFormater";
import "./Mapa.css";



const Mapa = ({ editarArea }) => {


  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
  const [map, setMap] = useState(null);
  const mapDiv = useRef(null);

  const { setAreaMapa, polygonEdit, reloadMap, setGeojson  } = useContext(GlobalContext);


  useEffect(() => {
   


    //Valores INICIALES del mapa. ESTO ES LO MAS BASICO DE MAPBOX.
    const map = new mapboxgl.Map({
      container: mapDiv.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center: [-62.69572643, -31.86263305], //Ubicacion apenas carga el mapa
      zoom: 8, //zoom inicial
    });
    //Valores INICIALES del mapa. ESTO ES LO MAS BASICO DE MAPBOX.


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
        //console.log('ENTRE EN if(editarArea) {')
        map.addControl(draw);

        draw.add(editarArea); //Esto me permite setear un draw, es decir lo voy a usar para la funcionalidad de editar, NECESITA CIERTO FORMATO. Las has al modificar, van a mostrarse en un principio por la res del backend que las contenga, aunque aun no existe dicha col en la base, preguntar.

        updateArea(); //Esto ejecuta la funcion que calcula el area del polygon apenas empieza la app, asi se muestra en el modal de la esquina inferior izq, ya que no esta almecenada en el la base de datos. En el caso de LOTES si esta alamecenada y ahi si vamos a mostrar la que viene en la respuesta del backend.

        //Ocultar botones crear y eliminar polygon
        showHideBtnsMapa();
      };

      if (!editarArea) {
        //console.log('ENTRE EN if(!editarArea) {')
        map.addControl(draw);
        if (polygonEdit === false) {
          //console.log('ENTRE EN if polygonEdit === false')
          //Ocultar botones crear y eliminar polygon
          showHideBtnsMapa();
        }
      };




      //Calcular area del poligono LISTO
      map.on('draw.create', updateArea);
      map.on('draw.delete', updateArea);
      map.on('draw.update', updateArea);

      function updateArea(e) {
        const data = draw.getAll();
        // const answer = document.getElementById('calculated-area');
        if (data.features.length > 0) {
          let area = turf.area(data);
          // Conversion a has.
          let rounded_area = Math.round(area * 100) / 100;
          let has = numberFormater(rounded_area / 10000) //formateado con punto y sin decimales.
          //console.log(e?.features[0].geometry.coordinates[0]) //coordenadas al modificar mi polygon en editar lote, si no estoy editando, traigo las coordenadas de la base, ya que no varia.
          setAreaMapa(has);
        } else {
          // answer.innerHTML = '';
          if (e.type !== 'draw.delete')
            alert('Click the map to draw a polygon.');
        }
      }
      //Calcular area del poligono LISTO



    });
    //fin Funcion que marca con poligonos y colorea una zona del mapa





































    //POSICION RELACIONADA A SELECCION (ya seleccionado Campo o Lote)
    if (editarArea) {

      // centrado de viewport con turf (Esto hace que el mapa de mueva al lugar que queramos.)
      const geojsonBounds = turf.bbox({
        type: "FeatureCollection",
        features: [
          { //Esta entra en accion cuando elejimos el icono parecido a GoogleMaps y marcar un punto.
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point", //IMPORTANTE
              coordinates: editarArea?.geometry.coordinates[0][0],
            },
          }
        ],
      });

      map.fitBounds(geojsonBounds, { padding: 10, zoom: 13 });

    };


    //POSICION GENERICA (previo a seleccionar Campo o Lote)
    // centrado de viewport con turf (Esto hace que el mapa se mueva al lugar que queramos). 
    if (!editarArea) {

      const geojsonBoundsGenerico = turf.bbox({
        type: "FeatureCollection",
        features: [
          { //Esta entra en accion cuando elejimos el icono parecido a GoogleMaps y marcar un punto.
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point", //IMPORTANTE
              coordinates: [
                -62.67741539,
                -31.8276833
              ],
            },
          }
        ],
      });

      map.fitBounds(geojsonBoundsGenerico, { padding: 10, zoom: 4 });
    }


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



  }, [reloadMap]);





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