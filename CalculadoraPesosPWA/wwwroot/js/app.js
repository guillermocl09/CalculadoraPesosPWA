"use strict";

const CLAVE_STORAGE = "calculadoraPesos_historial_v1";

// Cantidad máxima de decimales que manejará el peso recomendado.
// Ejemplo: 0.440, 0.500, 0.667
const DECIMALES_PESO = 3;

// Tolerancia para comparar números decimales.
const TOLERANCIA = 0.000000001;

let operacionActual = null;


// =====================================================
// ELEMENTOS
// =====================================================

const cantidad = document.getElementById("cantidad");
const peso = document.getElementById("peso");
const resultado = document.getElementById("resultado");

const pesoActual = document.getElementById("pesoActual");

const pesoBajar = document.getElementById("pesoBajar");
const pesoSubir = document.getElementById("pesoSubir");

const totalBajar = document.getElementById("totalBajar");
const totalSubir = document.getElementById("totalSubir");

const recomendacionPrincipal =
    document.getElementById("recomendacionPrincipal");


// =====================================================
// EVENTOS
// =====================================================

cantidad.addEventListener(
    "input",
    calcularAutomaticamente
);

peso.addEventListener(
    "input",
    calcularAutomaticamente
);


document
    .getElementById("btnGuardar")
    .addEventListener(
        "click",
        guardarOperacion
    );


document
    .getElementById("btnExcel")
    .addEventListener(
        "click",
        descargarExcel
    );


document
    .getElementById("btnCompartir")
    .addEventListener(
        "click",
        compartirExcel
    );


document
    .getElementById("btnFinalizar")
    .addEventListener(
        "click",
        finalizarJornada
    );


// =====================================================
// CÁLCULO AUTOMÁTICO
// =====================================================

function calcularAutomaticamente() {

    const cantidadValor =
        Number(cantidad.value);

    const pesoValor =
        Number(peso.value);


    if (
        !Number.isFinite(cantidadValor) ||
        !Number.isFinite(pesoValor) ||
        cantidadValor <= 0 ||
        pesoValor <= 0
    ) {

        resultado.classList.add(
            "oculto"
        );

        operacionActual = null;

        return;
    }


    calcular(
        cantidadValor,
        pesoValor
    );
}


// =====================================================
// CÁLCULO PRINCIPAL
// =====================================================

