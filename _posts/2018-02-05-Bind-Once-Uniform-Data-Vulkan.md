---
layout: post
title: A "Bind Once" Approach to Uniform Data
categories:
- blog
- tutorial
- vulkan
tags:
- <span style="background-color:#AA2222;"><font color="white">&nbsp;Vulkan</font></span>
---

After figuring out how to use a global [array of textures](http://kylehalladay.com/blog/tutorial/vulkan/2018/01/28/Textue-Arrays-Vulkan.html) to store all the textures that are in use for a frame in a single descriptor set, I returned to my [material system project](https://github.com/khalladay/VkMaterialSystem) and realized how much easier life would be if I could do all my descriptor set binding at the beginning of a frame, both because I'd avoid any performance overhead from doing lots of binding, and because it greatly simplifies anything related to descriptor set versioning (or dealing with updating buffers that are in flight).

As it turns out, this is totally possible and really easy to do, although I have no idea if it's a good idea in the grand scheme of things. Also, just like using an array of textures, I couldn't find anyone else writing about, so I guess that means it's on me to share.

<div align="center">
<img src="/images/post_images/2018-02-05/badideas.jpg" />
<br><br>
</div>
So with all that said, this post is going to show off how to use a single, globally bound descriptor set (and a single VkBuffer!) to store all the uniform data needed for multiple objects that are using different shaders.

I've set all this up in a demo project ([on github](https://github.com/khalladay/VulkanDemoProjects/tree/master/VulkanDemoProjects/UniformBufferArrays)) if you just want the code. The fragment shaders I used in that demo are:

{% highlight c %}
#version 450 core
#extension GL_ARB_separate_shader_objects : enable

struct Data48
{
    vec4 colorA;
    vec4 colorB;
    vec4 colorC;
};

layout(binding = 0, set = 0) uniform DATA_48
{
    Data48 testing[8];
}data;

layout(push_constant) uniform PER_OBJECT
{
    int dataIdx;
}pc;

layout(location=0) out vec4 outColor;

void main()
{
    outColor = data.testing[pc.dataIdx].colorA
            + data.testing[pc.dataIdx].colorB
            + data.testing[pc.dataIdx].colorC;
}
{% endhighlight %}

and

{% highlight c %}
#version 450 core
#extension GL_ARB_separate_shader_objects : enable

struct Data48
{
    float r;
    vec4 colorB;
    int x;
};

layout(binding = 0, set = 0) uniform DATA_48
{
    Data48 data[8];
}data;

layout(push_constant) uniform PER_OBJECT
{
    int dataIdx;
}pc;

layout(location=0) out vec4 outColor;

void main()
{
    float red = data.data[pc.dataIdx].r;
    float intCast = data.data[pc.dataIdx].x;
    vec4 colorA =  vec4(red, intCast, intCast, intCast);
    outColor = data.data[pc.dataIdx].colorB * colorA;
}
{% endhighlight %}

I'll omit the vert shader because it just passes through uv coords and does nothing fancy. The stars of our show are the ones above.


## How This All Works

The trick, which you may have already guessed from the shader code, is to keep all the uniform buffer objects the same size. VkDescriptorSets, and VkBuffers don't actually care about the contents of your uniform buffers, otherwise we'd have to provide a lot more information when setting up a descriptor set binding. All they care about is how big the buffer needs to be.

Knowing that, it follows that if all our shaders are using buffers of the same size, they should all be able to use the same descriptor set, and that's exactly how things work in practice. It's almost embarrassing how easy it is to set up the descriptor set layout to do this:

{% highlight c %}
VkDescriptorSetLayoutBinding layoutBinding;
layoutBinding.descriptorCount = 1;
layoutBinding.binding = 0;
layoutBinding.stageFlags = VK_SHADER_STAGE_FRAGMENT_BIT;
layoutBinding.descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
layoutBinding.pImmutableSamplers = 0;

VkDescriptorSetLayoutCreateInfo layoutInfo = {};
layoutInfo.sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
layoutInfo.bindingCount = 1;
layoutInfo.pBindings = &layoutBinding;

vkCreateDescriptorSetLayout(...)

{% endhighlight %}

You don't even need to worry about specifying the number of elements in the array, since it's all stored in a uniform block. As far as the descriptor set is concerned, we're not even using an array.  

Once you've set up your Descriptor Set Layout, allocating the buffer to store the data is similarly easy. I'm going to just copy + paste the utility function call from my demo project, because allocating a buffer and memory associated with it in vulkan has a lot of boiler plate, but in reality, all you do is create a buffer large enough to hold the array you declared. So if you have an array of length 8, that stores 48 byte structures, you're buffer needs to be 8 * 48 (384) bytes large.

{% highlight c %}
vkh::createBuffer(demoData.sharedBuffer,
    demoData.bufferMemory,
    SHARED_UNIFORM_SIZE * BUFFER_ARRAY_SIZE,
    VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
    VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT,
    appContext);
{% endhighlight %}

And finally, once you've put the data into that buffer writing the descriptor set is also about as straightforward as possible.

{% highlight c++ %}
VkDescriptorBufferInfo bufferInfo = {};
bufferInfo.buffer = demoData.sharedBuffer;
bufferInfo.offset = 0;
bufferInfo.range = VK_WHOLE_SIZE;

VkWriteDescriptorSet setWrite = {};
setWrite.sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
setWrite.dstBinding = 0;
setWrite.dstArrayElement = 0;
setWrite.descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
setWrite.descriptorCount = 1;
setWrite.dstSet = demoData.descriptorSet;
setWrite.pBufferInfo = &bufferInfo;
setWrite.pImageInfo = 0;

vkUpdateDescriptorSets(appContext.device, 1, &setWrite, 0, nullptr);

{% endhighlight %}

This up is completely identical to setting up a single uniform buffer object, because in practice, that's exactly what's going on. The only difference is that to make this work you have to keep a few more things in mind:

## Ensuring Buffers Are The Same Size

I've already covered that you need to keep the uniform objects the same size, but how to do that is a bit different for Vulkan than it might be if you were working with solely cpu side structs. This is because struct members in Vulkan shaders are 16 byte aligned, which means that if you're trying to manually specify the structs in your c++ code (like I do in my example project), you need to add some additional syntax to make sure if all adds up properly:

{% highlight c++ %}
struct LayoutA
{
    __declspec(align(16)) glm::vec4 colorA;
    __declspec(align(16)) glm::vec4 colorB;
    __declspec(align(16)) glm::vec4 colorC;
};

struct LayoutB
{
    __declspec(align(16)) float r;
    __declspec(align(16)) glm::vec4 colorA;
    __declspec(align(16)) int x;
};
{% endhighlight %}

Unless you're working with matrices, this actually ends up making your life easier, because any data type equal to or smaller than the size of a vec4 will fit inside 16 bytes, meaning that rather than worrying about the size of the struct members, you just worry about keeping the count the same. Once you add matrices, you have to start looking at sizes again.

Once the structs are set up, you just need some quick pointer math to get them into one buffer:

{% highlight c++ %}
char* sharedData = (char*)malloc(sizeof(LayoutA) * BUFFER_ARRAY_SIZE);
LayoutA first = {glm::vec4(0.5,0,0,0), glm::vec4(0.25,0.5,0,0), glm::vec4(0.0,0.25,0.25,1)};
LayoutB second =  1.0, glm::vec4(1,1,1,1), 1};

