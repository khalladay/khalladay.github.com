---
layout: post
title: Loading Static Meshes With the FBX SDK
categories:
tags:
- <span style="background-color:#CCAA00;"><font color="white">&nbsp;&nbsp;Gfx&nbsp;&nbsp;</font></span>
---

One of my goals for 2017 is to learn a new graphics api, and since this means working without an engine for the first time in years, this means that I'm also re-learning a bunch of things that I've long since forgotten, like loading meshes. I've been spoiled by big shiny game engines that have done this for me for so long that I forgot how to do it.

Since it seems that fbx has won the mesh file format wars for now, I figured it made the most sense to write an FBX importer. Googling around turned up a bunch of tutorials, which were handy when combined with the FBX SDK docs, but none of the tutorials by themselves really explained things in a way that made sense to me, so I thought I'd write my own.

This post is just going to cover loading a static mesh with normals, multiple uv sets, and vertex colors. We'll just be filling out a simple Mesh struct with this info; you'll have to do the work of actually rendering it yourself. I'll write a second installment to cover skinned meshes later.

If you need a mesh to work with for this tutorial, you can use the one that I've uploaded [here](), it's a super fun cube mesh, so be excited. Finally, This post was written assuming that you're using the 2017 sdk, so if you're from the future, things might be different for you.


## Setting Up Your Project

This section is assuming that you're using Visual Studio. Skip it and do your own thing if that isn't the case for you :)

The first thing that we need to do is get a project including/linking with the FBX SDK. You can grab the sdk off of [Autodesk's Site](http://usa.autodesk.com/adsk/servlet/pc/item?siteID=123112&id=10775847), and install it wherever you want it to be.

Next, create a project in VS, and open up the project properties window. We need to tell our project where to look to see the SDK we just installed. This part should mostly be familiar to you if you've ever worked with an external library before, but there's some nuances to the FBX SDK that are worth mentioning.

In the Property window, navigate to the "VC++ Directories" tab. It should look something like this:

<div align="center">
<img src="/images/post_images/2017-04-07/vcdirectories.PNG"/><br>
</div>

Just like any other library, you need to add the "include" directory of the FBX SDK to the "Include Directories" item, and the path to the SDK library folder to your "Library Directories" item. Make sure that you use the debug libraries for your debug project configuration, and the release libraries for your release config, otherwise you may run into issues when you try to build.

Next, we need to tell the linker which library file to use, so navigate to the Linker->Input page:

<div align="center">
<img src="/images/post_images/2017-04-07/linkerinput.PNG"/><br>
</div>

We need to add the library name to the "Additional Dependencies" item, but this is where we need to pay some special attention to what we're doing. The FBX SDK ships with a number of libraries, a .DLL and two .lib files. To make things easier, I used one of the static libraries instead of the dll (so that I didn't have to worry about where the DLL was located). This means that there were two options: libfbxsdk-md.lib and libfbxsdk-mt.lib (mt for multithreaded). You can choose to use either one, but both of them require one additional step.

Regardless of which one you entered, you will need to navigate to the code generation tab:

<div align="center">
<img src="/images/post_images/2017-04-07/codegeneration.png"/><br>
</div>

If you chose to use the -MD variant, you will need to make sure that your "Runtime Library" setting is set to "/MD" in release and "/MDd" in debug. Predictably, if you choose the -MT variant (like I did), these need to be "/MT" and "/MTd" respectively.

Ok, that covers the set up, let's import some meshes shall we?

## Setting up the FBX Importer

## Getting To The Mesh

While they're probably most commonly used to store meshes (at least in my experience), FBX files can be used to store entire 3D scenes, containing meshes, materials, lights, animation data, NURB curves, LOD Groups, and a whole bunch of other stuff. For the most part, if you're importing a mesh from and FBX file, you hope that the file just has the mesh you want, but that isn't always the case, which is why the first thing we need to do is traverse our imported FBX scene and find the mesh (or meshes!) contained in it.
