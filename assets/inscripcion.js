/* Inscripciones del curso Inglés Río Hurtado.
   - Envía cada inscripción a la planilla de Google (Apps Script) si hay endpoint.
   - Guarda una copia en este dispositivo para el registro y los indicadores.
   - Exporta a CSV y permite consultar agrupado por localidad, grupo o emprendimiento.
   Sin dependencias externas: funciona también abierto desde un pendrive. */

const INSCRIPCION = {
  // Pegar aquí la URL del Web App de Apps Script (Implementar > Aplicación web).
  ENDPOINT: "https://script.google.com/macros/s/AKfycbz_q_1Ja4MQHsCadf8OnuV70Pqepvn7fwVF-i-4NJnFJZaeCzhsWYHmW63OoPxC_a-w/exec",
  // URL de la planilla para el botón «Abrir planilla» (opcional).
  HOJA: "https://docs.google.com/spreadsheets/d/1e-eI1ncGa6GqYxDNAf-V6B9ZATVsja8MDetMV0RMD-A/edit",
  CLAVE: "inglesRH.inscripciones.v1",
};

const CLAVE_LOCAL = "inglesRH.clave";
let REMOTO = null;   // cuando tiene datos, el panel muestra la planilla completa

const CAMPOS = ["nombre", "grupo", "negocio", "localidad", "correo", "whatsapp"];
const ETIQUETAS = {
  nombre: "Nombre completo",
  grupo: "Grupo",
  negocio: "Oficina o emprendimiento",
  localidad: "Localidad",
  correo: "Correo electrónico",
  whatsapp: "WhatsApp",
};

/* ---------- almacenamiento ---------- */

function leer() {
  try {
    const crudo = localStorage.getItem(INSCRIPCION.CLAVE);
    const lista = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}

function guardar(lista) {
  try {
    localStorage.setItem(INSCRIPCION.CLAVE, JSON.stringify(lista));
  } catch (e) {
    /* sin espacio o modo privado: seguimos, la planilla es la fuente principal */
  }
}

/* ---------- validación ---------- */

function soloDigitos(t) {
  return (t || "").replace(/\D/g, "");
}

function normalizarWhatsapp(t) {
  let d = soloDigitos(t);
  if (d.startsWith("56")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("9")) return "+56 " + d[0] + " " + d.slice(1, 5) + " " + d.slice(5);
  if (d.length === 8) return "+56 9 " + d.slice(0, 4) + " " + d.slice(4);
  return "";
}

function validar(datos) {
  const errores = {};
  const nombre = (datos.nombre || "").trim();
  if (nombre.length < 5 || !/[a-záéíóúñ]/i.test(nombre)) {
    errores.nombre = "Escribe tu nombre y apellido completos.";
  }
  if (!datos.grupo) errores.grupo = "Elige el grupo al que postulas.";
  const negocio = (datos.negocio || "").trim();
  if (negocio.length < 3) errores.negocio = "Indica tu oficina, servicio o emprendimiento.";
  if (!datos.localidad) errores.localidad = "Elige tu localidad.";
  const correo = (datos.correo || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(correo)) errores.correo = "Revisa el correo: falta el arroba o el dominio.";
  const wpp = normalizarWhatsapp(datos.whatsapp);
  if (!wpp) errores.whatsapp = "Escribe el número con 9 dígitos, por ejemplo 9 1234 5678.";
  return { errores, wpp, correo: correo.toLowerCase() };
}

/* ---------- envío ---------- */

async function enviarAPlanilla(registro) {
  if (!INSCRIPCION.ENDPOINT) return { estado: "sin-endpoint" };
  try {
    // text/plain evita el preflight de CORS: Apps Script no responde a OPTIONS.
    await fetch(INSCRIPCION.ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(registro),
    });
    return { estado: "enviado" };
  } catch (e) {
    return { estado: "error" };
  }
}

// Respaldo cuando la planilla no está conectada: WhatsApp del curso con los datos listos.
// No se usa mailto: en equipos sin programa de correo configurado abre una pestaña en blanco.
function textoRespaldo(registro) {
  return [
    "Inscripción al programa Inglés Río Hurtado",
    "Nombre completo: " + registro.nombre,
    "Grupo: " + registro.grupo,
    "Oficina o emprendimiento: " + registro.negocio,
    "Localidad: " + registro.localidad,
    "Correo electrónico: " + registro.correo,
    "WhatsApp: " + registro.whatsapp,
  ].join("\n");
}

