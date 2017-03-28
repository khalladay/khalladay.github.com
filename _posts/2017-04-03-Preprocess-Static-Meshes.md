---
layout: post
title: Preprocess Meshes For Fun And Profit
categories:
tags:
- <span style="background-color:#5555AA;"><font color="white">&nbsp;&nbsp;C++&nbsp;&nbsp;</font></span>
---

One of my goals for 2017 is to learn a new graphics api (I chose DX12), and of course to do anything useful without an engine, this means that I'm also re-learning a bunch of things that I haven't had to do in years, like loading meshes. I've been spoiled by big shiny game engines that have done this for me for so long that I forgot how to do it.

Googling around turned up a bunch of tutorials, which were handy when combined with the FBX SDK docs, but none of the tutorials by themselves really explained things in a way that made sense to me. So... I figured I'd try my hand at writing one. This post is just going to cover loading a static mesh with normals, tangents, uvs, and vertex color. I'll write a second installment to cover skinned meshes later (when I decide I want skinned meshes in my DX12 programs).

Here goes.
