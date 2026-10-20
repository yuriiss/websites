# Girl in navy suit — 3D model

3D reconstruction of the woman in the reference photos (front / side / back), textured with her real photos.

| File | What |
|---|---|
| `girl_navy_suit.glb` | glTF binary: two meshes (`Head`, `Body`), about 900k triangles, each with a 4K photo texture (JPEG, embedded). Opaque materials, so it shows correctly in web viewers (three.js / model‑viewer), Unity, Unreal and Godot. |
| `girl_navy_suit.blend` | Blender 4.2 scene: the same meshes and packed textures, plus studio lights and a camera (Cycles). |
| `compare_photo_vs_model.png` | Her photos (top) vs the `.glb` rendered in a web viewer (bottom) |
| `webviewer_check.png` | The `.glb` in `<model-viewer>` (Chromium): full body, face, face at 30°, side, back |
| `source/` | The scripts that build the model |

Height 1.76 m including heels, feet on the ground at the origin, facing −Y in Blender (+Z in glTF). It is a static model in the photo pose; there is no skeleton.

## How it was made

1. **Geometry from her photos**: [Hunyuan3D‑2mv](https://huggingface.co/spaces/tencent/Hunyuan3D-2mv) multi‑view image‑to‑3D.
   - Full body: from the front, side and back photos together (octree 512).
   - Head: from her front and side head crops, first upscaled 4× with Real‑ESRGAN, which gives a high‑resolution face, profile and hair.
2. **One watertight figure**: the high‑resolution head was placed on the body using the exact photo‑pixel registration of both reconstructions. The two were fused with a 1.3 mm voxel remesh, so there are no seams.
3. **Texture = her photos**: each photo (head region 4× upscaled, face detail restored with GFPGAN) was projected back onto the surface it was built from, with ray‑cast visibility.
   - Anything the front camera sees takes the front photo only, so the face matches the photo.
   - The side and back photos fill in the rest.
   - Baked to one 4K texture for the head and one for the body.

## Known limits

- The lighting from the photos is baked into the textures, as with any photo scan.
- The hairline at her right temple and the area behind the ears show small projection artefacts.
- Not rigged.

## Licence note

The geometry was generated with Tencent Hunyuan3D‑2. Its *Tencent Hunyuan 3D 2.0 Community License* applies to outputs, and that licence does not cover use in the EU, the UK or South Korea.

## Rebuilding (`source/`)

| Script | Step |
|---|---|
| `mv.py` | Hunyuan3D‑2mv call (via `gradio_client`) |
| `upscale.py`, `lmk.py` | Real‑ESRGAN/GFPGAN head upscale; MediaPipe landmarks |
| `prepviews.py` | Background removal and bounding boxes per view |
| `projbake.py` | Photo projection bake for a single reconstruction |
| `single2.py` | Head placement and voxel fusion |
| `projbake3.py` | Final photo projection with front priority |
| `finalize.py` | Scale, materials, scene, `.blend` and `.glb` export |
