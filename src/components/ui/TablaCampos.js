import React, { useContext, useEffect, useState } from "react";
import {
    Button,
    Table,
    Row,
    Col,
    Input,
    App,
    Segmented,
    Card,
    Tag,
    Tooltip,
} from "antd";
import {
    EditOutlined,
    SearchOutlined,
    ArrowLeftOutlined,
    CloseOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import Link from "antd/es/typography/Link";
import "./TablaCampos.css";
import { GlobalContext } from "../context/GlobalContext";
import FormCampos from "./FormCampos";
import FormLotes from "./FormLotes";
import Mapa from "./Mapa";
import { geojsonFormater } from "../../util/geojsonFormater";

function TablaCampos() {

    const URL = process.env.REACT_APP_URL;

    const { message } = App.useApp();
    const [searchedText, setSearchedText] = useState('');
    const [tableDataCampos, setTableDataCampos] = useState();
    const [campo, setCampo] = useState();
    const [lote, setLote] = useState();
    const [tableDataLotes, setTableDataLotes] = useState();
    const [historialLotes, setHistorialLotes] = useState();

    const [switchValue, setSwitchValue] = useState('CAMPOS'); //muestra tabla Campos o Lotes
    const [mostrarABMCampo, setMostrarABMCampo] = useState(false); //muestra abm Campo
    const [mostrarABMLote, setMostrarABMLote] = useState(false);   //muestra abm Lote
    const [mostrarCampoSelec, setMostrarCampoSelec] = useState(false); //muestra tag detalle campo sel.
    const [nuevoCampoLabel, setNuevoCampoLabel] = useState(true); //label nuevo o editar Campo
    const [nuevoLoteLabel, setNuevoLoteLabel] = useState(true); //label nuevo o editar en Lote
    const [mostrarCardHistorial, setMostrarCardHistorial] = useState(false); //muestra historial de Lote.


    const { areaMapa, setAreaMapa, setPolygonEdit, polygonEdit, reloadMap, setReloadMap, guardar, setGuardar, setUbicacionCampo, areaEditar, setAreaEditar } = useContext(GlobalContext);

    const screenH = window.innerHeight;

    useEffect(() => {

        fetchDataCampos()
            .catch(console.error);;

        fetchDataHistorialLote()
            .catch(console.error);;

    }, [guardar]);

    useEffect(() => {

        reloadDataLotes();

    }, [campo]);

    useEffect(() => {

        reloadDataLotes();

    }, [tableDataCampos]);

    const fetchDataCampos = async () => {
        const data = await fetch(`${URL}campos-lotes-master.php`);
        const jsonData = await data.json();
        setTableDataCampos(jsonData);
        //console.log(jsonData)
    };

    const fetchDataHistorialLote = async () => {
        const data = await fetch(`${URL}cam_historialLote.php`);
        const jsonData = await data.json();
        setHistorialLotes(jsonData);
        //console.log(jsonData)
    };


    const columnsCampos = [
        {
            title: "CUENTA",
            dataIndex: "nombreCliente",
            key: "nombreCliente",
            align: "left",
            sorter: {
                compare: (a, b) => a.nombreCliente?.localeCompare(b.nombreCliente),
            },
            onFilter: (value, record) => {
                return String(record.nombreCliente).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(record.nombreCampo).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(record.acopio).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(record.kmsplanta).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(record.planta).toUpperCase().trim().includes(value.toUpperCase().trim());
            },
            filteredValue: [searchedText]
        },
        {
            title: "NOMBRE",
            //dataIndex: "nombre",
            key: "nombreCampo",
            align: "left",
            render: (fila) => {
                return (
                    <>
                        <Link className="icon-color" onClick={() => seleccionarCampo(fila, 'verDetalle')} >{fila.nombreCampo}</Link>
                    </>
                );
            },
            sorter: {
                compare: (a, b) => a.nombreCampo?.localeCompare(b.nombreCampo),
            }
        },
        // {
        //     title: "CAP. DE ACOPIO",
        //     dataIndex: "acopio",
        //     key: "acopio",
        //     align: "left",
        //     sorter: {
        //         compare: (a, b) => a.acopio - b.acopio,
        //     }
        // },
        // {
        //     title: "KMS. A PLANTA",
        //     dataIndex: "kmsplanta",
        //     key: "kmsplanta",
        //     align: "left",
        //     sorter: {
        //         compare: (a, b) => a.kmsplanta - b.kmsplanta,
        //     }
        // },
        // {
        //     title: "PLANTA",
        //     dataIndex: "planta",
        //     key: "planta",
        //     align: "left",
        //     sorter: {
        //         compare: (a, b) => a.planta?.localeCompare(b.planta),
        //     }
        // },
        {
            title: "...",
            key: "acciones",
            align: "center",
            render: (fila) => {
                return (
                    <>
                        <div className="btn-contenedor">
                            <EditOutlined className="icon-color" onClick={() => seleccionarCampo(fila, 'editar')} />
                        </div>
                    </>
                );
            },
        }
    ];

    //Asigna el valor de la fila
    const seleccionarCampo = (fila, accion) => {
        // console.log(fila)
        setMostrarCardHistorial(false); //Card historial se oculta en cualquier otro caso.

        if (accion === 'crear') {
            setSwitchValue('NINGUNO');
            setMostrarABMCampo(true);
            setNuevoCampoLabel(true);
            setMostrarABMLote(false);
            setMostrarCampoSelec(false);
            setCampo(0); //Si entro por el crear, seteo un 0, para pisar la posible data que puede tener campo, si antes presionamos editar un campo y luego presionamos crear.
            setReloadMap(!reloadMap);
            //setAreaEditar(null)
            setPolygonEdit(true); //habilita herramientas dibujar area.
            setAreaEditar(undefined); //elimino el area que se pudo seleccionar previo a crear una nueva.
            setAreaMapa(undefined); //Limpio el area seleccionada mapa.
        };
        if (accion === 'editar') {
            setSwitchValue('NINGUNO')
            setMostrarABMCampo(true);
            setNuevoCampoLabel(false);
            setCampo(fila);

            setAreaEditar(geojsonFormater(fila));
            setReloadMap(!reloadMap);

            setPolygonEdit(false); //deshabilita herramientas dibujar area.

        };
        if (accion === 'verDetalle') {
            setMostrarCampoSelec(true);
            setSwitchValue('LOTES')
            setCampo(fila);
            // const campoSeleccionado = tableDataCampos.find((campo) => campo.key === fila.key);
            // setTableDataLotes(campoSeleccionado.lotes);
            //reloadDataLotes();

            setAreaEditar(geojsonFormater(fila));
            setReloadMap(!reloadMap);
        };
    };


    //Lotes
    const columnsLotes = [
        {
            title: "NOMBRE",
            dataIndex: "nombreLote",
            key: "nombreLote",
            sorter: {
                compare: (a, b) => a.nombreLote?.localeCompare(b.nombreLote),
            },
            onFilter: (value, record) => {
                return String(record.nombreLote).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(record.has).toUpperCase().trim().includes(value.toUpperCase().trim())
            },
            filteredValue: [searchedText]
        },
        {
            title: "HAS.",
            dataIndex: "has",
            key: "has",
            align: "left",
            sorter: {
                compare: (a, b) => a.has - b.has,
            }
        },
        {
            title: "CONDICIÓN",
            //dataIndex: "condicion",
            key: "condicion",
            align: "center",
            render: (fila) => {
                return (
                    <>
                        {fila.condicion === '1' && <Tag color="success">PROPIO</Tag>}
                        {fila.condicion === '0' && <Tag color="error">ALQUILADO</Tag>}
                        {fila.condicion === null && <Tag color="default">LIMPIAR DE BD</Tag>} {/*salva el error de los lotes sin campo registrados desde antes de este modulo. Dichos lotes NO estan registrados en tabla agro_lotesxsocio, deben eliminarse de la bd, ya que no se puede modificar su condicion*/}

                        {fila.geojson === null || fila.geojson === '' && <Tag color="default">SIN GEOJSON</Tag>}
                    </>
                );
            },
        },
        {
            title: "...",
            key: "acciones",
            align: "center",
            render: (fila) => {
                return (
                    <>
                        <div className="btn-contenedor">
                            <HistoryOutlined className="icon-color" onClick={() => seleccionarLote(fila, 'verDetalle')} />
                            <EditOutlined className="icon-color" onClick={() => seleccionarLote(fila, 'editar')} />
                        </div>
                    </>
                );
            },
        }
    ];



    //Asigna el valor de la fila al presionar editar
    const seleccionarLote = (fila, accion) => {
        //console.log(fila)
        setMostrarCardHistorial(false); //Card historial se oculta en cualquier otro caso

        if (accion === 'crear') {
            setCampo(undefined);
            setSwitchValue('NINGUNO');
            setMostrarABMLote(true);
            setNuevoLoteLabel(true);
            setMostrarABMCampo(false);
            setMostrarCampoSelec(false);
            setLote(0);

            setReloadMap(!reloadMap);
            //setAreaEditar(null)
            setPolygonEdit(true); //habilita herramientas dibujar area.
            setAreaEditar(undefined); //elimino el area que se pudo seleccionar previo a crear una nueva.
            setAreaMapa(undefined); //Limpio el area seleccionada mapa.
            return
        };
        // const loteSeleccionado = tableDataLotes.find((lote) => lote.key === fila.key);
        // setTableDataLotes(loteSeleccionado.lotes);
        if (accion === 'editar') {
            setSwitchValue('NINGUNO')
            setMostrarABMLote(true);
            setNuevoLoteLabel(false);
            setLote(fila);

            setAreaEditar(geojsonFormater(fila));
            setReloadMap(!reloadMap);

            setPolygonEdit(false); //deshabilita herramientas dibujar area.
        };
        if (accion === 'verDetalle') {
            setLote(fila);
            setMostrarCardHistorial(true);

            setAreaEditar(geojsonFormater(fila));
            setReloadMap(!reloadMap);
        };
    };



    //Switch
    const selectedOption = (e) => {
        //Cada vez que cambiemos de opcion en el switch, vuelve a los datos originales de Campos y Lotes
        setMostrarCampoSelec(false);
        setMostrarABMCampo(false);
        setMostrarABMLote(false);

        setReloadMap(!reloadMap);
        setAreaEditar(undefined);
        setCampo(undefined); //Al presionar volver en campo seleccionado, eliminaria el que habia selecc.

        setPolygonEdit(false); //oculta herramientas dibujar area.
        setMostrarCardHistorial(false); //Card historial se oculta en cualquier otro caso.


        if (e === 'CAMPOS') {
            setSwitchValue('CAMPOS');
            //setReloadMap(!reloadMap);
        };
        if (e === 'LOTES') {
            setSwitchValue('LOTES');
            //Si entra en esta seccion, significa que el usuario quiere ver los lotes sin Campo(0)
            // const campoSeleccionado = tableDataCampos.find((campo) => campo.key === 0);
            // setTableDataLotes(campoSeleccionado.lotes);
            setCampo(0)
            //reloadDataLotes();
        };
    };

    const closeABMLote = () => {

        setUbicacionCampo(undefined); //Al cerrar el ABM de Lote, que se dirija a la posicion general de cliente a traves de sus parametros, no la del campo seleccionado en el select.
        setReloadMap(!reloadMap);
        setAreaEditar(undefined);
        setLote(undefined); //Al presionar volver en campo seleccionado, eliminaria el que habia selecc.

        setPolygonEdit(false); //oculta herramientas dibujar area.

        //al presionar cerrar en editar lote.
        if (switchValue === 'NINGUNO' & mostrarABMLote & !nuevoLoteLabel) {
            setMostrarABMLote(false);
            setSwitchValue('LOTES')
        };
        //al presionar cerrar en agregar lote.
        if (switchValue === 'NINGUNO' & mostrarABMLote & nuevoLoteLabel) {
            setMostrarABMLote(false);
            setSwitchValue('CAMPOS')
        };

    };

    //Notificacion al guardar. 
    const showMessage = (error) => {

        if (error) {
            message.warning('Debe marcar el area en el mapa');
            return;
        };
        message.success('Guardado correctamente!');
    };

    const accionGuardarABM = (error, tipo) => {

        if (error) {
            showMessage(true);
            return;
        } else {
            showMessage();
            if (tipo === 'campo') selectedOption('CAMPOS');
            if (tipo === 'lote') closeABMLote();
            setGuardar(!guardar);
        }

    };

    const reloadDataLotes = () => {
        //console.log(campo?.key)
        //console.log(campo)
        const idCampo = campo?.key ? campo?.key : 0;

        const campoSeleccionado = tableDataCampos?.find((campoSelect) => campoSelect.key === idCampo);
        setTableDataLotes(campoSeleccionado?.lotes);
    };


    const columnsHistorialLote = [
        {
            title: "COSECHA",
            dataIndex: "cosecha",
            key: "cosecha",
            align: "center"
        },
        {
            title: "CULTIVO",
            dataIndex: "cultivo",
            key: "cultivo",
            align: "left"
        },
        {
            title: "CICLO",
            dataIndex: "ciclo",
            key: "ciclo",
            align: "center"
        },
        {
            title: "FECHA SIEMBRA",
            dataIndex: "fechasiembra",
            key: "fechasiembra",
            align: "center",
            // render: (fechasiembra, record) => (
            //   <Typography.Text style={{ fontSize: "14px" }}>
            //     {fechasiembra}
            //   </Typography.Text>
            // )
        },
        {
            title: "ANTERIOR",
            dataIndex: "cultivoA",
            key: "cultivoA",
            align: "left"
        },
        {
            title: "RINDE EST.",
            dataIndex: "rindeest",
            key: "rindeest",
            align: "left"
        },
        {
            title: "COSTO EST.",
            dataIndex: "costoest",
            key: "costoest",
            align: "left"
        }
        // {
        //     title: "...",
        //     key: "acciones",
        //     align: "center",
        //     render: (fila) => {
        //         return (
        //             <>
        //                 <div className="btn-contenedor">
        //                     <EditOutlined className="icon-color" onClick={() => seleccionarCampo(fila, 'editar')} />
        //                 </div>
        //             </>
        //         );
        //     },
        // }
    ];

    console.log(screenH)

    return (
        <div className="tabla-main-wrapper">

            <h3 className="titulo-modulo" >CAMPOS</h3>

            <Row>
                <Col xs={24} sm={12} md={10} className="filtros-contenedor">


                    <Segmented className="switch" block options={['CAMPOS', 'LOTES']}
                        onChange={selectedOption} value={switchValue} />

                    <Tooltip title="Buscar por cualquiera de las columnas" placement="top" >
                        <>
                            <Input placeholder="Buscar..." className="buscador"
                                suffix={
                                    <SearchOutlined className="search-icon" />
                                }
                                onChange={(e) => {
                                    setSearchedText(e.target.value);
                                }}
                            />
                        </>
                    </Tooltip>
                </Col>
                <Col xs={24} sm={12} md={14} className="btn-agregar-contenedor">

                    <Button type="primary" className="btn-agregar" onClick={() => seleccionarCampo('btnNuevoCampo', 'crear')}>NUEVO CAMPO</Button>
                    <Button type="primary" className="btn-agregar" onClick={() => seleccionarLote('btnNuevoLote', 'crear')}>NUEVO LOTE</Button>

                </Col>
            </Row>
            {/* aca podemos probar con un Space para separar las tablas (que seria tabla y mapa) */}

            <Row className="tabla-mapa-contenedor" style={{ paddingBottom:"8px", paddingTop:"8px" }}>

                <Col xs={24} sm={24} md={10} >

                    {mostrarCampoSelec ? <Card
                        title={campo?.nombreCampo}
                        bordered={true}
                        extra={<ArrowLeftOutlined onClick={() => selectedOption('CAMPOS')} />}
                        className="campo-card-show"
                    >
                        <>
                            <Row style={{ marginBottom: "20px" }}>
                                <Col xs={24} sm={24} md={24} >
                                    <div><b>Cliente: </b>{campo?.nombreCliente}</div>
                                </Col>
                                {/* <Col xs={24} sm={12} md={12} >
                                    <div><b>KMs a planta: </b>{campo?.kmsplanta}</div>
                                </Col> */}
                            </Row>
                            <Row>
                                <Col xs={24} sm={24} md={24} >
                                    <div><b>Descripción: </b>{campo?.descripcion}</div>
                                </Col>
                            </Row>
                        </>
                    </Card> : ''}



                    {switchValue === 'LOTES' & !mostrarCampoSelec ? <Card
                        title="Lotes sin campo asignado"
                        bordered={true}
                        bodyStyle={{ padding: '0px' }}

                    >
                    </Card> : ''}



                    {switchValue === 'CAMPOS' ? <Table
                        className={mostrarCampoSelec === false && "tabla-campos-switch-animation"}
                        size={"small"}
                        dataSource={tableDataCampos?.filter((campo) => campo.key !== 0)} //Elimino la ultima fila, ya que es la de idCampo = 0, no es un campo, son los lotes sin campo.
                        columns={columnsCampos}
                        pagination={{
                            position: ["none", "bottomRight"],
                            showSizeChanger: false
                        }}
                    /> : ''}

                    {switchValue === 'LOTES' ? <Table
                        className={mostrarCampoSelec & switchValue === 'LOTES' ? "tabla-lotes-link-animation" : "tabla-lotes-switch-animation"}
                        size={"small"}
                        dataSource={tableDataLotes}
                        columns={columnsLotes}
                        pagination={{
                            position: ["none", "bottomRight"],
                            showSizeChanger: false
                        }}
                    /> : ''}


                    {/* Agregar/Editar CAMPO */}
                    {mostrarABMCampo ? <Card
                        title={nuevoCampoLabel ? "NUEVO CAMPO" : "EDITAR CAMPO"}
                        bordered={true}
                        extra={<CloseOutlined onClick={() => selectedOption('CAMPOS')} />}
                        className={mostrarCampoSelec === false && "tabla-campos-switch-animation"}

                    >
                        <FormCampos editarCampoValues={campo} cancelar={selectedOption} notificacion={accionGuardarABM} />
                    </Card> : ''}




                    {/* Agregar/Editar LOTE */}
                    {mostrarABMLote ? <Card
                        title={nuevoLoteLabel ? "NUEVO LOTE" : "EDITAR LOTE"}
                        bordered={true}
                        extra={<CloseOutlined onClick={closeABMLote} />}
                        className={"tabla-lotes-switch-animation"}
                    >
                        <FormLotes editarLoteValues={lote} cancelar={closeABMLote} notificacion={accionGuardarABM} dataCampos={tableDataCampos} />
                    </Card> : ''}

                </Col>


                <Col xs={24} sm={24} md={13} >
                    <Mapa editarArea={areaEditar} />


                    <div className="area-calculada-contenedor" >
                        {mostrarABMCampo || mostrarABMLote ? <Card
                            bordered={true}
                            className="card-area-calculada"
                            bodyStyle={{ padding: '0 8px 8px 8px' }}
                        >
                            <p className="card-nombre-contenedor">
                                {campo?.nombreCampo}
                            </p>

                            <p style={{ textAlign: "center", margin: "0px" }}>Área de {mostrarABMCampo ? 'campo' : 'lote'} calculada:</p>

                            <h4 style={{ textAlign: "center", margin: "16px 0px", fontWeight: "700", fontSize: "1.1rem" }}>{areaMapa ?? areaMapa} Has.</h4>

                            {/* <div style={{ textAlign: "center", display: "flex", justifyContent: "space-around" }}>
                            <Button type="primary" danger style={{ borderRadius: "2px" }}>Cancelar</Button>

                            <Button type="primary" style={{ borderRadius: "2px" }} >Guardar</Button>
                        </div> */}

                        </Card> : ''}
                    </div>



                    {mostrarCardHistorial ? <div className="card-historialLote-contenedor">
                        {/* Modal historial lote */}
                        <Card
                            title={
                                <div className="contenedor-titulo-modal">
                                    <div className="lote-historial-modal">
                                        <HistoryOutlined style={{ paddingRight: "5px" }} /> {lote?.nombreLote}</div>
                                </div>
                            }

                            size="small"
                            bodyStyle={{ padding: '0px 8px 0px 8px' }}

                        >

                            <Row>
                                <Col xs={24} sm={24} md={24} >

                                    <Table
                                        size={"small"}
                                        dataSource={historialLotes?.filter((loteh) => loteh.idLote === lote?.key)}
                                        columns={columnsHistorialLote}
                                        pagination={{
                                            position: ["none", "bottomRight"],
                                            showSizeChanger: false,
                                            defaultPageSize: 2,
                                            size: "small",
                                            style: { margin: "8px 0px 8px 0px" }
                                        }}
                                    />

                                </Col>
                            </Row>

                        </Card>
                    </div> : ''}

                </Col>

            </Row>


        </div>
    )
}

export default () => (
    <App>
        <TablaCampos />
    </App>
);