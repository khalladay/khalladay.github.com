---
layout: graphics
title: Dissolve Shader Pack
snippet: 4 increasingly complex shaders for dissolve effects in Unity3D <strong>[Open Source]</strong>

---

Apparently when I'm bored, I write shaders. These 4 shaders were inspired by the dragon skin dissolving effect in Skyrim.  

<h4>Here's how it works: </h4>

The shader takes a texture as the pattern source for the dissolve effect. The shader uses the red channel in this texture to determine whether a fragment should be shaded normally, as a border colour, or transparent. The Burn property on the shaders controls the threshold for this change. As Burn approaches zero the number of fragments above the threshold increases, resulting in the effect progressing. The 4 shaders cover various levels of shader complexity. At the high end, the edges of the effect use a different normal map from the regularly shaded pixels and the shader renders 2 passes to properly light the interior of the object. At the low end, no normal maps are involved, and the shader is done in 1 pass with back-face culling on. 

For now, these shaders work only with a single directional light. I plan to add support for multi lights and different types of lights later :D  

A web demo of this project is available [here](/demos/dissolve/dissolve.html)

Download the shaders [here](https://dl.dropboxusercontent.com/u/6128167/Dissolve%20Shaders.zip) 

![Screen 1](/images/post_images/2013-09-22/dissolve_screen.png)
![Screen 2](/images/post_images/2013-09-22/dissolve_control.png)

Know something that would make these shaders better? Send me a message [on Twitter](http://twitter.com/khalladay)