function calcular(
    cantidadValor,
    pesoValor
) {

    const totalActual =
        cantidadValor *
        pesoValor;


    const totalActualEsEntero =
        esEnteroExacto(
            totalActual
        );


    // Si ya es entero, no hace falta recomendar otro peso.
    if (totalActualEsEntero) {

        pesoActual.textContent =
            `${formatearNumero(totalActual)} kg`;


        pesoBajar.textContent =
            `${formatearPeso(pesoValor)} kg`;

        pesoSubir.textContent =
            `${formatearPeso(pesoValor)} kg`;


        totalBajar.textContent =
            `${Math.round(totalActual)} kg · ✅ Exacto`;

        totalSubir.textContent =
            `${Math.round(totalActual)} kg · ✅ Exacto`;


        recomendacionPrincipal.innerHTML =
            `✅ El peso actual ya produce un total entero de ` +
            `<strong>${Math.round(totalActual)} kg</strong>. ` +
            `No necesitas realizar ningún ajuste.`;


        operacionActual = {

            cantidad:
                cantidadValor,

            pesoOriginal:
                pesoValor,

            totalOriginal:
                totalActual,

            pesoBajar:
                pesoValor,

            totalBajar:
                Math.round(totalActual),

            exactoBajar:
                true,

            pesoSubir:
                pesoValor,

            totalSubir:
                Math.round(totalActual),

            exactoSubir:
                true,

            tipoRecomendacion:
                "Sin ajuste",

            pesoRecomendado:
                pesoValor,

            totalRecomendado:
                Math.round(totalActual),

            resultadoExacto:
                true
        };


        resultado.classList.remove(
            "oculto"
        );

        return;
    }


    const enteroInferior =
        Math.floor(totalActual);


    const enteroSuperior =
        Math.ceil(totalActual);


    // =================================================
    // OPCIÓN PARA BAJAR
    // =================================================

    let opcionBajar = null;


    if (enteroInferior > 0) {

        const pesoIdealBajar =
            enteroInferior /
            cantidadValor;


        const pesoUtilizableBajar =
            redondearPeso(
                pesoIdealBajar
            );


        const totalRealBajar =
            cantidadValor *
            pesoUtilizableBajar;


        const exactoBajar =
            esEnteroExacto(
                totalRealBajar
            );


        opcionBajar = {

            tipo:
                "Bajar",

            pesoIdeal:
                pesoIdealBajar,

            peso:
                pesoUtilizableBajar,

            totalObjetivo:
                enteroInferior,

            totalReal:
                totalRealBajar,

            exacto:
                exactoBajar,

            diferenciaPeso:
                Math.abs(
                    pesoValor -
                    pesoUtilizableBajar
                ),

            diferenciaTotal:
                Math.abs(
                    enteroInferior -
                    totalRealBajar
                )
        };
    }


    // =================================================
    // OPCIÓN PARA SUBIR
    // =================================================

    const pesoIdealSubir =
        enteroSuperior /
        cantidadValor;


    const pesoUtilizableSubir =
        redondearPeso(
            pesoIdealSubir
        );


    const totalRealSubir =
        cantidadValor *
        pesoUtilizableSubir;


    const exactoSubir =
        esEnteroExacto(
            totalRealSubir
        );


    const opcionSubir = {

        tipo:
            "Subir",

        pesoIdeal:
            pesoIdealSubir,

        peso:
            pesoUtilizableSubir,

        totalObjetivo:
            enteroSuperior,

        totalReal:
            totalRealSubir,

        exacto:
            exactoSubir,

        diferenciaPeso:
            Math.abs(
                pesoUtilizableSubir -
                pesoValor
            ),

        diferenciaTotal:
            Math.abs(
                enteroSuperior -
                totalRealSubir
            )
    };


    // =================================================
    // MOSTRAR RESULTADOS
    // =================================================

    pesoActual.textContent =
        `${formatearNumero(totalActual)} kg`;


    if (opcionBajar) {

        pesoBajar.textContent =
            `${formatearPeso(opcionBajar.peso)} kg`;


        totalBajar.textContent =
            construirTextoTotal(
                opcionBajar
            );

    }
    else {

        pesoBajar.textContent =
            "No aplica";

        totalBajar.textContent =
            "-";
    }


    pesoSubir.textContent =
        `${formatearPeso(opcionSubir.peso)} kg`;


    totalSubir.textContent =
        construirTextoTotal(
            opcionSubir
        );


    // =================================================
    // ELEGIR LA MEJOR OPCIÓN
    // =================================================

    const recomendacion =
        elegirMejorOpcion(
            opcionBajar,
            opcionSubir
        );


    mostrarRecomendacion(
        recomendacion
    );


    operacionActual = {

        cantidad:
            cantidadValor,

        pesoOriginal:
            pesoValor,

        totalOriginal:
            totalActual,

        pesoBajar:
            opcionBajar
                ? opcionBajar.peso
                : null,

        totalBajar:
            opcionBajar
                ? opcionBajar.totalReal
                : null,

        exactoBajar:
            opcionBajar
                ? opcionBajar.exacto
                : false,

        pesoSubir:
            opcionSubir.peso,

        totalSubir:
            opcionSubir.totalReal,

        exactoSubir:
            opcionSubir.exacto,

        tipoRecomendacion:
            recomendacion.tipo,

        pesoRecomendado:
            recomendacion.peso,

        totalRecomendado:
            recomendacion.totalReal,

        resultadoExacto:
            recomendacion.exacto
    };


    resultado.classList.remove(
        "oculto"
    );
}


// =====================================================
// ELEGIR MEJOR OPCIÓN
// =====================================================

function elegirMejorOpcion(
    opcionBajar,
    opcionSubir
) {

    if (!opcionBajar) {

        return opcionSubir;
    }


    // 1. Si una opción es exacta y la otra no,
    //    SIEMPRE se recomienda la exacta.

    if (
        opcionBajar.exacto &&
        !opcionSubir.exacto
    ) {

        return opcionBajar;
    }


    if (
        opcionSubir.exacto &&
        !opcionBajar.exacto
    ) {

        return opcionSubir;
    }


    // 2. Si ambas son exactas,
    //    elegimos la que menos modifica el peso.

    if (
        opcionBajar.exacto &&
        opcionSubir.exacto
    ) {

        return opcionBajar.diferenciaPeso <=
            opcionSubir.diferenciaPeso
            ? opcionBajar
            : opcionSubir;
    }


    // 3. Si ninguna es exacta,
    //    elegimos la más cercana al entero objetivo.

    if (
        Math.abs(
            opcionBajar.diferenciaTotal -
            opcionSubir.diferenciaTotal
        ) > TOLERANCIA
    ) {

        return opcionBajar.diferenciaTotal <
            opcionSubir.diferenciaTotal
            ? opcionBajar
            : opcionSubir;
    }


    // 4. Si empatan, elegimos la que menos cambia el peso.

    return opcionBajar.diferenciaPeso <=
        opcionSubir.diferenciaPeso
        ? opcionBajar
        : opcionSubir;
}


