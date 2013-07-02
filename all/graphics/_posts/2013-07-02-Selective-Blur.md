---
layout: graphics
title: Selective-Blur
snippet: Per-Material blurring for Unity3D. Allows single objects to be blurred without the need to blur everything. <strong>[Open Source]</strong>

---

Selective-Blur is my first released graphics project! It's a shader replacement effect for Unity Pro that allows blurring of individual materials without blurring the entire scene. 


<h4>Here's how it works: </h4>

A camera with the blur effect script is childed to the user's camera. The blur effect script calls RenderWithShader on the camera every frame, and uses a replacement shader that looks for specific RenderType tags in the materials in view. The output is rendered to a texture, which then has a gaussian blur applied to it before being drawn as a GUI texture over top of the user's view. 

A web demo of this project is available [here](/demos/blurdemo/blurdemo.html)

This project is open source! Check out the repo [here](https://github.com/khalladay/Unity-SelectiveBlur) 

![blur1](/images/post_images/2013-07-02/blur1.png)
![blur2](/images/post_images/2013-07-02/blur2.png)

I will be maintaining and improving this repository whenever the mood strikes me. I would like to optimize it to avoid using GUI.DrawTexture, add support for blur mask textures, and increase the number of blur shaders present. Pull requests are very welcome if you want to add or fix up something before I get to it :D