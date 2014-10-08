---
layout: post
title: Dissolve Shader Pack
categories:
- all
- graphics
---

Apparently when I'm bored, I write shaders. These shaders were inspired by the dragon skin dissolving effect in Skyrim.  

<h4>Here's how it works: </h4>

The shader takes a texture as the pattern source for the dissolve effect. The shader uses the red channel in this texture to determine whether a fragment should be shaded normally, as a border colour, or transparent. The Burn property on the shaders controls the threshold for this change. As Burn approaches zero the number of fragments above the threshold increases, resulting in the effect progressing. The "Interior" shaders have back face culling turned off, allowing some of the interior of the mesh to show through, although it isn't as accurate as true geometry duplication. 

At some point in the future I will return and add a working version of my geometry duplication shader, however for the moment I've only had luck getting it to work with the first pixel light in the scene and I'd rather not post something that doesn't work.

A web demo of this project is available [here](/demos/dissolve/dissolve.html)

Download the shaders [here](https://dl.dropboxusercontent.com/u/6128167/Dissolve%20Shaders.zip) 

![Screen 1](/images/post_images/2013-09-22/dissolve_screen.png)
![Screen 2](/images/post_images/2013-09-22/dissolve_control.png)

Know something that would make these shaders better? Send me a message [on Twitter](http://twitter.com/khalladay)