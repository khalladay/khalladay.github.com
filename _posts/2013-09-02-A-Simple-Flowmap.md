---
layout: post
title: A Simple Flow Map
categories:
- blog
---

Water effects have always seemed firmly in the realm of people who have much more graphics experience than me. When the need for a river effect presented itself in a project I'm working on, I was first in line to suggest that we buy a solution, rather than roll our own. However, after surveying what was out there, it became clear that all the options available required us to sacrifice more frame time than I was willing to give up for one effect. 

Since I'm the only programmer on this specific project, this meant that building a river effect that satisfied our requirements fell to me. Since I'm much too stubborn to admit defeat without at least a quart of coffee drank and hours of sleep lost, it became time for water effects to become something that I did too.

We had already decided that we really liked how the plugin Flow looked, so anything that I built needed to match the appearance of the mobile shaders from there. Luckily, Flow had exposed me to the concept of a flow map, and I was pretty sure I could build my own fairly easily. 

<div align="center">
	<img src="/images/post_images/2013-09-02/water-effect-comparison.png" /><br>
	<font size="2">
		The right shows what the Flow plugin's basic mobile shader is, compared to mine on the left.
	</font>
</div>
<br>

Flow maps, if you're unfamiliar with them, are textures used to dictate the direction that uv's are scrolled across a model. Rather than simply scrolling every texture coord uniformly (creating a really lame effect), using a flow map is a relatively lightweight way to create winding, interesting water movement effects. 

Traditionally, the scrolling texture coords are used to move a normal map across the surface of the water. The effect [looks really good](http://graphicsrunner.blogspot.ca/2010/08/water-using-flow-maps.html), but that was going to be far too heavy for what we needed, so I decided to copy Flow again, and simply scroll a secondary water texture overtop of the ground. The shader uses three textures, the ground, the water, and the flow map. The flow map is very simple: the red channel controls x movement, green channel controls y, and blue channel controls blending between the ground and water textures. #777777 is a 50% blend of ground and water that is not moving. 

<div align="center">
	<img src="/images/post_images/2013-09-02/flow_map.png" /><br>
	<font size="2">
	An example of a flow map used by this shader
	</font>
</div>
<br>

The only gotcha with this method is resetting the texture offset. To avoid the texcoords getting too distorted over time, the offset value needs to get reset to 0 regularly. This causes the texture to jump and looks terrible. I took a page out of the tutorial linked above, and fixed this by using 2 very similar (but different) offsets, which allow the texture to fade between the two, and hides the reset by never resetting the coord currently being shown. 

Even cooler, because those offsets are uniform across a frame, keeping track of them (and performing any calculations that only involve them) can be moved to a script that executes once a frame and just sets those uniforms once. This isn't usually something to write home about, but (at least in my experience) it's uncommon to see scripts interacting with a material's shader in Unity, and it ended up saving us 7ms a frame. 

The end result of all this trouble is a flow map shader which is roughly 40% faster than the mobile shader included in flow, mostly due to ignoring all lights in the scene (we're a mobile game, what lights?), and removing a bunch of colour multiply options. I've included the shader / script in the graphics section of the site, hopefully it can be useful :D 


As always, send me a message [on Twitter](http://twitter.com/khalladay) if you want to chat (especially about games or graphics).
