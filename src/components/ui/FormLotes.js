import React, { useContext, useRef, useEffect, useState } from "react";
import {
    Button,
    Form,
    Input,
    Select,
    Row,
    Col,
} from "antd";
import FormItem from "antd/es/form/FormItem";
import { Upload } from 'antd';
import { GlobalContext } from "../context/GlobalContext";
import './FormLotes.css';
import ImportKML from "./ImportKML";

function FormLotes({ editarLoteValues, cancelar, notificacion, dataCampos }) {

    const URL = process.env.REACT_APP_URL;
    const formRef = useRef(null);
    const { Dragger } = Upload;
    const { geojson, setGeojson, areaMapa, reloadMap, setReloadMap, setUbicacionCampo, setIdCampoS } = useContext(GlobalContext);
    const idUserLogged = localStorage.getItem("usuario");
    const [dataClientes, setDataClientes] = useState([]);
    const [optionsCampos, setoptionsCampos] = useState();
    const [lote, setLote] = useState({
        nombreLote: "",
        has: "",
        idCondicion: "",
        idCampo: "",
        idCliente: ""
    });


    const fetchDataClientesxUser = async () => {
        const dataForm = new FormData();
        dataForm.append("idU", idUserLogged);

        const requestOptions = {
            method: 'POST',
            body: dataForm
        };
        const data = await fetch(`${URL}selectClientesxUser.php`, requestOptions);
        const jsonData = await data.json();
        setDataClientes(jsonData);
    }


    useEffect(() => {

        if (editarLoteValues && editarLoteValues !== 0) {
            formRef.current.setFieldsValue({
                nombreLote: editarLoteValues.nombreLote,
                has: editarLoteValues.has,
                idCondicion: Number(editarLoteValues.condicion),
                idCampo: editarLoteValues.idCampo,
                idCliente: editarLoteValues.idCliente,
            });
            //Seteamos el geojson que viene en el Lote a modificar
            setGeojson(editarLoteValues.geojson);

            //seteo el geojson del Campo asignado al Lote a modificar

            if ( editarLoteValues.idCampo > 0) { //Siempre y cuando no sea 'SIN CAMPO'
                const ubiCampo = dataCampos?.find((campo) => campo.key === editarLoteValues.idCampo);
                setUbicacionCampo(JSON.parse(ubiCampo.geojson))
                setIdCampoS(editarLoteValues.idCampo)
                setReloadMap(!reloadMap);
            }
        }

        //Si estamos creando nuevo lote, por defecto Campo: sin campo, Condicion:propio
        if (editarLoteValues === 0) {

            document.getElementById("formLotes").reset();
            formRef.current.setFieldsValue({
                idCampo: "0",
                idCondicion: 1
            });
            setLote(prev => ({ ...prev, idCampo: 0, idCondicion: 1 }))

            //El geojson del lote se limpia
            setGeojson(undefined);
        }

        fetchOptionsCampo();
        fetchDataClientesxUser();

    }, [editarLoteValues]);

    const fetchOptionsCampo = async () => {
        const data = await fetch(`${URL}selectCampos.php`);
        const jsonData = await data.json();
        setoptionsCampos(jsonData);
    };


    const crearLote = async () => {

        const data = new FormData();
        data.append("nombreLote", lote.nombreLote);
        data.append("has", lote.has);
        data.append("geojson", geojson);
        data.append("idCampo", lote.idCampo);

        data.append("idCondicion", lote.idCondicion);
        data.append("idCliente", lote.idCliente);



        if (!geojson) {
            console.log('Debe marcar el area del lote.')
            notificacion(true, 'lote');
            return;
        }

        const requestOptions = {
            method: 'POST',
            body: data
        };
        const response = await fetch(`${URL}cam_crearLote.php`, requestOptions);
        console.log(response);
        notificacion(undefined, 'lote');
    };


    //Funcion que MODIFICA lote
    const editarLote = async (values) => {

        const data = new FormData();
        data.append("idLote", editarLoteValues.key);

        data.append("nombreLote", values.nombreLote);
        data.append("has", values.has);
        data.append("geojson", geojson);
        data.append("idCampo", values.idCampo);

        data.append("idCondicion", values.idCondicion);
        data.append("idCliente", values.idCliente);

        const requestOptions = {
            method: 'POST',
            body: data
        };
        const response = await fetch(`${URL}cam_editarLote.php`, requestOptions);
        console.log(response);
        notificacion(undefined, 'lote');

    };

    const optionsCondicion = [
        {
            value: 1,
            label: 'Propio'
        },
        {
            value: 0,
            label: 'Alquilado'
        }
    ];

    const handleChange = (e) => {

        setLote(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const optionsCliente = dataClientes.map((cliente) => ({
        value: cliente.cli_id,
        label: cliente.cli_nombre,
    }));

    const handleChangeCampo = (e) => {

        setLote(prev => ({ ...prev, idCampo: e }));

        if (e > 0) { //Siempre y cuando no sea 'SIN CAMPO'
            const ubiCampo = dataCampos?.find((campo) => campo.key === e);
            setUbicacionCampo(JSON.parse(ubiCampo.geojson))
            setIdCampoS(e)
            setReloadMap(!reloadMap);
        }else{ //en caso de ser 0 la seleccion (sin campo), limpiamos el mapa.
            setUbicacionCampo(undefined)
            setIdCampoS(undefined)
            setReloadMap(!reloadMap);
        }

    };

    
    return (
        <>
            <Form
                layout="vertical"
                ref={formRef}
                onFinish={editarLoteValues ? editarLote : crearLote}
                autoComplete="off"
                id="formLotes"
            >

                <Row style={{ display: "flex", justifyContent: "space-between" }}>

                    <Col xs={24} sm={24} md={11}>
                        <FormItem name="nombreLote" label="Nombre"
                            hasFeedback
                            rules={[{
                                required: true,
                                // message: "Ingrese nombre/s válidos",
                                // pattern: new RegExp("^([ \u00c0-\u01ffa-zA-Z'])+$")
                            }]}>
                            <Input name="nombreLote" onChange={handleChange} />
                        </FormItem>
                    </Col>

                    <Col xs={24} sm={24} md={11}>

                        <FormItem name="has" label="Has."
                            hasFeedback
                            rules={[
                                {
                                    required: false,
                                    message: "Ingrese solo numeros",
                                    pattern: "^[0-9,$]*$"
                                }
                            ]}>

                            <Input name="has" onChange={handleChange} />

                        </FormItem>
                        {lote.has !== areaMapa & areaMapa > 0 & lote.has > 0 ? <div style={{ color: "orange", marginTop: "-23px" }}>Las has.: introducida y calculada, no coinciden (puede guardar igualmente).</div> : ''}
                    </Col>


                </Row>


                <Row style={{ display: "flex", justifyContent: "space-between" }}>
                    <Col xs={24} sm={24} md={11}>
                        <FormItem name="idCondicion" label="Condición"
                            hasFeedback
                            rules={[{
                                required: true,
                                message: "Seleccione condición"
                            }]}>
                            <Select
                                showSearch
                                // className='input-style-lote'
                                placeholder="Selecciona condición"
                                optionFilterProp="children"
                                filterOption={(input, option) => (option?.label ?? '').includes(input.toUpperCase().trim())}
                                options={optionsCondicion}
                                onChange={(e) => setLote(prev => ({ ...prev, idCondicion: e }))}
                                name="idCondicion"
                            />
                        </FormItem>
                    </Col>

                    <Col xs={24} sm={24} md={11}>
                        <FormItem name="idCampo" label="Campo"
                            hasFeedback
                            rules={[{
                                required: true,
                                message: "Seleccione campo"
                            }]}>
                            <Select
                                showSearch
                                // className='input-style-lote'
                                placeholder="Selecciona campo"
                                optionFilterProp="children"
                                filterOption={(input, option) => (option?.label ?? '').includes(input.toUpperCase().trim())}
                                options={optionsCampos}
                                onChange={handleChangeCampo}
                                name="idCampo"
                            />
                        </FormItem>
                    </Col>





                </Row>

                <Row>

                    <Col xs={24} sm={24} md={24}>
                        <FormItem name="idCliente" label="Cliente"
                            hasFeedback
                            rules={[{
                                required: true,
                                message: "Seleccione un cliente"
                            }]}>
                            <Select
                                showSearch
                                className='input-style'
                                placeholder="Selecciona un cliente"
                                optionFilterProp="children"
                                filterOption={(input, option) => (option?.label ?? '').includes(input.toUpperCase().trim())}
                                options={[...optionsCliente]}
                                onChange={(e) => setLote(prev => ({ ...prev, idCliente: e }))}
                                name="idCliente"
                            />
                        </FormItem>
                    </Col>
                </Row>



                {!editarLoteValues ? <ImportKML /> : ''}




                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <Button
                        //type="primary"
                        onClick={() => cancelar()}
                        className='btn-guardar-formLote'
                    //danger
                    >CANCELAR</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        className='btn-guardar-formLote'
                    >GUARDAR</Button>
                </div>


            </Form>
        </>
    )
}

export default FormLotes