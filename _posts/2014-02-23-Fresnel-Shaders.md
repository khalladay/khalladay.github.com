---
layout: post
title: Fresnel Shader Pack
snippet: A collection of Fresnel shader effects for Unity3D
categories:
- all
- graphics
---

As described in my post [The Basics of Fresnel Shading](/all/blog/2014/02/18/Fresnel-Shaders-From-The-Ground-Up.html), here is a pack of shaders which all use the Fresnel effect (except for the pure reflection shader, included for contrast between Fresnel and regular reflections). 

<h4>Here's how it works: </h4>

The shaders all use the "Empirical Approximation" of Fresnel presented in the CG Tutorial from NVidia. The results are very easy to customize, but are not physically correct. Each material gives you a slider that controls how strong the Fresnel effect is, and any reflections come from Cube maps, which you can render from static scenes, or render on the fly for real time reflections. 

All the code is MIT Licensed (included in the shader files themselves). 

A web demo of this project is available [here](/demos/fresnel/fresnel.html)

Download the unitypackage [here](https://dl.dropboxusercontent.com/u/6128167/fresnel-pack.unitypackage) 

![Screen 1](/images/post&#95;images/2014-02-23/AllFresnel.png)

Know something that would make these shaders better? Send me a message [on Twitter](http://twitter.com/khalladay)