// =====================================================
// MOSTRAR RECOMENDACIÓN
// =====================================================

function mostrarRecomendacion(
    opcion
) {

    if (opcion.exacto) {

        recomendacionPrincipal.innerHTML =
            `✅ Recomendación: <strong>${opcion.tipo.toLowerCase()}</strong> ` +
            `el peso a <strong>${formatearPeso(opcion.peso)} kg</strong> ` +
            `para obtener exactamente ` +
            `<strong>${Math.round(opcion.totalReal)} kg</strong>.`;

        return;
    }


    recomendacionPrincipal.innerHTML =
        `⚠️ Con un peso de máximo ${DECIMALES_PESO} decimales ` +
        `no se obtiene exactamente un número entero cercano. ` +
        `La mejor opción es <strong>${opcion.tipo.toLowerCase()}</strong> ` +
        `el peso a <strong>${formatearPeso(opcion.peso)} kg</strong>, ` +
        `obteniendo aproximadamente ` +
        `<strong>${formatearNumero(opcion.totalReal)} kg</strong>.`;
}


// =====================================================
// TEXTO PARA LAS TARJETAS
// =====================================================

function construirTextoTotal(
    opcion
) {

    if (opcion.exacto) {

        return (
            `${Math.round(opcion.totalReal)} kg · ✅ Exacto`
        );
    }


    return (
        `${formatearNumero(opcion.totalReal)} kg · ⚠️ Aproximado`
    );
}


// =====================================================
// REDONDEO DE PESO
// =====================================================

function redondearPeso(
    numero
) {

    return Number(
        Number(numero)
            .toFixed(
                DECIMALES_PESO
            )
    );
}


// =====================================================
// VALIDAR SI EL TOTAL ES ENTERO
// =====================================================

function esEnteroExacto(
    numero
) {

    return Math.abs(
        numero -
        Math.round(numero)
    ) < TOLERANCIA;
}


// =====================================================
// GUARDAR OPERACIÓN
// =====================================================

async function guardarOperacion() {

    if (!operacionActual) {

        await mostrarMensaje(
            "Datos incompletos",
            "Ingresa una cantidad y un peso válidos.",
            "normal",
            "⚠️"
        );

        return;
    }


    const historial =
        obtenerHistorial();


    const ahora =
        new Date();


    historial.push({

        id:
            Date.now(),

        fecha:
            ahora.toLocaleDateString(
                "es-MX"
            ),

        hora:
            ahora.toLocaleTimeString(
                "es-MX",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            ),

        ...operacionActual
    });


    guardarHistorial(
        historial
    );


    cargarHistorial();


    await mostrarMensaje(
        "Operación guardada",
        "La operación se guardó correctamente en este dispositivo.",
        "success",
        "✅"
    );


    limpiarCalculadora();
}


// =====================================================
// LOCAL STORAGE
// =====================================================

function obtenerHistorial() {

    try {

        const datos =
            localStorage.getItem(
                CLAVE_STORAGE
            );


        const historial =
            datos
                ? JSON.parse(datos)
                : [];


        return Array.isArray(historial)
            ? historial
            : [];

    }
    catch {

        return [];
    }
}


function guardarHistorial(
    historial
) {

    localStorage.setItem(
        CLAVE_STORAGE,
        JSON.stringify(
            historial
        )
    );
}


// =====================================================
// CARGAR HISTORIAL
// =====================================================

