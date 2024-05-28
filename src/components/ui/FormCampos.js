import React, { useContext, useRef, useEffect, useState } from "react";
import {
    Button,
    Form,
    Input,
    Select,
    Row,
    Col
} from "antd";
import FormItem from "antd/es/form/FormItem";
import { GlobalContext } from "../context/GlobalContext";
import './FormCampos.css';

function FormCampos({ editarCampoValues, cancelar, notificacion }) {


    const URL = process.env.REACT_APP_URL;
    const { TextArea } = Input;
    const formRef = useRef(null);
    const idUserLogged = localStorage.getItem("usuario");
    const { geojson, setGeojson } = useContext(GlobalContext);
    const [optionsPlanta, setoptionsPlanta] = useState();
    const [dataClientes, setDataClientes] = useState([]);
    const [campo, setCampo] = useState({
        nombreCampo: "",
        descripcion: "",
        idEstado: "",
        idCliente: "",

        // acopio: "",
        // kmsplanta: "",
        // idPlanta: "",
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

        if (editarCampoValues && editarCampoValues !== 0) {
            formRef.current.setFieldsValue({
                nombreCampo: editarCampoValues.nombreCampo,
                descripcion: editarCampoValues.descripcion,
                idEstado: Number(editarCampoValues.idEstado),
                idCliente: editarCampoValues.idCliente,

                // acopio: editarCampoValues.acopio,
                // kmsplanta: editarCampoValues.kmsplanta,
                // idPlanta: editarCampoValues.idPlanta,
            });
            //Seteamos el geojson que viene en el Campo a modificar
            setGeojson(editarCampoValues.geojson);
        }
        //Si estamos creando nuevo campo, Estado por defecto es activo
        if (editarCampoValues === 0) {

            document.getElementById("formCampos").reset();
            formRef.current.setFieldsValue({
                idEstado: 1
            });
            setCampo(prev => ({ ...prev, idEstado: 1 }))


            //El geojson del campo se limpia
            setGeojson(undefined);
        }

        fetchOptionsPlanta();
        fetchDataClientesxUser();

    }, [editarCampoValues]);

    const fetchOptionsPlanta = async () => {
        const data = await fetch(`${URL}selectPlantas.php`);
        const jsonData = await data.json();
        setoptionsPlanta(jsonData);
    };


    const crearCampo = async () => {

        const data = new FormData();
        data.append("nombreCampo", campo.nombreCampo);
        data.append("idEstado", campo.idEstado);
        data.append("descripcion", campo.descripcion);
        data.append("geojson", geojson);
        data.append("idCliente", campo.idCliente);

        //data.append("acopio", campo.acopio);
        //data.append("kmsplanta", campo.kmsplanta);
        //data.append("idPlanta", campo.planta);
        if (!geojson) {
            console.log('Debe marcar el area del campo.')
            notificacion(true, 'campo');
            return;
        }

        const requestOptions = {
            method: 'POST',
            body: data
        };
        const response = await fetch(`${URL}cam_crearCampo.php`, requestOptions);
        console.log(response);
        notificacion(undefined, 'campo');
    };


    //Funcion que MODIFICA campo
    const editarCampo = async (values) => {


        const data = new FormData();
        data.append("idCampo", editarCampoValues.key);
        data.append("nombreCampo", values.nombreCampo);
        data.append("idEstado", values.idEstado);
        data.append("descripcion", values.descripcion);
        data.append("idCliente", values.idCliente);
        data.append("geojson", geojson);

        //data.append("acopio", values.acopio);
        //data.append("kmsplanta", values.kmsplanta);
        //data.append("idPlanta", values.planta);

        const requestOptions = {
            method: 'POST',
            body: data
        };
        const response = await fetch(`${URL}cam_editarCampo.php`, requestOptions);
        console.log(response);
        notificacion(undefined, 'campo');
    };

    const handleChange = (e) => {
        setCampo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const optionsEstados = [
        {
            value: 1,
            label: 'Activo'
        },
        {
            value: 0,
            label: 'Inactivo'
        }
    ];

    const optionsCliente = dataClientes.map((cliente) => ({
        value: cliente.cli_id,
        label: cliente.cli_nombre,
    }));



    return (
        <>
            <Form
                layout="vertical"
                ref={formRef}
                onFinish={editarCampoValues ? editarCampo : crearCampo}
                autoComplete="off"
                id="formCampos"
            >


                <Row style={{ display: "flex", justifyContent: "space-between" }}>

                    <Col xs={24} sm={24} md={11}>
                        <FormItem name="nombreCampo" label="Nombre"
                            hasFeedback
                            rules={[{
                                required: true,
                                // message: "Ingrese nombre/s válidos",
                                // pattern: new RegExp("^([ \u00c0-\u01ffa-zA-Z'])+$")
                            }]}>
                            <Input name="nombreCampo" onChange={handleChange} />
                        </FormItem>
                    </Col>

                    <Col xs={24} sm={24} md={11}>
                        <FormItem name="idEstado" label="Estado"
                            hasFeedback
                            rules={[{
                                required: true,
                                message: "Seleccione un estado"
                            }]}>
                            <Select
                                showSearch
                                placeholder="Selecciona un estado"
                                optionFilterProp="children"
                                filterOption={(input, option) => (option?.label ?? '').includes(input)}
                                options={optionsEstados}
                                onChange={(e) => setCampo(prev => ({ ...prev, idEstado: e }))}
                                name="idEstado"
                            />
                        </FormItem>
                    </Col>





                    {/* <FormItem name="acopio" label="Cap. de Acopio"
                            hasFeedback
                            rules={[{
                                // required: true,
                                message: "Ingrese solo números",
                                pattern: "^[0-9,$]*$"
                            }]}>
                            <Input name="acopio" onChange={handleChange} className="input-style" />
                        </FormItem> */}

                    {/* <FormItem name="kmsplanta" label="KMs. a Planta"
                            hasFeedback
                            rules={[{
                                // required: true,
                                message: "Ingrese solo números",
                                pattern: "^[0-9,$]*$"
                            }]}>
                            <Input name="kmsplanta" onChange={handleChange} className="input-style" />
                        </FormItem> */}
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
                                onChange={(e) => setCampo(prev => ({ ...prev, idCliente: e }))}
                                name="idCliente"
                            />
                        </FormItem>
                    </Col>
                </Row>


                <Row style={{ display: "flex", justifyContent: "space-between" }}>

                    <Col xs={24} sm={24} md={24}>
                        <FormItem name="descripcion" label="Descripcion"
                            hasFeedback
                            rules={[{
                                required: false,
                                // message: "Ingrese una descripcion"
                            }]}>
                            <TextArea rows={4} name="descripcion" onChange={handleChange} maxLength={254} />
                        </FormItem>
                    </Col>

                </Row>


                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <Button
                        //type="primary"
                        onClick={() => cancelar('CAMPOS')}
                        className='btn-guardar-formCampo'
                        //danger
                    >CANCELAR</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        className='btn-guardar-formCampo'
                    >GUARDAR</Button>
                </div>

            </Form>
        </>
    )
}

export default FormCampos