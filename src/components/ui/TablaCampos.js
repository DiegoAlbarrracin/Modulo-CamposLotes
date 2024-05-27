import React, { useContext, useEffect, useState, useRef } from "react";
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
    Spin,
    Popconfirm,
    Select,
    Popover,
    Alert
} from "antd";
import {
    EditOutlined,
    ArrowLeftOutlined,
    CloseOutlined,
    HistoryOutlined,
    LoadingOutlined,
    DeleteOutlined,
    PaperClipOutlined,
    FilterOutlined
} from "@ant-design/icons";
import Link from "antd/es/typography/Link";
import "./TablaCampos.css";
import { GlobalContext } from "../context/GlobalContext";
import FormCampos from "./FormCampos";
import FormLotes from "./FormLotes";
import Mapa from "./Mapa";
import { geojsonFormater } from "../../util/geojsonFormater";
import DrawerUploads from "./DrawerUploads";


function TablaCampos() {

    const URL = process.env.REACT_APP_URL;

    const tipoAcceso = localStorage.getItem("camposlotes");
    const idU = localStorage.getItem("usuario");

    const { Search } = Input;
    const { message } = App.useApp();

    //Rango de usuario: es Administrador o no.
    const [isAdmin, setIsAdmin] = useState();

    // Filtro campo o lote.
    const [searchedTextCampo, setSearchedTextCampo] = useState('');
    const [searchedTextLote, setSearchedTextLote] = useState('');
    const [filter, setFilter] = useState(2); // 0 campos. 1 lotes. 2 nada.
    const [open, setOpen] = useState(false);

    const [tableDataCampos, setTableDataCampos] = useState();
    const [campo, setCampo] = useState();
    const [lote, setLote] = useState();
    const [tableDataLotes, setTableDataLotes] = useState();
    const [historialLotes, setHistorialLotes] = useState();
    const [loading, setLoading] = useState(true);

    //Buscador de ciudades mapa.
    const [coordinates, setCoordinates] = useState(null);
    const [optionsLugar, setOptionsLugar] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState();

    const [switchValue, setSwitchValue] = useState('CAMPOS'); //muestra tabla Campos o Lotes
    const [mostrarABMCampo, setMostrarABMCampo] = useState(false); //muestra abm Campo
    const [mostrarABMLote, setMostrarABMLote] = useState(false);   //muestra abm Lote
    const [mostrarCampoSelec, setMostrarCampoSelec] = useState(false); //muestra tag detalle campo sel.
    const [nuevoCampoLabel, setNuevoCampoLabel] = useState(true); //label nuevo o editar Campo
    const [nuevoLoteLabel, setNuevoLoteLabel] = useState(true); //label nuevo o editar en Lote
    const [mostrarCardHistorial, setMostrarCardHistorial] = useState(false); //muestra historial de Lote.

    const [datosFiltrados, setDatosFiltrados] = useState(tableDataCampos); // datos filtrados de las tablas campos y lotes.

    const [currentPage, setCurrentPage] = useState(1); // Pagina tabla campos

    const [datosFilterResult, setDatosFilterResult] = useState();

    // Acceso al modulo-campos-lotes desde modulo_vistaCliente, cuando cliente no posee lotes
    const [clienteSinLotes, setClienteSinLotes] = useState(false);

    // State para mostrar visualmente si una busqueda por lote arroja o no resultados y que eso afecte visualmente a la tabla Campos
    const [filtroLoteNoResult, setFiltroLoteNoResult] = useState(false);

    // Drawer uploads
    const [drawerUpload, setDrawerUpload] = useState(false);
    const [modori, setModori] = useState(0);
    const [filterDrawer, setFilterDrawer] = useState(0);
    const [generico, setGenerico] = useState(0);
    const [cliLote, setCliLote] = useState(0);

    const { areaMapa, setAreaMapa, setPolygonEdit, polygonEdit, reloadMap, setReloadMap, guardar, setGuardar, setUbicacionCampo, setUbicacionLote, areaEditar, setAreaEditar, setIdCampoS, idCampoS, setUbicacionMapa, setZoomMapa, mapLoaded } = useContext(GlobalContext);


    useEffect(() => {

        fetchDataCampos()
            .catch(console.error);;

        fetchDataHistorialLote()
            .catch(console.error);;

        fetchIsAdmin()
            .catch(console.error);;

    }, [guardar]);

    useEffect(() => {

        reloadDataLotes();

    }, [tableDataCampos, campo]);

    useEffect(() => {

        if (mapLoaded) {

            // Respetar filtros
            if (searchedTextCampo.trim().length > 0) {
                handleFiltroCampos(searchedTextCampo, currentPage);
            }

            if (searchedTextLote.trim().length > 0) {
                handleFiltroLotes(searchedTextLote);
            }

            // Respetar paginacion:
            if (searchedTextCampo.trim().length === 0 && searchedTextLote.trim().length === 0) {
                handlePageChangeCampos(currentPage);
            }
        }


    }, [tableDataCampos]);



    const fetchDataCampos = async () => {

        //Si no existe un cliSelect en localStorage, significa que no estamos en la vista clientes, estamos en la vista generica.        
        const dataForm = new FormData();

        if (tipoAcceso == 'generico') {
            dataForm.append("idCliente", 0);
        };

        if (tipoAcceso == 'cliente') {
            dataForm.append("idCliente", localStorage.getItem("cliSelect"));
        };


        const requestOptions = {
            method: 'POST',
            body: dataForm
        };
        const data = await fetch(`${URL}campos-lotes-master.php`, requestOptions);
        const jsonData = await data.json();

        // Validacion clientes que no poseen ningun lote, al acceder a este modulo, desde modulo_vistaCliente.
        let indexSinCampo = jsonData?.findIndex((campo) => campo.key === 0);
        if (!jsonData[indexSinCampo].lotes && !jsonData[0].lotes) {
            //console.log('Cliente sin lotes')
            setClienteSinLotes(true);
            setLoading(false);
            setDatosFiltrados([]);
            return
        };

        // Validacion si solo posee asignados, quitar seccion 'lotes sin asignar'
        if (!jsonData[indexSinCampo].lotes) {
            jsonData.splice(indexSinCampo, 1)
            // console.log('json data restante', jsonData)
        };


        setTableDataCampos(jsonData);

        // Formato de data inicial: 10 primeros campos con sus lotes, en caso de lotes sin asig solo 5 primeros lotes.
        //handlePageChangeCampos(currentPage);
        await paginarCamposLotes(jsonData);

        setLoading(false);
    };

    const fetchDataHistorialLote = async () => {
        const data = await fetch(`${URL}cam_historialLote.php`);
        const jsonData = await data.json();
        setHistorialLotes(jsonData);
        //console.log(jsonData)
    };

    const fetchIsAdmin = async () => {
        const dataForm = new FormData();

        dataForm.append("idU", idU);

        const requestOptions = {
            method: 'POST',
            body: dataForm
        };

        const data = await fetch(`${URL}cam_isAdmin.php`, requestOptions);
        const jsonData = await data.json();
        setIsAdmin(jsonData);
        // console.log(jsonData);
    };


    const columnsCampos = [
        {
            title: "CUENTA",
            //dataIndex: "nombreCliente",
            key: "nombreCliente",
            align: "left",
            // sorter: {
            //     compare: (a, b) => a.nombreCliente?.localeCompare(b.nombreCliente),
            // },
            onFilter: (value, fila) => {
                // Logica filtrado para lotes sin campo asignado.
                if (fila.key === 0) {
                    fila = { ...fila, 'nombreCampo': 'Sin campo', 'nombreCliente': 'Lotes sin asignar' }
                }
                return String(fila.nombreCliente).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(fila.nombreCampo).toUpperCase().trim().includes(value.toUpperCase().trim())
            },
            filteredValue: [searchedTextCampo],
            render: (fila) => {
                return (
                    <>
                        {fila.nombreCliente ? fila.nombreCliente : 'Sin campo'}
                    </>
                );
            },
        },
        {
            title: "NOMBRE",
            //dataIndex: "nombre",
            key: "nombreCampo",
            align: "left",
            render: (fila) => {
                return (
                    <>
                        {fila.nombreCampo ?
                            <Link className="icon-color" onClick={() => seleccionarCampo(fila, 'verDetalle')} >{fila.nombreCampo}</Link>
                            :
                            <Link className="icon-color" onClick={() => seleccionarCampo(fila, 'verDetalle')} >Lotes sin asignar</Link>
                        }
                    </>
                );
            },
            // sorter: {
            //     compare: (a, b) => a.nombreCampo?.localeCompare(b.nombreCampo),
            // }
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
                        {fila.key !== 0 ?
                            <div className="btn-contenedor">
                                <EditOutlined className="icon-color" onClick={() => seleccionarCampo(fila, 'editar')} />
                            </div> :
                            ''
                        }
                    </>
                );
            },
        }
    ];

    //Asigna el valor de la fila
    const seleccionarCampo = (fila, accion) => {

        setMostrarCardHistorial(false); //Card historial se oculta en cualquier otro caso.

        if (fila.key === 0) {
            setSwitchValue('LOTES');
            setZoomMapa(10);
            setCampo(fila);

            setIdCampoS(0);

            setUbicacionCampo(JSON.parse(fila.lotes[0].geojson)); //dibujamos campo (no editable).
            setUbicacionMapa(JSON.parse(fila.lotes[0].geojson));
            //setReloadMap(!reloadMap);
            return
        };

        if (accion === 'crear') {
            setUbicacionCampo(undefined); //Al cerrar el ABM de Lote, que se dirija a la posicion general de cliente a traves de sus parametros, no la del campo seleccionado en el select(dibujo).
            setUbicacionLote(undefined); //Elimina el dibujo del lote de solo visualizacion.
            setSwitchValue('NINGUNO');
            setMostrarABMCampo(true);
            setNuevoCampoLabel(true);
            setMostrarABMLote(false);
            setMostrarCampoSelec(false);
            setCampo(0); //Si entro por el crear, seteo un 0, para pisar la posible data que puede tener campo, si antes presionamos editar un campo y luego presionamos crear.
            setReloadMap(!reloadMap);
            setPolygonEdit(true); //habilita herramientas dibujar area.
            setAreaEditar(0); //elimino el area que se pudo seleccionar previo a crear una nueva.
            setAreaMapa(undefined); //Limpio el area seleccionada mapa.
        };
        if (accion === 'editar') {
            setSwitchValue('NINGUNO')
            setMostrarABMCampo(true);
            setNuevoCampoLabel(false);
            setCampo(fila);

            setAreaEditar(geojsonFormater(fila));
            setReloadMap(!reloadMap);

            if (!datosFiltrados) setDatosFiltrados(tableDataCampos);

            setPolygonEdit(false); //deshabilita herramientas dibujar area.

        };
        if (accion === 'verDetalle') {
            setMostrarCampoSelec(true);
            setSwitchValue('LOTES');
            setCampo(fila);
            setUbicacionCampo(JSON.parse(fila.geojson)); //dibujamos campo (no editable).

            setUbicacionMapa(JSON.parse(fila.geojson));
            setZoomMapa(14);
            setIdCampoS(fila?.key);
            setReloadMap(!reloadMap);
        };
    };


    //Lotes
    const columnsLotes = [
        {
            title: "CUENTA",
            dataIndex: "nombreCliente",
            key: "nombreCliente",
            align: "left",
            // sorter: {
            //     compare: (a, b) => a.nombreCliente?.localeCompare(b.nombreCliente),
            // },
            //defaultSortOrder: 'ascend',
            ellipsis: true,
            onFilter: (value, fila) => {
                return String(fila.nombreCliente).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(fila.nombreLote).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
                    String(fila.has).toUpperCase().trim().includes(value.toUpperCase().trim());
            },
            filteredValue: [searchedTextLote],
            width: 200,
        },
        {
            title: "NOMBRE",
            dataIndex: "nombreLote",
            key: "nombreLote",
            // sorter: {
            //     compare: (a, b) => a.nombreLote?.localeCompare(b.nombreLote),
            // },
            // onFilter: (value, fila) => {
            //     return String(fila.nombreLote).toUpperCase().trim().includes(value.toUpperCase().trim()) ||
            //         String(fila.has).toUpperCase().trim().includes(value.toUpperCase().trim())
            // },
            // filteredValue: [searchedTextCampo],
            ellipsis: true,
            width: 200,
        },
        {
            title: "HAS.",
            dataIndex: "has",
            key: "has",
            align: "left",
            // sorter: {
            //     compare: (a, b) => a.has - b.has,
            // },
            width: 60,
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
                        {fila.condicion === '2' && <Tag color="error">ALQUILADO</Tag>}
                        {fila.condicion === null && <Tag color="default">LIMPIAR DE BD</Tag>} {/*salva el error de los lotes sin campo registrados desde antes de este modulo. Dichos lotes NO estan registrados en tabla agro_lotesxsocio, deben eliminarse de la bd, ya que no se puede modificar su condicion*/}

                        {fila.geojson === null || fila.geojson === '' && <Tag color="default">SIN GEOJSON</Tag>}
                    </>
                );
            },
            width: 100,
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
                            <PaperClipOutlined className="icon-color" onClick={() => handleUploadClick(fila)} title="Archivos" />
                            {!historialLotes?.find((loteh) => loteh.idLote === fila?.key) && isAdmin.isAdmin ?
                                <Popconfirm
                                    title={
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                width: 250,
                                                gap: 4,
                                            }}
                                        >
                                            <label>¿Deseas eliminar '{fila.nombreLote}'?</label>
                                        </div>
                                    }
                                    okText="Eliminar"
                                    cancelText="Cerrar"
                                    onConfirm={() => eliminarLote(fila)}
                                    onCancel={() => setUbicacionLote(undefined)}
                                    placement="left"
                                >
                                    <Button type="link" style={{ padding: "0px", margin: "0px" }}>
                                        <DeleteOutlined style={{ color: "red" }} onClick={() => seleccionarLote(fila, 'eliminar')} />
                                    </Button>
                                </Popconfirm> : ''}
                        </div>
                    </>
                );
            },
            width: 60,
        }
    ];


    const handleFiltroCampos = (value, paginaActual) => {

        //console.log('handleFiltroCampos', value)

        if (value.trim() !== '') {
            const datosFiltrados = tableDataCampos.filter(item => {
                if (item.key === 0) {
                    item = { ...item, 'nombreCampo': 'Sin campo', 'nombreCliente': 'Lotes sin asignar' }
                }
                // Lógica de filtrado
                const nombreCliente = String(item.nombreCliente).toUpperCase().trim();
                const nombreCampo = String(item.nombreCampo).toUpperCase().trim();
                const filtro = value.toUpperCase().trim();

                return nombreCliente.includes(filtro) || nombreCampo.includes(filtro);
            });
            // console.log('filtro campo buscado', datosFiltrados)
            handlePageChangeCampos(paginaActual, datosFiltrados, value);
            setDatosFilterResult(datosFiltrados);
        }
        else {
            setDatosFilterResult([]);
            //paginarCamposLotes(tableDataCampos);
            handlePageChangeCampos(1);
        }

        setReloadMap(!reloadMap);
    };


    const handleFiltroLotes = (value) => {

        if (value.trim() !== '') {
            const datosFiltrados = tableDataCampos.map(campo => {
                if (campo.lotes) {
                    const lotesFiltrados = campo.lotes.filter(lote => {
                        // Filtrar por propiedades del lote
                        const nombreCliente = String(lote.nombreCliente).toUpperCase().trim();
                        const nombreLote = String(lote.nombreLote).toUpperCase().trim();
                        const has = String(lote.has).toUpperCase().trim();
                        const filtro = value.toUpperCase().trim();

                        return nombreLote.includes(filtro) || has.includes(filtro) || nombreCliente.includes(filtro);
                    });

                    // Devolver el campo solo si tiene lotes que coincidan con el filtro
                    if (lotesFiltrados.length > 0) {
                        return { ...campo, lotes: lotesFiltrados };
                    }
                }
                // Devolver null para los campos sin lotes filtrados
                return null;
            }).filter(campo => campo !== null); // Filtrar los campos nulos, es decir, aquellos sin lotes filtrados

            //console.log('filtro lote buscado', datosFiltrados)

            // Validacion: si la busqueda arroja coincidencias, que asigne dicha data a la tabla campos con los lotes filtrados, en caso de NO arrojar coincidencias setear valor 1, para en el componente Table de campos, validar y no mostrar data en dicha tabla cuando no existe coincidencia de lote.
            if (datosFiltrados.length > 0) {
                setFiltroLoteNoResult(false);
            }else {
                setFiltroLoteNoResult(true);
            }

            setDatosFiltrados(datosFiltrados);
            setDatosFilterResult(datosFiltrados); // Para afectar visualmente a la tabla campos, y que muestre los campos y lotes no asigandos, que coincidan con la busqueda de lote, se debe asigar un valor a este state.

        } else {

            setFiltroLoteNoResult(false);
            setDatosFilterResult([]);
            //paginarCamposLotes(tableDataCampos);
            handlePageChangeCampos(currentPage);
        };

        setReloadMap(!reloadMap);
    };


    const eliminarLote = async (lote) => {
        //console.log('lote a eliminar', lote)

        const data = new FormData();
        data.append("alote_id", lote.key);

        const requestOptions = {
            method: 'POST',
            body: data
        };
        const response = await fetch(`${URL}cam_eliminarLote.php`, requestOptions);
        console.log(response);
        setGuardar(!guardar);
        setReloadMap(!reloadMap);
        setUbicacionLote(undefined);
        //if (!datosFiltrados) setDatosFiltrados(tableDataCampos);
    };



    //Asigna el valor de la fila al presionar editar
    const seleccionarLote = (fila, accion) => {
        //console.log(fila)
        setMostrarCardHistorial(false); //Card historial se oculta en cualquier otro caso

        if (accion === 'crear') {
            setUbicacionCampo(undefined); //Al cerrar el ABM de Lote, que se dirija a la posicion general de cliente a traves de sus parametros, no la del campo seleccionado en el select(dibujo).
            setUbicacionLote(undefined); //Elimina el dibujo del lote de solo visualizacion.
            setCampo(undefined);
            setSwitchValue('NINGUNO');
            setMostrarABMLote(true);
            setNuevoLoteLabel(true);
            setMostrarABMCampo(false);
            setMostrarCampoSelec(false);
            setLote(0);

            setReloadMap(!reloadMap);
            setPolygonEdit(true); //habilita herramientas dibujar area.
            setAreaEditar(0); //elimino el area que se pudo seleccionar previo a crear una nueva.
            setAreaMapa(undefined); //Limpio el area seleccionada mapa.
            return
        };
        if (accion === 'editar') {
            setSwitchValue('NINGUNO')
            setMostrarABMLote(true);
            setNuevoLoteLabel(false);
            setLote(fila);
            setUbicacionLote(undefined); //PRUEBA

            setAreaEditar(geojsonFormater(fila));
            //setReloadMap(!reloadMap);

            //setUbicacionLote(undefined); //Elimina el dibujo del lote de solo visualizacion.
            setPolygonEdit(false); //deshabilita herramientas dibujar area.

        };
        if (accion === 'verDetalle') {
            setLote(fila);
            setMostrarCardHistorial(true);

            setUbicacionMapa(JSON.parse(fila.geojson));
            setZoomMapa(14);

            setUbicacionLote(JSON.parse(fila.geojson))
            setReloadMap(!reloadMap);
        };
        if (accion === 'eliminar') {
            //console.log('eliminar lote')
            setLote(fila);
            setUbicacionMapa(JSON.parse(fila.geojson));
            setZoomMapa(14);
            setUbicacionLote(JSON.parse(fila.geojson))
        };
    };



    //Switch
    const selectedOption = (e) => {
        setUbicacionCampo(undefined); //Al cerrar el ABM de Lote, que se dirija a la posicion general de cliente a traves de sus parametros, no la del campo seleccionado en el select(dibujo).
        setUbicacionLote(undefined); //Elimina el dibujo del lote de solo visualizacion.


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
            setZoomMapa(10);

        };
        if (e === 'LOTES') {
            setSwitchValue('LOTES');
            //Si entra en esta seccion, significa que el usuario quiere ver los lotes sin Campo(0)
            // const campoSeleccionado = tableDataCampos.find((campo) => campo.key === 0);
            // setTableDataLotes(campoSeleccionado.lotes);
            setCampo(0)
        };
    };

    const closeABMLote = () => {

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
            if (tipo === 'campo') selectedOption('CAMPOS'); //setCurrentPage(1);
            if (tipo === 'lote') closeABMLote();
            //if (!datosFiltrados) setDatosFiltrados(tableDataCampos);
            setGuardar(!guardar);
            //setReloadMap(!reloadMap);
        }

    };

    const reloadDataLotes = () => {

        const idCampo = campo?.key //? campo?.key : 0;

        const campoSeleccionado = tableDataCampos?.find((campoSelect) => campoSelect.key === idCampo);
        //console.log('campoSeleccionado', campoSeleccionado)
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
            align: "center"
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
            // render: (fechasiembra, fila) => (
            //   <Typography.Text style={{ fontSize: "14px" }}>
            //     {fechasiembra}
            //   </Typography.Text>
            // )
        },
        {
            title: "ANTERIOR",
            dataIndex: "cultivoA",
            key: "cultivoA",
            align: "center"
        },
        {
            title: "RINDE EST.",
            dataIndex: "rindeest",
            key: "rindeest",
            align: "center"
        },
        {
            title: "COSTO EST.",
            dataIndex: "costoest",
            key: "costoest",
            align: "center"
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

    const loadingIcon = (
        <LoadingOutlined
            style={{
                fontSize: 40
            }}
            spin
        />
    );

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const handleSearchMap = async (e) => {
        setLoadingSearch(true);

        try {
            const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${e}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`);
            const data = await response.json();
            // console.log(data);

            setOptionsLugar(data.features.map((location) => ({
                value: location?.id,
                label: removeAccents(location?.place_name),
                key: location?.id,
                center: location?.center
            })));

            setLoadingSearch(false);

        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    const handleSelectCity = (result, option) => {
        setCoordinates(option.center);
        setReloadMap(!reloadMap);
    };

    const handleUploadClick = (fila) => {
        // console.log('fila upload ', fila)
        setDrawerUpload(true);
        setModori(4); // lotes = 4
        setFilterDrawer(4); // lotes = 4
        setGenerico(Number(fila.key)); // idLote
        setCliLote(fila.idCliente)
    };

    const handlePageChangeCampos = async (page, data, searchedText) => {

        setCurrentPage(page);
        // Calcular el índice de inicio y fin de los datos
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;

        // Pagina los datos (pagina segun haya o no un filtro, si no hay filtro, paginara sobre la totalidad de la data. Si hay filtro pagina sobre la data resultante de aplicar el filtro campos o lotes).

        let newData = [];

        if (searchedText || data?.length > 0) { //Existe filtro
            
            if (data?.length > 0) {
                // console.log('SI existe filtro con datos')
                newData = data?.slice(startIndex, endIndex);
            } else { 
                // console.log('SI existe filtro pero no arroja datos')
                newData = [];
            }
            
        } else { // No existe filtro
            // console.log('NO existe filtro')
            newData = tableDataCampos.slice(startIndex, endIndex);
        }

        paginarCamposLotes(newData);
        // console.log('newDataCampos', newData)
    };

    const handlePageChangeLotes = (page) => {

        // Calcular el índice de inicio y fin de los datos
        const startIndex = (page - 1) * 5;
        const endIndex = startIndex + 5;

        // Filtrar los lotes según la página actual (muestra de 5 en 5)
        const newData = tableDataLotes.slice(startIndex, endIndex);
        if (idCampoS !== 0) {

            return
        };

        setDatosFiltrados(prev => {
            let array = [...prev];
            let indexSinCampo = array?.findIndex((campo) => campo.key === 0);
            array[indexSinCampo].lotes = newData;
            return array
        });
    };


    const paginarCamposLotes = async (jsonData) => {

        // Formato de data inicial: 10 primeros campos con sus lotes (slice en json data desde la carga inicial), en caso de lotes sin asig solo 5 primeros lotes.
        // Para el resto del ciclo de vida del componente siempre se mostraran de a 5 lotes en 'lotes sin asignar', para evitar sobrecarga del mapa.

        const jsonDataCopy = structuredClone(jsonData);

        // Ordenar lotes por cuenta
        // jsonDataCopy.forEach(campo => {

        //     campo.lotes?.sort((a, b) => {
        //         const nombreA = a.nombreCliente?.toUpperCase();
        //         const nombreB = b.nombreCliente?.toUpperCase();

        //         if (nombreA < nombreB) {
        //             return -1;
        //         }
        //         if (nombreA > nombreB) {
        //             return 1;
        //         }
        //         return 0; // Son iguales
        //     });
        // });


        // Limita a dibujar solo los 5 primeros lotes no asignados
        const lotesNoAsig = jsonDataCopy.find(item => item.key === 0);
        // console.log('lotes no asig 0', lotesNoAsig)
        if (lotesNoAsig?.lotes) {
            const primerosDiezLotes = lotesNoAsig ? lotesNoAsig.lotes.slice(0, 5) : [];
            const indexLotesNoAsig = jsonDataCopy.findIndex(item => item.key === 0);
            jsonDataCopy[indexLotesNoAsig].lotes = primerosDiezLotes;
        };

        setDatosFiltrados(jsonDataCopy.slice(0, 10));

    };

    // console.log('datosFilterResult', datosFilterResult)
    // console.log('datosFiltrados', datosFiltrados)
    // console.log('filtroLoteNoResult', filtroLoteNoResult)

    return (
        <div className={loading ? "loading-spin" : "tabla-main-wrapper"}>

            {clienteSinLotes ? <Row style={{ paddingTop: "20px", display: "flex", justifyContent: "center"}}>
                <Col xs={12} sm={12} md={12}>
                    <Alert message="Este cliente no tiene lotes asignados. Si desea agregar un nuevo lote para este cliente, por favor ingrese al módulo 'Campos y Lotes' desde el menú." type="info" showIcon />
                </Col>

            </Row> :

                loading ? <Spin spinning={true} indicator={loadingIcon} tip="Cargando" size="large"><div style={{ color: 'transparent' }}>Cargando...</div></Spin> :
                    <>
                        <h3 className="titulo-modulo" >CAMPOS</h3>

                        <Row>
                            <Col xs={24} sm={12} md={12} className="filtros-contenedor">


                                <Segmented className="custom-switch" block options={[
                                    {
                                        label: (
                                            <div className='parent'>
                                                <div style={{ paddingRight: "3px" }} className="child">CAMPOS</div>
                                                <div className="child">({tableDataCampos?.filter((campo) => campo.key !== 0).length > 0 ? tableDataCampos?.filter((campo) => campo.key !== 0).length : 0})</div>
                                            </div>
                                        ),
                                        value: 'CAMPOS',
                                    },
                                    {
                                        label: (
                                            <div className='parent'>
                                                <div style={{ paddingRight: "3px" }} className="child">LOTES</div>
                                                <div className="child">({tableDataLotes?.length > 0 ? tableDataLotes?.length : 0})</div>
                                            </div>
                                        ),
                                        value: 'LOTES',
                                    }
                                ]}
                                    onChange={selectedOption} value={switchValue} />

                                {switchValue === 'CAMPOS' ? <Popover open={open} title={
                                    <div
                                        style={{
                                            display: "flex",
                                            //flexDirection: "column",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            width: 250,
                                            gap: 4,
                                            marginBottom: "0"
                                        }}
                                    >
                                        <label>Filtrar por:</label>
                                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                            <Button onClick={() => {
                                                setFilter(0); setOpen(false); setSearchedTextLote('');
                                            }}>
                                                Campos</Button>
                                            o
                                            <Button onClick={() => {
                                                setFilter(1); setOpen(false); setSearchedTextCampo('');
                                            }}>
                                                Lotes</Button>
                                        </div>
                                    </div>
                                } trigger="click" >
                                    <Button onClick={() => setOpen(!open)} icon={<FilterOutlined title="Filtro" />} />
                                </Popover> : ''}



                                {filter === 0 && switchValue === 'CAMPOS' ?
                                    <Tooltip title="Buscar por cuenta o nombre." placement="top" >
                                        <>
                                            <Search
                                                placeholder="Buscar campos..." className="buscador filtro-camposlotes-animation"
                                                defaultValue={searchedTextCampo}
                                                onChange={(e) => {
                                                    if (e.target.value.trim() === '') {
                                                        // console.log('EJECUTA EVENTO VACIO CAMPO')
                                                        handleFiltroCampos('', 1);
                                                        setSearchedTextCampo('');
                                                    }

                                                }}
                                                onSearch={(value) => {
                                                    // console.log('VALOR SEARCH CAMPOS:', value);
                                                    setMostrarCardHistorial(false);
                                                    setUbicacionLote(undefined);
                                                    handleFiltroCampos(value.trim(), 1);
                                                    setSearchedTextCampo(value.trim());
                                                }}
                                            />
                                        </>
                                    </Tooltip>
                                    : ''}
                                {filter === 1 && switchValue === 'CAMPOS' ?
                                    <Tooltip title="Buscar por cuenta, nombre o has." placement="top" >
                                        <>
                                            <Search
                                                placeholder="Buscar lotes..." className="buscador filtro-camposlotes-animation"
                                                defaultValue={searchedTextLote}
                                                onChange={(e) => {
                                                    if (e.target.value.trim() === '') {
                                                        // console.log('EJECUTA EVENTO VACIO')
                                                        handleFiltroLotes('');
                                                        setSearchedTextLote('');
                                                    }

                                                }}
                                                onSearch={(value) => {
                                                    // console.log('VALOR SEARCH LOTES:', value);
                                                    // setMostrarCardHistorial(false);
                                                    // setUbicacionLote(undefined);
                                                    handleFiltroLotes(value.trim());
                                                    setSearchedTextLote(value.trim());
                                                }}
                                            />
                                        </>
                                    </Tooltip>
                                    : ''}
                            </Col>
                            <Col xs={24} sm={12} md={12} className="btn-agregar-contenedor">

                                <Select
                                    showSearch
                                    className="buscador"
                                    placeholder="Buscar lugares o direcciones..."
                                    optionFilterProp="children"
                                    filterOption={(input, option) => (option?.label?.toUpperCase().trim() ?? '').includes(input.toUpperCase().trim())}
                                    onSearch={(e) => { handleSearchMap(e) }}
                                    name="idLugar"
                                    id="idLugarSelect"
                                    loading={loadingSearch}
                                    onSelect={handleSelectCity}
                                    options={optionsLugar}
                                />

                                <Button type="primary" className="btn-agregar" onClick={() => seleccionarCampo('btnNuevoCampo', 'crear')}>NUEVO CAMPO</Button>
                                <Button type="primary" className="btn-agregar" onClick={() => seleccionarLote('btnNuevoLote', 'crear')}>NUEVO LOTE</Button>

                            </Col>
                        </Row>
                        {/* aca podemos probar con un Space para separar tabla y mapa */}

                        <Row className="tabla-mapa-contenedor" style={{ paddingBottom: "8px", paddingTop: "8px" }}>

                            <Col xs={24} sm={24} md={12} style={{ paddingRight: "8px" }}>

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



                                {switchValue === 'LOTES' & campo?.key === 0 ? <Card
                                    title="Lotes sin campo asignado"
                                    bordered={true}
                                    bodyStyle={{ padding: '0px' }}
                                    extra={<ArrowLeftOutlined onClick={() => selectedOption('CAMPOS')} />}
                                >
                                </Card> : ''}



                                {switchValue === 'CAMPOS' ? <Table
                                    className={mostrarCampoSelec === false && "tabla-campos-switch-animation"}
                                    size={"small"}
                                    //dataSource={datosFiltrados ? datosFiltrados : tableDataCampos} Original previo.

                                    // Si hay datos filtrados, que los tome, sino que agarre la data completa. Esta logica esta solo relacionada al filtro lotes.
                                    dataSource={filtroLoteNoResult ? [] : datosFilterResult && datosFilterResult?.length > 0 ? datosFilterResult : tableDataCampos}
                                    columns={columnsCampos}
                                    pagination={{
                                        position: ["none", "bottomRight"],
                                        showSizeChanger: false,
                                        onChange: (page) => handlePageChangeCampos(page, datosFilterResult), // Función de cambio de página
                                        current: currentPage
                                    }}
                                /> : ''}

                                {switchValue === 'LOTES' ? <Table
                                    className={mostrarCampoSelec & switchValue === 'LOTES' ? "tabla-lotes-link-animation" : "tabla-lotes-switch-animation"}
                                    size={"small"}
                                    dataSource={tableDataLotes}
                                    columns={columnsLotes}
                                    pagination={{
                                        position: ["none", "bottomRight"],
                                        showSizeChanger: false,
                                        defaultPageSize: 5,
                                        onChange: handlePageChangeLotes // Función de cambio de página
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


                            <Col xs={24} sm={24} md={12} style={{ paddingLeft: "8px" }}>
                                <Mapa editarArea={areaEditar} dataCamposLotes={tableDataCampos} editarLoteValues={lote} editarCampoValues={campo} switchValue={switchValue} mostrarCampoSelec={mostrarCampoSelec} datosFiltrados={datosFiltrados} coordinates={coordinates} setCoordinates={setCoordinates} />

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
                                        bodyStyle={{ padding: '0px 8px' }}
                                        headStyle={{ padding: '0px 8px' }}

                                    >

                                        <Row>
                                            <Col xs={24} sm={24} md={24} >

                                                <Table
                                                    id="tablaHistorial"
                                                    size='small'
                                                    dataSource={historialLotes?.filter((loteh) => loteh.idLote === lote?.key)}
                                                    columns={columnsHistorialLote}
                                                    pagination={{
                                                        position: ["none", "bottomRight"],
                                                        showSizeChanger: false,
                                                        defaultPageSize: 2,
                                                        size: "small",
                                                        style: { margin: "2px 0px 2px 0px" }
                                                    }}
                                                />

                                            </Col>
                                        </Row>

                                    </Card>
                                </div> : ''}

                                <div style={{ position: "absolute", left: 20, top: 10, backdropFilter: "blur(10px)", padding: "4px", borderRadius: "4px", display: "flex" }} className="texto-con-borde">
                                    <div className="cuadrado-verde"></div> <b style={{ paddingLeft: "4px", paddingRight: "20px" }}> Campo</b>
                                    <div className="cuadrado-celeste"></div> <b style={{ paddingLeft: "4px", paddingRight: "20px" }}> Lote</b>
                                    <div className="cuadrado-rojo"></div> <b style={{ paddingLeft: "4px" }}> Lote sin asignar</b>
                                </div>

                            </Col>

                        </Row>
                    </>
            }


            {/* Drawer subir archivos */}
            <DrawerUploads setDrawerUpload={setDrawerUpload} drawerUpload={drawerUpload} modori={modori} filter={filterDrawer} usu={idU} generico={generico} idCliente={cliLote} />

        </div>
    )
}

export default () => (
    <App>
        <TablaCampos />
    </App>
);