---
layout: post
title: Handling Transform Data in Vulkan
categories:
- blog
- tutorial
- vulkan
tags:
- <span style="background-color:#AA2222;"><font color="white">&nbsp;Vulkan</font></span>
---

Once you progress past getting a mesh on screen, the learning material out there for Vulkan is in a weird state right now, especially if you're looking for content that bridges the gap between noob and pro. Articles talking about different approaches to common rendering tasks, and the tradeoffs you make when choosing one solution over another are few and far between.

This is unfortunate, because the beauty of Vulkan is all the choices that it gives you! So today, I want to share the results of a performance test I did to try to figure out a good, scalable way to handle transform data.

I started out by asking Twitter for how other people were handling transform data in their projects, and noticed right away that it seemed like there were a lot of approaches that people were using:

<div align="left" style="border-style:dashed;border-width:1px;">
<img src="/images/post_images/2018-03-27/twitter1.png" />
</div>
<div align="left" style="border-style:dashed;border-width:1px;">
<img src="/images/post_images/2018-03-27/twitter3.png" />
</div>

<div align="left" style="padding-bottom:15px;">
</div>

So I decided to build a test project and try a few approaches out for myself.

I knew right away that I didn't want a new UBO for each mesh, since that seemed unwieldy and obviously not the best idea for performance, but that still left me with push constants, large UBOs, and a single large SSBO to try out.

