# Sterke Beer – 3D-printbaar poppetje met klik-accessoires (Blender CLI)
#
#   blender -b --factory-startup -P blender/build_print.py -- web/assets/models.json print
#
# Maakt van hetzelfde recept als de game:
#   * beer_poppetje.stl  – de beer op een standaardje, met gaatjes op hoofd, ogen, nek, rug, handen, riem en voeten
#   * <accessoire>.stl   – elke superkracht met een pinnetje dat in het juiste gaatje klikt
#   * printset.png       – een render van de hele set
# Alles wordt waterdicht gemaakt (voxel-remesh) zodat elke slicer het snapt.
import bpy, bmesh, sys, os, math, time
from mathutils import Matrix, Vector

# Hergebruik de bouwfuncties uit build_assets.py (zonder het hoofdprogramma uit te voeren)
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, "build_assets.py")).read()
exec(_src.split("# ---------------- hoofdprogramma ----------------")[0])

OUTP = OUT  # tweede argument
PR = data["print"]
S = PR["scale"]
BEER = data["models"]["beer"]
VOX_BODY = float(os.environ.get("SB_VOX_BODY", "0.38"))
VOX_ACC = float(os.environ.get("SB_VOX_ACC", "0.22"))

def vmm(p):  # three-eenheden -> blender millimeters
    return v3(p) * S

def apply_all(ob):
    deselect(); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    for m in list(ob.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=m.name)
        except Exception as e:
            log("modifier mislukt", m.name, e); ob.modifiers.remove(m)

def join(objs, name):
    deselect()
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    for m in list(ob.modifiers):  # afrondingen
        try: bpy.ops.object.modifier_apply(modifier=m.name)
        except Exception: pass
    return ob

def to_mm(ob):
    ob.matrix_world = Matrix.Scale(S, 4) @ ob.matrix_world
    deselect(); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def remesh(ob, vox):
    m = ob.modifiers.new("remesh", "REMESH"); m.mode = "VOXEL"; m.voxel_size = vox; m.adaptivity = 0.0
    try: m.use_smooth_shade = True
    except Exception: pass
    apply_all(ob)

def boolean(ob, cutter, op):
    m = ob.modifiers.new("bool", "BOOLEAN"); m.operation = op; m.object = cutter
    try: m.solver = "EXACT"
    except Exception: pass
    apply_all(ob)

def remove(ob):
    bpy.data.objects.remove(ob, do_unlink=True)

def cylinder_between(a, b, r, verts=32):
    a, b = Vector(a), Vector(b)
    d = b - a
    deselect()
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(a + b) / 2)
    ob = bpy.context.view_layer.objects.active
    ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    deselect(); ob.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return ob

def bar_prim(p):  # 'bar': cilinder van punt A (pos) naar punt B (scale), in three-eenheden
    return cylinder_between(v3(p["pos"]), v3(p["scale"]), p.get("r", 0.03))

def box_mm(center, size):
    deselect()
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    ob = bpy.context.view_layer.objects.active
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return ob

def decimate(ob, max_faces=220000):
    n = len(ob.data.polygons)
    if n > max_faces:
        m = ob.modifiers.new("dec", "DECIMATE"); m.ratio = max_faces / n
        apply_all(ob)

def export_stl(ob, path):
    deselect(); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    try:
        bpy.ops.wm.stl_export(filepath=path, export_selected_objects=True, apply_modifiers=True)
    except Exception:
        bpy.ops.export_mesh.stl(filepath=path, use_selection=True)
    log("STL", os.path.basename(path), "%d vlakken" % len(ob.data.polygons),
        "afm: %.0fx%.0fx%.0f mm" % tuple(ob.dimensions))

def socket_geo(name):
    s = PR["sockets"][name]; z = PR["pegs"][s["size"]]
    p = vmm(s["pos"]); d = v3(s["dir"]).normalized()
    return p, d, z

# ---------------- het poppetje ----------------
t0 = time.time()
reset()
body_prims = [p for p in BEER["prims"] if not p["part"].startswith("acc_")]
body = join([make_prim(p) for p in body_prims], "beer")
to_mm(body)
remesh(body, VOX_BODY)
log("lijf waterdicht", len(body.data.polygons), "vlakken")

# kopie (iets dikker) om straks van de accessoires af te trekken, zodat ze precies passen
mold = body.copy(); mold.data = body.data.copy(); bpy.context.collection.objects.link(mold); mold.name = "mal"
dm = mold.modifiers.new("dik", "DISPLACE"); dm.strength = 0.25; dm.mid_level = 0.0
apply_all(mold)
decimate(mold, 60000)
mold.hide_render = True

# gaatjes
for sname in PR["sockets"]:
    p, d, z = socket_geo(sname)
    hole = cylinder_between(p - d * 1.5, p + d * z["depth"], z["hole"] / 2, 32)
    boolean(body, hole, "DIFFERENCE"); remove(hole)
