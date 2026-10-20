# Girl in navy suit — 3D character

Rigged, textured 3D character built from the five reference photos (front / side / back / A‑pose).

| File | What |
|---|---|
| `girl_navy_suit.blend` | Blender 4.2 scene: rigged character (163‑bone MakeHuman skeleton, posed like the photos), full materials, studio lights, camera, shadow‑catcher floor. All textures packed. |
| `girl_navy_suit.glb` | glTF binary of the same character: skinned to the rig (the photo pose is the rest pose), plain PBR materials, textures embedded (max 2048 px). Works in three.js, Unity, Unreal, Godot, etc. |
| `render_front.png`, `render_side.png`, `render_back.png`, `render_face.png` | Cycles renders of the `.blend` |
| `compare_photo_vs_model.png` | Photos (top) vs model (bottom) |
| `fit_silhouette_front.png` | Body fit check: photo silhouette (red) vs model (blue), overlap grey |
| `fit_profile.png` | Face profile fit: her photo profile (red line) on the model's head |
| `source/` | The scripts that build the character (see below) |

## How it was made

- **Base**: [MPFB 2](https://static.makehumancommunity.org/mpfb.html) (MakeHuman for Blender), a parametric female mesh with clean topology and a 163‑bone rig.
- **Face shape, fitted to her photos**: the model's 478 MediaPipe facial landmarks were mapped onto the mesh, and least squares solved about 190 MakeHuman face controls so that the landmarks match the front photo (2.7 mm RMS). Her side‑photo profile, from forehead to under the chin, was matched at the same time (1 mm RMS), and the crown height was constrained to her eye‑to‑chin ratio.
- **Body, fitted to her silhouettes**: width and depth profiles of the front and side photos were compared with renders of the model (normalised eye‑to‑floor), and hips, waist, shoulders, arm position, stance and skirt length were adjusted until they matched (see `fit_silhouette_front.png`).
- **Face texture**: her photo face (upscaled 4× with Real‑ESRGAN and restored with GFPGAN) was warped onto the fitted head landmark‑by‑landmark and blended into the skin. The rest of the body skin was colour‑matched to it.
- **Hair**: her real hair colour and waves were projected from the front, back and side photos onto the hair mesh, using a hair‑only segmentation mask per photo.
- **Outfit**: navy blazer with lapels and her gold anchor crest (from the photo, on the chest pocket), white V‑neck blouse, knee‑length navy pencil skirt with back slit, black ankle‑strap stilettos.
- Feet on the ground at the origin; facing −Y in Blender (+Z forward in glTF).

## Re-posing

In the `.blend`, select `Girl_rig` → Pose Mode and rotate bones; clothes, hair and shoes follow.
The `.glb` has the same skeleton, so it can be retargeted or animated (for example with Mixamo‑style rigs) in any engine.

## Asset credits

- MakeHuman base mesh, skin (`toigo_light_skin_female_bronze` by MargaretToigo), eyes, brows, lashes, skirt (`female_elegantsuit01`) and hair (`culturalibre_hair_01` by culturalibre): **CC0**.
- Blazer is derived from `mindfront_m_suit_01` by **Mindfront**: **CC‑BY**. Credit "Mindfront" if you publish it.

## Rebuilding

`source/human.py` builds the character from `source/character.json` (MPFB 2.0.18, Blender 4.2). The face fitting is done by `fit_face_blender.py` and `solve_face2.py`, the body fitting by `silh.py`, `runs.py` and `overlay.py`, and the texture projections by `project_face.py`, `compose_face.py` and `hair_project.py`. `export.py` writes the .blend and .glb. They expect the MakeHuman asset packs (system assets, skins01, hair01, suits02/03) to be installed in MPFB's data folder.