function cargarHistorial() {

    const historial =
        obtenerHistorial();


    const tabla =
        document.getElementById(
            "tablaHistorial"
        );


    const sinOperaciones =
        document.getElementById(
            "sinOperaciones"
        );


    const contador =
        document.getElementById(
            "contadorOperaciones"
        );


    tabla.innerHTML = "";


    contador.textContent =
        historial.length;


    if (
        historial.length === 0
    ) {

        sinOperaciones.style.display =
            "block";

        return;
    }


    sinOperaciones.style.display =
        "none";


    historial
        .slice()
        .reverse()
        .forEach(
            registro => {

                const fila =
                    document.createElement(
                        "tr"
                    );


                const tipoResultado =
                    registro.resultadoExacto
                        ? "✅ Exacto"
                        : "⚠️ Aproximado";


                fila.innerHTML = `

                    <td>
                        ${escaparHtml(registro.fecha)}
                        <br>
                        <small>
                            ${escaparHtml(registro.hora)}
                        </small>
                    </td>

                    <td>
                        ${formatearNumero(registro.cantidad)}
                    </td>

                    <td>
                        ${formatearPeso(registro.pesoOriginal)}
                    </td>

                    <td>
                        ${formatearNumero(registro.totalOriginal)}
                    </td>

                    <td>
                        ${escaparHtml(registro.tipoRecomendacion)}
                        <br>
                        <small>${tipoResultado}</small>
                    </td>

                    <td>
                        ${formatearPeso(registro.pesoRecomendado)}
                    </td>

                    <td>
                        ${formatearNumero(registro.totalRecomendado)}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-eliminar">

                            Eliminar

                        </button>

                    </td>
                `;


                fila
                    .querySelector(
                        ".btn-eliminar"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            eliminarOperacion(
                                registro.id
                            );

                        }
                    );


                tabla.appendChild(
                    fila
                );
            }
        );
}


// =====================================================
// ELIMINAR OPERACIÓN
// =====================================================

async function eliminarOperacion(
    id
) {

    const confirmar =
        await confirmarApp(
            "Eliminar operación",
            "¿Deseas eliminar esta operación del historial?",
            "Sí, eliminar",
            "Cancelar",
            "🗑️",
            true
        );


    if (!confirmar) {

        return;
    }


    const historial =
        obtenerHistorial()
            .filter(
                item =>
                    item.id !== id
            );


    guardarHistorial(
        historial
    );


    cargarHistorial();


    await mostrarMensaje(
        "Operación eliminada",
        "La operación fue eliminada correctamente.",
        "success",
        "✅"
    );
}


// =====================================================
// GENERAR EXCEL
// =====================================================

function generarExcelBlob() {

    const historial =
        obtenerHistorial();


    if (
        historial.length === 0
    ) {

        return null;
    }


    const filas =
        historial
            .map(
                (x, index) => {

                    const tipoResultado =
                        x.resultadoExacto
                            ? "Exacto"
                            : "Aproximado";


                    return `

                        <tr>

                            <td>${index + 1}</td>

                            <td>${escaparHtml(x.fecha)}</td>

                            <td>${escaparHtml(x.hora)}</td>

                            <td>${formatearNumero(x.cantidad)}</td>

                            <td>${formatearPeso(x.pesoOriginal)}</td>

                            <td>${formatearNumero(x.totalOriginal)}</td>

                            <td>${escaparHtml(x.tipoRecomendacion)}</td>

                            <td>${formatearPeso(x.pesoRecomendado)}</td>

                            <td>${formatearNumero(x.totalRecomendado)}</td>

                            <td>${tipoResultado}</td>

                        </tr>
                    `;
                }
            )
            .join("");


    const html = `

        <html
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">

        <head>

            <meta charset="UTF-8">

            <style>

                table {
                    border-collapse: collapse;
                    font-family: Arial;
                    font-size: 12px;
                }

                th {
                    background: #17233a;
                    color: white;
                    font-weight: bold;
                }

                th,
                td {
                    border: 1px solid #cccccc;
                    padding: 7px;
                }

            </style>

        </head>

        <body>

            <table>

                <thead>

                    <tr>

                        <th>No.</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Cantidad de productos</th>
                        <th>Peso original</th>
                        <th>Total original</th>
                        <th>Recomendación</th>
                        <th>Peso recomendado</th>
                        <th>Total resultante</th>
                        <th>Tipo de resultado</th>

                    </tr>

                </thead>

                <tbody>

                    ${filas}

                </tbody>

            </table>

        </body>

        </html>
    `;


    return new Blob(
        [
            "\ufeff",
            html
        ],
        {
            type:
                "application/vnd.ms-excel;charset=utf-8"
        }
    );
}


// =====================================================
// DESCARGAR EXCEL
// =====================================================

async function descargarExcel() {

    const blob =
        generarExcelBlob();


    if (!blob) {

        await mostrarMensaje(
            "Sin operaciones",
            "No hay operaciones guardadas para exportar.",
            "normal",
            "📄"
        );

        return false;
    }


    descargarBlob(
        blob
    );


    return true;
}


