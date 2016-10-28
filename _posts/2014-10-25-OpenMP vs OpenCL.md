---
layout: post
title: OpenMP vs OpenCL - An Unfair Comparison
categories: 
- all
- blog
tags:
- <span style="background-color:#5555AA;"><font color="white">&nbsp;&nbsp;C++&nbsp;&nbsp;</font></span>

---

In the wake of my last post, I decided to get started with my path tracing project by building a small proof of concept renderer to get my feet wet both with the path tracing algorithm and with OpenMP. I was pretty happy with the output of the path tracer (shown below), but I wasn't happy with the speed I was getting. Since this project's entire goal is to entertain me, having to wait minutes to see how a code change impacts the output image is a major buzzkill.

<div align="center">
	 	
<img src="/images/post_images/2014-10-26/caffeine-4096.png" style="max-width:100%;"/>
<br>
<br>
<br>

</div>

So I decided to ask (myself) a really stupid question: would this be faster on the GPU? 

And because the answer for that was pretty obvious (yes!), I then asked a slightly less stupid question: how much faster? 

To answer that, I wrote a second version of the path tracer using OpenCL and ran both of them with the time command. It goes without saying that the code bases were so different that this comparison isn't exactly fair, but I've always wanted to put a graph in a blog post, so here one is!

<div align="center">
	 	
<img src="/images/post_images/2014-10-26/clvsmp.png" style="max-width:100%;"/>
<br>
<br>
<br>

</div>
It's hard to see on the graph, but the OpenCL renderer only barely cracked a minute in running time on the 1024 samples per pixel run. OpenMP started at a minute and a half for the 64 samples per pixel case. There are obviously other things that impact which API will be the best for your use case, but iteration speed is pretty important to me, and it's how I'm deciding which API I'm using for this project. Waiting makes you a waiter. 


If you're interested, the code for both path tracers can be found on github: [OpenMP](https://github.com/khalladay/CaribouPT) or [OpenCL](https://github.com/khalladay/CaffeinePT). If you can see anything in the OpenMP source that could be changed to make it 20x faster (which would *almost* catch up to OpenCL), please let me know! Until then, it looks like I'm abandoning OpenMP for this project. 

As always, I'm [on twitter](http://twitter.com/khalladay) if you want to say hi :D Happy Coding!