function whatsappDeRespaldo(registro) {
  return "https://wa.me/56957050087?text=" + encodeURIComponent(textoRespaldo(registro));
}

async function copiarDatos(registro, boton) {
  const texto = textoRespaldo(registro);
  try {
    await navigator.clipboard.writeText(texto);
    boton.textContent = "¡Datos copiados!";
  } catch (e) {
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); boton.textContent = "¡Datos copiados!"; }
    catch (err) { boton.textContent = "No se pudo copiar"; }
    area.remove();
  }
  setTimeout(() => { boton.textContent = "Copiar mis datos"; }, 2600);
}

/* ---------- indicadores y tabla ---------- */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

function agrupar(lista, campo) {
  const cuenta = new Map();
  lista.forEach((r) => {
    const clave = (r[campo] || "Sin dato").trim() || "Sin dato";
    cuenta.set(clave, (cuenta.get(clave) || 0) + 1);
  });
  return Array.from(cuenta.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

function datos() {
  return REMOTO || leer();
}

function pintarPanel() {
  const panel = $("#registro-inscripciones");
  if (!panel) return;
  const lista = datos();
  const total = lista.length;
  const municipales = lista.filter((r) => /municip/i.test(r.grupo)).length;
  const emprendedores = total - municipales;
  const localidades = new Set(lista.map((r) => r.localidad)).size;

  $("#kpi-total").textContent = total;
  $("#kpi-municipales").textContent = municipales;
  $("#kpi-emprendedores").textContent = emprendedores;
  $("#kpi-localidades").textContent = localidades;

  const campo = $("#agrupar").value;
  const grupos = agrupar(lista, campo);
  const maximo = Math.max(1, ...grupos.map((g) => g[1]));
  $("#barras").innerHTML = grupos.length
    ? grupos
        .map(
          ([nombre, n]) =>
            `<li><span class="barras__nombre">${nombre}</span>` +
            `<span class="barras__barra"><i style="width:${Math.round((n / maximo) * 100)}%"></i></span>` +
            `<span class="barras__n">${n}</span></li>`
        )
        .join("")
    : '<li class="barras__vacio">Todavía no hay inscripciones registradas en este dispositivo.</li>';

  const filtro = $("#filtro-grupo").value;
  const visibles = filtro ? lista.filter((r) => r.grupo === filtro) : lista;
  $("#tabla-cuerpo").innerHTML = visibles.length
    ? visibles
        .slice()
        .reverse()
        .map(
          (r) =>
            `<tr><td>${r.fecha || ""}</td><td>${r.nombre}</td><td>${r.grupo}</td>` +
            `<td>${r.negocio}</td><td>${r.localidad}</td><td>${r.correo}</td><td>${r.whatsapp}</td>` +
            (REMOTO ? "<td></td>"
                     : `<td><button class="btn-borrar" data-correo="${r.correo}" title="Quitar del registro de este dispositivo">✕</button></td>`) +
            "</tr>"
        )
        .join("")
    : '<tr><td colspan="8" class="tabla__vacio">Sin registros para mostrar.</td></tr>';

  const opciones = Array.from(new Set(lista.map((r) => r.grupo)));
  const actual = $("#filtro-grupo").value;
  $("#filtro-grupo").innerHTML =
    '<option value="">Todos los grupos</option>' +
    opciones.map((g) => `<option${g === actual ? " selected" : ""}>${g}</option>`).join("");

  const estado = $("#estado-planilla");
  if (REMOTO) {
    const aviso = $("#aviso-planilla");
    if (aviso) {
      aviso.textContent = "Mostrando la planilla completa: " + REMOTO.length +
        " inscripciones. Lo que se ve acá es lo mismo que descargan los botones.";
      aviso.hidden = false;
    }
  }
  if (estado) {
    estado.textContent = INSCRIPCION.ENDPOINT
      ? "Conectado a la planilla del curso: cada inscripción queda guardada y avisa por correo."
      : "Modo local: la inscripción queda en este dispositivo y se puede enviar por WhatsApp. Falta conectar la planilla del curso.";
    estado.classList.toggle("aviso--pendiente", !INSCRIPCION.ENDPOINT);
  }
  const abrir = $("#abrir-planilla");
  if (abrir) {
    abrir.hidden = !INSCRIPCION.HOJA;
    if (INSCRIPCION.HOJA) abrir.href = INSCRIPCION.HOJA;
  }
}

/* ---------- exportación ---------- */

function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fechaArchivo() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}

function exportarCSV() {
  const lista = datos();
  const cabecera = ["Fecha", "Nombre completo", "Grupo", "Oficina o emprendimiento", "Localidad", "Correo", "WhatsApp"];
  const filas = lista.map((r) => [r.fecha, r.nombre, r.grupo, r.negocio, r.localidad, r.correo, r.whatsapp]);
  const escapar = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const csv = [cabecera, ...filas].map((f) => f.map(escapar).join(";")).join("\r\n");
  descargar("inscripciones_ingles_rio_hurtado_" + fechaArchivo() + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
}

function exportarExcel() {
  // Hoja de cálculo XML de Excel: la abre directamente, sin avisos de formato.
  const lista = datos();
  const cabecera = ["Fecha", "Nombre completo", "Grupo", "Oficina o emprendimiento", "Localidad", "Correo", "WhatsApp"];
  const celda = (v, cab) =>
    `<Cell><Data ss:Type="String">${cab ? "<B>" : ""}${String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}${cab ? "</B>" : ""}</Data></Cell>`;
  const filas = lista
    .map((r) => "<Row>" + [r.fecha, r.nombre, r.grupo, r.negocio, r.localidad, r.correo, r.whatsapp].map((v) => celda(v)).join("") + "</Row>")
    .join("");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<?mso-application progid="Excel.Sheet"?>\n' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
    'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Inscripciones"><Table>' +
    "<Row>" + cabecera.map((c) => celda(c, true)).join("") + "</Row>" + filas +
    "</Table></Worksheet></Workbook>";
  descargar("inscripciones_ingles_rio_hurtado_" + fechaArchivo() + ".xls", xml, "application/vnd.ms-excel");
}

/* ---------- planilla completa (solo docentes con la clave) ---------- */

async function cargarPlanilla(clave, destino) {
  if (!INSCRIPCION.ENDPOINT) {
    if (destino) destino.textContent = "Falta conectar la planilla del curso.";
    return false;
  }
  if (destino) destino.textContent = "Leyendo la planilla…";
  try {
    const r = await fetch(INSCRIPCION.ENDPOINT + "?clave=" + encodeURIComponent(clave));
    const d = await r.json();
    if (!d.ok) {
      REMOTO = null;
      if (destino) destino.textContent = "La clave no corresponde.";
      pintarPanel();
      return false;
    }
    REMOTO = d.inscripciones || [];
    try { localStorage.setItem(CLAVE_LOCAL, clave); } catch (e) { /* modo privado */ }
    pintarPanel();
    if (destino) destino.textContent = "Planilla cargada: " + REMOTO.length + " inscripciones.";
    return true;
  } catch (e) {
    if (destino) destino.textContent = "No se pudo leer la planilla. Revisa la conexión.";
    return false;
  }
}

/* ---------- formulario ---------- */

function marcarErrores(errores) {
  CAMPOS.forEach((campo) => {
    const caja = document.querySelector(`[data-error="${campo}"]`);
    const input = document.querySelector(`[name="${campo}"]`);
    if (!caja) return;
    caja.textContent = errores[campo] || "";
    if (input) input.classList.toggle("campo--mal", Boolean(errores[campo]));
  });
}

function iniciarFormulario() {
  const form = $("#form-inscripcion");
  if (!form) return;
  const aviso = $("#form-aviso");

  let enviando = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (enviando) return;              // evita el doble envío por doble clic
    enviando = true;
    const datos = Object.fromEntries(new FormData(form).entries());
    const { errores, wpp, correo } = validar(datos);
    marcarErrores(errores);
    if (Object.keys(errores).length) {
      aviso.className = "form__aviso error";
      aviso.textContent = "Revisa los campos marcados: todos los datos son obligatorios.";
      $(".campo--mal", form)?.focus();
      return;
    }

    const lista = leer();
    if (lista.some((r) => r.correo === correo)) {
      aviso.className = "form__aviso error";
      aviso.textContent = "Ya hay una inscripción con ese correo en este dispositivo. Si necesitas corregirla, bórrala del registro y vuelve a enviarla.";
      return;
    }

    const registro = {
      fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
      nombre: datos.nombre.trim(),
      grupo: datos.grupo,
      negocio: datos.negocio.trim(),
      localidad: datos.localidad,
      correo: correo,
      whatsapp: wpp,
    };

    aviso.className = "form__aviso";
    aviso.textContent = "Guardando la inscripción…";
    const boton = $("button[type=submit]", form);
    boton.disabled = true;
    const resultado = await enviarAPlanilla(registro);
    boton.disabled = false;
    enviando = false;

    lista.push(registro);
    guardar(lista);
    pintarPanel();
    form.reset();
    marcarErrores({});

    if (resultado.estado === "enviado") {
      aviso.className = "form__aviso ok";
      aviso.innerHTML =
        "¡Inscripción registrada! " + registro.nombre.split(" ")[0] +
        ", quedaste en la lista del grupo " + registro.grupo.replace(/^Grupo /, "") +
        ". Te escribiremos al " + registro.whatsapp + " con la fecha de la primera sesión.";
    } else if (resultado.estado === "error") {
      aviso.className = "form__aviso error";
      aviso.innerHTML =
        "Guardamos tu inscripción en este dispositivo, pero no pudimos avisar a la planilla. " +
        'Para que quede registrada, <a href="' + whatsappDeRespaldo(registro) + '" target="_blank" rel="noopener">' +
        "envía tus datos por WhatsApp</a> o <button type=\"button\" class=\"enlace-copiar\" id=\"btn-copiar\">cópialos</button>.";
    } else {
      aviso.className = "form__aviso ok";
      aviso.innerHTML =
        "Inscripción guardada en este dispositivo. Para que llegue a la planilla del curso, " +
        '<a href="' + whatsappDeRespaldo(registro) + '" target="_blank" rel="noopener">envía tus datos por WhatsApp</a> ' +
        'o <button type="button" class="enlace-copiar" id="btn-copiar">cópialos</button> y pégalos donde necesites.';
    }
    const copiar = $("#btn-copiar");
    if (copiar) copiar.addEventListener("click", () => copiarDatos(registro, copiar));
  });

  const btnCargar = $("#btn-cargar");
  if (btnCargar) {
    btnCargar.addEventListener("click", () => {
      const clave = ($("#clave-planilla").value || "").trim();
      if (!clave) { $("#aviso-planilla").hidden = false; $("#aviso-planilla").textContent = "Escribe la clave del curso."; return; }
      cargarPlanilla(clave, $("#aviso-planilla"));
    });
    $("#clave-planilla").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); btnCargar.click(); }
    });
    let guardada = "";
    try { guardada = localStorage.getItem(CLAVE_LOCAL) || ""; } catch (e) { guardada = ""; }
    if (guardada) { $("#clave-planilla").value = guardada; cargarPlanilla(guardada, $("#aviso-planilla")); }
  }

  $("#agrupar").addEventListener("change", pintarPanel);
  $("#filtro-grupo").addEventListener("change", pintarPanel);
  $("#btn-csv").addEventListener("click", exportarCSV);
  $("#btn-excel").addEventListener("click", exportarExcel);
  $("#btn-limpiar").addEventListener("click", () => {
    if (confirm("¿Borrar el registro guardado en este dispositivo? La planilla del curso no se toca.")) {
      guardar([]);
      pintarPanel();
    }
  });
  $("#tabla-cuerpo").addEventListener("click", (e) => {
    const boton = e.target.closest(".btn-borrar");
    if (!boton) return;
    const correo = boton.dataset.correo;
    if (!confirm("¿Quitar esta inscripción del registro de este dispositivo?")) return;
    guardar(leer().filter((r) => r.correo !== correo));
    pintarPanel();
  });

  pintarPanel();
}

document.addEventListener("DOMContentLoaded", iniciarFormulario);
