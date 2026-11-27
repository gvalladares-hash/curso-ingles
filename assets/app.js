/* =========================================================================
   English for Tourism · Valle del Río Hurtado
   Interacciones del sitio: menú, filtros de la malla, buscador de vocabulario,
   copiado de frases, revelado al hacer scroll y formulario de inscripción.
   ========================================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------------ utilidades */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const norm = (str) =>
    (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ menú móvil */
  const boton = $("#menu-boton");
  const menu = $("#menu");

  if (boton && menu) {
    boton.addEventListener("click", () => {
      const abierto = menu.classList.toggle("is-open");
      boton.setAttribute("aria-expanded", String(abierto));
    });

    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        menu.classList.remove("is-open");
        boton.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* --------------------------------------------------- sombra de la barra */
  const barra = $(".barra");
  const alScroll = () => {
    if (!barra) return;
    barra.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", alScroll, { passive: true });
  alScroll();

  /* ------------------------------------------------------ malla curricular */
  const entradaSesion = $("#buscar-sesion");
  const conteoSesiones = $("#conteo-sesiones");
  const sinResultados = $("#sin-resultados");
  const bloques = $$(".bloque");
  const totalSesiones = $$(".sesion").length;
  let moduloActivo = "all";

  function filtrarSesiones() {
    const q = norm(entradaSesion ? entradaSesion.value : "");
    let visibles = 0;

    bloques.forEach((bloque) => {
      const coincideModulo = moduloActivo === "all" || bloque.dataset.modulo === moduloActivo;
      let visiblesBloque = 0;

      $$(".sesion", bloque).forEach((sesion) => {
        const coincideTexto = !q || norm(sesion.dataset.texto).includes(q);
        const mostrar = coincideModulo && coincideTexto;
        sesion.hidden = !mostrar;
        if (mostrar) visiblesBloque += 1;
      });

      bloque.hidden = visiblesBloque === 0;
      visibles += visiblesBloque;
    });

    if (conteoSesiones) {
      if (visibles === 0) {
        conteoSesiones.textContent = "Sin resultados";
      } else if (visibles === totalSesiones) {
        conteoSesiones.textContent = totalSesiones + " sesiones disponibles";
      } else {
        conteoSesiones.textContent = visibles + " de " + totalSesiones + " sesiones";
      }
    }
    if (sinResultados) sinResultados.hidden = visibles !== 0;
  }

  const tabsModulo = $$('.tabs [data-modulo]');
  tabsModulo.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabsModulo.forEach((t) => {
        const activo = t === tab;
        t.classList.toggle("is-active", activo);
        t.setAttribute("aria-selected", String(activo));
      });
      moduloActivo = tab.dataset.modulo;
      filtrarSesiones();
    });
  });

  if (entradaSesion) {
    entradaSesion.addEventListener("input", filtrarSesiones);
    entradaSesion.addEventListener("search", filtrarSesiones);
  }

  /* ---------------------------------------------------------- vocabulario */
  const entradaVocab = $("#buscar-vocab");
  const paneles = $$(".panel");
  const tabsVocab = $$(".tabs--vocab [data-panel]");
  const vocabVacio = $("#vocab-vacio");
  let panelActivo = paneles.length ? paneles[0].id : null;

  function mostrarPanel(id) {
    panelActivo = id;
    paneles.forEach((p) => p.classList.toggle("is-active", p.id === id));
    tabsVocab.forEach((t) => {
      const activo = t.dataset.panel === id;
      t.classList.toggle("is-active", activo);
      t.setAttribute("aria-selected", String(activo));
    });
  }

  tabsVocab.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (entradaVocab && entradaVocab.value) {
        entradaVocab.value = "";
        filtrarVocab();
      }
      mostrarPanel(tab.dataset.panel);
    });
  });

  function filtrarVocab() {
    const q = norm(entradaVocab ? entradaVocab.value : "");
    let encontrados = 0;

    paneles.forEach((panel) => {
      let coincidencias = 0;
      $$("tbody tr", panel).forEach((fila) => {
        const ok = !q || norm(fila.textContent).includes(q);
        fila.hidden = !ok;
        if (ok) coincidencias += 1;
      });

      if (q) {
        panel.hidden = coincidencias === 0;
        panel.classList.add("is-active");
      } else {
        panel.hidden = false;
        panel.classList.toggle("is-active", panel.id === panelActivo);
      }
      encontrados += coincidencias;
    });

    const barraTabs = $(".tabs--vocab");
    if (barraTabs) barraTabs.hidden = Boolean(q);
    if (vocabVacio) vocabVacio.hidden = encontrados !== 0;
  }

  if (entradaVocab) {
    entradaVocab.addEventListener("input", filtrarVocab);
    entradaVocab.addEventListener("search", filtrarVocab);
  }

  /* --------------------------------------------------------- copiar frase */
  const aviso = $("#aviso-copiado");

  function avisar(texto) {
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.add("is-visible");
    window.clearTimeout(avisar._t);
    avisar._t = window.setTimeout(() => aviso.classList.remove("is-visible"), 2200);
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Copiado: «" + texto + "»");
    } catch (err) {
      const area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        avisar("Copiado: «" + texto + "»");
      } catch (e) {
        avisar("No se pudo copiar automáticamente.");
      }
      document.body.removeChild(area);
    }
  }

  $$(".frase").forEach((botonFrase) => {
    botonFrase.addEventListener("click", () => {
      const texto = botonFrase.dataset.copiar;
      if (texto) copiar(texto);
      botonFrase.classList.add("is-copiada");
    });
  });

  /* ------------------------------------------------- revelado al hacer scroll */
  if (!reducido) {
    const objetivos = $$(
      ".intro__texto > *, .ficha, .cifras li, .perfil, .bloque, .paso, .principios__lista li, " +
      ".frases__bloque, .recurso, .semanas li, .eval__grid > *, .inscripcion__grid > *, .sedes"
    );
    objetivos.forEach((el) => el.classList.add("reveal"));

    if ("IntersectionObserver" in window) {
      const observador = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
              const el = entrada.target;
              const hermanos = el.parentElement ? Array.from(el.parentElement.children) : [];
              const i = Math.min(hermanos.indexOf(el), 5);
              el.style.transitionDelay = (i > 0 ? i * 60 : 0) + "ms";
              el.classList.add("is-in");
              observador.unobserve(el);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      objetivos.forEach((el) => observador.observe(el));
    } else {
      objetivos.forEach((el) => el.classList.add("is-in"));
    }
  }

  /* ------------------------------------------------------------- formulario */
  const form = $("#form-inscripcion");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const avisoForm = $("#form-aviso");
      const datos = new FormData(form);
      const nombre = (datos.get("nombre") || "").toString().trim();
      const negocio = (datos.get("negocio") || "").toString().trim();
      const contacto = (datos.get("contacto") || "").toString().trim();
      const localidad = datos.get("localidad");
      const grupo = datos.get("grupo") || "Sin especificar";

      if (!nombre || !negocio || !contacto) {
        if (avisoForm) {
          avisoForm.textContent = "Complete su nombre, el emprendimiento y un medio de contacto.";
          avisoForm.classList.add("error");
        }
        return;
      }

      const cuerpo = [
        "Solicitud de inscripción al programa English for Tourism",
        "",
        "Nombre: " + nombre,
        "Grupo: " + grupo,
        "Oficina o emprendimiento: " + negocio,
        "Localidad: " + localidad,
        "Contacto: " + contacto,
        "",
        "Declaro mi interés en participar y mi disponibilidad para asistir a las sesiones del programa.",
      ].join("\n");

      const enlace =
        "mailto:ingles.riohurtado2026@gmail.com" +
        "?subject=" + encodeURIComponent("Inscripción English for Tourism - " + nombre) +
        "&body=" + encodeURIComponent(cuerpo);

      if (avisoForm) {
        avisoForm.classList.remove("error");
        avisoForm.textContent =
          "Se abrirá su aplicación de correo con la solicitud lista. Si no ocurre, escriba a ingles.riohurtado2026@gmail.com o por WhatsApp al +56 9 5705 0087.";
      }
      window.location.href = enlace;
    });
  }

  /* --------------------------------------------------- detalles al imprimir */
  window.addEventListener("beforeprint", () => {
    $$("details").forEach((d) => {
      if (!d.open) {
        d.open = true;
        d.dataset.abiertoImpresion = "1";
      }
    });
  });
  window.addEventListener("afterprint", () => {
    $$('details[data-abierto-impresion="1"]').forEach((d) => {
      d.open = false;
      delete d.dataset.abiertoImpresion;
    });
  });

  /* ------------------------------------------------------ año en el pie (si aplica) */
  const anio = $("[data-anio]");
  if (anio) anio.textContent = new Date().getFullYear();
})();
