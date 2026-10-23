"use strict";

const CLAVE_STORAGE = "calculadoraPesos_historial_v1";
let operacionActual = null;

const cantidad = document.getElementById("cantidad");
const peso = document.getElementById("peso");
const resultado = document.getElementById("resultado");
const pesoActual = document.getElementById("pesoActual");
const pesoBajar = document.getElementById("pesoBajar");
const pesoSubir = document.getElementById("pesoSubir");
const totalBajar = document.getElementById("totalBajar");
const totalSubir = document.getElementById("totalSubir");
const recomendacionPrincipal = document.getElementById("recomendacionPrincipal");

cantidad.addEventListener("input", calcularAutomaticamente);
peso.addEventListener("input", calcularAutomaticamente);

document.getElementById("btnGuardar").addEventListener("click", guardarOperacion);
document.getElementById("btnExcel").addEventListener("click", descargarExcel);
document.getElementById("btnCompartir").addEventListener("click", compartirExcel);
document.getElementById("btnFinalizar").addEventListener("click", finalizarJornada);

function calcularAutomaticamente() {
    const cantidadValor = Number(cantidad.value);
    const pesoValor = Number(peso.value);

    if (
        !Number.isFinite(cantidadValor) ||
        !Number.isFinite(pesoValor) ||
        cantidadValor <= 0 ||
        pesoValor <= 0
    ) {
        resultado.classList.add("oculto");
        operacionActual = null;
        return;
    }

    calcular(cantidadValor, pesoValor);
}

function calcular(cantidadValor, pesoValor) {
    const totalActual = cantidadValor * pesoValor;
    const tolerancia = 1e-10;
    const yaEsEntero = Math.abs(totalActual - Math.round(totalActual)) < tolerancia;

    let enteroInferior = yaEsEntero ? Math.round(totalActual) : Math.floor(totalActual);
    let enteroSuperior = yaEsEntero ? enteroInferior : Math.ceil(totalActual);

    const pesoInferior = enteroInferior > 0 ? enteroInferior / cantidadValor : null;
    const pesoSuperior = enteroSuperior / cantidadValor;

    pesoActual.textContent = `${limpiarNumero(totalActual)} kg`;

    if (pesoInferior !== null) {
        pesoBajar.textContent = `${limpiarNumero(pesoInferior)} kg`;
        totalBajar.textContent = `${enteroInferior} kg`;
    } else {
        pesoBajar.textContent = "No aplica";
        totalBajar.textContent = "-";
    }

    pesoSubir.textContent = `${limpiarNumero(pesoSuperior)} kg`;
    totalSubir.textContent = `${enteroSuperior} kg`;

    let pesoRecomendado;
    let totalRecomendado;
    let tipoRecomendacion;

    if (yaEsEntero) {
        pesoRecomendado = pesoValor;
        totalRecomendado = Math.round(totalActual);
        tipoRecomendacion = "Sin ajuste";

        recomendacionPrincipal.innerHTML =
            `✅ El peso actual ya produce un total entero de <strong>${totalRecomendado} kg</strong>.`;
    } else {
        const diferenciaSubir = Math.abs(pesoSuperior - pesoValor);
        const diferenciaBajar = pesoInferior === null
            ? Number.POSITIVE_INFINITY
            : Math.abs(pesoValor - pesoInferior);

        if (diferenciaBajar <= diferenciaSubir) {
            pesoRecomendado = pesoInferior;
            totalRecomendado = enteroInferior;
            tipoRecomendacion = "Bajar";

            recomendacionPrincipal.innerHTML =
                `Recomendación: <strong>bajar</strong> el peso a ` +
                `<strong>${limpiarNumero(pesoInferior)} kg</strong> para obtener exactamente ` +
                `<strong>${enteroInferior} kg</strong>.`;
        } else {
            pesoRecomendado = pesoSuperior;
            totalRecomendado = enteroSuperior;
            tipoRecomendacion = "Subir";

            recomendacionPrincipal.innerHTML =
                `Recomendación: <strong>subir</strong> el peso a ` +
                `<strong>${limpiarNumero(pesoSuperior)} kg</strong> para obtener exactamente ` +
                `<strong>${enteroSuperior} kg</strong>.`;
        }
    }

    operacionActual = {
        cantidad: cantidadValor,
        pesoOriginal: pesoValor,
        totalOriginal: totalActual,
        pesoBajar: pesoInferior,
        totalBajar: enteroInferior,
        pesoSubir: pesoSuperior,
        totalSubir: enteroSuperior,
        tipoRecomendacion,
        pesoRecomendado,
        totalRecomendado
    };

    resultado.classList.remove("oculto");
}

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

    const historial = obtenerHistorial();
    const ahora = new Date();

    historial.push({
        id: Date.now(),
        fecha: ahora.toLocaleDateString("es-MX"),
        hora: ahora.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit"
        }),
        ...operacionActual
    });

    guardarHistorial(historial);
    cargarHistorial();

    await mostrarMensaje(
        "Operación guardada",
        "La operación se guardó correctamente en este dispositivo.",
        "success",
        "✅"
    );

    limpiarCalculadora();
}

