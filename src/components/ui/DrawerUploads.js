import React, { useEffect } from "react";
import "./TablaCampos.css";

function DrawerUploads({ setDrawerUpload, drawerUpload, modori, filter, usu, generico, idCliente }) {

    const PORT = window.location.port ? window.location.port : 80;
    const PROTOCOL = window.location.protocol;
    const HOSTNAME = window.location.hostname;
    const URLDrawer = `${PROTOCOL}//${HOSTNAME}:${PORT}`;
    // console.log('URLDrawer, ',URLDrawer)
    // console.log('modori, ',modori)
    // console.log('filter, ',filter)
    // console.log('usu, ',usu)
    // console.log('generico, ',generico)
    // console.log('idCliente, ',idCliente)


    const handleCloseDrawer = () => {
        setDrawerUpload(false);
    };

    const handleMessageFromIframe = (event) => {
        if (event.data === "closeDrawer") {
            handleCloseDrawer();
        }
    };

    // Agrega el event listener para recibir mensajes del iframe
    useEffect(() => {
        window.addEventListener("message", handleMessageFromIframe);

        // Remueve el event listener al desmontar el componente
        return () => {
            window.removeEventListener("message", handleMessageFromIframe);
        };
    }, [drawerUpload]);



    return (
        <>
            {drawerUpload ? (
                <div className="drawer-uploads" >
                    <iframe
                        loading="lazy"
                        src={`${URLDrawer}/duoc/file_dos/?drawer=${drawerUpload}&modori_id=${modori}&filter_id=${filter}&usu_id=${usu}&generico_id=${generico}&cli_id=${idCliente}`}
                        width={"100%"}
                        height={"100%"}
                        style={{ border: "none" }}
                        title="drawer"
                    ></iframe>
                </div>
            ) : null}
        </>
    )
}

export default DrawerUploads