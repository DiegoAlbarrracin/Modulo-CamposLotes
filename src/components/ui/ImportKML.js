import React, { useContext, useState } from "react";
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { message, Upload, App,  Row, Col, Segmented } from 'antd';
import FormItem from "antd/es/form/FormItem";
import { geojsonFormater } from "../../util/geojsonFormater";
import { TbPolygon } from "react-icons/tb";
import { GlobalContext } from "../context/GlobalContext";


function ImportKML() {

    const { message } = App.useApp();
    const { Dragger } = Upload;
    const { setAreaMapa, setPolygonEdit, reloadMap, setReloadMap, setGeojson, setAreaEditar } = useContext(GlobalContext);
    const [ disableImport, setDisableImport ] = useState(true);
    const [ status, setStatus ] = useState();
    const [ showUpload, setShowUpload ] = useState(false);



    const props = {
        name: 'file',
        multiple: false,
        maxCount: 1,
        accept: '.kml',
        beforeUpload(file) {
            
            //console.log(file)
            if (!file.name.toLowerCase().endsWith(".kml")) {
                console.log("Por favor, selecciona un archivo con extensión .kml");
                message.error("Ingrese unicamente archivos .kml");
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

                //console.log(JSON.stringify(coordinatesArray)) //geojson extraido del xml.
                setGeojson(JSON.stringify(coordinatesArray)); //seteamos el geojson extraido del kml importado.

                setAreaEditar(geojsonFormater(JSON.stringify(coordinatesArray))); //Una vez cargue el archivo, marcaremos el polygon en el mapa.
                setReloadMap(!reloadMap);
                
            };
            reader.readAsText(file);
            setStatus('done');
            return false;
        },
        onChange(info) {

            
            if (status === 'deleted') {
                return;
            }
            
            if (status === 'done') {
                message.success(`${info.file.name} archivo subido satisfactoriamente.`);
            } 
            
            setStatus('deleted');

        },
    };

    const selectedOption = (e) => {

        setGeojson(undefined); //Al cambiar el switch limpiar el geojson para prepararlo para el seteo.
        setAreaMapa(undefined); //limpiamos el area de la card de has.
        setAreaEditar(undefined);

        if(e === 'dibujar'){ 
            setDisableImport(true) 
            setPolygonEdit(true);
            setShowUpload(false);
        };
        if(e === 'importar'){ 
            setDisableImport(false);
            setPolygonEdit(false);
            setShowUpload(true);
        };
        
        setReloadMap(!reloadMap);
    };


    return (
        <>
            <Row style={{ display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "8px" }}>

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


            {showUpload ? <Row style={{marginBottom:"50px"}}>

                <Col xs={24} sm={24} md={24}>

                        <Dragger {...props}
                        disabled= {disableImport}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Haga click o arrastre un archivo aquí</p>
                            <p className="ant-upload-hint">
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