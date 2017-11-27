---
layout: post
title: Lessons Learned While Building a Vulkan Material System
categories:
- blog
- tutorial
tags:
- <span style="background-color:#AA2222;"><font color="white">&nbsp;Vulkan</font></span>
---

One of the things I'm noticing about learning Vulkan, is that there isn't a lot of material out there to bridge the gap between being a complete beginner, and being able to build your own real applications.

I didn't realize how big this gap was was until I decided to start my next Vulkan project by building a material system. It was supposed to just be the first step in something bigger, but I realized pretty quickly that I didn't know nearly enough to even get this small piece done. So I scrapped my loftier plans, and decided to split building the material system up into two parts. The first phase (which is the part I have done) was to simply load materials from a file which specified which shaders to use, and which default values to use for their inputs. To keep things simple, I've so far always been loading the material onto a full screen quad.

The second phase will be to extend the system to handle material instances, and thousands of objects, but before I dive into that, it felt like a good time to take a step back and write down some of the things I've had to figure out to get this far, in case someone else gets stuck in the same places.


<div align="center">
<img src="/images/post_images/2017-11-28/output.png" />
<font size="2">One of my tests was Inigo Quilez's <a href="https://www.shadertoy.com/view/Xds3zN">raymarching primitives shader</a></font>
<br><br>
</div>

This post is going to jump around a little bit, as you'll notice by the headings. Some things I want to share are just things I didn't realize about how to use the Vulkan API, some are "good ideas" that are working out for me so far, and finally I want to write a bit about the high level structure of how my material system works.

All the code for everything is [on github](https://github.com/khalladay/VkMaterialSystem), and I've tried to add helpful comments to [material_creation.cpp](https://github.com/khalladay/VkMaterialSystem/blob/master/VkMaterialSystem/material_creation.cpp), which contains most of the stuff I'm talking about here. Standard caveats to everything: I barely know what I'm doing, there's probably better ways to do this, I'm not a lawyer, yadda yadda yadda.  

## How Descriptor Sets (and Bindings!) Work

The first thing that I really needed to get a handle on was how descriptor sets work in Vulkan GLSL. It's easy enough to look at the syntax and realize that they're a method for grouping shader inputs and move on, but there's a bit more to them than that.

For one, Vulkan shaders aren't namespaced, so Descriptor Set 0 in your vertex shader, is Descriptor Set 0 in your fragment shader (or any other stage you're using in your material). This also means that a single descriptor set can have bindings that exist in different shader stages, but still all belong to the same set. Even more fun, since the SPIR-V compiler will (likely) remove any variables not in use by your shader, your shader stages may all have the same Descriptor Set Binding in them, and see different versions of that binding.

Let me show you what I mean. If you have a vertex shader that uses descriptor set 0, binding 0, to hold some global information:

{% highlight c %}
layout(binding = 0, set = 0)uniform GLOBAL_DATA
{
    float time;
    vec2 mouse;
}global;
{% endhighlight %}

But your actual shader code only ever uses the time member of the GLOBAL_DATA uniform, the compiler will optimize away the mouse member var entirely. However, your fragment shader might also need access to global data, and if it uses the mouse data, and not the time data, it won't even know that set 0, binding 0 has the time member in it.

To keep everyone on same page despite this, data about the size of the overall uniform is still there (that is, the size of the struct with ALL members, including compiled out ones, present), along with information about the offset into the struct that a member sits at. So your fragment shader, which only knows about mouse data, will still know that the GLOBAL_DATA uniform is 32 bytes large, and the mouse data is offset 16 bytes from the start of the uniform buffer. With this information, it doesn't matter which member vars each stage sees.

Note that uniform members are 16 byte aligned in Vulkan, more on that later.

## Use Descriptor Sets To Group Inputs By Update Frequency

