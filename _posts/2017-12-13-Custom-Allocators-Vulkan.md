---
layout: post
title: A Simple Device Memory Allocator For Vulkan
categories:
- blog
- tutorial
tags:
- <span style="background-color:#AA2222;"><font color="white">&nbsp;Vulkan</font></span>
---

Last month, I posted about the [material system](http://kylehalladay.com/blog/tutorial/2017/11/27/Vulkan-Material-System.html) that I've been trying to piece together, and talked about how the next step for that system was going to be to extend it to handle material instances. This sounded like a great next step until I started building it and realized that in order for this to work with arbitrary data, I needed to sort out how I wanted to manage allocating arbitrary amounts of Vulkan device memory.

Vulkan only gives you a limited amount of allocations that you're allowed to have active at one time (set by your gpu), so I can't keep creating new allocations for every new material, and I definitely can't for material instances. So instead of pressing forward with the material system, I took a quick detour to figure out how to write a memory allocator that would solve this problem for me.

If you're not interested in the implementation details, GPUOpen already has a very capable memory allocator that's open source and ready to use, and is way better than what I've put together (you can get it [here](https://github.com/GPUOpen-LibrariesAndSDKs/VulkanMemoryAllocator)) but I wanted to figure out how to write my own, which is what I'm going to talk about for the rest of this post.

<div align="center">
<img src="/images/post_images/2017-12-14/duck.jpg" />
<font size="2">I have no idea how to take a picture of an allocator</font>
<br><br>
</div>


## Understanding Vulkan Memory

The first thing I needed to take a look at was how exactly Vulkan memory worked, and there wasn't a better spot than the output of [vkGetPhysicalDeviceMemoryProperties](https://www.khronos.org/registry/vulkan/specs/1.0/man/html/vkGetPhysicalDeviceMemoryProperties.html)

On my GPU (GTX 1060), this reported that my device had 2 memory heaps, one that was 6 GB, and one that was 16 GB, this was interesting because according to NVidia's system stats, my gpu only has 14.2 GB of total graphics memory (and I never really figured out what this discrepancy was all about). However, the 6GB number made sense, since that's how much dedicated video memory I have on my card.

The only other information given about these heaps was a "flags" variable. A quick look at the Vulkan docs reveals that there's only one flag defined right now:

{% highlight c %}
typedef enum VkMemoryHeapFlagBits {
    VK_MEMORY_HEAP_DEVICE_LOCAL_BIT = 0x00000001,
} VkMemoryHeapFlagBits;
{% endhighlight %}

Which makes sense because my 6 GB heap is listed with a flags value of 1, making it the device local memory (which is what I'd expect, given that it's my dedicated memory), and the other heap has a flags value of 0, which I assume just means that anything goes with that heap.

The other thing returned by vkGetPhysicalDeviceMemoryProperties is an array of memory types. These are important because when you're allocating memory pools, you can't mix memory types, so unlike on the CPU where you can malloc up as much as you want and parcel it out to anything, in Vulkan, you need multiple large allocations that you parcel out from based on type.

Vulkan memory types are identified by what heap they belong to, and which of the following property bits they have set:

{% highlight c %}
typedef enum VkMemoryPropertyFlagBits {
    VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT = 0x00000001,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT = 0x00000002,
    VK_MEMORY_PROPERTY_HOST_COHERENT_BIT = 0x00000004,
    VK_MEMORY_PROPERTY_HOST_CACHED_BIT = 0x00000008,
    VK_MEMORY_PROPERTY_LAZILY_ALLOCATED_BIT = 0x00000010,
} VkMemoryPropertyFlagBits;
{% endhighlight %}

On my machine, using the above information, I could determine the following about the memory types I have available:

* 7 memory types that use Heap 1 (all graphics memory), but have none of the above properties (wtf?)
* 2 memory types which have the VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT property, and are located in heap 0 (dedicated memory)
* 1 memory type which have the VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT and VK_MEMORY_PROPERTY_HOST_COHERENT_BITproperties, located in heap 1
* 1 memory type which have the VK_MEMORY_PROPERTY_HOST_CACHED_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, and VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT properties, in heap 1

Some of this makes sense, but wtf is going on with the duplicate memory types? Quick, REACT WITH BLAME!

## This is NVidia's Fault!

A quick jaunt over to the [Vulkan Hardware Database]() shows that it's only NVidia cards that have these extra memory types, and a quick trip to google turns up [this article](https://developer.nvidia.com/what%E2%80%99s-your-vulkan-memory-type), which says that in additional to the memory types that Vulkan gives you, NVidia cards have additional types which are specialized for certain kinds of data. Fair enough, the problem is figuring out which of our mystery memory types are for what data.

Here's where you really hope the article has an enum definition or something, but instead we get this:

>A memory allocator that follows the rules and guidance of the Vulkan specification should be able to handle all these memory types gracefully by properly interpreting the VkMemoryRequirements::memoryTypeBits member when selecting an allocation for a specific resource.

Gee... thanks. Turns out, even when you're working with Vulkan, you have to accept some amount of vendor specific magic behind the scenes.

Thankfully, the [Vulkan spec](https://www.khronos.org/registry/vulkan/specs/1.0/html/vkspec.html#memory-device) gives us the exact bit of code we need to follow its "rules and guidance" when determining what memory type to use:

{% highlight c %}
// Find a memory in `memoryTypeBitsRequirement` that includes all of `requiredProperties`
int32_t findProperties(const VkPhysicalDeviceMemoryProperties* pMemoryProperties,
                       uint32_t memoryTypeBitsRequirement,
                       VkMemoryPropertyFlags requiredProperties)
{
    const uint32_t memoryCount = pMemoryProperties->memoryTypeCount;

    for (uint32_t memoryIndex = 0; memoryIndex < memoryCount; ++memoryIndex)
    {
        const uint32_t memoryTypeBits = (1 << memoryIndex);
        const bool isRequiredMemoryType = memoryTypeBitsRequirement & memoryTypeBits;

        const VkMemoryPropertyFlags properties = pMemoryProperties->memoryTypes[memoryIndex].propertyFlags;
        const bool hasRequiredProperties = (properties & requiredProperties) == requiredProperties;

        if (isRequiredMemoryType && hasRequiredProperties)
        {
            return static_cast<int32_t>(memoryIndex);
        }
    }

    // failed to find memory type
    return -1;
}
{% endhighlight %}

So until I find a good reason to not use the above code exactly, I'm going to copy/paste the crap out of it.

## Allocating Device Memory

The next thing I looked into was how to allocate device memory. I almost skipped this step, given that I've built a few projects already, and figured that calling vkAllocateMemory was about all there was to it. Turns out I was wrong and there were few things that I didn't realize I needed to keep in mind. All this information comes from the [vulkan spec page](https://www.khronos.org/registry/vulkan/specs/1.0/man/html/vkAllocateMemory.html) for vkAllocateMemory, so if you want to go straight to the source, there it is.

Here are all the things I didn't know about allocating device memory before I looked there:

* vkAllocateMemory is guaranteed to return an allocation that is aligned to the largest alignment requirement for your Vulkan implementation (ie: if one resource type needs to be 16 byte aligned, and another type 128 byte aligned, all vkAllocateMemory calls will be 128 bit aligned), so you never have to worry about the alignment of these allocs.

* Some platforms limit the maximum size a single allocation can be, and this limit can be different for each memory type. So if you're getting VK_ERROR_OUT_OF_DEVICE_MEMORY errors but don't see an obvious cause, that may be it.

* There is a limit to the amount of memory available in each memory heap your implementation provides (found in vkGetPhysicalDeviceMemoryProperties).

* The vkAllocateMemory call has a parameter for a VkAllocationCallbacks structure, which can be used to provide custom allocators for host memory. I'm ignoring this today, but it's good to know what that argument for.

Finally, as mentioned earlier, Vulkan limits the number of vkDeviceMemory allocations you can have active at one time. You can grab the limit from VkPhysicalDeviceLimits (on my gpu, the limit was 4096). If you try to exceed this limit, you get VK_ERROR_TOO_MANY_OBJECTS.  This allocation count limit is the reason for all of this work: I don't want to write a material instancing system that bogarts all my allocations.

## Binding Memory And Freeing Resources

Assuming that all of the nuances of allocating memory have been properly handled, there's still the matter of actually using that memory. In Vulkan, this means "binding" a buffer to some region of a vkDeviceMemory allocation. Luckily this is much more straightforward than allocating the memory: all you need to do is call a binding function, like one of these:

{% highlight c %}
VkResult vkBindBufferMemory(
    VkDevice                                    device,
    VkBuffer                                    buffer,
    VkDeviceMemory                              memory,
    VkDeviceSize                                memoryOffset);

VkResult vkBindImageMemory(
    VkDevice                                    device,
    VkImage                                     image,
    VkDeviceMemory                              memory,
    VkDeviceSize                                memoryOffset);
{% endhighlight %}


Unlike vkAllocateMemory, which I brought up specifically to talk about all the gotchas, the functions used to bind memory are really simple. Instead, I'm mentioning this one to provide some info about how I decided on the structure of my allocator. Since any allocator that will solve the allocation count limit problem is going to be subdividing up large allocations, any call to allocate memory needs to return both the VkDeviceMemory handle for the large allocation we're subdividing, and the offset into that allocation used for this specific resource so that the allocation can be bound correctly.

I ended up settling on this:

{% highlight c %}
struct Allocation
{
    VkDeviceMemory handle;
    uint32_t type;
    uint32_t id;
    VkDeviceSize size;
    VkDeviceSize offset;
};
{% endhighlight %}

The only thing that may not be readily apparent is the id variable, which I'm adding since I'm assuming at some point I'll need some extra bits to help find the allocation inside a memory pool.

It's worth noting that once you bind memory to a Vulkan resource, the only way you can unbind that memory is to destroy the buffer, image, or whatever else that memory is bound too. You can free memory that's currently bound to something (as long as you make sure to stop using whatever it was bound to), but you can't decide to bind an allocated chunk of memory to something new until the original binding has been destroyed.

Whew, all that theory is finally out of the way! It's time to actually build something.

## A Basic Allocator Structure

For my project, all I did was define some function pointers for allocating things, and then have whatever allocator I wanted to use write to those pointers with its own functions. Sure, this means that I can't have multiple allocators in use at once, but I think I'm having the right amount of fun just worrying about 1 allocator right now. I already have a global struct called vkh::Context (vkh is the namespace for my "vulkan helper" code), so I just added another member to this struct that looks like so:

{% highlight c %}
struct AllocatorInterface
{
    //setup the allocator
    //args: vkh context structure
    void(*activate)(VkhContext*);

    //args: mem handle, size of alloc, mem type
    void(*alloc)(Allocation&, VkDeviceSize, uint32_t);

    //args: mem handle
    void(*free)(Allocation&);

    //args: memory type
    size_t(*allocatedSize)(uint32_t);

    //returns total number of active vulkan allocs
    uint32_t(*numAllocs);
};
{% endhighlight %}

The VkhContext structure can be found on github in [vkh.h](https://github.com/khalladay/VkMaterialSystem/blob/master/VkMaterialSystem/vkh.h).

## A Passthrough Allocator

To start things off, I decided that I wanted to build an allocator that did nothing, or rather, that just made the exact same calls that my program code was making otherwise, but routed through this "passthrough" allocator. This gave me a starting place for defining the interface I needed, and was pretty simple, since all my code already routed calls to allocate memory through two functions.

I'll leave out the activate function because it's specific to my program, and boring. Instead I want to start by showing off the allocate function:

{% highlight c %}
void alloc(Allocation& outAlloc, VkDeviceSize size, uint32_t memoryType)
{
    state.totalAllocs++;
    state.memTypeAllocSizes[memoryType] += size;

    VkMemoryAllocateInfo allocInfo = vkh::memoryAllocateInfo(size, memoryType);
    VkResult res = vkAllocateMemory(state.context->device, &allocInfo, nullptr, &(outAlloc.handle));

    outAlloc.size = size;
    outAlloc.type = memoryType;
    outAlloc.offset = 0;

    checkf(res != VK_ERROR_OUT_OF_DEVICE_MEMORY, "Out of device memory");
    checkf(res != VK_ERROR_TOO_MANY_OBJECTS, "Attempting to create too many allocations")
    checkf(res == VK_SUCCESS, "Error allocating memory in passthrough allocator");
}
{% endhighlight %}

Ok, so this function is also pretty boring in the passthrough allocator, but there's a couple of key things to note:

* All the errors I mentioned earlier are checked for. The checkf function essentially a macro for an assert that prints a log message and pops up a message window if it fails.
* Even though we aren't using it in this allocator, the Allocation structure we're returning gets it's offset set to 0 so that we can pass the offset to bind calls later.

With the allocation code out of the way, the rest of the allocator interface is pretty boring to look at:

{% highlight c %}
void free(Allocation& allocation)
{
    state.totalAllocs--;
    state.memTypeAllocSizes[allocation.type] -= allocation.size;
    vkFreeMemory(state.context->device, (allocation.handle), nullptr);
}

size_t allocatedSize(uint32_t memoryType)
{
    return state.memTypeAllocSizes[memoryType];
}

uint32_t numAllocs()
{
    return state.totalAllocs;
}
{% endhighlight %}

The entire source for this class is available [on github](https://github.com/khalladay/VkMaterialSystem/blob/material-instances/VkMaterialSystem/vkh_allocator_passthrough.cpp), but the above is the part that matters for what I'm talking about right now.

What's nice about this is that even though it really isn't doing anything interesting, it at least gives us a bit more insight into our memory use, which is certainly useful by itself. For example I know that the [material system demo app](https://github.com/khalladay/VkMaterialSystem) I posted last month needs 11 active allocations to render the frame, which is more than I knew last month when I wrote the thing.

## A Better Allocator Structure

Despite being pretty useful, the passthrough allocator didn't solve the allocation count problem that I needed solve. I needed to do something a bit more interesting.

So here's what I ended up resolving to build (remember, I just wanted something functional, so don't take any of this as a great idea):

* The allocator needs separate memory pools, one for each type of vulkan memory (this is required by the spec anyway)
* Each pool is made up of an array of large VkDeviceMeemory allocations and associated usage data about those allocations
* When something needs memory, I'll go through each large allocation, looking for the first large enough memory chunk in an allocation's usage data
* If no gap is found, I'll create a new large allocation to use, and add it to that pool's array.

There are lots of details that real allocators worry about that the above doesn't begin to cover, but I'm already down this rabbit hole far enough for my liking right now, and this minimal allocator suits my current needs just fine.

## How Subdividing Device Memory Works

The basics of subdividing device memory are simple - call vkBindDeviceMemory with a VkDeviceMemory to the allocation you're subdividing, and use the offset argument to select where in that allocation to go, but I figured there had to be more to it than that. One of the things I was sure that I needed to figure out was how to decide how big to make my large allocations, or heck, even how big a memory page is on the gpu.

Reading through the spec ([11.6. Resource Memory Association](https://vulkan.lunarg.com/doc/view/1.0.26.0/linux/vkspec.chunked/ch11s06.html)), I noticed the concept of "buffer-image granularity." The description in the spec was fairly confusing, but what I took away from it is that in addition to alignment concerns when sub allocating from a larger device memory allocation, if you're going to be using the same alloc for buffers and images, you also need to space them far enough apart within the alloc to satisfy this implementation defined value. If you screw this up, your validation layer let you know with the message:

>Linear buffer 0xXX is aliased with non-linear image 0xXX which may indicate a bug. For further info refer to the Buffer-Image Granularity section of the Vulkan specification. >(https://www.khronos.org/registry/vulkan/specs/1.0-extensions/xhtml/vkspec.html#resources-bufferimagegranularity)

So I'm using this buffer-image granularity number as my page size for allocations, and only ever allocating large blocks which are a multiple of that size for simplicity.

Another thing to keep in mind is that different memory types can't share the same VkDeviceMemory allocation, so we'll need a memory pool for each memoryType returned for our GPU (on my card, this meant that I'd need up to 11 memory pools).

## The Pool Allocator

Finally, we get to the good stuff. The Pool Allocator is what I ended up with after cramming all of the above into my head. I've talked about it enough already, so let's actually get to the code. To start off, I want to talk about the couple of structs that I'm using to track allocators, and allocator state data:

{% highlight c %}
struct OffsetSize { uint64_t offset; uint64_t size; };
struct BlockSpanIndexPair { uint32_t blockIdx; uint32_t spanIdx; };

struct DeviceMemoryBlock
{
    Allocation mem;
    std::vector<OffsetSize> layout;
};

struct MemoryPool
{
    std::vector<DeviceMemoryBlock> blocks;
};

struct AllocatorState
{
    VkhContext* context;

    std::vector<size_t> memTypeAllocSizes;
    uint32_t totalAllocs;

    uint32_t pageSize;
    VkDeviceSize memoryBlockMinSize;

    std::vector<MemoryPool> memPools;
};
{% endhighlight %}

So yeah... that's a lot of nested vectors, but it works and that's good enough for me right now. I'm sure someone reading this has strong opinions about a better way to structure this and I'd actually really love to hear about it [on Twitter](https://twitter.com/khalladay), but for this article, I'm going with the above.

The first two structs at the beginning are really just more convenient std::pairs, I hate pairs because .first and .second get really hard to read really fast, these just give me more useful member names.

The AllocatorState structure is the real meat of the above snippet. For the most part it's probably pretty explanatory, but the few variables that aren't probably make more sense in the context of the activate function, which is less boring than the passthrough allocator:

{% highlight c %}
void activate(VkhContext* context)
{
    context->allocator = allocImpl;
    state.context = context;

    VkPhysicalDeviceMemoryProperties memProperties;
    vkGetPhysicalDeviceMemoryProperties(context->gpu.device, &memProperties);

    state.memTypeAllocSizes.resize(memProperties.memoryTypeCount);
    state.memPools.resize(memProperties.memoryTypeCount);

    state.pageSize = context->gpu.deviceProps.limits.bufferImageGranularity;
    state.memoryBlockMinSize = state.pageSize * 10;
}
{% endhighlight %}

I chose the minimum block size at random, and in practice that number is probably the most important one for making sure this allocator performs the best it can (ideally large enough that every large allocation will be able to be broken up by multiple requests). My app is so simple that I'm not worrying about using up all my graphics memory, so I probably could have made this 10x larger than it is, but that seemed like an even dumber idea than what I did.

The rest of that function pretty much documents itself, but without it, the allocate function would have made a lot less sense:

{% highlight c %}
void alloc(Allocation& outAlloc, VkDeviceSize size, uint32_t memoryType)
{
    MemoryPool& pool = state.memPools[memoryType];

    //make sure we always alloc a multiple of pageSize
    VkDeviceSize requestedAllocSize = ((size / state.pageSize) + 1) * state.pageSize;
    state.memTypeAllocSizes[memoryType] += requestedAllocSize;

    BlockSpanIndexPair location;
    bool found = findFreeChunkForAllocation(location, memoryType, requestedAllocSize);

    if (!found)
    {
        location = { addBlockToPool(requestedAllocSize, memoryType), 0 };
    }

    outAlloc.handle = pool.blocks[location.blockIdx].mem.handle;
    outAlloc.size = size;
    outAlloc.offset = pool.blocks[location.blockIdx].layout[location.spanIdx].offset;
    outAlloc.type = memoryType;
    outAlloc.id = location.blockIdx;

    markChunkOfMemoryBlockUsed(memoryType, location, requestedAllocSize);
}
{% endhighlight %}

The most important thing to note in this function is that no matter how big the allocation we need is, the allocator rounds it up to the nearest multiple of our page size and uses that. The only thing that needs the originally asked for allocation size is the structure we're returning to the caller (since it needs the correct size for the bind function).

This function itself is pretty straightforward, as are the couple of functions I haven't pasted here. findFreeChunkForAllocation returns a location inside our target MemoryPool that can fit the allocation we want to make. If it can't find space, we have to make space by adding a new block to the pool (that function returns the new block's index in the memory pool), which is what addBlockToPool does.

Finally, after we build our allocation structure, we have to update the usage data for the DeviceMemoryBlock we're using to make sure we know what regions of memory are already in use.

The code for all of these functions is on [the github repo](https://github.com/khalladay/VkMaterialSystem/blob/material-instances/VkMaterialSystem/vkh_allocator_pool.cpp), (i've linked directly to the allocator's .cpp file), so click through if you're interested, I'm going to omit them here for brevity.

One function I'm not going to omit is the free function:

{% highlight c %}
void free(Allocation& allocation)
{
    VkDeviceSize requestedAllocSize = ((allocation.size / state.pageSize) + 1) * state.pageSize;

    OffsetSize span = {allocation.offset, requestedAllocSize };

    MemoryPool& pool = state.memPools[allocation.type];
    bool found = false;
    for (uint32_t j = 0; j < pool.blocks[allocation.id].layout.size(); ++j)
    {
        if (pool.blocks[allocation.id].layout[j].offset == requestedAllocSize +allocation.offset)
        {
            pool.blocks[allocation.id].layout[j].offset = allocation.offset;
            pool.blocks[allocation.id].layout[j].size += requestedAllocSize;
            found = true;
            break;
        }
    }

    if (!found)
    {
        state.memPools[allocation.type].blocks[allocation.id].layout.push_back(span);
        state.memTypeAllocSizes[allocation.type] -= requestedAllocSize;
    }
}
{% endhighlight %}

Remember that the Allocation struct needed to have the non rounded-up size so it could bind properly, so the first thing we need to do is get the size of the memory chunk it will take up in one of our pools. After that, it's just a matter of updating the usage data for the pool the allocation was from (which I store in the id variable of the struct). The logic I'm using to update the layout for the blocks is really simple, and is almost certainly unoptimal in a lot of scenarios, but it works for now and is short enough to paste into a blog post, so I'm going to go with it.

Also important to note: I'm not actually ever freeing memory right now, just reusing pages. In a big kid app, I'd probably need to change that.

The remaining parts of the AllocatorInterface that the pool allocator implements are as follows:

{% highlight c %}
size_t allocatedSize(uint32_t memoryType)
{
	return state.memTypeAllocSizes[memoryType];
}

uint32_t numAllocs()
{
	return state.totalAllocs;
}
{% endhighlight %}

I'm going to go out on a limb and assume these don't need explanation.

Putting all of this together and re running the MaterialDemo app shows that now I'm only using 4 active allocations to render the frame! That's a big improvement over the 11 that I needed earlier. Mission success! Mostly...

## The Problem Of Mapping Memory

Unfortunately, using the above code, I ended up with the following in my output log:

> VkMapMemory: Attempting to map memory on an already-mapped object 0x1a

It appears to be incorrect to map the same vkDeviceMemory block more than once at the same time, even if you're mapping different regions of the block of memory. This means that the pool allocator needs a bit more information about how we plan to use the memory that we get out of it, to decide whether it needs to put that allocation into it's own chunk of memory, or if it can reuse an old one like I did above.

Any allocation that isn't device local _might_ be mapped at some point, so I decided to simply assume that if an allocation's memory properties weren't exactly VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, I would give it its own allocation. Since the usage flags aren't part of a standard VkMemoryAllocateInfo, this meant I had to define my own AllocateCreateInfo struct, and modify my AllocatorInterface a bit:

{% highlight c %}
struct AllocationCreateInfo
{
    VkMemoryPropertyFlags usage;
    uint32_t memoryTypeIndex;
    VkDeviceSize size;
};

struct AllocatorInterface
{
    //this was the only function that changed
    void(*alloc)(Allocation&, AllocationCreateInfo);
};
{% endhighlight %}

This is probably better long term anyway, because at some point it will likely be handy to be able to pass even more data about how the allocation will be used to the alloc function, and now I have the place to do that.

The changes to the allocator itself are very minimal. First, I added a flag to the DeviceMemoryBlock struct to flag it as "reserved," that is, not eligible for new allocations even if there is room:

{% highlight c %}
struct DeviceMemoryBlock
{
    Allocation mem;
    std::vector<OffsetSize> layout;
    bool pageReserved;
};
{% endhighlight %}

Next, the allocation function needed to be modified to check if an allocation needed a whole page to itself, and to pass that info to the findFreeChunkForAllocation function. This flag forced the find function to return a totally DeviceMemoryBlock that will fit the allocation.

{% highlight c %}
void alloc(Allocation& outAlloc, AllocationCreateInfo createInfo)
{
    //rest of code omitted for brevity
    bool needsOwnPage = createInfo.usage != VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT;
    bool found = findFreeChunkForAllocation(location, memoryType, requestedAllocSize, needsOwnPage);
    //...
}
{% endhighlight %}

The after either finding or creating a memory block to use, the allocation function marks that DeviceMemoryBlock as reserved:

{% highlight c %}
pool.blocks[location.blockIdx].pageReserved = needsOwnPage;
{% endhighlight %}

Finally, the free function had to be modified to mark any DeviceMemoryBlock that it's freeing memory from as not reserved:

{% highlight c %}
void free(Allocation& allocation)
{
    //rest of code omitted for brevity
    MemoryPool& pool = state.memPools[allocation.type];
    pool.blocks[allocation.id].pageReserved = false;
    //...
}
{% endhighlight %}

With all that in place, I ran the MaterialDemo again, and at long last, got the thing to run with no errors, and only 4 allocations, which means I'm calling work on this done for now.

## Wrap Up

I'm really glad that I decided to dig into this rather than just grab GPUOpen's allocator. I learned a ton about Vulkan memory that I'm quite positive I never would have learned otherwise. As mentioned many times, all the code for this is available [on github](https://github.com/khalladay/VkMaterialSystem/tree/material-instances)

As per usual, I'm sure I'm doing a hundred different dumb things in this article, and I'd love you to send me a message [on Twitter](https://twitter.com/khalladay), or @Khalladay on [Mastodon](gamedev.mastodon.place) if you spot on of them (or want to say hi).

Tune in next time when I try to finally add instances to the material system!