This felt a little bit like repeating my previous post about [comparing data transfer methods in vulkan](http://kylehalladay.com/blog/tutorial/vulkan/2017/08/30/Vulkan-Uniform-Buffers-pt2.html), except this time I actually managed to throw enough data at the problem to get meaningful results, and I've had some more time with Vulkan since then, so I'd like to think that I've approached things a bit smarter this time around.

So this post is going to walk through how each of the above approaches works, and then present the results of the performance tests I did for each.

## Handling Transforms With Push Constants

I want to start by talking about Push Constants, because it's really easy to set them up since you don't need to allocate any buffers or memory for them. All you need to do is set up your material's VkPipeline to expect a certain number of bytes of push constnat data:

{% highlight c %}
VkPipelineLayoutCreateInfo pipelineLayoutInfo = {};
    //other pipelineCreateInfo filling out code here

VkPushConstantRange pushConstantRange = {};
pushConstantRange.offset = 0;
pushConstantRange.size = sizeof(glm::mat4)*2;
pushConstantRange.stageFlags = VK_SHADER_STAGE_VERTEX_BIT;

pipelineLayoutInfo.pPushConstantRanges = &pushConstantRange;
pipelineLayoutInfo.pushConstantRangeCount = 1;
{% endhighlight %}

That being said, I really want to keep my push constants free so I can use them to pass in other data as needed, so I went into this hoping that they didn't turn out to be the fastest option. Yay bias!

With your VkPipeline set up, passing push constant data to your shader just requires a call to vkCmdPushConstants before you issue a draw call:

{% highlight c %}
for (uint32_t i = 0; i < drawCalls.size(); ++i)
{
    //0 is MVP, 1 is normal
    glm::mat4 frameData[2];

    frameData[0] = vulkanCorrection * p * view;
    frameData[1] = glm::transpose(glm::inverse(view));

    vkCmdPushConstants(
        appData.commandBuffers[imageIndex],
        appMaterial.pipelineLayout,
        VK_SHADER_STAGE_VERTEX_BIT,
        0,
        sizeof(glm::mat4)*2,
        (void*)&frameData);

    VkBuffer vertexBuffers[] = { drawCalls[i].buffer };
    VkDeviceSize vertexOffsets[] = { 0 };
    vkCmdBindVertexBuffers(appData.commandBuffers[imageIndex], 0, 1, vertexBuffers, vertexOffsets);
    vkCmdBindIndexBuffer(appData.commandBuffers[imageIndex], drawCalls[i].buffer, drawCalls[i].iOffset, VK_INDEX_TYPE_UINT32);
    vkCmdDrawIndexed(appData.commandBuffers[imageIndex], static_cast<uint32_t>(drawCalls[i].iCount), 1, 0, 0, 0);

}
{% endhighlight %}

Finally, instead of specifying a decsriptor set or binding for this data in your shader, you just use the push_constant specifier:

{% highlight c %}
layout(push_constant) uniform transformData
{
  mat4 mvp;
  mat4 it_mv;
}global;
{% endhighlight %}


Note that in the above code, all the objects I was testing with used an identity model matrix, so I just omitted that from the creation of my MVP matrix. The "vulkanCorrection" matrix you see in the code block above is taken from [The New Vulkan Coordinate System](https://matthewwellings.com/blog/the-new-vulkan-coordinate-system/), and is being used to flip the Y and make sure depth is in the 0-1 range.

Push constants have a maximum amount of data that they can hold. This differs by device, and is accessible in the "maxPushConstantsSize" property of your device limits. For a lot of devices, this value is 128 bytes, so you have to plan how you're going to use push constants carefully, otherwise you'll run out of room.

The general advice I've been given is that push constants are a great option for passing data on a per object basis, and as you'll see later in the performance tests, however it's worth noting that in cases where you want to pre-record your command buffers, push constants are a no go. For almost everything except static geo, this isn't a problem, but I'm mentioning it to flag that even if you have space available in your push constants, it's still worth knowing how fast the other options are.

...and speaking of other options:

## Using Large UBOs

(note: If you're not sure how to set up an UBO, I recommend checking out the [Uniform Buffer Object](https://vulkan-tutorial.com/Uniform_buffers) section on [vulkan-tutorial.com](https://vulkan-tutorial.com/Uniform_buffers)
)

As I mentioned before, I knew I didn't want to go down the "1 UBO per object" approach, so every method I'm going to discuss here involves packing a number of objects' data into a single buffer. There are two ways to this. Probably the most common way is to use a Dynamic Uniform Buffer, and then have each object keep track of it's offset in the buffer, and then set that buffer before every draw call with vkCmdBindDescriptorSets. Dynamic Uniform buffers are well covered elsewhere, so I'm going to omit implementation details in this post for brevity.

The other option is to approach it the way I outlined in my [last post](http://kylehalladay.com/blog/tutorial/vulkan/2018/02/05/Bind-Once-Uniform-Data-Vulkan.html), by creating a single buffer that stores an array of data structs in it, and passing the index into that array via a push constant. That means setting up your vertex shader like so:

{% highlight c %}
struct tdata
{
  mat4 mvp;
};

layout(binding=0,set=0) uniform TRANSFORM_DATA
{
  tdata d[256];
}transform;

layout(push_constant) uniform transformData
{
  uint tform;
}idx;

layout(location=0) in vec3 vertex;

void main()
{
  gl_Position = transform.d[idx.tform].mvp * vec4(vertex, 1.0);
}
{% endhighlight %}

One big advantage of this approach is that you don't have to worry about making sure that your elements are packed into your UBO according to the minUniformBufferOffsetAlignment of your gpu. On my laptop, the minUniformBufferOffsetAlignment is 256 bytes, which means that if the struct I want to pack into it is smaller than that, I have to waste a ton of space making sure that each struct is located at the right spot in the buffer. You don't have to worry about that restriction if you're packing everything into an array in the shader itself.

The other big win is that you don't need to call vkCmdBindDescriptorSets for each object to pass in an offset; you can do that with push constants. Instead, you only have to issue a new bind call if the object you're about to create a draw call for uses a different large UBO. You can see that in the [rendering.cpp](https://github.com/khalladay/VkBindingBenchmark/blob/master/VkBindingBenchmark/rendering.cpp) file on github, but I ended up writing a function like this to handle that switch:

{% highlight c %}
int bindDescriptorSets(int currentlyBound, int page, int slot, VkCommandBuffer& cmd)
{
    uint32_t offset = 0;
  if (currentlyBound != page)
  {
    vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, pipelineLayout, 0, 1, &descSets[page], 0, &offset);
  }
  return page;
}
{% endhighlight %}

My draw loop kept track of the last bound "page" (large UBO), and while iterating over each object, would call this function with the current object's page, and the page that was currently bound. This kept vkCmdBindDescriptorSets to a minimum.

The downside to this approach is that all your shaders need to be aware of how you're handling transform data, and if you decide to change how many elements are stored in your large UBO pages, you need to update all the vertex shaders with the new array size.

In the end, I tested both the Dynamic UBO and "Bind Once" UBO, and as you'll see later the Bind Once UBO came out on top in all my tests, but not by a whole lot (and there's a chance that I'm doing something dumb that might influence that value). So if you hate the "bind once" approach that I'm outlining, it's not like you're shooting yourself in the foot if you do with a dynamic UBO.

Alright, bring forth the next type of buffer!

## Using 1 Big SSBO

This is the technique I was most excited about when I started this benchmarking project, because it's by far the simplest. Instead of worrying about the size limits for UBOs (and needing multiple UBOs as a result), you just make 1 really big SSBO that can hold all of your transform data at once. Then you index into it exactly like we did with the "Bind Once" UBO:

{% highlight c %}
struct tData
{
  mat4 mvp;
};

layout(binding=0,set=0)buffer TRANSFORM_DATA
{
  tData d[25000];
}transform;

layout(push_constant) uniform transformData
{
  uint tform;
}idx;

layout(location=0) in vec3 vertex;

void main()
{
  gl_Position = transform.d[idx.tform].mvp * vec4(vertex, 1.0);
}
{% endhighlight %}

You'll notice the only difference in the shader is that the TRANSFORM_DATA input is declared with a type of "buffer" instead of "uniform." You may have also noticed that the SSBO is really, really big. This is because the [Amazon Bistro](http://casual-effects.com/data/) scene that I used as my second test has a whopping 24777 meshes in it, so I rounded up a little and got to the above.

The major disadvantage of using 1 large SSBO is that you need to pick the size of the buffer up front, and if you guess wrong, it has major performance penalties. If you guess too small, you either have to allocate a second SSBO (in which case...why not just use the paged UBO approach from the last section?), or you have to create a bigger SSBO, copy the current contents in, and go from there. If you guess too big, you pay the cost of binding a much larger buffer than you need (which is actually pretty costly if you're binding WAY more than you need).

This information requirement makes me think that this approach might be better left for specific instances when you know exactly how many things you want to draw (a specific effect, or group of NPCs or something), rather than your go to general purpose solution.

## Bechmark Project Set Up

It's time to talk about performance! To test all of these approaches, I built a simple [benchmarking project](https://github.com/khalladay/VkBindingBenchmark) that loaded either the [CryTek Sponza](http://www.crytek.com/cryengine/cryengine3/downloads) or the [Amazon Bistro](http://casual-effects.com/data/) models.

Since all I really cared about was vertex shader performance, I skipped loaded materials for the models and instead just had the fragment shader output normals. This meant that when the project was running, it looked like this:

<div align="center">
<img src="/images/post_images/2018-03-27/Capture.png" />
Beauty isn't everything, right?
<br><br>
</div>

I didn't do any mesh combining, or much in the way of [Assimp](http://www.assimp.org/) post processing, so the Sponza test ended up using 379 meshes (which didn't do much in the way of taxing my gpu), and the Bistro test was 24777 meshes. In a real game, you'd want to pre-transform these vertices to their final position so you wouldn't have to store model matrices for all these meshes. However, that wasn't what I wanted to test today, so for our purposes, each one of these meshes is a fully dynamic mesh that can move at any time.

I also made sure to shuffle the order of the meshes that I was using before beginning to render anything, so that data wasn't skewed by one approach working better with perfectly sorted data.

I didn't end up using vkTimestamps when gathering data for the tests...mostly because I had already spent more time than I wanted to just running the frame time tests, and because the code paths for every SSBO / UBO test case are so close to identical that I didn't really care to drill into exactly where in the process time was being spent. I'll leave that for a future post, if I ever run into a case where I need more specific performance info.

Finally, all code is available [on github](https://github.com/khalladay/VkBindingBenchmark), and there is more information about testing methodology at the end of the post.

## Push Constant Tests

I want to talk about the results for Push Constants first, since there's really only 1 way to use them (which makes the results very easy to understand):

<div align="left">
<img src="/images/post_images/2018-03-27/push_constant.png" />
</div>

Yes folks, it turns out that doing more work does in fact take longer. While the push constant numbers are useful as a basis for comparison with the other techniques I tried, they're really boring on their own. Ok. moving on.


## UBO Tests

In addition to testing out transform data strategies, this project gave me a good chance to re-validate a conclusion I made [in my last vulkan benchmarking post](http://kylehalladay.com/blog/tutorial/vulkan/2017/08/30/Vulkan-Uniform-Buffers-pt2.html), namely, that device-local memory wasn't suited for data that needed to be updated every frame. My initial data confirmed this finding:

<div align="left">
<img src="/images/post_images/2018-03-27/ubo_1.PNG" />
</div>

Wow! Not only does a HOST_CACHED Uniform Buffer beat Push Constants for speed when the mesh count increases, but look at how crappy a DEVICE_LOCAL buffer does!

As it turns out, that's not really the whole story, and now that I've got some more experience with Vulkan, I can say that, as I feared in my previous post, I was probably doing something really stupid last time. Yes, the numbers look bad at first glance, but this DEVICE_LOCAL test was creating new staging buffers every frame, and then creating a command buffer just for copying data to the DEVICE_LOCAL buffer (and submitting those commands!), before rendering the frame.

When I fixed those issues (used a persistent staging buffer, and added my copy commands to the main command buffer), things got a lot more reasonable:

<div align="left">
<img src="/images/post_images/2018-03-27/ubo_2.PNG" />
</div>

However, just because it looks more reasonable doesn't mean it isn't interesting. The best case DEVICE_LOCAL tests performed about as well as just having a HOST_CACHED buffer to begin with. Given how much simpler it is to not worry about staging buffers, I'm still of the opinion that for data that updates every frame, you shouldn't use DEVICE_LOCAL memory.

I've avoided talking about Dynamic UBOs so far because the results weren't very interesting:

<div align="left">
<img src="/images/post_images/2018-03-27/ubo_3.PNG" />
</div>

Basically, while I totally expect that a Dynamic UBO would outperform a single UBO per object, it doesn't match the "Large UBO" method for performance. However, if you go with the Dynamic UBO approach, your shaders get more straightforward to read / write, and you don't have to worry about updating vertex shaders if you decide to change the size of your UBO arrays, so it's a performance/complexity tradeoff.

Ok, so we know that using an UBO is faster than push constants when you scale up to ridiculous mesh counts, but how did the SSBO fare?

## SSBO tests

SSBOs are a different story from UBOs. You really really really don't want to use anything but DEVICE_LOCAL memory for them:

<div align="left">
<img src="/images/post_images/2018-03-27/ssbo_1.PNG" />
</div>

Since SSBO performance is largely dependent on the size of the SSBO you're using, the Sponza test used an SSBO that could hold 512 items, and the Bistro test used the one from the code sample earlier, that could hold 25000. To test the performance cost of picking the wrong SSBO size, I ran the Sponza test again, using the 25000 slot SSBO, and it ended up taking **3.58 ms** to render, which is worse than the HOST_CACHED version of the smaller one.

Key Takeaway: if you don't know how big your data will be, don't use SSBOs.

## Final Results

Here are the results of every test presented in a single graph:

<div align="left">
<img src="/images/post_images/2018-03-27/final_results.PNG" />
</div>

It's a bit hard to read for the Sponza results, but basically everything rendered that in around 0.8 ms on my GPU, so you aren't really missing much.

I think I'm going to go with HOST_CACHED UBO pages for my transform data until I run into a performance problem with that approach and need to optimize further. However, what's striking is that every buffer based approach I tested out-performed Push Constants at scale. I'm not entirely sure what this means, since I was under the impression Push Constants were supposed to always be the fastest option if you weren't pre-recording command buffers. Perhaps I'm doing something dumb (if so - please e-mail me or send me a message [on Twitter](https://twitter.com/khalladay))

Speaking of optimizing this further:

## Improving On These Results

For the purposes of the tests, I updated every transform matrix every frame. Clearly that's not going to be the case in a real application, especially with static geo. As I mentioned earlier, you'd see a huge increase in performance if you pre-transformed your static geo so they has an identity model matrix, set the ViewProjection matrix in a globally bound UBO, and then pre-recorded all the commands for rendering those objects.

For dynamic meshes, you might also be able to get some wins by moving the ViewProjection matrix to a globally bound UBO. If you didn't have to update the MVP every frame, you might be able build a system where objects "register" into an UBO slot every frame, or some other re-ordering of the buffer data takes place so that you could avoid flushing the entire buffer range each frame, and only transfer the model matrices that changed.

This is all conjecture, and I haven't thought too hard about any of it, or tried it out, but they seem like reasonable ways to approach speeding this up if you wanted to.

## Conclusion

Thanks for sticking with me this far! As mentioned before, I'm probably doing a thousand different dumb things in my code, or while interpreting the results. If you spot one of these dumb things, I would love to hear about it [on Twitter](https://twitter.com/khalladay), [Mastodon](https://mastodon.gamedev.place/@khalladay), or via e-mail (button is on the side bar).

I feel like these performance benchmarking posts sound like a much better idea before I get into them and realize how much time they take to do right. So perhaps my next post will be about something a bit lighter. In any case - I hope this info was helpful to someone!

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
