# Sterke Beer – Blender-bouwscript (draait via de Blender CLI, ook in GitHub Actions)
#
#   blender -b --factory-startup -P blender/build_assets.py -- web/assets/models.json web/assets
#
# Leest de recepten uit models.json, bouwt elk model met nette, gladde vormen en
# afgeronde randen, exporteert ze als .glb voor three.js en rendert met Cycles
# portretten (voor de dialogen) en iconen (voor de superkrachten).
import bpy, bmesh, json, sys, os, math, time
from mathutils import Matrix, Vector, Euler

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SRC = argv[0] if argv else "web/assets/models.json"
OUT = argv[1] if len(argv) > 1 else "web/assets"
ONLY = argv[2].split(",") if len(argv) > 2 and argv[2] else None
SAMPLES = int(os.environ.get("SB_SAMPLES", "64"))
RES = int(os.environ.get("SB_RES", "384"))
data = json.load(open(SRC))
for d in ("models", "portraits", "icons"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

# three.js-assen (Y omhoog, +Z voor) -> Blender (Z omhoog, -Y voor)
CV = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
def v3(p): return CV @ Vector(p)

def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hexcol(h):
    h = h.lstrip("#")
    return tuple(srgb_to_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)

def log(*a):
    print("[SB]", *a, flush=True)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()

MATS = {}
def setin(node, names, val):
    for n in names:
        if n in node.inputs:
            try:
                node.inputs[n].default_value = val
                return True
            except Exception:
                pass
    return False

def get_mat(color, kind):
    key = color + "|" + (kind or "")
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(name=(kind or "mat") + "_" + color.lstrip("#"))
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    col = hexcol(color)
    setin(b, ["Base Color"], col)
    rough = {"skin": 0.5, "eye": 0.1, "shiny": 0.28, "cloth": 0.95, "metal": 0.28, "glass": 0.05,
             "emit": 0.4, "glow": 0.35, "leaf": 0.7, "stone": 0.9, "wood": 0.75, "roof": 0.6, "wall": 0.85}.get(kind, 0.8)
    setin(b, ["Roughness"], rough)
    if kind == "metal":
        setin(b, ["Metallic"], 0.7)
    if kind in ("skin", "shiny"):
        setin(b, ["Coat Weight", "Clearcoat"], 0.25)
    if kind in ("emit", "glow"):
        setin(b, ["Emission Color", "Emission"], col)
        setin(b, ["Emission Strength"], 1.6 if kind == "emit" else 0.5)
    if kind == "glass":
        setin(b, ["Alpha"], 0.55)
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            try: m.blend_method = "BLEND"
            except Exception: pass
    MATS[key] = m
    return m

def star_mesh():
    bm = bmesh.new()
    pts = []
    for i in range(10):
        r = 0.45 if i % 2 else 1.0
        a = i / 10 * math.pi * 2 + math.pi / 2
        pts.append((math.cos(a) * r, math.sin(a) * r))
    front = [bm.verts.new(v3((x, y, 0.15))) for x, y in pts]
    back = [bm.verts.new(v3((x, y, -0.15))) for x, y in pts]
    cf = bm.verts.new(v3((0, 0, 0.32)))
    cb = bm.verts.new(v3((0, 0, -0.32)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[i], front[j], cf))
        bm.faces.new((back[j], back[i], cb))
        bm.faces.new((front[j], front[i], back[i], back[j]))
    me = bpy.data.meshes.new("star")
    bm.normal_update(); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new("star", me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    return ob

def deselect():
    for o in bpy.context.selected_objects:
        o.select_set(False)

def make_prim(p):
    t = p["type"]
    deselect()
    if t == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=18, radius=1)
    elif t == "box":
        bpy.ops.mesh.primitive_cube_add(size=1)
    elif t == "cyl":
        bpy.ops.mesh.primitive_cylinder_add(vertices=p.get("seg") or 28, radius=1, depth=1)
    elif t == "cone":
        bpy.ops.mesh.primitive_cone_add(vertices=p.get("seg") or 28, radius1=1, radius2=0, depth=1)
    elif t == "torus":
        a = p.get("args", [0.3, 0.05])
        bpy.ops.mesh.primitive_torus_add(major_radius=a[0], minor_radius=a[1], major_segments=40, minor_segments=14)
    elif t == "ico":
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
    elif t == "star":
        star_mesh()
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1)
    ob = bpy.context.view_layer.objects.active
    ob.select_set(True)

    if t == "cyl" and p.get("top") and p["top"] != 1:
        me = ob.data
        for v in me.vertices:
            if v.co.z > 0:
                v.co.x *= p["top"]; v.co.y *= p["top"]

    r = p.get("rot") or [0, 0, 0]
    R3 = Euler([math.radians(x) for x in r], "XYZ").to_matrix()
    Rb = (CV @ R3 @ CV.transposed()).to_4x4()
    sx, sy, sz = p["scale"]
    S = Matrix.Diagonal((sx, sz, sy, 1.0))  # three (x,y,z) schaal -> blender (x,z,y)
    T = Matrix.Translation(v3(p["pos"]))
    ob.matrix_world = T @ Rb @ S
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    if t == "box" and p.get("round"):
        mod = ob.modifiers.new("bevel", "BEVEL")
        mod.width = p["round"]; mod.segments = 3; mod.limit_method = "ANGLE"
    if t in ("ico", "box", "star") or p.get("mat") == "stone":
        bpy.ops.object.shade_flat()
    else:
        try:
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))
        except Exception:
            bpy.ops.object.shade_smooth()
    ob.data.materials.append(get_mat(p["color"], p.get("mat")))
    return ob