You can't bind an individual set binding in a command buffer, you have to bind an entire descriptor set at once, and binding a descriptor set is a performance heavy operation. What you should do (at least according to [NVidia's Article](https://developer.nvidia.com/vulkan-shader-resource-binding)), is use your descriptor sets to group shader inputs by how frequently they need to be swapped out. Once a descriptor set is bound, it stays bound for the duration of that command buffer, until something else gets bound to that set index. So if everything uses the same set 0, you can bind it once and never pay the cost to bind that again (until next frame).

In my project, I chose set 0 to store Global data which all shaders can access, which will get bound at the beginning of a frame and stay bound while rendering everything, left set 1 alone for a future experiment, and used sets 2 and 3 for data which can change on a per material / per material instance basis. Set 2 is for data which will get set when a material or instance is first loaded and then never changed (like the albedo texture of a character), while set 3 is for shader inputs that can be manipulated at runtime.

An example of how this might play out:

{% highlight c %}
for each view {
  bind global resourcees          // set 0

  for each shader {
    bind shader pipeline  
    for each material {
      bind material resources  // sets 2,3
    }
  }
}
{% endhighlight %}

Obviously this is a pretty simple rendering model, but it's good enough for this stage of my material system's life.

Technically speaking, sets 2 and 3 could be one set, but having a separation between static and dynamic data made sense to me, since I have to keep around a lot more information about the dynamic data to facilitate updating it later, but time will tell if this is a good idea or not. I think it largely depends on if theres a higher cost associated with binding multiple descriptor sets in one call to vkCmdBindDescriptorSets.

## VkDescriptorPools Can Store Descriptors of Different Types

This is pretty obvious if you're reading the actual API docs, but when I started this, most of my information was coming from tutorials like [vulkan-tutorial.com](https://vulkan-tutorial.com/), which never explicitly points out that your descriptor pools don't have to be segregated by descriptor type. You can store uniform buffers, combined image samplers, dynamic buffers, the whole shebang in the same pool.

## Getting Arbitrary Descriptor Set Layouts

The last three points were more about general Vulkan knowledge, but the rest are all about implementation details.

The most obvious problem with building a generic material loading system in Vulkan vs OpenGL is the lack of shader reflection available at runtime. In OpenGL all this functionality was there by default, but in Vulkan we need to use the wonderful [SPIR-V Cross](https://github.com/KhronosGroup/SPIRV-Cross) library to help us get at this information.

I didn't want to embed SPIR-V Cross in my runtime application, since it felt like unnecessary bloat, so I wrote a separate application that I called the "ShaderPipeline" (also available [on github](https://github.com/khalladay/VkMaterialSystem/tree/master/ShaderPipeline)). This program runs whenever a shader has been edited, and handles compiling GLSL into SPIR-V, and creating json files (.refl files) that store reflection information about these shaders.  

One of these .refl files might look like the following:

{% highlight c %}
{
    "descriptor_sets": [
        {
            "set": 0,
            "binding": 0,
            "name": "GLOBAL_DATA",
            "size": 32,
            "type": "UNIFORM",
            "members": [
                {
                    "name": "mouse",
                    "size": 16,
                    "offset": 16
                }
            ]
        }
    ],
    "global_sets": [
        0
    ],
    "static_sets": [],
    "dynamic_sets": [],
    "static_set_size": 0,
    "dynamic_set_size": 0,
    "num_static_uniforms": 0,
    "num_static_textures": 0,
    "num_dynamic_uniforms": 0,
    "num_dynamic_textures": 0
}
{% endhighlight %}

You'll notice that at the end I have some extra data about which descriptor sets are global, dynamic, or static, and how many of each type we have. This information is obviously not technically necessary, but this way I can decide to change which sets belong to which category at the ShaderPipeline level instead of the runtime application, and having the counts available was just handier than counting them later.

## Fill Gaps In Your VkDescriptorSetLayout Array With Empty Elements

This one definitely threw me for awhile until I figured out what to do, since it's not something that I saw in any tutorial or example code before trying this project out.

One of the first things you need to do when you're creating your material is to make VkDescriptorSetLayouts for each descriptor set in use by the shaders in your material. Eventually, you use this array of DescriptorSetLayouts as part of your VkPipelineLayoutCreateInfo struct. One thing you may have noticed is that a VkDescriptorSetLayout struct doesn't have any spot for specifying which set that layout is for. This means the api assumes that the array of VkDescriptorSetLayouts that you use is a continuous collection of sets - that is - if your array is 3 elements long, it is for sets 0, 1, and 2.

In practice, you'll likely have gaps in the sets that your shaders use, especially if you assign each set number a specific use case, like I did above. In this case, you need to make a VkDescriptorSet for each set you aren't using as well. These "empty" elements will have their binding count set to 0, and their pBindings array set to null, but still need to be in your final array of set layouts, or else nothing is going to work right.


## If you're manually specifying a struct that maps to a set, alignment matters

To keep things simple, I'm keeping my global data as a mapped struct, since I'm assuming (hoping?) that because it's not a lot of data, and it only gets updated once a frame, there won't be much of a performance penalty (this is untested right now though, so... ymmv).

When I first set this up, I defined my struct like so:

{% highlight c %}
struct GlobalShaderData
{
    glm::float32 time;
    glm::vec4 mouse;
    glm::vec2 resolution;
    glm::mat4 viewMatrix;
    glm::vec4 worldSpaceCameraPos;
};
{% endhighlight %}

and this compiled and ran...sorta. Data was getting sent to the gpu, but the wrong data seemed to be filling the variables in the shader. Turns out, this is because (as mentioned earlier) uniform struct members are 16 byte aligned in Vulkan.

Awkwardly, fixing this problem in MSVC looks like this:

{% highlight c %}
struct GlobalShaderData
{
    __declspec(align(16)) glm::float32 time;
    __declspec(align(16)) glm::vec4 mouse;
    __declspec(align(16)) glm::vec2 resolution;
    __declspec(align(16)) glm::mat4 viewMatrix;
    __declspec(align(16)) glm::vec4 worldSpaceCameraPos;
};
{% endhighlight %}

I'm about 110% positive there's a less awful way of doing this, so please, please let me know what it is [on Twitter](https://twitter.com/khalladay).

That's the end of the "potentially helpful to everyone" segment of the post, if you want to know more about the structure of my material systeem so far, read on!

## My Ugly Little Material System

To preface: I'm going to include more information than anyone needs, because I wish implementation details about how someone else had approached this problem was readibly available to me before I started on this path.

As I mentioned earlier, my system works in two passes. The first pass, called the "ShaderPipeline", is an application that gets run whenever a shader is modified. This handles compiling GLSL into SPIR-V, and generates the reflection files I talked about earlier.

Materials are defined in their own json files (I don't love json, but [rapidjson](https://github.com/Tencent/rapidjson) is really easy to use), which specify which shaders to use for each stage, and default values for their inputs. A Simple material might look like this:

{% highlight c %}
{
  "shaders":
  [
    {
      "stage": "vertex",
      "shader": "vertex_uvs",
      "defaults":
      [
        {
          "name":"Instance",
          "members":
          [
            {
              "name": "tint",
              "value": [0.0, 1.0, 1.0, 1.0]
            }
          ]
        }
      ]
    },
    {
      "stage": "fragment",
      "shader": "fragment_passthrough",
      "defaults":
      [
        {
          "name": "texSampler",
          "value":"../data/textures/airplane.png"
        }
      ]
    }
  ]
}
{% endhighlight %}

When a material is loaded from a file, this material file is unpacked into a Material::Definition struct, which is formatted to make it easy to access the data we need when creating the vulkan material. Below is what that struct looks like, but if you want to know what the custom types inside it are (like PushConstantBlock), go check out [material_creation.h](https://github.com/khalladay/VkMaterialSystem/blob/master/VkMaterialSystem/material_creation.h)

{% highlight c %}
struct Definition
{
  PushConstantBlock pcBlock;
  std::vector<ShaderStageDefinition> stages;
  std::map<uint32_t, std::vector<DescriptorSetBinding>> descSets;

  std::vector<uint32_t> dynamicSets;
  std::vector<uint32_t> staticSets;
  std::vector<uint32_t> globalSets;

  uint32_t numStaticUniforms;
  uint32_t numStaticTextures;
  uint32_t numDynamicUniforms;
  uint32_t numDynamicTextures;
  uint32_t staticSetsSize;
  uint32_t dynamicSetsSize;
};
{% endhighlight %}

The Material::Definition struct is what gets passed to the material creation function. If you really wanted to, you could create a definition at runtime and make new materials on the fly. I'm sure at some point I'll think of a clever reason to do that.

The advantage of this Material::Definition struct is that it's trivial to add more information to it. If I wanted my material json files to specify blend mode, ZWrite behaviour, Culling Mode, Polygon Mode, or anything else, I can just add a field to this and grab it out of the json. For now, the creation method just assumes I want an opque, ZWriting, Cull Back, Polygon Filled material, but that will be made configurable pretty much as soon as I want to have a translucent material.

Once loaded, all the data needed to render a material is stored in a MaterialRenderData struct:

{% highlight c %}
struct MaterialRenderData
{
  //general material data
  VkPipeline pipeline;
  VkPipelineLayout pipelineLayout;

  uint32_t layoutCount;
  VkDescriptorSetLayout* descriptorSetLayouts;

  VkDescriptorSet* descSets;
  uint32_t numDescSets;

  UniformBlockDef pushConstantLayout;
  char* pushConstantData;

  //we don't need a layout for static data since it cannot be
  //changed after initialization
  VkBuffer* staticBuffers;
  VkDeviceMemory staticUniformMem;
    uint32_t numStaticBuffers;

  //for now, just add buffers here to modify. when this
  //is modified to support material instances, we'll change it
  //to something more sane.
  MaterialDynamicData dynamic;
};
{% endhighlight %}

There are a few things to talk about here. Firstly, I store the data used for a material's push constants in the RenderData struct, so that if nothing has changed since the last time they were set, we have that data already sorted out. Rather than store each of the push constant members in a map, or other collection, I keep all the data for the entire push constant block in a char* buffer, and then store layout data about that char* in a UniformBlockDef struct, which looks like this:

{% highlight c %}
struct UniformBlockDef
{
  //stride 2 - hashed name / member offset
  uint32_t* layout;
  uint32_t blockSize;
  uint32_t memberCount;
  VkShaderStageFlags visibleStages;
};
{% endhighlight %}

As the comment says, instead of storing string names for the member vars, I hash them and store them along with each member's offset into the buffer.

Setting a push constant value on a material then becomes a simple matter of looping over this layout buffer until you find the member you want, and using the offset data located next to it:

{% highlight c %}
void setPushConstantData(uint32_t matId, const char* var, void* data, uint32_t size)
{
  MaterialRenderData& rData = Material::getRenderData(matId);

  uint32_t varHash = hash(var);

  for (uint32_t i = 0; i < rData.pushConstantLayout.memberCount * 2; i += 2)
  {
    if (rData.pushConstantLayout.layout[i] == varHash)
    {
      uint32_t offset = rData.pushConstantLayout.layout[i + 1];
      memcpy(rData.pushConstantData + rData.pushConstantLayout.layout[i + 1], data, size);
      break;
    }
  }
}
{% endhighlight %}

Then when it's time for that material to be rendered, I can just grab the entire buffer of push constant data and send it on its way.

I like this approach to the problem because it makes Push Constant members (and other dynamic data, which uses a smiliar paradigm) "fire and forget" data, that is, nothing blows up if I try to set a push constant var on a material that doesn't have that member, the function just doesn't find the member in the layout buffer and does nothing. It ends up working very much like the functions for setting shader inputs on Unity's Material class.

I use this same paradigm to handle setting dynamic uniform data, although in that case I have to call vkCmdUpdateBuffer instead of just memcpying, since I have to update device local memory. This could probably be sped up by collecting all the updates for a frame and then doing the vulkan update once, but I'll worry about that in phase 2. Dynamic uniforms also need a bit more information stored about them, so I have a separate struct, called MaterialDynamicData to store that:

{% highlight c %}
struct MaterialDynamicData
{
  uint32_t numInputs;

  // stride: 4 - hashed name / buffer index / member size / member offset
  // for images- hasehd name / textureViewPtr index / desc set write idx / padding
  uint32_t* layout;
  VkBuffer* buffers;
  VkDeviceMemory uniformMem;

  VkWriteDescriptorSet* descriptorSetWrites;
};
{% endhighlight %}

The big difference between this and the push constant data is that I'm also keeping the VkWriteDescriptorSet structs around, so that I can change what textures are being used at runtime, and the layout buffer is storing more information per member, but it's all pretty much working the same way as the push constants.

These MaterialRenderData structs are stored in a map (boo!) that uses uint32_ts as keys. When the renderer wants to get the information about a mesh's material, it uses the integer material name to get the corresponding struct, and Bob's your uncle.


## Problems and Limitations With My System

Oh boy, there's a lot of them. Probably the biggest being that none of it has actually survived being used in a real project, but I suppose there's some more specific things to point out.


Number one is that storing the VkDeviceMemory directly in the material is probably bad, and should likely be replaced by an actual allocator doing actual allocator things.

Secondly, as mentioned before, this doesn't handle material instances at all yet, so if you want two materials, using the same shaders but a different texture, you need two whole materials to do it. Phase 2 of this project will remedy that, and add some more customization options to the Material::Definition struct.

All my materials are stored in maps, and setting any data on them requires a map lookup to get the MaterialRenderData struct for that material. This results in a LOT of unnecessary map lookups. Looking up materials by id is going to happen an awful lot, and I'm not thrilled about using a map at all (but it was easy!). Instead, this should probably do something like store materials in an array, use the integer id to store an index into the array and some additional data to handle when an array slot gets re-used (like [Bitsquid does with their ECS](http://bitsquid.blogspot.com/2014/08/building-data-oriented-entity-system.html))

It also should probably support hot reloading of shaders to make editing easier, maybe I should add a phase 3?

Regardless, hopefully this article was helpful to someone! If you want to say hi / want to point out something dumb I'm doing. give me a shout [on Twitter](https://twitter.com/khalladay), or @Khalladay on [Mastodon](gamedev.mastodon.place).