function descargarBlob(
    blob
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const enlace =
        document.createElement(
            "a"
        );


    enlace.href =
        url;


    enlace.download =
        obtenerNombreArchivo();


    document.body.appendChild(
        enlace
    );


    enlace.click();


    enlace.remove();


    setTimeout(
        () =>
            URL.revokeObjectURL(
                url
            ),
        1500
    );
}


// =====================================================
// COMPARTIR EXCEL
// =====================================================

async function compartirExcel() {

    const blob =
        generarExcelBlob();


    if (!blob) {

        await mostrarMensaje(
            "Sin operaciones",
            "No hay operaciones guardadas para compartir.",
            "normal",
            "📄"
        );

        return;
    }


    const archivo =
        new File(
            [blob],
            obtenerNombreArchivo(),
            {
                type:
                    "application/vnd.ms-excel"
            }
        );


    try {

        if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare(
                {
                    files:
                        [archivo]
                }
            )
        ) {

            await navigator.share(
                {

                    title:
                        "Reporte de operaciones",

                    text:
                        "Reporte de operaciones de la Calculadora de Pesos.",

                    files:
                        [archivo]
                }
            );

        }
        else {

            await mostrarMensaje(
                "Compartir no disponible",
                "Este dispositivo no permite compartir el archivo directamente. El reporte se descargará para que puedas adjuntarlo manualmente.",
                "normal",
                "📤"
            );


            descargarBlob(
                blob
            );
        }
    }
    catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            return;
        }


        console.error(
            error
        );


        await mostrarMensaje(
            "No se pudo compartir",
            "Ocurrió un problema al intentar compartir el archivo.",
            "danger",
            "⚠️"
        );
    }
}


// =====================================================
// FINALIZAR JORNADA
// =====================================================

async function finalizarJornada() {

    const historial =
        obtenerHistorial();


    if (
        historial.length === 0
    ) {

        await mostrarMensaje(
            "Sin operaciones",
            "No existen operaciones guardadas para finalizar.",
            "normal",
            "📋"
        );

        return;
    }


    const exportar =
        await confirmarApp(
            "Finalizar jornada",
            "¿Deseas descargar el reporte de Excel antes de continuar?",
            "Sí, descargar",
            "No descargar",
            "📊"
        );


    if (exportar) {

        await descargarExcel();
    }


    const borrar =
        await confirmarApp(
            "Historial de operaciones",
            "¿Deseas borrar el historial guardado en este dispositivo?\n\nSi seleccionas conservar, las próximas operaciones se seguirán acumulando.",
            "Sí, borrar",
            "Conservar",
            "🗂️",
            true
        );


    if (!borrar) {

        await mostrarMensaje(
            "Historial conservado",
            "La jornada finalizó y las operaciones permanecerán guardadas.",
            "success",
            "💾"
        );

        return;
    }


    const confirmarBorrado =
        await confirmarApp(
            "Confirmar borrado",
            "Se eliminarán todas las operaciones guardadas en este dispositivo.\n\nEsta acción no se puede deshacer.",
            "Borrar historial",
            "Cancelar",
            "⚠️",
            true
        );


    if (!confirmarBorrado) {

        return;
    }


    localStorage.removeItem(
        CLAVE_STORAGE
    );


    cargarHistorial();


    limpiarCalculadora();


    await mostrarMensaje(
        "Jornada finalizada",
        "El historial fue eliminado correctamente.",
        "success",
        "✅"
    );
}


// =====================================================
// LIMPIAR CALCULADORA
// =====================================================

function limpiarCalculadora() {

    cantidad.value = "";

    peso.value = "";

    operacionActual = null;

    resultado.classList.add(
        "oculto"
    );


    cantidad.focus();
}


// =====================================================
// MODAL DE MENSAJE
// =====================================================

