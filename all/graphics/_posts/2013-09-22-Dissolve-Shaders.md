---
layout: graphics
title: Dissolve Shader Pack
snippet: A shader pack for a dissolve effect in Unity3D <strong>[Open Source]</strong>

---

Apparently when I'm bored, I write shaders. These 4 shaders were inspired by the dragon skin dissolving effect in Skyrim.  

<h4>Here's how it works: </h4>

The shader takes a texture as the pattern source for the dissolve effect. The shader uses the red channel in this texture to determine whether a fragment should be shaded normally, as a border colour, or transparent. The Burn property on the shaders controls the threshold for this change. As Burn approaches zero the number of fragments above the threshold increases, resulting in the effect progressing. The 4 shaders cover various levels of shader complexity. At the high end, the edges of the effect use a different normal map from the regularly shaded pixels and the shader renders 2 passes to properly light the interior of the object. At the low end, no normal maps are involved, and the shader is done in 1 pass with back-face culling on. 

The first six shaders should work with all types of lights. The final one "Better Interior" will only work with the first diffuse light in the scene, but provides a much more accurate version of the dissolve effect (uses geometry duplication instead of just using back face culling). It's probably less useful than the others for serious dev, but I'm including it because looking at a properly done dissolve interior looks cool. At some point I may return (with more shader experience) and add support for multiple lights to it. 

A web demo of this project is available [here](/demos/dissolve/dissolve.html)

Download the shaders [here](https://dl.dropboxusercontent.com/u/6128167/Dissolve%20Shaders.zip) 

![Screen 1](/images/post_images/2013-09-22/dissolve_screen.png)
![Screen 2](/images/post_images/2013-09-22/dissolve_control.png)

Know something that would make these shaders better? Send me a message [on Twitter](http://twitter.com/khalladay)