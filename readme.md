# MeshSurfaceParticles
I tried to simulate the "paiting" effect from [chartogne-taillet website](https://chartogne-taillet.com/en)

## Unaswered mysteries

### Particle Positioning
The position that I get after sampling does not include the offset of the whole inital mesh (since the mesh is positioned at the centered of the scene). I tried to offset them by first calculating teh bounding box of the mesh and substract half from X and Z, it didn't go well. So, I'm not sure what is the answer here? Rigth now I hardcoded some values.

### Vertex Colors from Blender
Once I switch to vertex color, all the colors became darker. The biggest impact has been on the ground (plane) objct. I guess because it only has 4 verteces. I saw that you can manually color the plane in Blander. I'm not sure it that is a possible solution.

## Resources
[https://tympanus.net/codrops/2021/08/31/surface-sampling-in-three-js/](https://tympanus.net/codrops/2021/08/31/surface-sampling-in-three-js/)
[https://threejs.org/examples/?q=points#webgl_custom_attributes_points2](https://threejs.org/examples/?q=points#webgl_custom_attributes_points2)

## The "Fun" side
I accidently opened the glb from the original website in MS 3D Viwer and I noticed that by clicking the Vertec Color checkbox, the model colors would toggle. This is what made me go the Vertex Color path.

