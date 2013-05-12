---
layout: post
title: It&apos;s Cool In The Shader Part 2&#58; Reverse Lambert Shading
---

The second week of my shader odyssey was a lot of fun. The lesson from Unity Cookie involved implementing a 1 light lambert shader that took into account ambient lighting. This would have been enough to be "cool" by itself, but I also went ahead and modified the lesson a bit to do something I've always wanted to see done: a lighting model that works in reverse, that is, things in the light are darkened, and things away from the light are lit up.

I'm making it a point to understand the math behind each week's shader, so I'll explain the math behind the lambert shader, and the dark/light switch modification first, and then post the code. The lambert lighting model is summarized in the equation 

I<sub>D</sub> = L &middot; N * C * I<sub>L</sub> <br>
(or: The intensity of the diffuse light (I<sub>D</sub>) on a surface is equal to the dot product of the surface's normal vector and the normalized direction of the light (L  &middot; N), multiplied by the Color (C) and intensity of the incoming light (I<sub>L</sub>))

The tutorial goes a bit further. We added a max function to the dot product which clamped the values to between 0.0 and 1.0. This prevented the areas of the objects which were facing away from the light source from being darkened to a value less than having no light shining on it. The equation was also modified to add ambient light calculations, meaning that objects facing perfectly away from the light source would be coloured exactly the colour of the ambient light in the scene. The end result of this was a lighting equation that looked like this (A = ambient light colour): 

I<sub>D</sub> = ( max(0.0,L &middot; N ) * C * I<sub>L</sub>) + A

The modification was much simpler than I initially expected. All that needs to be done to the above equation to reverse the lighting calculation is to calculate I<sub>D</sub> using N*-1, that is, as if the surface's normal vector is point in the opposite direction. 

The end result is simply I<sub>D</sub> = ( max(0.0,L &middot; -N ) * C * I<sub>L</sub>) + A

Changing just the direction of the normal vector allows you to use the rest of the equation unchanged, allowing you to still take advantage of the max function without needing to fiddle with any values. I'm not entirely convinced that this would work in all cases (particularly with really intricate meshes), but I can't think of any good reason why it wouldn't (if you can, grab me [on Twitter](http://twitter.com/khalladay). I also make no guarantees that the math above is perfectly explained or correct. To me it makes sense, but this is only week 2 of my long journey towards competency in shader programming, so feel free to shoot any corrections my way as well. 

Finally, now that you've sat through my oh so titillating exploration of the math involved this week, here's the modified shader I came up with. It's exactly 1 character different from the tutorial's shader so don't get your hopes up, but playing with the shader and tinkering to get to this point was definitely worthwhile.

<script src="https://gist.github.com/khalladay/d77a2bcd09de1e726906.js" class="gist">&nbsp;</script>