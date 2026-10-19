"""Ankle-strap stiletto sandals built from cross-sections of the posed foot, rigged to the MPFB skeleton.
exec()'d from human.py, provides build_sandals(body, rig, lift)."""
import bpy, bmesh, math
from mathutils import Vector


def build_sandals(body, rig, lift):
    dg = bpy.context.evaluated_depsgraph_get()
    mods = [(m, m.show_viewport) for m in body.modifiers]
    for m, _ in mods: m.show_viewport = (m.type == 'ARMATURE')
    dg.update()
    me_p = body.evaluated_get(dg).to_mesh()
    P = [v.co.copy() for v in me_p.vertices]
    body.evaluated_get(dg).to_mesh_clear()
    for m, s in mods: m.show_viewport = False
    dg.update()
    me_r = body.evaluated_get(dg).to_mesh()
    R = [v.co.copy() for v in me_r.vertices]
    body.evaluated_get(dg).to_mesh_clear()
    for m, s in mods: m.show_viewport = s
    ground = -lift
    gidx = {g.name: g.index for g in body.vertex_groups}
    wts = [{g.group: g.weight for g in v.groups} for v in body.data.vertices]

    def material(name, rgb, rough):
        m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
        return m
    leather = material('SandalLeather', (0.012, 0.011, 0.011), 0.3)
    solem = material('SandalSole', (0.02, 0.018, 0.017), 0.6)

    def D(bone):
        pb = rig.pose.bones[bone]
        return pb.matrix @ rig.data.bones[bone].matrix_local.inverted()

    def finish(name, bm, bone_of_vert, mat):
        """bm verts are in posed space; map each to rest via its bone and rig it rigidly."""
        inv = {}; vb = {}
        for v in bm.verts:
            b = bone_of_vert(v.co)
            if b not in inv: inv[b] = D(b).inverted()
            vb[v.index] = b
            v.co = inv[b] @ v.co
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(name, me)
        body.users_collection[0].objects.link(ob)
        ob.parent = rig; ob.matrix_world = body.matrix_world.copy()
        me.materials.append(mat)
        for p in me.polygons: p.use_smooth = True
        for b in inv:
            ob.vertex_groups.new(name=b).add([i for i, bb in vb.items() if bb == b], 1.0, 'REPLACE')
        ob.modifiers.new('Armature', 'ARMATURE').object = rig
        return ob

    def smooth(vals, k=2):
        out = []
        for i in range(len(vals)):
            s = vals[max(0, i - k):i + k + 1]; out.append(sum(s) / len(s))
        return out

    def loft(bm, rows, closed_rows=True, closed_cols=False):
        vs = [[bm.verts.new(p) for p in r] for r in rows]
        n = len(rows[0]); m = len(rows)
        for r in range(m if closed_rows else m - 1):
            a, b = vs[r], vs[(r + 1) % m]
            for k in range(n if closed_cols else n - 1):
                bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
        return vs

    made = []
    for side in ('L', 'R'):
        sgn = 1 if side == 'L' else -1
        fg = {gidx[n] for n in gidx if n == f'foot.{side}' or (n.startswith('toe') and n.endswith('.' + side))}
        lg = gidx[f'lowerleg02.{side}']
        foot = [P[i] for i, w in enumerate(wts) if sum(w.get(g, 0) for g in fg) > 0.3 and P[i].z < ground + 0.12]
        toe_y = rig.pose.bones[f'toe3-1.{side}'].head.y
        bone_of = lambda co, ty=toe_y, s=side: (f'toe3-1.{s}' if co.y < ty + 0.004 else f'foot.{s}')

        # ---------- sole: slices along the foot length
        y0 = min(p.y for p in foot); y1 = max(p.y for p in foot)
        ns = 26; slices = []
        for i in range(ns + 1):
            y = y0 + 0.002 + (y1 - y0 - 0.004) * i / ns
            sl = [p for p in foot if abs(p.y - y) < (y1 - y0) / ns]
            if len(sl) < 3: continue
            slices.append([y, min(p.x for p in sl) - 0.002, max(p.x for p in sl) + 0.002, min(p.z for p in sl) - 0.0012])
        for j in (1, 2, 3):
            col = smooth([s[j] for s in slices], 2)
            for s, v in zip(slices, col): s[j] = v
        # round the open toe end
        for s_ in slices:
            t = (s_[0] - y0) / (y1 - y0)
            if t < 0.12:
                c = (s_[1] + s_[2]) / 2; f = 0.55 + 0.45 * (t / 0.12) ** 0.5
                s_[1] = c + (s_[1] - c) * f; s_[2] = c + (s_[2] - c) * f
        nx = 9
        top = [[Vector((xa + (xb - xa) * k / nx, y, zb)) for k in range(nx + 1)] for y, xa, xb, zb in slices]
        bm = bmesh.new()
        T = [[bm.verts.new(p) for p in r] for r in top]
        B = [[bm.verts.new(p - Vector((0, 0, 0.008))) for p in r] for r in top]
        for a in range(len(T) - 1):
            b = a + 1
            for k in range(nx):
                bm.faces.new((T[a][k], T[a][k + 1], T[b][k + 1], T[b][k]))
                bm.faces.new((B[a][k], B[b][k], B[b][k + 1], B[a][k + 1]))
            bm.faces.new((T[a][0], T[b][0], B[b][0], B[a][0]))
            bm.faces.new((T[a][nx], B[a][nx], B[b][nx], T[b][nx]))
        for r in (0, len(T) - 1):
            for k in range(nx):
                bm.faces.new((T[r][k], B[r][k], B[r][k + 1], T[r][k + 1]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        made.append(finish(f'Sandal_sole.{side}', bm, bone_of, solem))

        # ---------- stiletto heel
        back = [s for s in slices if s[0] > y1 - 0.035]
        hx = sum((s[1] + s[2]) / 2 for s in back) / len(back)
        hy = y1 - 0.024; hz = min(s[3] for s in back) - 0.008
        segs = 20; rows = []
        for z, rx, ry, dy in ((hz + 0.002, 0.016, 0.02, 0.004), (hz - 0.012, 0.010, 0.011, 0.003),
                              (ground + 0.012, 0.0045, 0.0045, 0.0), (ground, 0.0042, 0.0042, 0.0)):
            rows.append([Vector((hx + rx * math.cos(2 * math.pi * i / segs), hy + dy + ry * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
        bm = bmesh.new()
        vs = loft(bm, rows, closed_rows=False, closed_cols=True)
        bm.faces.new(list(reversed(vs[0]))); bm.faces.new(vs[-1])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        made.append(finish(f'Sandal_heel.{side}', bm, lambda co, s=side: f'foot.{s}', leather))

        # ---------- ankle strap
        fh = rig.pose.bones[f'foot.{side}'].head
        za = fh.z + 0.006
        sec = [p for i, p in enumerate(P) if abs(p.z - za) < 0.006 and wts[i].get(lg, 0) + sum(wts[i].get(g, 0) for g in fg) > 0.3
               and (Vector((p.x, p.y, 0)) - Vector((fh.x, fh.y, 0))).length < 0.07]
        cen = sum(sec, Vector()) / len(sec)
        nb = 32; rad = [0.0] * nb
        for p in sec:
            a = math.atan2(p.y - cen.y, p.x - cen.x); k = int((a + math.pi) / (2 * math.pi) * nb) % nb
            rad[k] = max(rad[k], math.hypot(p.x - cen.x, p.y - cen.y))
        for k in range(nb):
            if rad[k] == 0: rad[k] = max(rad)
        rad = smooth(rad, 1)
        ang = lambda k: (k + .5) / nb * 2 * math.pi - math.pi
        rows = [[Vector((cen.x + (rad[k] + dr) * math.cos(ang(k)), cen.y + (rad[k] + dr) * math.sin(ang(k)), za + dz)) for k in range(nb)]
                for dz, dr in ((-0.0045, 0.0035), (0.0045, 0.0035), (0.0045, 0.0058), (-0.0045, 0.0058))]
        bm = bmesh.new(); loft(bm, rows, closed_rows=True, closed_cols=True)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        made.append(finish(f'Sandal_ankle.{side}', bm, lambda co, s=side: f'lowerleg02.{s}', leather))

        # ---------- toe strap: arch over the forefoot, computed in the flat rest pose of the foot
        Df = D(f'foot.{side}')
        footR = [R[i] for i, w in enumerate(wts) if sum(w.get(g, 0) for g in fg) > 0.3 and R[i].z < 0.12]
        toe_r = rig.data.bones[f'toe3-1.{side}'].head_local.y
        ys = toe_r + 0.02
        sec = [p for p in footR if abs(p.y - ys) < 0.005]
        xa = min(p.x for p in sec); xb = max(p.x for p in sec); nbx = 16
        zs = []
        for k in range(nbx + 1):
            x = xa + (xb - xa) * k / nbx
            near = [p.z for p in sec if abs(p.x - x) < (xb - xa) / nbx * 1.2]
            zs.append(max(near) if near else None)
        fill = max(z for z in zs if z is not None)
        zs = smooth([z if z is not None else fill for z in zs], 1)
        zsole = min(p.z for p in sec) - 0.001
        path = [Vector((xa - 0.0015, ys, zsole))] + [Vector((xa + (xb - xa) * k / nbx, ys, zs[k] + 0.003)) for k in range(nbx + 1)] + [Vector((xb + 0.0015, ys, zsole))]
        rows = [[Df @ (p + Vector((0, dy, dz))) for p in path] for dy, dz in ((-0.006, 0.0), (0.006, 0.0), (0.006, 0.0022), (-0.006, 0.0022))]
        bm = bmesh.new(); loft(bm, rows, closed_rows=True, closed_cols=False)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        made.append(finish(f'Sandal_toe.{side}', bm, lambda co, s=side: f'foot.{s}', leather))
    print('SANDALS', [o.name for o in made])
    return made
