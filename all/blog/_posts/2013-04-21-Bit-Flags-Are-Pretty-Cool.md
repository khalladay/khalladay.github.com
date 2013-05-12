---
layout: post
title: Bit Flags are Pretty Cool
---

I've been working on prototype for (possibly) my next personal project, and one of the things I've needed to do a number of times is store a lot of boolean attributes on different objects. This led to some really terrible looking scripts with a whole host of boolean flags at the top of them, and I decided I needed to find a better way of handling things. 
<br>
<br>
I've had some fun before with packing a whole bunch of booleans into byte-sized structs using the bit field operator in C++, but I've never seen anything like that done in C#, and if I can help it, I try to avoid dealing directly with memory addresses in Unity scripts. Luckily, bit flags seem to do the exact same job (possibly better). To show you what I mean, let me link an example:
<br>
<br>
<script src="https://gist.github.com/khalladay/5432282.js" class="gist">&nbsp;</script>
<br>
So here's whats going on: rather than specifying a int or float value for the members of the enum, you can assign each of them a hex number. Provided each of these hex numbers match up to the values represented by each bit in a byte (powers of 2), you can use all of the regular bitwise operations with these new enum values. 

<script src="https://gist.github.com/khalladay/a5ecf560b97f746829b1.js" class="gist">&nbsp;</script>

Provided the player can only have 1 of each item, you could do an entire inventory this way (not that I think that would be the greatest idea). Nevertheless, it's certainly handy for fast prototyping, and I'm sure that less contrived examples will find their way into production code at some point. 