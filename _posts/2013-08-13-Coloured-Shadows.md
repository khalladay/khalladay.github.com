---
layout: post
title: Multi Coloured Shadows In Unity
categories:
- blog
tags:
- <span style="background-color:grey;"><font color="white">&nbsp;Unity&nbsp;</font></span>

---

<div style="background-color:#EEAAAA;">NOTE: This article is OLD! (From 2013!). Information in it may be out of date or outright useless, and I have no plansto update it. Beware!
</div>

<br>

**UPDATE&#58; I've posted a tutorial on how to get coloured shadows working in your project. Check it out [here](http://kylehalladay.com/all/blog/2014/05/16/Coloured-Shadows-In-Unity.html)**

Lately, in my (precious little) free time, I've been working on a custom shadow receiver system which will give me greater control over the appearance of soft shadows in Unity. On the surface, it sounds like a fun project. It gets slightly more insane when you take into account that i had never so much as written my own shadow map system before starting this. Crawling is boring, I tend to jump (metaphorical) cliffs and hope that I figure out flying, running, landing, and crawling by the time I hit ground. 

At first, I thought I'd actually start from the ground up and simply disable the Unity shadows altogether and substitute my own depth maps. It works pretty well for one light, but I've run into issues trying to pass multiple shadow maps to multiple passes in Unity. I'm not yet sure whether thats a limitation on my own knowledge, or just something that Unity doesn't let you do. Once I hit that wall though, it occurred to me that it might just be easier to tap into the shadow maps already being generated. It would certainly save a lot of extra scripts, and would benefit from all the work that's already gone into Unity. 

<div align="center">
	<img src="/images/post_images/2013-08-13/shadowmap.png" /><br>
	<font size="2">
	(Manually making shadow maps, the depth map from the light is displayed in the corner)
	</font>
</div>
<br>

And so, I (once again) entered the wonderful world of undocumented Unity functionality. This time, I ended up delving through the CGInclude files that come with the built in shaders. The result of this was an interesting set of variables defined in the UnityShaderVariables.cginc and AutoLight.cginc files, namely: unity_World2Shadow&#91;4&#93;, _ShadowMapTexture, _LightShadowData and the macro UNITY_SAMPLE_SHADOW_PROJ.

Most of the above is self explanatory, but the macro was something I hadn't thought about. A lot of functionality is wrapped in macros in the built in shaders, which handle the difference between DirectX and GLSL shading. 

Once I knew what the internal variables were called, it was pretty easy to get rudimentary hard shadows up and running using the built in shadow map.... for one light. I'm still working on getting multiple lights working at once, but, in the interest of enjoying small victories, I figured I'd do something a bit fun with the new shadows I had made. Since I now have complete control over the shader producing the shadows, why not change their colour. Therefore, may I present, the most fabulous looking hard shadows ever produced in Unity...probably!

<div align="center">
	<img src="/images/post_images/2013-08-13/multi-shadows.png" /><br>
	<font size="2">
	(The purple's darkness gets set by the depth value for that fragment)
	</font>
</div>
<br>

A lot of work goes into making games look realistic, but I think that there's a lot to be said for making games look uniquely different from norm. Purple shadows are how I'm doing that today :D

As always, send me a message [on Twitter](http://twitter.com/khalladay) if you want to chat (especially about games or graphics).
