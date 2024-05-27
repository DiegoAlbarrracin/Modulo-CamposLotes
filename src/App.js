import { ConfigProvider } from "antd";
import './App.css';
import { GlobalContext } from './components/context/GlobalContext';
import { useState } from 'react';
import TablaCampos from "./components/ui/TablaCampos";
import esES from "antd/lib/locale/es_ES";
import 'mapbox-gl/dist/mapbox-gl.css';


function App() {
  //Mapbox campo
  const [areaMapa, setAreaMapa] = useState();
  const [polygonEdit, setPolygonEdit] = useState(false);
  const [reloadMap, setReloadMap] = useState(false);
  

  //FormCampos - Mapa
  const [geojson, setGeojson] = useState();
  const [areaEditar, setAreaEditar] = useState();
  
  //FormCampo - FormLote accion:Guardar
  const [guardar, setGuardar] = useState(false);
  //FormLote accion: marcar campo seleccionado en el mapa, al crear/modificar lote.
  const [newLote, setNewLote] = useState();


  //FormLote - FormLote accion: onChange select campo
  const [ubicacionCampo, setUbicacionCampo] = useState();
  //FormLote - FormLote accion: verDetalle
  const [ubicacionLote, setUbicacionLote] = useState();
  //Todos los lotes de un campo
  const [idCampoS, setIdCampoS] = useState();

  //Ubicacion y zoom unificados
  const [ubicacionMapa, setUbicacionMapa] = useState();
  const [zoomMapa, setZoomMapa] = useState(4);

  //Carga basica del mapa
  const [mapLoaded, setMapLoaded] = useState(false);



  console.log('version modulo-campos-lotes: 27.05.24v3');

  return (
    <GlobalContext.Provider value={{ areaMapa, setAreaMapa, polygonEdit, setPolygonEdit, reloadMap, setReloadMap, geojson, setGeojson, guardar, setGuardar, ubicacionCampo, setUbicacionCampo, ubicacionLote, setUbicacionLote, areaEditar, setAreaEditar, newLote, setNewLote, idCampoS, setIdCampoS, ubicacionMapa, setUbicacionMapa, zoomMapa, setZoomMapa, mapLoaded, setMapLoaded }}>
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            colorPrimary: "#56b43c",
          },
        }}
      >
        <TablaCampos />
      </ConfigProvider>
    </GlobalContext.Provider>
  );
}

export default App;