def build(name):
    r = data["models"][name]
    per_part = {}
    for p in r["prims"]:
        per_part.setdefault(p["part"], []).append(make_prim(p))
    part_obj = {}
    for pname, objs in per_part.items():
        deselect()
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1:
            bpy.ops.object.join()
        ob = bpy.context.view_layer.objects.active
        # modifiers (bevel) toepassen
        for mod in list(ob.modifiers):
            try: bpy.ops.object.modifier_apply(modifier=mod.name)
            except Exception: pass
        ob.name = pname; ob.data.name = pname
        bpy.context.scene.cursor.location = v3(r["parts"][pname]["pivot"])
        bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
        part_obj[pname] = ob
    for pname, d in r["parts"].items():
        if d.get("parent") and pname in part_obj and d["parent"] in part_obj:
            ch, pa = part_obj[pname], part_obj[d["parent"]]
            ch.parent = pa
            ch.matrix_parent_inverse = pa.matrix_world.inverted()
    return part_obj

def export(name, path):
    deselect()
    for o in bpy.context.scene.objects:
        if o.type == "MESH":
            o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                              export_apply=True, export_yup=True)

# ---------------- renderen ----------------
def setup_render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = SAMPLES
    try: sc.cycles.use_denoising = True
    except Exception: pass
    sc.cycles.device = "CPU"
    sc.render.film_transparent = True
    sc.render.resolution_x = RES; sc.render.resolution_y = RES
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    try:
        sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
    except Exception: pass
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (0.72, 0.82, 1.0, 1); bg.inputs[1].default_value = 0.45

def add_light(name, loc, target, energy, size, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = energy; ld.size = size; ld.color = color
    ob = bpy.data.objects.new(name, ld); bpy.context.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return ob

def shoot(target3, dist, path, dir3=(0.32, 0.18, 1.0), lens=60):
    target = v3(target3)
    d = v3(dir3).normalized()
    cam_d = bpy.data.cameras.new("cam"); cam_d.lens = lens
    cam = bpy.data.objects.new("cam", cam_d); bpy.context.collection.objects.link(cam)
    cam.location = target + d * dist
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    key = add_light("key", target + v3((1.6, 2.2, 2.4)) * (dist / 2), target, 140 * (dist / 2) ** 2, 2.5, (1.0, 0.95, 0.88))
    fill = add_light("fill", target + v3((-2.2, 0.6, 1.6)) * (dist / 2), target, 45 * (dist / 2) ** 2, 3.0, (0.85, 0.9, 1.0))
    rim = add_light("rim", target + v3((0.4, 1.6, -2.4)) * (dist / 2), target, 120 * (dist / 2) ** 2, 1.5, (1.0, 0.9, 1.0))
    bpy.context.scene.render.filepath = path
    t = time.time()
    bpy.ops.render.render(write_still=True)
    log("render", os.path.basename(path), "%.1fs" % (time.time() - t))
    for o in (cam, key, fill, rim):
        bpy.data.objects.remove(o, do_unlink=True)

def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx

def to_three(v):  # blender -> three
    return [v.x, v.z, -v.y]

# ---------------- hoofdprogramma ----------------
names = ONLY or list(data["models"].keys())
t0 = time.time()
for name in names:
    reset()
    parts = build(name)
    export(name, os.path.join(OUT, "models", name + ".glb"))
    log("model", name, "parts:", len(parts))

    if name in data.get("portraits", {}) and os.environ.get("SB_RENDER", "1") == "1":
        setup_render()
        for pn, ob in parts.items():
            ob.hide_render = pn.startswith("acc_")
        pr = data["portraits"][name]
        shoot(pr["target"], pr["dist"], os.path.join(OUT, "portraits", name + ".png"))
        if name == "beer":
            # superkracht-iconen: elk accessoire los gerenderd
            items = {}
            for pn in parts:
                if pn.startswith("acc_"):
                    item = pn[4:]
                    if item.endswith("L") or item.endswith("R"):
                        if item[:-1] in ("laarzen",): item = item[:-1]
                    items.setdefault(item, []).append(parts[pn])
            for item, objs in items.items():
                for ob in parts.values():
                    ob.hide_render = ob not in objs
                mn, mx = world_bbox(objs)
                c = (mn + mx) / 2
                size = max((mx - mn).length, 0.2)
                shoot(to_three(c), size * 1.2, os.path.join(OUT, "icons", item + ".png"), dir3=(0.55, 0.35, 1.0), lens=50)
            # heel de beer, voor het titelscherm
            for pn, ob in parts.items():
                ob.hide_render = pn.startswith("acc_") and pn not in ("acc_cape", "acc_sjaal")
            shoot([0, 0.85, 0], 2.7, os.path.join(OUT, "portraits", "beer_full.png"), dir3=(0.45, 0.2, 1.0), lens=50)
    if name == "star" and os.environ.get("SB_RENDER", "1") == "1":
        setup_render()
        shoot([0, 0, 0], 2.2, os.path.join(OUT, "icons", "moedster.png"), dir3=(0.3, 0.2, 1.0))
log("klaar in %.0fs" % (time.time() - t0))
