# Girl in navy suit — 3D character

Rigged, textured 3D character built from the five reference photos (front / side / back / A‑pose).

| File | What |
|---|---|
| `girl_navy_suit.blend` | Blender 4.2 scene: rigged character (163‑bone MakeHuman skeleton, posed like the photos), full materials, studio lights, camera, shadow‑catcher floor. All textures packed. |
| `girl_navy_suit.glb` | glTF binary of the same character: skinned to the rig (the photo pose is the rest pose), plain PBR materials, textures embedded (max 2048 px). Works in three.js, Unity, Unreal, Godot, etc. |
| `render_front.png`, `render_side.png`, `render_back.png`, `render_face.png` | Cycles renders of the `.blend` |
| `compare_photo_vs_model.png` | Photos (top) vs model (bottom) |
| `source/` | The scripts that build the character (see below) |

## How it was made

- **Body and face**: [MPFB 2](https://static.makehumancommunity.org/mpfb.html) (MakeHuman for Blender) parametric female base mesh with clean topology, shaped with face and body targets to match her proportions.
- **Face likeness**: 478 MediaPipe face landmarks were detected on her photo and on a render of the 3D head. Her photo face (upscaled 4× with Real‑ESRGAN and restored with GFPGAN) was then warped triangle‑by‑triangle onto the head and baked into the skin texture. The rest of the body skin was colour‑matched to it. Brown eyes, lashes and brows are separate meshes.
- **Outfit**: navy single‑breasted blazer with lapels and her gold anchor crest (taken from the photo, upscaled and baked onto the chest pocket); white blouse with an open V; knee‑length navy pencil skirt with a back slit.
- **Hair**: long, centre‑parted, brown with lighter highlights and soft waves.
- **Shoes**: black ankle‑strap stiletto sandals, generated from cross‑sections of the posed foot and rigged to the foot bones.
- Height 1.71 m barefoot plus about 8 cm of heel; feet on the ground at the origin; facing −Y in Blender (+Z forward in glTF).

## Re-posing

In the `.blend`, select `Girl_rig` → Pose Mode and rotate bones; clothes, hair and shoes follow.
The `.glb` has the same skeleton, so it can be retargeted or animated (for example with Mixamo‑style rigs) in any engine.

## Asset credits

- MakeHuman base mesh, skin (`toigo_light_skin_female_bronze` by MargaretToigo), eyes, brows, lashes, skirt (`female_elegantsuit01`) and hair (`culturalibre_hair_01` by culturalibre): **CC0**.
- Blazer is derived from `mindfront_m_suit_01` by **Mindfront**: **CC‑BY**. Credit "Mindfront" if you publish it.

## Rebuilding

`source/human.py` builds the character from `source/character.json` using MPFB 2.0.18 in Blender 4.2. The face and crest projection, sandals and export are done by the other scripts in `source/`. They expect the MakeHuman asset packs (system assets, skins01, hair01, suits02/03) to be installed in MPFB's data folder.
