---
layout: post
title: GBA By Example - Drawing and Moving Sprites
categories:
- blog
- tutorial
tags:
- <span style="background-color:#DD6655;"><font color="white">&nbsp;&nbsp;GBA&nbsp;&nbsp;</font></span>
---

[Last week](http://kylehalladay.com/blog/tutorial/2017/03/28/GBA-By-Example-1.html), we were working in video mode 3, which is one of the "bitmap" video modes. These modes are named so because they use the GBA's 96K of video memory (VRAM) to store a representation of the screen as an array of colour values. If you want to draw to pixel (0,0), you simply set the first element in the screen buffer array to the colour you want, and when the hardware draws, it reads the value at that location, and draws it to the screen.

While some games did use the bitmap modes to do some pretty amazing stuff (like [James Bond 007: NightFire](http://www.ign.com/games/james-bond-007-nightfire/gba-497891) and [Stuntman](http://www.ign.com/games/stuntman/gba-550094)), they were the exception, not the rule. Most GBA games that were released were purely 2D, and used what are called Tiled Video Modes, which provide hardware level optimizations for 2D drawing tasks.

So today I'm going to walk through the bare minimum needed to use one of these tiled video modes to draw (and move) a sprite across the screen, which might end up looking like this:

<div align="center">
<img src="/images/post_images/2017-04-04/preview.gif" style="width:240px;height:160px"/>
<font size="2">(Forgive the Programmer Art)</font><br><br>
</div>

Let's get started!

## Introducing Tiled Video Modes

Tiled video modes are different from the bitmap modes because they don't store large colour arrays in VRAM. Instead, VRAM is used to store collections of tiles (8x8 collections of colour values), and data about how to display these tiles. There are 3 different tiled video modes (mode 0 - mode 2), but I don't really know enough right now to worry about the differences between them right now to make an informed choice about which one to use. Until that changes, I'm going to work in Mode 0 and kinda plug my ears and try not to think too hard about it:

{% highlight c %}
#define REG_DISPLAYCONTROL     *((volatile uint16*)(0x04000000))

int main()
{
    REG_DISPLAYCONTROL = 0; //mode 0, no background enabled

    while(1){}
    return 0;
}
{% endhighlight %}

Since what we store in VRAM has changed since last week, it makes sense that there are a few new data structures that we're going to have to understand in order to get anything useful into memory (and do anything interesting).

As mentioned, a _Tile_ is an 8x8 collection of colour values (stored linearly, one row after the other), but these colour values are not the colours the sprite will actually use on screen. Instead, these values are used to look up the colour in a _Palette_, which is another data structure we're going to have to wrangle today.

A _Palette_ is a block of memory that contains colour values, plain and simple. An application gets 2 of these blocks of memory, one for backgrounds, and one for sprites. Each section is large enough to contain 256 colour values.

Tiles can take the form of 8bpp (bits per pixel), or 4bpp. 8bpp mode is pretty straightforward - we have 8 bits to play with, which means each value in our tile can be one of 256 possible values, which is exactly how many values we can store in a palette. In 4bpp mode, we get up to 16 possible values for each pixel, which means that we can only use a section of our palette memory for each sprite.

Because it sounds easier, and I promised that this article was the bare minimum we needed to draw a sprite, we're going to use 8bpp today.

Finally, a Sprite is a rectangular collection of tiles, so when we format images to be used on the GBA, we need to break them up into 8x8 tiles, and a palette of colours that those tiles use, and then provide some data about which locations in Tile and Palette memory our sprite will use. It's important to note that the GBA calls Sprites "Objects" (not the OOP kind). You can split hairs about this, but a GBA Object is a collection of tiles, arranged rectangularly, that move around the screen. Sounds like a Sprite to me.

I'm sure there are reasons why this isn't true 100% of the time, but those reasons aren't really important today.

So to wrap this section up:

* A Palette is an array of 256 colour values
* A Tile's colour values are actually indices into Palette memory
* A Sprite is a (theoretical) rectangular collection of tiles.
* The hardware equivalent of a Sprite is called an Object

<br>
Hopefully that's all relatively clear! Let's start putting all of this together

## Working With Sprite Data

The first thing we need to do is to actually have some tile and colour data to use in our program.

For this section, I'm going to simply provide the data that we're going to use. At the end of this post, I'll link you to tools that you can use to make your own. To start with, let's consider a really simple sprite, which consists of only a single tile, and 3 palette colours.

<div align="center">
<img src="/images/post_images/2017-04-04/testsprite.PNG"/>
<font size="2">(Grid lines added to help differentiate pixels, not included in sprite)</font><br><br>
</div>

Here's what that sprite might look like in our program:

{% highlight c %}
const unsigned int testTiles[16] __attribute__((aligned(4)))=
{
    0x00000000,0x00000000,
    0x00000001,0x00000000,
    0x00000000,0x00000000,
    0x00000000,0x00000000,
    0x00000000,0x00000000,
    0x00000000,0x00000000,
    0x02020102,0x02020202,
    0x00000000,0x00000000,
};

const unsigned int testPal[2] __attribute__((aligned(4)))=
{
    0x03E0001F,0x00007C00,
};
{% endhighlight %}

You can see that most of this is what we would expect, the testTiles data traverses each row in order from top to bottom, with each tile index getting 8 bits (2 hex numbers) of data allocated, so each 32 bit value represents 4 pixels. The lowest bits represent the leftmost pixels, which makes sense logically, even if it makes things harder to read when you're looking at hex values.

The palette data is also as we would expect, containing the three colours used in our sprite, represented as 15 bit colours, with 2 colours per 32 bit value.

The __attribute__((aligned(4))) is a gcc macro to force your data to be aligned on 4 byte boundaries. I took it straight from the [Tonc tutorial](http://www.coranac.com/tonc/text/regobj.htm), which says:

>As of devkitARM r19, there are new rules on struct alignments, which means that structs may not always be word aligned, and in the case of OBJ_ATTR structs (and others), means that [some] struct-copies ...  will not only be slow, they may actually break. For that reason, I will force word-alignment on many of my structs...

Since I don't know enough to argue with that right now, I'm taking it on faith that this is still a good idea.

I'm using 32 bit integers to store tile data because the GBA is a 32 bit machine at heart, and I've found a couple places online that talk about how much faster the GBA hardware is at working with 32 bit integers vs 16 bit ones when possible. Since I have no way of verifying this right now (no timers yet!), this is also a matter of faith for the moment.

Now that we know what our sprite data is going to look like, let's use a slightly larger data set. This is mostly to make sure that what we do later is correctly ordering the tiles in our sprite. If we used the example data above, we wouldn't be able to verify this because we only had 1 tile. Here's the sprite and data that I'm going to be using for the rest of the article:

<div align="center">
<img src="/images/post_images/2017-04-04/realsprite.PNG"/><br>
</div>

{% highlight c %}
const unsigned int spriteTiles[64] __attribute__((aligned(4)))=
{
    0x00000000,0x01000000,0x00000000,0x01010000,0x00000000,0x01010100,0x00000000,0x01010101,
    0x01000000,0x01010101,0x01010000,0x01010101,0x01010100,0x01010101,0x01010101,0x01010101,
    0x00000003,0x00000000,0x00000303,0x00000000,0x00030303,0x00000000,0x03030303,0x00000000,
    0x03030303,0x00000003,0x03030303,0x00000303,0x03030303,0x00030303,0x03030303,0x03030303,
    0x04040404,0x04040404,0x04040400,0x04040404,0x04040000,0x04040404,0x04000000,0x04040404,
    0x00000000,0x04040404,0x00000000,0x04040400,0x00000000,0x04040000,0x00000000,0x04000000,
    0x02020202,0x02020202,0x02020202,0x00020202,0x02020202,0x00000202,0x02020202,0x00000002,
    0x02020202,0x00000000,0x00020202,0x00000000,0x00000202,0x00000000,0x00000002,0x00000000,
};

const unsigned int spritePal[3] __attribute__((aligned(4)))=
{
    0x001E0000,0x03E07FFF,0x00007C1F,
};
{% endhighlight %}

If you take a look at this larger sprite data, you'll notice that it's stored as a sequential array of 8x8 tiles, that is, the 3rd 32 bit value isn't the first four pixels of the top right tile, it's the first four pixels of the second row of the top left tile. This is to make things easier to get into VRAM, since we have to upload tiles, not whole images. Mercifully, there's a command line tool that I'll link later that will convert images to this format for us, so we don't have to try to author images like this.

For readability sake, I'm going to put the above block of code into it' own .c file, that I'm going to call sprite.c. I'm also going to create sprite.h, which looks like this:

{% highlight c %}
#ifndef SPRITE_H
#define SPRITE_H

#define spriteTilesLen 256 //size in bytes
extern const unsigned int spriteTiles[64];

#define spritePalLen 12
extern const unsigned int spritePal[3];

#endif
{% endhighlight %}


## Getting All This Into VRAM

We have sprite data and palette data ready to go, but as we discussed earlier, we're going to need to get this data into the proper parts of memory. Specifically, we'll need to add the palette values to our larger 256 colour palette memory, upload tile data to tile memory, and then create a sprite that references those tiles.

Let's start with the palette memory:

{% highlight c %}
#include "sprite.h"

typedef unsigned char      uint8;
typedef unsigned short     uint16;
typedef unsigned int       uint32;

#define MEM_PALETTE   ((uint16*)(0x05000200))
void UploadPaletteMem()
{
    memcpy(MEM_PALETTE, spritePal, spritePalLen);

}
{% endhighlight %}

This is pretty straightforward, the only thing to note is that in other articles, what I'm calling MEM_PALETTE here is usually called MEM_OBJ_PAL, or something similar. This is because palette memory on the GBA is divided into two sections, but we're only using one of them today, so for simplicity's sake, I'm just calling it MEM_PALETTE and pretending that's all there is to it.

Next we need to upload our tile memory, this is a bit less straightforward:

{% highlight c %}
typedef uint32 Tile[16];
typedef Tile TileBlock[256];

#define MEM_VRAM        ((volatile uint32*)0x06000000)
#define MEM_TILE        ( (TileBlock*)MEM_VRAM )

void UploadTileMem()
{
    memcpy(&MEM_TILE[4][1], spriteTiles, spriteTilesLen);
}
{% endhighlight %}

To understand what's going on here, we need to know a bit more about how tiles are stored in VRAM. In tiled video modes, VRAM is used to store tile data, and that data is arranged in 16kb blocks, called "tile blocks" or (more confusingly) "charblocks." Since the GBA has 96kb of VRAM, this gives us 6 tile blocks total.

The first four of these tile blocks are reserved for backgrounds (which we aren't delving into today), and the remainder are for tiles. This means that when we want to put a tile into memory, the first possible memory slot for us is at  MEM_VRAM + 64k bytes (or really, + 65536 bytes because of data alignment). This gives us a memory address of 0x6010000, but it's much easier to get at individual tile addresses using the structs / array notation you see here.

I'm putting my sprite into [4][1] instead of [4][0] because writing into [4][0] ended up putting some weird artifacts on the top left corner of my screen. I'm not sure why that is yet, and I haven't found another example of using 8bpp sprites online to see what they're doing, so I'm going to leave it for now (if you know what's going on, shoot me a message [on Twitter](https://twitter.com/khalladay)).

The last thing we need to get into memory is a description of our sprite (since we need to know how to combine all these tiles we just put into VRAM). To do that, we're going to define an Object.

## GBA Objects Aren't "Objects"

As mentioned earlier, a GBA Object is NOT an OOP style Object. Instead, they're  simply a collections of tiles which can be transformed / drawn without needing to clear where they were. If you remember from [last week](http://kylehalladay.com/blog/tutorial/2017/03/28/GBA-By-Example-1.html), we had to do all our own clearing. Objects relieve us of that duty.

Unfortunately, creating an Object is a bit of an arcane exercise, so bear with me here. The first thing we need to do is to define the Object data structure, and where object memory lives:

{% highlight c %}
typedef struct ObjectAttributes {
    uint16 attr0;
    uint16 attr1;
    uint16 attr2;
    uint16 pad;
} __attribute__((packed, aligned(4))) ObjectAttributes;

#define MEM_OAM  ((volatile ObjectAttributes *)0x07000000)

{% endhighlight %}

As you may have guessed from above, you don't technically store objects in memory (although you're free to call your struct whatever you want), instead we store what's referred to as "Object Attributes." These structs are stored in "Object Attribute Memory", or OAM.

There's a lot of information packed into the three uint16 variables in the ObjectAttributes struct, and it's easy to get lost. In the interest of being the "bare minimum" you need to move a sprite around the screen, I'm only going to talk about the bits that we're going to use today. If you want a more granular look at things, [Tonc](http://www.coranac.com/tonc/text/regobj.htm) does an excellent job at explaining what every bit does.

It's easiest to describe how these variables work in a table, so here's attr0

<div align = "center">
<table style="border:1px solid black; width=600px; padding:2px;">
<colgroup>
<col width="200px" />
<col width="400px" />
</colgroup>
<thead style="border:1px solid black; background-color:#FF8854;">
<tr class="header">
<th>Attr 0</th>
<th> 0x FEDC BA98 7654 3210</th>
</tr>
</thead>
<tbody>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span">FE</td>
<td markdown="span" style="border:1px solid black;">Shape of Sprite: 00 = Square, 01 = Tall, 10 = Wide</td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span" style="border:1px solid black;">D</td>
<td markdown="span">Colour Mode: 0 = 4bpp, 1 = 8bpp</td>
</tr>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span" style="border:1px solid black;">C</td>
<td markdown="span">Not used today</td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span" style="border:1px solid black;">AB</td>
<td markdown="span">Not used today</td>
</tr>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span" style="border:1px solid black;">89</td>
<td markdown="span">Not used today</td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span" style="border:1px solid black;">7654 3210</td>
<td markdown="span">Y Coordinate</td>
</tr>
</tbody>
</table>
</div>
<br>

Our sprite is an 8bpp, square sprite. Using this table, if we wanted to define a sprite like that, and place it at a Y coordinate of 50, we could do so like this:

{% highlight c %}
volatile ObjectAttributes *spriteAttribs = &MEM_OAM[0];
spriteAttribs->attr0 = 0x2032;
{% endhighlight %}

Here's what we need in Attr1:

<div align = "center">
<table style="border:1px solid black; width=600px;">
<colgroup>
<col width="200px" />
<col width="400px" />
</colgroup>
<thead style="border:1px solid black; background-color:#FF8854">
<tr class="header">
<th>Attr 1</th>
<th> 0x FEDC BA98 7654 3210</th>
</tr>
</thead>
<tbody>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span">FE</td>
<td markdown="span" style="border:1px solid black;">Sprite Size (discussed below)</td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span" style="border:1px solid black;">DCBA9</td>
<td markdown="span">Not Used Today</td>
</tr>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span" style="border:1px solid black;">7654 3210</td>
<td markdown="span">X coordinate
</td>
</tr>
</tbody>
</table>
</div>
<br>

Sprite size is weird on the GBA. A sprite can be a maximum of 64x64, but doesn't necessarily have to be square, meaning that what size your sprite is depends both on the value in FE or Attribute 1, and on the shape you defined in Attribute 0. They work together like this:

<div align = "center">
<table style="border:1px solid black; width=480px;">
<colgroup>
<col width="80px" />
<col width="100px" />
<col width="100px" />
<col width="100px" />
<col width="100px" />

</colgroup>
<tbody>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span"></td>
<td markdown="span" style="border:1px solid black;">Size 00 </td>
<td markdown="span" style="border:1px solid black;">Size 01 </td>
<td markdown="span" style="border:1px solid black;">Size 10 </td>
<td markdown="span" style="border:1px solid black;">Size 11 </td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span" style="background-color:#DDDDDD;">Shape 00</td>
<td markdown="span" style="border:1px solid black;">8x8 </td>
<td markdown="span" style="border:1px solid black;">16x16 </td>
<td markdown="span" style="border:1px solid black;">32x23 </td>
<td markdown="span" style="border:1px solid black;">64x64 </td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span" style="background-color:#DDDDDD;">Shape 01</td>
<td markdown="span" style="border:1px solid black;">16x8 </td>
<td markdown="span" style="border:1px solid black;">32x8 </td>
<td markdown="span" style="border:1px solid black;">32x16 </td>
<td markdown="span" style="border:1px solid black;">64x32 </td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span" style="background-color:#DDDDDD;">Shape 10</td>
<td markdown="span" style="border:1px solid black;">8x16 </td>
<td markdown="span" style="border:1px solid black;">8x32 </td>
<td markdown="span" style="border:1px solid black;">16x32 </td>
<td markdown="span" style="border:1px solid black;">32x64 </td>
</tr>
</tbody>
</table>
</div>
<br>

It certainly has some logical consistency to it, but I still find it really cumbersome to figure out what I need. In any case, given that we defined a square sprite in attribute 0, if we wanted to define a 16x16 sprite (and we do), at an x coordinate of 100, it would look like this:

{% highlight c %}
volatile ObjectAttributes *spriteAttribs = &MEM_OAM[0];

spriteAttribs->attr0 = 0x2032; // 8bpp tiles, SQUARE shape
spriteAttribs->attr1 = 0x4064;
{% endhighlight %}


The last attribute we need to define is maybe the most important, since it tells the hardware where to look for the tiles in VRAM:

<div align = "center">
<table style="border:1px solid black; width=600px;">
<colgroup>
<col width="200px" />
<col width="400px" />
</colgroup>
<thead style="border:1px solid black; background-color:#FF8854">
<tr class="header">
<th>Attr 2</th>
<th> 0x FEDC BA98 7654 3210</th>
</tr>
</thead>
<tbody>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span">FEDC</td>
<td markdown="span" style="border:1px solid black;">Not Used Today</td>
</tr>
<tr style="border:1px solid black;">
<td markdown="span">BA</td>
<td markdown="span" style="border:1px solid black;">Not Used Today</td>
</tr>
<tr style="border:1px solid black; background-color:#DDDDDD;">
<td markdown="span">98 7654 3210</td>
<td markdown="span" style="border:1px solid black;">First Tile Index</td>
</tr>
</tbody>
</table>
</div>
<br>

It's worth noting that some of these tables are different when you're working in 4bpp mode. Eventually I'll end up using all the options available for sprite drawing, but today I just want to move a thing across my screen.

Combining everything we just talked about: defining our 16x16, 8bpp sprite, at location 100,50, and starting with the tile at index [4][1] looks like this:

{% highlight c %}
volatile ObjectAttributes *spriteAttribs = &MEM_OAM[0];

spriteAttribs->attr0 = 0x2032; // 8bpp tiles, SQUARE shape
spriteAttribs->attr1 = 0x4064; // 16x16 size when using the SQUARE shape
spriteAttribs->attr2 = 2;      // Start at [4][1]

{% endhighlight %}

You'll notice that the index we pass to attr2 isn't 1, which is what you'd expect to see passed there since we're at element 1 of the array. However, the index stored in attr2 assumes that you're using 4bpp sprites. If you're using 8bpp like us, you need to go up by 2 indices every time you want to access the next tile.

With that set up, we actually have (almost) everything we need to draw our sprite, we just need to set a few more flags on our DisplayControl variable:

{% highlight c %}
#define REG_DISPLAYCONTROL     *((volatile uint16*)(0x04000000))

#define VIDEOMODE_0    0x0000
#define ENABLE_OBJECTS 0x1000
#define MAPPINGMODE_1D 0x0040

int main()
{
    ...
    REG_DISPLAYCONTROL =  VIDEOMODE_0 | ENABLE_OBJECTS | MAPPINGMODE_1D;
    ...
}
{% endhighlight %}

As the names suggest, these flags tell the hardware to enable support for objects, and to expect tile memory to be stored as a 1D array. I've already covered all the info needed to understand what these mean, so hopefully they make sense now. If you're confused about the 1D array flag, know that the only other option for tile mapping is in a 2D array, but in the interest of brevity (and imo, coding sanity), I've omitted that from this article. As usual, [Tonc](http://www.coranac.com/tonc/text/regobj.htm) covers it very well if you're interested in knowing more.

## Putting It All Together

All that's left is to put together what we already have. Aside from the sprite include files I added earlier, all the code we need to move a sprite across the screen can easily fit below:

{% highlight c %}
#include "sprite.h"
#include <string.h>

typedef unsigned char      uint8;
typedef unsigned short     uint16;
typedef unsigned int       uint32;

typedef uint32 Tile[16];
typedef Tile   TileBlock[256];

#define VIDEOMODE_0    0x0000
#define ENABLE_OBJECTS 0x1000
#define MAPPINGMODE_1D 0x0040

#define REG_VCOUNT              (*(volatile uint16*) 0x04000006)
#define REG_DISPLAYCONTROL      (*(volatile uint16*) 0x04000000)

#define MEM_VRAM      ((volatile uint16*)0x6000000)
#define MEM_TILE      ((TileBlock*)0x6000000 )
#define MEM_PALETTE   ((uint16*)(0x05000200))
#define SCREEN_W      240
#define SCREEN_H      160

typedef struct ObjectAttributes {
    uint16 attr0;
    uint16 attr1;
    uint16 attr2;
    uint16 pad;
} __attribute__((packed, aligned(4))) ObjectAttributes;

#define MEM_OAM       ((volatile ObjectAttributes *)0x07000000)

inline void vsync()
{
    while (REG_VCOUNT >= 160);
    while (REG_VCOUNT < 160);
}

int main()
{
    memcpy(MEM_PALETTE, spritePal,  spritePalLen );
    memcpy(&MEM_TILE[4][1], spriteTiles, spriteTilesLen);

    volatile ObjectAttributes *spriteAttribs = &MEM_OAM[0];

    spriteAttribs->attr0 = 0x2032; // 8bpp tiles, SQUARE shape, at y coord 50
    spriteAttribs->attr1 = 0x4064; // 16x16 size when using the SQUARE shape
    spriteAttribs->attr2 = 2;      // Start at the first tile in tile

    REG_DISPLAYCONTROL =  VIDEOMODE_0 | ENABLE_OBJECTS | MAPPINGMODE_1D;

    int x = 0;
    while(1)
    {
        vsync();
        x = (x+1) % (SCREEN_W);
        spriteAttribs->attr1 = 0x4000 | (0x1FF & x);

    }
    return 0;
}
{% endhighlight %}

Voila! You are now in posession of your very own moving sprite. Notice that unlike last week, we don't have to do any work to clear the screen (thanks objects!), and all it takes to move the sprite is to update the appropriate attribute.

Finally, I promised to link you to the tools that I used to generate the sprites, both of which were written by the author of the [Tonc tutorial](http://www.coranac.com/projects/tonc/). For bitmap editing (and bitmap palette editing), I used [Usenti](http://www.coranac.com/projects/usenti/), and for exporting that bitmap to the .c code we looked at, I used [Grit](http://www.coranac.com/projects/grit/). Both tools are very straightforward, but definitely don't overlook Grit's GUI client (helpfully called "WinGrit"), it makes life much easier.  

That's it for today! Hope you had as much fun as I did! As always, if you want to say hi, I'm most accessible [on Twitter](https://twitter.com/khalladay), Have a good one!
 