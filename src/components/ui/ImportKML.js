import React, { useContext, useState, useEffect } from "react";
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Upload, App,  Row, Col, Segmented } from 'antd';
import { geojsonFormater } from "../../util/geojsonFormater";
import { TbPolygon } from "react-icons/tb";
import { GlobalContext } from "../context/GlobalContext";
import './FormLotes.css';


function ImportKML() {

    const { message } = App.useApp();
    const { Dragger } = Upload;
    const { setAreaMapa, setPolygonEdit, reloadMap, setReloadMap, setGeojson, geojson, setAreaEditar, areaEditar } = useContext(GlobalContext);
    const [ disableImport, setDisableImport ] = useState(true);
    const [ status, setStatus ] = useState(); //Estado al subir archivo
    const [ showUpload, setShowUpload ] = useState(false);




    const props = {
        name: 'file',
        multiple: false,
        maxCount: 1,
        accept: '.kml',
        beforeUpload(file) {

            if (!file.name.toLowerCase().endsWith(".kml")) {
                console.log("Por favor, selecciona un archivo con extensión .kml");
                message.error("Ingrese unicamente archivos .kml", 10);
                setStatus('error');
                return Upload.LIST_IGNORE;
            }
            
            const reader = new FileReader();

            reader.onload = e => {
                
                const xmlDocument = new DOMParser().parseFromString(e.target.result, "text/xml");
                const polygonCoordinates = xmlDocument.querySelector("coordinates").textContent.trim();

                const coordinatesArray = polygonCoordinates.split(" ").map((coord) => {
                    const [longitude, latitude] = coord
                        .trim()
                        .split(",")
                        .map(parseFloat);
                    return [longitude, latitude];
                });


                if (coordinatesArray.length < 4) {
                   // message.error("El archivo .kml ingresado no es un objeto GeoJSON válido.");
                    setStatus('error');
                    return Upload.LIST_IGNORE;
                }

                setGeojson(JSON.stringify(coordinatesArray)); //seteamos el geojson extraido del kml importado.

                setAreaEditar(geojsonFormater(JSON.stringify(coordinatesArray))); //Una vez cargue el archivo, marcaremos el polygon en el mapa.
                setReloadMap(!reloadMap);
                setStatus('done');
            };
            reader.readAsText(file);
            // setStatus('done');
            return false;
        },
        onChange(info) {

        },
        onRemove() {
            // console.log('Entra en onRemove')
            setGeojson(undefined); //Al cambiar el switch limpiar el geojson para prepararlo para el seteo.
            setAreaMapa(undefined); //limpiamos el area de la card de has.
            setAreaEditar(undefined);
        }
    };

    const selectedOption = (e) => {

        setGeojson(undefined); //Al cambiar el switch limpiar el geojson para prepararlo para el seteo.
        setAreaMapa(undefined); //limpiamos el area de la card de has.
        setAreaEditar(undefined);

        if(e === 'dibujar'){ 
            setDisableImport(true) 
            setPolygonEdit(true);
            setShowUpload(false);
            setAreaEditar(0); // Aparecen controles dibujar lote.
        };
        if(e === 'importar'){ 
            setDisableImport(false);
            setPolygonEdit(false);
            setShowUpload(true);
        };
        
        setReloadMap(!reloadMap);
    };


    useEffect(() => {
        
        if (status === 'done') {
            message.success(`Archivo subido satisfactoriamente.`);
        } 

        if (status === 'error') {
            message.error("El archivo .kml ingresado no es un objeto GeoJSON válido.", 10);
            setGeojson(undefined); //Al cambiar el switch limpiar el geojson para prepararlo para el seteo.
            setAreaMapa(undefined); //limpiamos el area de la card de has.
            setAreaEditar(undefined);
        } 

    }, [status]);


    return (
        <>
            <Row style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>

                <Segmented
                    onChange={selectedOption}
                    options={[
                        {
                            label: (
                                <div><TbPolygon /> Dibujar lote</div>
                            ),
                            value: 'dibujar',
                        },
                        {
                            label: (
                                <div><UploadOutlined /> Importar archivo</div>
                            ),
                            value: 'importar',
                        },
                    ]}
                />

            </Row>


            {showUpload ? <Row style={{marginBottom:"20px"}}>

                <Col xs={24} sm={24} md={24}>

                        <Dragger {...props}
                        disabled= {disableImport}>
                            <p className="ant-upload-drag-icon" style={{margin: '0'}}>
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text" style={{fontSize:'14px'}}>Haga click o arrastre un archivo aquí</p>
                            <p className="ant-upload-hint" style={{fontSize:'13px', margin: '0'}}>
                                Ingrese un archivo .kml
                            </p>
                        </Dragger>

                </Col>
            </Row> : '' }
        </>
    )
}

export default () => (
    <App>
        <ImportKML />
    </App>
);