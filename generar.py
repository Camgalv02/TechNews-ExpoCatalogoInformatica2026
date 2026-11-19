"""Genera html/index.html a partir de datos/*.json y plantillas/*.html.

Para agregar una noticia, un juego o una tecnología:
  1. Editá el archivo de datos/ que corresponda.
  2. Ejecutá:  python generar.py
"""
import json
from datetime import datetime
from html import escape
from pathlib import Path
from urllib.parse import quote

BASE = Path(__file__).parent
ARCHIVO_HTML = BASE / "html" / "index.html"

# tipo de proyecto: (emoji, etiqueta, texto del botón, nombre del filtro)
TIPOS = {
    "juego": ("🎮", "Juego", "Jugar ahora", "Juegos"),
    "app": ("💡", "Aplicación", "Abrir", "Aplicaciones"),
}


def leer_json(nombre):
    with open(BASE / "datos" / nombre, "r", encoding="utf-8") as archivo:
        return json.load(archivo)


def leer_plantilla(nombre):
    with open(BASE / "plantillas" / nombre, "r", encoding="utf-8") as archivo:
        return archivo.read()


def rellenar(plantilla, datos):
    for clave, valor in datos.items():
        plantilla = plantilla.replace("{{" + clave + "}}", str(valor))
    return plantilla


def etiqueta_imagen(ruta, alt=""):
    """Si el archivo no existe, onerror la quita y queda el fondo con su emoji."""
    if not ruta:
        return ""
    if not ruta.startswith(("../", "http")):
        ruta = "../img/" + ruta
    return f'<img src="{quote(ruta, safe="/:.-_")}" alt="{escape(alt, quote=True)}" onerror="this.remove()">'


def linea(titulo, valor):
    return f'<p class="meta"><b>{titulo}:</b> {escape(valor)}</p>' if valor else ""


# ---------- Noticias (misma lógica de siempre: de la más reciente a la más antigua)
noticias = leer_json("noticias.json")
noticias.sort(key=lambda n: datetime.strptime(n["fecha"], "%Y-%m-%d"), reverse=True)
plantilla_noticia = leer_plantilla("noticias.html")

html_noticias = "\n".join(
    rellenar(plantilla_noticia, {
        "titulo": escape(n["titulo"]),
        "fecha": datetime.strptime(n["fecha"], "%Y-%m-%d").strftime("%d/%m/%Y"),
        "texto": escape(n["texto"].strip()),
        "imagen": etiqueta_imagen(n.get("imagen"), n["titulo"]),
    })
    for n in noticias
)

# ---------- Proyectos
proyectos = leer_json("proyectos.json")
plantilla_proyecto = leer_plantilla("proyectos.html")
html_proyectos = []
for p in proyectos:
    icono, etiqueta, accion, _ = TIPOS[p["tipo"]]
    html_proyectos.append(rellenar(plantilla_proyecto, {
        "tipo": p["tipo"],
        "icono": icono,
        "etiqueta": etiqueta,
        "accion": accion,
        "nombre": escape(p["nombre"]),
        "descripcion": escape(p["descripcion"]),
        "meta": linea("Autores", p.get("autores", "")) + linea("Tutores", p.get("tutores", "")),
        "enlace": escape(p.get("enlace", "#"), quote=True),
        "imagen": etiqueta_imagen(p.get("imagen"), p["nombre"]),
    }))

# Filtros y buscador: aparecen solo cuando hay varios proyectos
tipos = sorted({p["tipo"] for p in proyectos})
if len(proyectos) > 4:
    botones = "".join(
        f'<button class="f" data-tipo="{t}">{TIPOS[t][3]} ({sum(p["tipo"] == t for p in proyectos)})</button>'
        for t in tipos
    )
    filtros = (
        '<div class="filtros"><label for="q" style="position:absolute;left:-9999px">Buscar proyecto</label>'
        '<input id="q" type="search" placeholder="Buscar un proyecto">'
        f'<button class="f on" data-tipo="todos">Todos ({len(proyectos)})</button>{botones}</div>'
    )
else:
    filtros = ""

# ---------- Tecnologías
tecnologias = leer_json("tecnologias.json")
chips = "".join(
    f'<span class="chip"><span class="ti">{t["icono"]}{etiqueta_imagen(t.get("imagen"))}</span>{escape(t["nombre"])}</span>'
    for t in tecnologias
)

# ---------- Página completa
pagina = rellenar(leer_plantilla("base.html"), {
    "noticias": html_noticias,
    "proyectos": "\n".join(html_proyectos),
    "filtros": filtros,
    "tecnologias": chips,
    "n_juegos": sum(p["tipo"] == "juego" for p in proyectos),
    "n_tecnologias": len(tecnologias),
    "n_noticias": len(noticias),
})
with open(ARCHIVO_HTML, "w", encoding="utf-8") as archivo:
    archivo.write(pagina)

print("¡Página generada correctamente!")
print(f"Noticias: {len(noticias)} | Proyectos: {len(proyectos)} | Tecnologías: {len(tecnologias)}")
