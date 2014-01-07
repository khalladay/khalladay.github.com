---
layout: post
title: (Some Of) The Many Uses of Dot Product
---

Happy 2014 everyone! To kick off the year, I've decided to write a post about a really simple piece of math that keeps surprising me with new uses for it. If the title of the post wasn't enough of a clue for you, this post will be about Dot Products.

So, let's start with the obvious:

A dot product (or scalar product) is the sum of products of corresponding elements in 2 sequences of numbers, but that makes it sound a heck of a lot more confusing than it is. It's easier just to see it: 

Given that A and B are 3 dimensional vectors: 

<div align="center">
	
A dot B = A<sub>x</sub> * B<sub>x</sub> + A<sub>y</sub> * B<sub>y</sub> +  A<sub>z</sub> * B<sub>z</sub>

</div>

Simple right? But that small operation is like a swiss army knife. 

If you've worked on any sort of game or graphics related project you've undoubtedly used dot products for 2 common use cases. The first (and most common in my experience) uses it to get the angle between 2 vectors: 

A dot B = |A| * |B| * cos(theta)

cos(theta) =

1. Angles
2. Projections
3. 0 if lines are perpendicular / other useful values of dot product
4. Triangle test - used in sameside function


function SameSide(p1,p2, a,b)
    cp1 = CrossProduct(b-a, p1-a)
    cp2 = CrossProduct(b-a, p2-a)
    if DotProduct(cp1, cp2) >= 0 then return true
    else return false

function PointInTriangle(p, a,b,c)
    if SameSide(p,a, b,c) and SameSide(p,b, a,c)
        and SameSide(p,c, a,b) then return true
    else return false 

Whew, that was a long post. If anything is unclear, or you spot a mistake (I wrote most of this on a train, it's very possible something is a bit off) feel free to send me a message [on Twitter.](http://twitter.com/khalladay) 

