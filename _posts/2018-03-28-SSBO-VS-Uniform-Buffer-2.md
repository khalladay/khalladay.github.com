---
layout: post
title: Re-Testing Vulkan Transform Data Handling Strategies
categories:
- blog
- tutorial
- vulkan
tags:
- <span style="background-color:#AA2222;"><font color="white">&nbsp;Vulkan</font></span>
---

Yesterday I posted [Handling Transform Data in Vulkan](http://kylehalladay.com/blog/tutorial/vulkan/2018/03/27/SSBO-VS-Uniform-Buffer.html), and it generally seemed well received by everyone, but as it turns out, **I was doing something dumb**. I was pretty sure that SSBOs *should* have been slower than UBOs on my (NVidia) graphics card, but none of the data I had showed that. In fact, all the data I had showed that all three buffer-based approaches to handling transform data performed about the same.

As weird as that was, I didn't have any data to suggest otherwise, so I posted what I had. Luckily, someone (who I won't name in case they'd prefer not to be forever immortalized on my blog) spotted my mistake:

<div align="left" style="border-style:dashed;border-width:1px;">
<img src="/images/post_images/2018-03-28/twitter.PNG" />
</div>
<div align="left" style="padding-bottom:15px;">
</div>

Suffice to say, the person giving me this feedback has much more experience than I do, so I figured I needed to take a look at my tests and see if I could improve things. Luckily, today was my day off, so I had some time to kill.

If that feedback was correct, the problem was that my shaders were so simple that my gpu was burning through frames so fast that it didn't matter if there was a performance difference in my transform data approaches, I was hitting a different performance bottleneck first. Sadly, I've spent a lot of time fixing graphics pipeline bottlenecks on different projects... I just didn't think about them when collecting my data last time.

<div align="center">
<img src="/images/post_images/2018-03-28/stan.png" />
<br><br>
</div>

## The New Test Setup

I kept almost everything the same as last time, since I'm pretty sure my test setup was mostly sound. However, I changed my fragment shader. You might recall that I was just outputting normals in my first attempt at benchmarking this. This seemed plausible because I only cared about vertex shader performance, but was also probably where I went wrong. So to re-test everything, I changed my fragment shader to the following:

{% highlight c %}
layout(location=0) in vec2 fragUV;
layout(location=1) in vec3 fragNormal;
layout(location=0) out vec4 outColor;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
	vec3 norm = normalize(fragNormal);

	outColor.x = rand(vec2(sin(norm.x), cos(norm.y)));
	outColor.y = rand(vec2(sin(norm.y), tan(norm.z)));
	outColor.z = rand(vec2(sin(norm.z), cos(norm.x)));

	for (int i = 0; i < 24; ++i)
	{
		outColor.x = rand(vec2(sin(outColor.x), cos(outColor.y)));
		outColor.y = rand(vec2(sin(outColor.y), tan(outColor.z)));
		outColor.z = rand(vec2(sin(outColor.z), cos(outColor.x)));
	}

	outColor.a = 1.0f;
}
{% endhighlight %}

This seemed like a reasonable way to try to avoid hitting the same bottlenecks as before, since it was easy to adjust how many useless operations I wanted to do in order to control how much time I wanted to be spent in fragment processing. Also, since every test case already used the same fragment shader, this was an easy spot to add instructions too that I knew would be applied uniformly to every test, so that the only variable between them was still transform data handling.

Now, my scene looked like this:

<div align="center">
<img src="/images/post_images/2018-03-28/output.PNG" />
Yep, uglier than last time<br><br>
</div>

Also - one things to note with these tests is that they seem to be consistent to within about 0.5 ms (when testing the Bistro Scene). That is, if I re-run the same test multiple times, all my results for that test are within about a half millisecond of each other. The Sponza tests were much more consistent (but the values were also much smaller). I've included detailed testing methodology notes at the end of this blog post, but the short version is that each test result is the average of 4096 frames, and I re ran each test 3 times. The number you see in the graphs is the median of these three test runs.