char* writeLocation = sharedData;
memcpy(writeLocation, &first, SHARED_UNIFORM_SIZE);
memcpy((writeLocation += SHARED_UNIFORM_SIZE), &second, SHARED_UNIFORM_SIZE);
{% endhighlight %}

This works, but If you're like me, you likely don't want to have to recompile your c++ code every time a shader changes. In the past, I got around this by using a program I wrote for my [material system](https://github.com/khalladay/VkMaterialSystem) (called the "ShaderPipeline") that uses [SPIR-V Cross](https://github.com/KhronosGroup/SPIRV-Cross) to generate json descriptions of the shaders that I use. One part of this description are the sizes and offsets of each member of a uniform buffer object, but with the array of structs approach here, SpirV-Cross ends up just telling you details about the size of the entire array:

{% highlight c++ %}
"descriptor_sets": [
{
   "set": 0,
   "binding": 0,
   "name": "DATA_48",
   "size": 384,
   "arrayLen": 1,
   "type": "UNIFORM",
   "members": [
       {
           "name": "data",
           "size": 384,
           "offset": 0
       }
   ]
}]
{% endhighlight %}

This isn't super helpful, which I think means that I'm going to have to add some support for glsl comment annotations to let this tool spit out more information about the "DATA48" struct. However, my main point here is that this "array of structs" approach does not require you to recompile your c++ code to make shader changes. Once you know the offsets for each variable, you can just do some quick pointer math and write things where they need to go in a generic way.

Side Note: this ShaderPipeline tool is turning out to be way more useful than the material system demo. I think it's soon going to need it's own github repo.

## A Potential Implementation Idea

I haven't tried this out yet, so take it with a grain of salt, but it seems like this technique would make it possible to keep uniform data centralized in a few different memory pools, one for each size of uniform buffer object (ie: a pool for 48 byte buffers, a pool for 128 byte, etc). Whenever a material instance gets created, it just gets assigned a slot in the appropriate pool for it's data. Then when it comes time to actually use the material, it just needs to know enough to pass the index (or indices in the case of multiple uniforms) via push constants to select the right data.

It might even be possible to use this separation of materials to figure out which thread should build the commands for drawing each object, so that each command list that gets built doesn't necessarily even need to bind every one of these uniform arrays.

I think this is the approach I'm going to try first in the next non-demo project that I make with Vulkan (whatever/whenever that is), but as simple as it sounds on paper, there's already at least one more factor that needs to be mentioned:

## Handling Large Buffer Updates

This approach to uniform data runs into problems pretty quickly as you add more entries to the arrays of data. The [vulkan spec](https://www.khronos.org/registry/vulkan/specs/1.0/man/html/vkCmdUpdateBuffer.html) states that:

>Buffer updates performed with vkCmdUpdateBuffer first copy the data into command buffer memory when the command is recorded (which requires additional storage and may incur an additional allocation), and then copy the data from the command buffer into dstBuffer when the command is executed on a device.

>The additional cost of this functionality compared to buffer to buffer copies means it is only recommended for very small amounts of data, and is why it is limited to only 65536 bytes.

>Applications can work around this by issuing multiple vkCmdUpdateBuffer commands to different ranges of the same buffer, but it is strongly recommended that they should not.

So once we exceed 65536 bytes in one of our buffer pools, we need to find a different way to update the data there. With the 48 byte buffers we're using above, we won't hit that limit for a while, but a hypothetical 128 byte uniform buffer array would exceed the limit with only 512 entries.

It seems like the right way to address this is to limit the size of any vkBuffer that stores data that needs to be modified, and then just before the renderer begins assembling command lists, copy those buffers into a larger buffer that exceeds the 65536 limit. This approach will add some additional complexity to setting up material data / managing those buffer pools, but wouldn't increase any complexity as far as our actual rendering logic is concerned... which I like.

## Wrap Up

I'll mention again that I haven't actually tried this out in a real application, and it could be that there are performance costs associated with binding really large buffers, or some other performance gotcha that I'm going to run into with this approach (in fast, there's almost certainly at least 10 things I'm not considering), but I really like this approach to working with uniform data, so I'm going to start giving it a shot in larger projects.

This was a really fun post to write and fun project to put together. Between my last post about texture arrays, and this one, I feel like I"m starting to get a good grip on how Vulkan handles Descriptor Sets, and how things map from GLSL to Vulkan.

As always, if you want to say hi, or point out something that I got wrong (or didn't think about), send a message to @khalladay [on Twitter](https://twitter.com/khalladay) or [on Mastodon](https://mastodon.gamedev.place/@khalladay). Have a good one!
