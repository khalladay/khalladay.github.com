---
layout: post
title: It&apos;s Cool In The Shader Part 4&#58; Rim Lighting
---

Wow. Nothing like making up for lost time. Not only did I get through another tutorial this weekend, but I've put together a few shaders on my own too. Writing small programs that do cool visual things is addictive; there aren't many other areas of game dev that provide such immediate feedback for your effort. 

The aforementioned tutorial I got through involved Rim Lighting, which wasn't something I was really even aware of as a concept. I had seen it done before, but hadn't really given the effect much thought, so it was really interesting to get into writing my own shader for it. 

![This week's tutorial shader](/images/post_images/2013-06-16/RimLighting.png)
(the far right has no rim lighting, the centre and left show different ways the effect can appear)

One thing I've been concerned about with all the tutorials is the lack of theory presented. I've had this nagging fear that at the end of all the tutorials I'll be left with the tools needed to make the tutorial shaders and not much else, so I've started really diving into writing my own stuff to, most of which have nothing to do with lighting. I didn't really set out to learn shaders because I wanted to write a better Phong shader, I did it because I wanted to make really cool effects that I couldn't do in scripts, and I've definitely jumped down that rabbit hole in the past couple of days. 

I've decided to link each shader separately and not waste space on a gist in this post because there's so much to show off (and really, pictures are more fun than the gists anyways).

So here's what I got done:

<h3>1. Gradual Fading an Object </h3>
This is actually an animated shader, which fades an object out over time, working the transparency from the top (highest local y point), to the bottom of the shader. This was the first time I got to play with the time variable inside a shader, lots of potential there.  [see the code] (https://gist.github.com/khalladay/97e4fb2c195b839ca1fb)

![Fading an object](/images/post_images/2013-06-16/Fadeout.png)


<h3>2. Dual Sided Planes</h3>
I really like using planes as particles, especially custom 4 vert ones. The only issue is that the back side of them isn't rendered. This shader fixes that (albeit in a probably very clumsy way). [see the code] (https://gist.github.com/khalladay/14cca196b60616f15480)

![Dual Sided Planes](/images/post_images/2013-06-16/DualSidedPlanes.png)


<h3>3. Texture based Height-Maps</h3>
This one was weird. By default, Unity doesn't allow you to sample a texture inside a vertex function. It took a bit of digging to figure out that it was possible if you forced the shader to only compile down to glsl. The end result is a shader that sets the y of a vertex based on the green channel in the texture at that point. [see the code] (https://gist.github.com/khalladay/6a4eff17a7c51a9a032f)

![Heightmaps!](/images/post_images/2013-06-16/Heightmap.png)


As always, if you want to say hi, grab me [on Twitter](http://twitter.com/khalladay), especially if you see something in a shader here that's done wrong, or could be done better. I'm still a noob.
