---
layout: post
title: Learning Code Practices From Rocket Scientists
---

Watching Curiosity land on Mars was amazing, but it also pointed out how much I have yet to learn about programming. NASA programmers managed to program Curiosity so well that they could land a robot on a specific point on the surface of Mars, Block Academy was submitted to the app store with a messy code base that I’m not looking forward to maintaining. Obviously I have a long way to go (not that this is a bad thing).

Luckily, someone on Reddit found a link to a published version of the NASA coding guidelines (http://lars-lab.jpl.nasa.gov/JPL_Coding_Standard_C.pdf), and while lots of it doesn’t apply to those of us not writing C code that has to be compliant with systems written in the early 90s, the parts that are contain some excellent coding practices, that I think will go a long way to increasing code clarity, and robustness in my future projects, and from what I’ve seen, in a lot of other people’s projects too.

* **Declare variables at the smallest level of scope possible.** 

This is programming 101 really, declaring at the smallest level of scope keeps your code organized and prevents irrelevant variables from sneakily causing problems in weird parts of code. I include it though because I find that I don’t make a conscious effort to ensure this rule is followed, and I’ve run into a number of problems that could have been solved a lot quicker if I didn’t have to deal with variables being declared in confusing places.

* **Always check the return value of non void functions**

This seemed like an obvious practice until I actually thought about my code, and how many times I’ve written functions with a return value that was only needed about half of the times that it was called, and how many times I simply ignored return values. Writing functions with the intention of always checking the return values eliminates times when a null pointer catches you off guard when it returns, but it also encourages you to write functions that have meaningful return values that are applicable in more than just a few edge cases.

* **Check the validity of function parameters at the beginning of each function**

Just as checking return values would help to avoid unexpected values, checking passed parameters to a function ensure that the data going to it is what you expect, and provides a very logical place for your program to terminate if they aren’t.

*  **Only declare one statement of variable per line (except for for loops)**

This post is rapidly becoming a huge wall of text, so this is the last rule I’ll post about, and it’s also the least critical of all the ones discussed. It won’t make your code function better, and the only debugging value it has is in increasing code legibility. But since programs are written by (very very fallible) people like me, code legibility is painfully important. I’m not sold on this being the be all and end all of legibility practices, but I’ll take NASA at their word and try it out.

 

Obviously this list isn’t exhaustive, and I’m always looking for ways to be a better coder. If you’ve got a coding practice or habit that has changed the way you look at code, I’d love to hear about it! Let me know in the comments.

