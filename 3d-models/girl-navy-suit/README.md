# Girl in navy suit — 3D model

Built from the 5 reference photos (front / side / back).

| File | What |
|---|---|
| `girl_navy_suit.glb` | glTF binary — mesh + embedded 4K texture (web, three.js, Unity, Unreal, etc.) |
| `girl_navy_suit.blend` | Blender 4.2 file — mesh, material, packed texture, camera + light |
| `Girl_BaseColor.png` | 4096×4096 base-colour texture (standalone copy) |
| `preview_turnaround.png`, `preview_render.png` | renders of the model |

- Height: 1.70 m, feet on the ground at the origin, facing −Y (Blender front view).
- ~53k vertices / 106k triangles, smooth shaded, single UV map.
- Geometry: Hunyuan3D-2.1 (image-to-3D) from the front photo.
- Texture: the front, side and back photos projected onto the mesh with visibility tests, baked in Blender Cycles.
  The right side uses the mirrored left-side photo, with the crest removed.
- Not rigged: it is a static mesh in the photo pose.