# onderkant vlak afsnijden en een rond standaardje eronder
cut = box_mm((0, 0, -50 + 0.3), (300, 300, 100)); boolean(body, cut, "DIFFERENCE"); remove(cut)
deselect()
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.47 * S, depth=4.0, location=(0, 0.02 * S, -2.0 + 0.3))
base = bpy.context.view_layer.objects.active
bev = base.modifiers.new("bevel", "BEVEL"); bev.width = 1.2; bev.segments = 3; apply_all(base)
boolean(body, base, "UNION"); remove(base)
decimate(body)
export_stl(body, os.path.join(OUTP, "beer_poppetje.stl"))
log("poppetje klaar in %.0fs" % (time.time() - t0))

# ---------------- accessoires ----------------
pieces = {}
for name, pc in PR["pieces"].items():
    t = time.time()
    prims = [p for p in BEER["prims"] if p["part"] in pc["parts"]]
    objs = [make_prim(p) for p in prims]
    for p in pc.get("extra", []):
        objs.append(bar_prim(p) if p["type"] == "bar" else make_prim(p))
    ob = join(objs, name)
    to_mm(ob)
    remesh(ob, VOX_ACC)
    # stukje weghalen zodat hij om het lijf heen past
    if pc.get("keep"):
        axis, op, c = pc["keep"]
        # three z > c  <=>  blender y < -c
        yb = -c * S
        if op == ">": cut = box_mm((0, yb + 150, 0), (400, 300, 400))
        else: cut = box_mm((0, yb - 150, 0), (400, 300, 400))
        boolean(ob, cut, "DIFFERENCE"); remove(cut)
    boolean(ob, mold, "DIFFERENCE")
    # pinnetje
    p, d, z = socket_geo(pc["socket"])
    peg = cylinder_between(p - d * 2.5, p + d * (z["depth"] - 0.4), z["peg"] / 2, 32)
    ch = peg.modifiers.new("bevel", "BEVEL"); ch.width = 0.4; ch.segments = 2; apply_all(peg)
    boolean(ob, peg, "UNION"); remove(peg)
    decimate(ob, 120000)
    export_stl(ob, os.path.join(OUTP, name + ".stl"))
    ob.data.materials.clear()
    col = (prims[0]["color"] if prims else pc["extra"][-1]["color"])
    ob.data.materials.append(get_mat(col, "shiny"))
    pieces[name] = ob
    log("accessoire", name, "%.1fs" % (time.time() - t))

# ---------------- render van de hele set ----------------
if os.environ.get("SB_RENDER", "1") == "1":
    remove(mold)
    body.data.materials.clear(); body.data.materials.append(get_mat("#d9a873", "shiny"))
    names = list(pieces.keys()); n = len(names)
    FLOOR = -3.7
    for i, nm in enumerate(names):
        ob = pieces[nm]
        pts = [ob.matrix_world @ Vector(v) for v in ob.bound_box]
        c = sum(pts, Vector()) / 8; minz = min(p.z for p in pts)
        a = math.pi * (-0.05 + 1.1 * i / max(1, n - 1))
        ring = 105 if i % 2 else 80
        ob.location += Vector((math.cos(a) * ring * 1.25 - c.x, math.sin(a) * ring + 20 - c.y, FLOOR - minz))
    deselect()
    bpy.ops.mesh.primitive_plane_add(size=6000, location=(0, 0, FLOOR))
    floor = bpy.context.view_layer.objects.active
    floor.data.materials.append(get_mat("#d9ecff", "cloth"))
    setup_render()
    sc = bpy.context.scene; sc.render.film_transparent = False
    sc.render.resolution_x = 1400; sc.render.resolution_y = 900
    cam_d = bpy.data.cameras.new("cam"); cam_d.lens = 36
    cam = bpy.data.objects.new("cam", cam_d); bpy.context.collection.objects.link(cam)
    cam.location = (0, -250, 250); tgt = Vector((0, 40, 20))
    cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler(); sc.camera = cam
    for nm_, rot, en, col in (("zon", (0.7, 0.2, 0.6), 1.7, (1, 0.96, 0.9)), ("vul", (1.0, -0.3, -2.4), 0.5, (0.85, 0.9, 1))):
        ld = bpy.data.lights.new(nm_, "SUN"); ld.energy = en; ld.color = col; ld.angle = 0.2
        lo = bpy.data.objects.new(nm_, ld); bpy.context.collection.objects.link(lo); lo.rotation_euler = rot
    sc.render.filepath = os.path.join(OUTP, "printset.png")
    bpy.ops.render.render(write_still=True)
    log("render printset.png")
log("alles klaar in %.0fs" % (time.time() - t0))