function mostrarMensaje(
    titulo,
    mensaje,
    tipo = "normal",
    icono = "⚖️"
) {

    return new Promise(
        resolve => {

            const modal =
                document.getElementById(
                    "modalApp"
                );


            const modalTitulo =
                document.getElementById(
                    "modalTitulo"
                );


            const modalMensaje =
                document.getElementById(
                    "modalMensaje"
                );


            const modalBotones =
                document.getElementById(
                    "modalBotones"
                );


            const modalIcono =
                document.getElementById(
                    "modalIcono"
                );


            modalTitulo.textContent =
                titulo;


            modalMensaje.textContent =
                mensaje;


            modalIcono.textContent =
                icono;


            modalBotones.innerHTML =
                "";


            const boton =
                document.createElement(
                    "button"
                );


            boton.type =
                "button";


            boton.textContent =
                "Aceptar";


            boton.className =
                "modal-btn modal-btn-primary";


            if (
                tipo ===
                "success"
            ) {

                boton.className =
                    "modal-btn modal-btn-success";
            }


            if (
                tipo ===
                "danger"
            ) {

                boton.className =
                    "modal-btn modal-btn-danger";
            }


            boton.addEventListener(
                "click",
                () => {

                    cerrarModal();

                    resolve(
                        true
                    );
                }
            );


            modalBotones.appendChild(
                boton
            );


            modal.classList.remove(
                "oculto"
            );


            boton.focus();
        }
    );
}


// =====================================================
// MODAL DE CONFIRMACIÓN
// =====================================================

function confirmarApp(
    titulo,
    mensaje,
    textoAceptar = "Aceptar",
    textoCancelar = "Cancelar",
    icono = "⚖️",
    peligro = false
) {

    return new Promise(
        resolve => {

            const modal =
                document.getElementById(
                    "modalApp"
                );


            const modalTitulo =
                document.getElementById(
                    "modalTitulo"
                );


            const modalMensaje =
                document.getElementById(
                    "modalMensaje"
                );


            const modalBotones =
                document.getElementById(
                    "modalBotones"
                );


            const modalIcono =
                document.getElementById(
                    "modalIcono"
                );


            modalTitulo.textContent =
                titulo;


            modalMensaje.textContent =
                mensaje;


            modalIcono.textContent =
                icono;


            modalBotones.innerHTML =
                "";


            const btnCancelar =
                document.createElement(
                    "button"
                );


            btnCancelar.type =
                "button";


            btnCancelar.textContent =
                textoCancelar;


            btnCancelar.className =
                "modal-btn modal-btn-secondary";


            btnCancelar.addEventListener(
                "click",
                () => {

                    cerrarModal();

                    resolve(
                        false
                    );
                }
            );


            const btnAceptar =
                document.createElement(
                    "button"
                );


            btnAceptar.type =
                "button";


            btnAceptar.textContent =
                textoAceptar;


            btnAceptar.className =
                peligro
                    ? "modal-btn modal-btn-danger"
                    : "modal-btn modal-btn-primary";


            btnAceptar.addEventListener(
                "click",
                () => {

                    cerrarModal();

                    resolve(
                        true
                    );
                }
            );


            modalBotones.appendChild(
                btnCancelar
            );


            modalBotones.appendChild(
                btnAceptar
            );


            modal.classList.remove(
                "oculto"
            );


            btnAceptar.focus();
        }
    );
}


// =====================================================
// CERRAR MODAL
// =====================================================

function cerrarModal() {

    document
        .getElementById(
            "modalApp"
        )
        .classList.add(
            "oculto"
        );
}


// =====================================================
// FORMATO
// =====================================================

function formatearPeso(
    numero
) {

    const valor =
        Number(numero);


    if (
        !Number.isFinite(valor)
    ) {

        return "0.000";
    }


    return valor.toFixed(
        DECIMALES_PESO
    );
}


function formatearNumero(
    numero
) {

    const valor =
        Number(numero);


    if (
        !Number.isFinite(valor)
    ) {

        return "0";
    }


    return parseFloat(
        valor.toFixed(10)
    ).toString();
}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHtml(
    valor
) {

    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// =====================================================
// NOMBRE DE ARCHIVO
// =====================================================

function obtenerNombreArchivo() {

    return (
        "Operaciones_Pesos_" +
        obtenerFechaArchivo() +
        ".xls"
    );
}


function obtenerFechaArchivo() {

    const fecha =
        new Date();


    const anio =
        fecha.getFullYear();


    const mes =
        String(
            fecha.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const dia =
        String(
            fecha.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return (
        anio +
        "-" +
        mes +
        "-" +
        dia
    );
}


// =====================================================
// SERVICE WORKER
// =====================================================

if (
    "serviceWorker" in
    navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator
                .serviceWorker
                .register(
                    "./sw.js"
                )
                .catch(
                    error => {

                        console.error(
                            "Error Service Worker:",
                            error
                        );
                    }
                );
        }
    );
}


// =====================================================
// INICIO
// =====================================================

cargarHistorial();