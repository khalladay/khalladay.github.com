---
layout: post
title: It&apos;s Cool In The Shader Part 3&#58; Specular Reflections
---

I know this is a bit late, but my schedule was a bit derailed by [getting S done](http://kylehalladay.com/all/blog/2013/06/02/S-Making-An-Abstract-Puzzle-Game.html), as well as attending the [Augmented World Expo](http://augmentedworldexpo.com/) (in California :D). Hopefully things will relax a bit now and I can get on with learning shaders!

Week 3 over at Unity Cookie's Noob-To-Pro tutorial series dealt with adding Phong specular values to the lambert shader that we wrote previously. The tutorial also went through how to take this shader (a vertex shader thus far) and make it into a fragment shader, which ended up producing results almost identical to the built in Unity "Specular" Shader. I went ahead and also made a Blinn-Phong shader, and added a multiplication which allowed the specular highlight size to be influenced by the intensity of the light on it, which fixes the problem with the tutorial shader that causes a specular reflection to be shown even when there is no light on the object.

![This week's tutorial shaders](/images/post_images/2013-06-12/specularReflections.png)
(Left To Right: Blinn-Phong, Phong, VertexLit Phong, Lambert)

In a bit of an interesting twist, Stephanie Owen (who worked on Bird Flew with me) was working on a problem this week that lent itself well to my shader learning goals, and provided a chance to see if I was really learning anything from all this or if I was just becoming very good at following tutorials. Thankfully, it was the former, and I ended up writing a solid colour shader which uses a texture as an alpha map. In the grand scheme of things, it's a remarkably simple thing to do, but being able to build something that actually fit a development need, and wasn't at all from a tutorial felt pretty good, and learning about Unity's rendering queues was a bit of an aha moment which is always a good thing.

I've put the gist for this shader below, since it's way more interesting than the Blinn-Phong one.

<script src="https://gist.github.com/khalladay/606c1b6226cb4f24d13d.js" class="gist">&nbsp;</script>