## Shiny New Push Constant Tests

Ok, let's start with Push Constants again. I've included my results from last time in this graph to showcase the differences made by the new test.

<div align="center">
<img src="/images/post_images/2018-03-28/push_constant.PNG" />
</div>

Similar to last time, there's not really much interesting to say about these results other than that you can see the impact that the new fragment shader had on frame time pretty clearly in that graph.

## UBO Tests Jr.

Ok, here's where things get interesting. Last time I ran this test, the data showed that Dynamic UBOs and the UBOs containing an array of structs performed pretty much evenly, however, I wasn't sure whether or not the difference was enough to suggest a real performance difference or just issues with my tests' accuracy.

<div align="center">
<img src="/images/post_images/2018-03-28/ubo_1.PNG" />
</div>

These new results don't mean that there aren't issues with the accuracy of my tests, but what it helps to confirm is that this performance difference exists to some extent (at least at scale). An obvious criticism of this is that the Sponza test was still reporting the same values for everything, and that's fair, there's likely more I could be doing to benchmark the smaller scene, but I'm happy with the results from the Bistro scene, and I've now spent way, way too much time on this benchmark.

The other thing this helps confirm is that there is indeed a noticeable performance difference between using HOST_CACHED UBOs and DEVICE_LOCAL ones. I stand by the old conclusion that for data that updates on a per frame basis, you should just stick to HOST_CACHED.

## SSBO Tests 2.0

And finally, the moment we've all been waiting for! Here's what the UBO test results look like alongside the new test results for SSBOs

<div align="center">
<img src="/images/post_images/2018-03-28/buffers.PNG" />
</div>

As expected, with the new test, we can now actually see a real performance difference between using SSBOs and using UBOs on my NVidia GTX 1060. All is well with the universe, things look how they should.

## Final Results

Here's all the results put into a single graph.

<div align="center">
<img src="/images/post_images/2018-03-28/final.PNG" />
</div>

## Conclusion

With this new data, I'm going to walk back my previous assertion that I'm going to go with a single large SSBO for my transform data, and I think will place my bets firmly in the large UBO pages camp. At least until I get an AMD card to play with. They seem fun.

It's interesting to note that even with the change in test methodology, Push Constants still come out the loser in the larger scenes. I don't know for sure what that means, but it's definitely still a surprise. Hopefully that doesn't point to a new problem with this benchmark, but you know, if it does and you can see what I'm doing wrong, send me a message [on Twitter](https://twitter.com/khalladay), [Mastodon](https://mastodon.gamedev.place/@khalladay), or via e-mail and I'll write up yet another one of these posts. Next time with an even bigger facepalm meme photo.

Until next time!

<font size="2"><div style="border-style:solid; background-color:#DDDDDD ">

<strong>Appendix: Testing Methodology</strong><br>

In case reviewing testing methods is your thing, here's how I got the numbers in all the graphs in this post:<br><br>
<li>All tests were run for at least 5120 frames, reporting the average frametime after every 1024 frames. I took the average of the last 4096 of these frames (to avoid any hitches on startup) to use as my numbers in the tests.</li><br>
<li>I monitored my CPU and GPU temp with <a href="http://openhardwaremonitor.org/">Open Hardware Monitor</a>, and let both of them return to their resting temp between tests (61 and 66 C respectively), and made sure that the same applications (and only those applications) were running alongside the test program.</li><br>
<li>I repeated this test 2 more times, at different times of the day (after using the laptop to do other tasks), which gave me 3 frametime averages (1 per run of the test). I chose the median of the three to present in the graph above.</li><br>
<li>Finally, all tests were done in Release builds, without a debugger attached or any validation layers turned on, and connected to a wall outlet to prevent any kind of throttling on battery to interfere with anything.</li><br>
<li>All the source for everything is  <a href="https://github.com/khalladay/VkBindingBenchmark">on github</a>, I would love for someone to compile everything and run a similar test to see if the results for my GPU can be replicated on someone else's hardware.</li>
</div>
</font>
