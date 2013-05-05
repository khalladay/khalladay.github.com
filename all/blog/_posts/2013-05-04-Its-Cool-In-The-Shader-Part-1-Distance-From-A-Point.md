---
layout: post
title: It's Cool In The Shader Part 1: Distance From a Point
---

I have a bit of a love hate relationship with shaders. On the one hand, I'm absolutely in love with the possibilities they offer. Programming visual effects is probably my favourite part of programming, and a lot of the really cool effects that I'm inspired by are made with shaders. On the other hand, as far as programming skills go, they're the Greedo to my Han. I've tried to learn how to write them a few times before (most notably last December, where I spent a month trying to make good looking soft shadows in Ogre), but I've never really "got" them. 

But, I'm nothing if not persistent, and now that it's warmed up enough to sit in the shade on my balcony, I figured it was time to look at writing shaders again (wordplay-five!). I'm going to be working through Unity Cookie's excellent Noob to Pro series (specifically focused on writing CG shaders for Unity), and each week I'm (hopefully) going to try to keep things interesting by coming up with my own spin on the lessons. 

To kick things off, this week I got started with the first lesson, a flat colour shader. For the most part, it just recovered stuff I had already managed to figure out, although it was a good intro to how shaders work with unity specifically, since all my forays have been either OpenGL or OGRE related.

It was also pretty easy to find something cool to do with it. Since I was already just setting a flat colour of a vertex, I decided to extend it by making it set the colour of the object based on it's distance from a set point in the world. It checks how far each vertex is from the point and passes either black or white to the fragment shader based on whether or not it's within range. It's still very simple in the grand scheme of things, but it's the coolest shader I've built from the ground up myself.

<script src="https://gist.github.com/khalladay/18db3cad343b5bcbc432.js" class="gist">&nbsp;</script>

Obviously I'm still pretty green at this. If you can see a way to improve the above shader, either from a functionality or stylistic point of view, grab me [on Twitter](http://twitter.com/khalladay). 