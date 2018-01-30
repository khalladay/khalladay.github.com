---
layout: post
title: Using Arrays of Textures in Vulkan Shaders
categories:
- blog
- tutorial
- vulkan
tags:
- <span style="background-color:#AA2222;"><font color="white">&nbsp;Vulkan</font></span>
---

Lately I've been trying to wrap my head how to effectively deal with textures in Vulkan. I don't want any descriptor sets that need to be bound on a per object basis, which means that just sticking each texture into it's own set binding isn't going to work. Instead, thanks to the [Vulkan Fast Paths](http://32ipi028l5q82yhj72224m8j-wpengine.netdna-ssl.com/wp-content/uploads/2016/03/VulkanFastPaths.pdf) presentation from AMD, I've been looking into using a global array of textures that stores all my textures in a descriptor set that I can bind at the beginning of the frame.

The AMD presentation doesn't actually cover how to set up an array of textures in Vulkan, and I couldn't find a good explanation of how to do that anywhere online, so now that I've figured it out I want to post a quick tutorial on here about it for the next person who gets stuck. I'll go more in depth about how this array fits into my material system in a later post, but for now I just want to cover the nuts and bolts of setting up a shader to use an array of texture.

One more thing to note before I get started: If you're looking for a way to work with images of the same size, Sascha Willems has a great example of using a sampler2DArray in his [Vulkan Examples Project](https://github.com/SaschaWillems/Vulkan). The advantage of using an array of textures instead of something like a sampler2DArray is that the array of textures approach supports storing multiple image sizes in the same array by default. I don't know how much (if any) of a performance penalty you pay for using an array of textures over a sampler2DArray. 

With all that said, the goal of this post is going to be to walk through how to set up a Vulkan app so that you can use a shader like this one:

{% highlight c %}
#version 450 core
#extension GL_ARB_separate_shader_objects : enable

layout(set = 0, binding = 0) uniform sampler samp;
layout(set = 0, binding = 1) uniform texture2D textures[8];

layout(push_constant) uniform PER_OBJECT
{
	int imgIdx;
}pc;

layout(location = 0) out vec4 outColor;
layout(location = 0) in vec2 fragUV;

void main()
{
	outColor = texture(sampler2D(textures[pc.imgIdx], samp), fragUV);
}
{% endhighlight %}

I've put all the code for this up in an [example project](https://github.com/khalladay/VulkanDemoProjects/tree/master/VulkanDemoProjects/TextureArrays) on github, which renders a full screen quad with the above shader, and changes what image is displayed by updated the imgIdx variable in the push constant, so feel free to grab that and take a look. I'm going to deep dive into parts of that code for the remainder of this post.

## Setting Up The Descriptor Set Layout

Setting up a descriptor set binding to work with an array of textures looks very similar to setting it up to work with a single texture. The main difference is the "decsriptorCount" variable on the VkDescriptorSetLayoutBinding structure: with a single texture you'd set this to 1, whereas with an array of textures, you set that variable to the number of elements in your array. For the above shader, the layout binding structure for the texture array might look like this:

{% highlight c %}
VkDescriptorSetLayoutBinding layoutBinding = {};
layoutBinding.descriptorCount = 8;
layoutBinding.binding = 1;
layoutBinding.stageFlags = VK_SHADER_STAGE_FRAGMENT_BIT;
layoutBinding.descriptorType = VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE;
layoutBinding.pImmutableSamplers = 0;
{% endhighlight %}

In hindsight, this is pretty obvious, but it took me awhile to realize that "descriptorCount" was the right spot for this information.

Once the above is set up, you just create your DescriptorSet (and DescriptorSetLayout) like you would with any other layout binding types. The demo app I posted has a working example of all of that.

## Writing the Descriptor Sets

Similar to the above, writing a texture array to a descriptor set is much more straightforward than it seems at first. The key is to have your VkDescriptorImageInfo structs already in an array. If you aren't using a combined image sampler, you don't actually need to fill in the sampler value on these structs. In my demo project, I set up this array like so:

{% highlight c %}
VkDescriptorImageInfo	descriptorImageInfos[TEXTURE_ARRAY_SIZE];

for (uint32_t i = 0; i < TEXTURE_ARRAY_SIZE; ++i)
{
    demoData.descriptorImageInfos[i].sampler = nullptr;
    demoData.descriptorImageInfos[i].imageLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;
    demoData.descriptorImageInfos[i].imageView = demoData.textures[i].view;
}
{% endhighlight %}

In a non contrived application, you likely won't have all the imageViews already in a neat little array like this, but it doesn't matter how those image views are laid out, as long as the DescriptorImageInfo structs you use are in an array of some kind.

Once you've set up those structs, setting up the rest of the WriteDescriptorSet for the array of textures is very simple:

{% highlight c %}
VkWriteDescriptorSet setWrites[2];

setWrites[1] = {};
setWrites[1].sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
setWrites[1].dstBinding = 1;
setWrites[1].dstArrayElement = 0;
setWrites[1].descriptorType = VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE;
setWrites[1].descriptorCount = TEXTURE_ARRAY_SIZE;
setWrites[1].pBufferInfo = 0;
setWrites[1].dstSet = demoData.descriptorSet;
setWrites[1].pImageInfo = demoData.descriptorImageInfos;

{% endhighlight %}

Note that just like earlier with the DescriptorSetLayoutBinding, the descriptorCount variable here is where you need to specify the length of your array.


## GlslangValidator And Large Arrays

If you're using the standable glslangvalidator tool from the [glslang project](https://github.com/KhronosGroup/glslang), you're going to run into some issues if you try to make a large array of textures (ie / more than 80). If you do that, you'll see an error message like the following:

>'binding' : sampler binding not less than gl_MaxCombinedTextureImageUnits (using array)

This was a problem for me because I want to keep all the textures used in any given frame bound, so my initial array size was set to 4096 (with all of those image views defaulting to the same image). As you probably guessed from the "gl_" prefix in the error being generated, this error doesn't actually apply to Vulkan shaders, so if you're sure that your shader will never be used by OpenGL, you need to tell the compiler not to worry about gl_MaxCombinedTextureImageUnits.

To do this, you need to create a device capabilities config file, like so:

{% highlight c %}
 "glslangvalidator -c > myconfig.config"
 {% endhighlight %}

It's important that your file uses the .config extension, because that's the extension that glslangvalidator will look for in it's argument list to know if an alternate config file is being provided.  

Once you have this config file, all you need to do is open it up in your favourite text editor and look for the "MaxCombinedTextureImageUnits" line:

{% highlight c %}
MaxVertexAttribs 64
MaxVertexUniformComponents 4096
MaxVaryingFloats 64
MaxVertexTextureImageUnits 32
MaxCombinedTextureImageUnits 80
MaxTextureImageUnits 32
{% endhighlight %}

Change that 80 to a really big number and you're on your way. One thing to note is that I ran into some issues when I did this originally because I generated the config file using powershell, which defaults to writing text files out using UCS2-LE text encoding. You don't want that. Make sure that your cconfig file is set to a sane encoding, like UTF-8, otherwise the validator won't be able to read the file back in properly.

Once you have your properly encoded, lots of textures using config file ready you are good to recompile your shader. This time, invoke the compiler like so:

{% highlight c %}
glslangvalidator -V myfile.frag myconf.conf
{% endhighlight %}

As long as your config file uses the .conf extension, that should be all you need to get it to stop complaining and do its job.

## That's All Folks!

When all the above is done, you should be able to simply pass your array index via push constants the same way you'd pass anything else via push constants and be on your way. If anything above was unclear, let me point you again in the direction of the [demo project](https://github.com/khalladay/VulkanDemoProjects/tree/master/VulkanDemoProjects/TextureArrays) on github, which will provide you with a relatively small working example.

Hopefully this was helpful! I realize it's a short post, and there's nothing here thats groundbreaking, but (imo), Vulkan needs more easily digestible tutorial content, so here this post is. In any case, if you want to say hi, send a message to @khalladay [on Twitter](https://twitter.com/khalladay) or [on Mastodon](https://mastodon.gamedev.place/@khalladay). Thanks for reading!