function obtenerHistorial() {
    try {
        const datos = localStorage.getItem(CLAVE_STORAGE);
        const historial = datos ? JSON.parse(datos) : [];
        return Array.isArray(historial) ? historial : [];
    } catch {
        return [];
    }
}

function guardarHistorial(historial) {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(historial));
}

function cargarHistorial() {
    const historial = obtenerHistorial();
    const tabla = document.getElementById("tablaHistorial");
    const sinOperaciones = document.getElementById("sinOperaciones");
    const contador = document.getElementById("contadorOperaciones");

    tabla.innerHTML = "";
    contador.textContent = historial.length;

    if (historial.length === 0) {
        sinOperaciones.style.display = "block";
        return;
    }

    sinOperaciones.style.display = "none";

    historial
        .slice()
        .reverse()
        .forEach(registro => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>
                    ${escaparHtml(registro.fecha)}
                    <br>
                    <small>${escaparHtml(registro.hora)}</small>
                </td>
                <td>${limpiarNumero(registro.cantidad)}</td>
                <td>${limpiarNumero(registro.pesoOriginal)}</td>
                <td>${limpiarNumero(registro.totalOriginal)}</td>
                <td>${escaparHtml(registro.tipoRecomendacion)}</td>
                <td>${limpiarNumero(registro.pesoRecomendado)}</td>
                <td>${limpiarNumero(registro.totalRecomendado)}</td>
                <td>
                    <button type="button" class="btn-eliminar">Eliminar</button>
                </td>
            `;

            fila.querySelector(".btn-eliminar").addEventListener("click", () => {
                eliminarOperacion(registro.id);
            });

            tabla.appendChild(fila);
        });
}

async function eliminarOperacion(id) {
    const confirmar = await confirmarApp(
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

    const historial = obtenerHistorial().filter(item => item.id !== id);
    guardarHistorial(historial);
    cargarHistorial();

    await mostrarMensaje(
        "Operación eliminada",
        "La operación fue eliminada correctamente.",
        "success",
        "✅"
    );
}

function generarExcelBlob() {
    const historial = obtenerHistorial();

    if (historial.length === 0) {
        return null;
    }

    const filas = historial.map((x, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escaparHtml(x.fecha)}</td>
            <td>${escaparHtml(x.hora)}</td>
            <td>${limpiarNumero(x.cantidad)}</td>
            <td>${limpiarNumero(x.pesoOriginal)}</td>
            <td>${limpiarNumero(x.totalOriginal)}</td>
            <td>${escaparHtml(x.tipoRecomendacion)}</td>
            <td>${limpiarNumero(x.pesoRecomendado)}</td>
            <td>${limpiarNumero(x.totalRecomendado)}</td>
        </tr>
    `).join("");

    const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; font-family: Arial; font-size: 12px; }
                th { background: #17233a; color: white; font-weight: bold; }
                th, td { border: 1px solid #cccccc; padding: 7px; }
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
                        <th>Total entero</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </body>
        </html>
    `;

    return new Blob(
        ["\ufeff", html],
        { type: "application/vnd.ms-excel;charset=utf-8" }
    );
}

async function descargarExcel() {
    const blob = generarExcelBlob();

    if (!blob) {
        await mostrarMensaje(
            "Sin operaciones",
            "No hay operaciones guardadas para exportar.",
            "normal",
            "📄"
        );
        return false;
    }

    descargarBlob(blob);
    return true;
}

function descargarBlob(blob) {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = obtenerNombreArchivo();

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function compartirExcel() {
    const blob = generarExcelBlob();

    if (!blob) {
        await mostrarMensaje(
            "Sin operaciones",
            "No hay operaciones guardadas para compartir.",
            "normal",
            "📄"
        );
        return;
    }

    const archivo = new File(
        [blob],
        obtenerNombreArchivo(),
        { type: "application/vnd.ms-excel" }
    );

    try {
        if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({ files: [archivo] })
        ) {
            await navigator.share({
                title: "Reporte de operaciones",
                text: "Reporte de operaciones de la Calculadora de Pesos.",
                files: [archivo]
            });
        } else {
            await mostrarMensaje(
                "Compartir no disponible",
                "Este dispositivo no permite compartir el archivo directamente. El reporte se descargará para que puedas adjuntarlo manualmente.",
                "normal",
                "📤"
            );

            descargarBlob(blob);
        }
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        console.error(error);

        await mostrarMensaje(
            "No se pudo compartir",
            "Ocurrió un problema al intentar compartir el archivo.",
            "danger",
            "⚠️"
        );
    }
}

async function finalizarJornada() {
    const historial = obtenerHistorial();

    if (historial.length === 0) {
        await mostrarMensaje(
            "Sin operaciones",
            "No existen operaciones guardadas para finalizar.",
            "normal",
            "📋"
        );
        return;
    }

    const exportar = await confirmarApp(
        "Finalizar jornada",
        "¿Deseas descargar el reporte de Excel antes de continuar?",
        "Sí, descargar",
        "No descargar",
        "📊"
    );

    if (exportar) {
        await descargarExcel();
    }

    const borrar = await confirmarApp(
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

    const confirmarBorrado = await confirmarApp(
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

    localStorage.removeItem(CLAVE_STORAGE);
    cargarHistorial();
    limpiarCalculadora();

    await mostrarMensaje(
        "Jornada finalizada",
        "El historial fue eliminado correctamente.",
        "success",
        "✅"
    );
}

function limpiarCalculadora() {
    cantidad.value = "";
    peso.value = "";
    operacionActual = null;
    resultado.classList.add("oculto");
    cantidad.focus();
}

function mostrarMensaje(titulo, mensaje, tipo = "normal", icono = "⚖️") {
    return new Promise(resolve => {
        const modal = document.getElementById("modalApp");
        const modalTitulo = document.getElementById("modalTitulo");
        const modalMensaje = document.getElementById("modalMensaje");
        const modalBotones = document.getElementById("modalBotones");
        const modalIcono = document.getElementById("modalIcono");

        modalTitulo.textContent = titulo;
        modalMensaje.textContent = mensaje;
        modalIcono.textContent = icono;
        modalBotones.innerHTML = "";

        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Aceptar";
        boton.className = "modal-btn modal-btn-primary";

        if (tipo === "success") {
            boton.className = "modal-btn modal-btn-success";
        }

        if (tipo === "danger") {
            boton.className = "modal-btn modal-btn-danger";
        }

        boton.addEventListener("click", () => {
            cerrarModal();
            resolve(true);
        });

        modalBotones.appendChild(boton);
        modal.classList.remove("oculto");
        boton.focus();
    });
}

function confirmarApp(
    titulo,
    mensaje,
    textoAceptar = "Aceptar",
    textoCancelar = "Cancelar",
    icono = "⚖️",
    peligro = false
) {
    return new Promise(resolve => {
        const modal = document.getElementById("modalApp");
        const modalTitulo = document.getElementById("modalTitulo");
        const modalMensaje = document.getElementById("modalMensaje");
        const modalBotones = document.getElementById("modalBotones");
        const modalIcono = document.getElementById("modalIcono");

        modalTitulo.textContent = titulo;
        modalMensaje.textContent = mensaje;
        modalIcono.textContent = icono;
        modalBotones.innerHTML = "";

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.textContent = textoCancelar;
        btnCancelar.className = "modal-btn modal-btn-secondary";

        btnCancelar.addEventListener("click", () => {
            cerrarModal();
            resolve(false);
        });

        const btnAceptar = document.createElement("button");
        btnAceptar.type = "button";
        btnAceptar.textContent = textoAceptar;
        btnAceptar.className = peligro
            ? "modal-btn modal-btn-danger"
            : "modal-btn modal-btn-primary";

        btnAceptar.addEventListener("click", () => {
            cerrarModal();
            resolve(true);
        });

        modalBotones.appendChild(btnCancelar);
        modalBotones.appendChild(btnAceptar);

        modal.classList.remove("oculto");
        btnAceptar.focus();
    });
}

function cerrarModal() {
    document.getElementById("modalApp").classList.add("oculto");
}

function limpiarNumero(numero) {
    const valor = Number(numero);

    if (!Number.isFinite(valor)) {
        return "0";
    }

    return parseFloat(valor.toFixed(10)).toString();
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

function obtenerNombreArchivo() {
    return `Operaciones_Pesos_${obtenerFechaArchivo()}.xls`;
}

function obtenerFechaArchivo() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .catch(error => console.error("Error Service Worker:", error));
    });
}

cargarHistorial();
