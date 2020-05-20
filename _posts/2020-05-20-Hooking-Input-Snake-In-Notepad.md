---
layout: post
title: Hooking Keyboard Input To Play Snake In Notepad.exe
categories:
- blog
tags:
- <span style="background-color:#5555AA;"><font color="white">&nbsp;&nbsp;C++&nbsp;&nbsp;</font></span>
---

<style>
.collapsible {
  padding: 10px;
  background-color: #F5F5F5;
  border-style: solid;
  border-color: #333333;
  border-width: 2px;
}

.collapsewrapper2 {
	  padding: 0px 0px 18px 0px;
}

</style>
 
This is second (and last) post about my quest to make a real-time game playable in stock Notepad.exe. In [the previous article](/blog/2020/05/20/Rendering-With-Notepad.html), I talked through using a quick and dirty memory scanner to get access to Notepad's on screen text buffer (and build a ray tracer that rendered into it). In this post I'm going to talk about how I handled getting user input, and finally ended up at a fully playable Snake game in stock Notepad. 

<div align="center">
<img src="/images/post_images/2020-05-20/snake3.gif" />
<font size="2">The flickering problem from last time is still very not-fixed</font>
<br><br>
</div>

## Baby's First DLL Injection
The title of this post gives away the fact that I ended using hooks to capture user input, but I originally thought I could do it with just DLL injection instead. I barely knew what DLL injection was but I knew it could cause things to happen in an already running process. This seemed like a decent place to start. As it turns out, you need to understand dll injection to work with hooks anyway, so it's not a bad spot to start this blog post too. 

I started by googling the hell out of "DLL injection," and found [this excellent article](http://deniable.org/windows/inject-all-the-things) that breaks down what DLL Injection is and has a great [github repo](https://github.com/fdiskyou/injectAllTheThings) with examples of different ways to go about it. I didn't have a clue about how I was going to use any of this capture keyboard input, but I figured I'd try to inject something simple into a running Notepad process anyway.

Based on the injection article I just linked, the easiest way to inject a dll seems to be:

* Create a DLL that performs some action in dllmain when it is loaded
* Open a handle ("attach") to a running process
* Allocate some memory in that process' address space
* Use LoadLibrary to load that DLL into that process
* When it loads, that DLL does the stuff in dllmain

Writing a DLL that does something in dllmain() is really easy if you aren't doing a whole lot with it. I found later on that there's a whole lot of stuff that you can't do in dllmain (more info [here](https://docs.microsoft.com/en-us/windows/win32/dlls/dllmain)), but for my first test project I just popped open a message box. The entire code for the DLL payload was just a few lines.

{% highlight c %}
//a small dll payload that spawns a message box in whatever process loads the dll
#define WIN32_LEAN_AND_MEAN 
#include <windows.h>

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD ul_reason_for_call, LPVOID lpvReserved)
{
  switch (ul_reason_for_call){
    case DLL_PROCESS_ATTACH:
      MessageBox(NULL, "Process attach!", "Woohoo", 0);
      break;
  }
}
{% endhighlight c %}

The tricky part, as you might imagine, was getting Notepad to load this in the first place. Just like the above payload, my injection code was almost entirely copied from the [InjectAllTheThings repo](https://github.com/fdiskyou/injectAllTheThings) I linked above. Unlike the payload, it's a lot longer. I'm including it here because if you've never seen how to do this before, I assume this will be more convenient than having to click a link to github, but I'm not going to dive into how it works because the article/repo I linked above can teach you about it a whole lot better than I can. 

<div class="collapsewrapper2">
<details markdown="1" class="collapsible"><summary>Full DLL Injection Code (click to expand)</summary>

{% highlight c %}

//Injector_LoadLibrary is a dll injector that uses LoadLibraryA to inject a dll into a running process
// usage: Injector_LoadLibrary <process name> <path to dll> 

#include <stdio.h>
#include <Windows.h>
#include <TlHelp32.h> //for PROCESSENTRY32, needs to be included after windows.h

void printHelp()
{
	printf("Injector_LoadLibrary\nUsage: Injector_LoadLibrary <process name> <path to dll>\n");
}

void createRemoteThread(DWORD processID, const char* dllPath)
{
	HANDLE handle = OpenProcess(
		PROCESS_QUERY_INFORMATION | //Needed to get a process' token
		PROCESS_CREATE_THREAD |	  //for obvious reasons
		PROCESS_VM_OPERATION |	  //required to perform operations on address space of process (like WriteProcessMemory)
		PROCESS_VM_WRITE,	//required for WriteProcessMemory
		FALSE,			//don't inherit handle
		processID);

	if (handle == NULL)
	{
		fprintf(stderr, "Could not open process with pid: %lu\n", processID);
		return;
	}

	//once the process is open, we need to write the name of our dll to that process' memory
	size_t dllPathLen = strlen(dllPath);
	void* dllPathRemote = VirtualAllocEx(
		handle,
		NULL, //let the system decide where to allocate the memory
		dllPathLen,
		MEM_COMMIT, //actually commit the virtual memory
		PAGE_READWRITE); //mem access for committed page
	
	if (!dllPathRemote)
	{
		fprintf(stderr, "Could not allocate %zd bytes in process with pid: %lu\n", dllPathLen, processID);
		return;
	}

	BOOL writeSucceeded = WriteProcessMemory(
		handle,
		dllPathRemote,
		dllPath,
		dllPathLen,
		NULL);
	
	if (!writeSucceeded)
	{
		fprintf(stderr, "Could not write %zd bytes to process with pid %lu\n", dllPathLen, processID);
		return;
	}

	//now get address of LoadLibraryW function inside Kernel32.dll
	//TEXT macro "Identifies a string as Unicode when UNICODE is defined by a preprocessor directive during compilation. Otherwise, ANSI string"
	PTHREAD_START_ROUTINE loadLibraryFunc = (PTHREAD_START_ROUTINE)GetProcAddress(GetModuleHandle(TEXT("Kernel32.dll")), "LoadLibraryA");
	if (loadLibraryFunc == NULL)
	{
		fprintf(stderr, "Could not find LoadLibraryA function inside kernel32.dll\n");
		return;
	}

	//now create a thread in remote process that loads our target dll using LoadLibraryA

	HANDLE remoteThread = CreateRemoteThread(
		handle,
		NULL, //default thread security
		0, //stack size for thread
		loadLibraryFunc, //pointer to start of thread function (for us, LoadLibraryA)
		dllPathRemote, //pointer to variable being passed to thread function
		0, //0 means the thread runs immediately after creation
		NULL); //we don't care about getting back the thread identifier

	if (remoteThread == NULL)
	{
		fprintf(stderr, "Could not create remote thread.\n");
		return;
	}
	else
	{
		fprintf(stdout, "Success! remote thread started in process %d\n", processID);
	}

	// Wait for the remote thread to terminate
	WaitForSingleObject(remoteThread, INFINITE);

	//once we're done, free the memory we allocated in the remote process for the dllPathname, and shut down
	VirtualFreeEx(handle, dllPathRemote, 0, MEM_RELEASE);
	CloseHandle(remoteThread);
	CloseHandle(handle);
}

DWORD findPidByName(const char* name)
{
	HANDLE h;
	PROCESSENTRY32 singleProcess;
	h = CreateToolhelp32Snapshot( //takes a snapshot of specified processes
		TH32CS_SNAPPROCESS, //get all processes
		0); //ignored for SNAPPROCESS

	singleProcess.dwSize = sizeof(PROCESSENTRY32);

	do {

		if (strcmp(singleProcess.szExeFile, name) == 0)
		{
			DWORD pid = singleProcess.th32ProcessID;
			printf("PID Found: %lu\n", pid);
			CloseHandle(h);
			return pid;
		}

	} while (Process32Next(h, &singleProcess));

	CloseHandle(h);

	return 0;
}

int main(int argc, const char** argv)
{
	if (argc != 3)
	{
		printHelp();
	}

	createRemoteThread(findPidByName(argv[1]), argv[2]);

	return 0;
}

{% endhighlight %}

</details></div>

This was enough to get a message box popping up in a running instance of Notepad, which was super cool. Unfortunately I realized pretty much immediately after I got this working that I had no idea how to go from popping a message box to using this to actually change Notepad's behaviour.

<div align="center">
<img src="/images/post_images/2020-05-20/message_popup.PNG" />
<font size="2">Celebrate the little things</font>
<br><br>
</div>

## Let's Try Hooking!
My message box app could make something new happen in another process, but I actually needed to be able to _change_ the behaviour of the target process. I had heard vaguely about api hooking before, and my limited understanding of it was that it allowed you to either replace existing code paths, or add additional functionality to them. This seemed roughly in line with what I wanted, so I dove down this rabbit hole next. 

Googling for how hooking works was less straightforward than dll injection, mostly because hooking is much more complicated. I eventually realized that as long as I wanted to change a program's reponse to a Windows system message, I could bypass a lot of this complexity and use a Win32 hook. Given that keyboard input is sent to Windows processes via WH_KEYBOARD messages, I was in luck. 

The [MDSN page for hooks](https://docs.microsoft.com/en-us/windows/win32/winmsg/hooks) provides some basic information about how these types of hooks work, but the general idea is like this (note: I'm a super beginner at all of this so take everything I say with a grain of salt): 

* Windows apps (and individual Win32 controls) receive events from the OS via system messages. 
* Before these messages are passed to the message handling function for a given Win32 window, it first gets passed to that system message's "hook chain," which is a list of functions that perform some action in response to that event type before the window has a chance to respond. 
* Each hook function is responsible for passing the system message information to the next item in the hook chain
* If a hook function _doesn't_ call the next function in the hook chain, the message can be lost before the window ever gets a chance to respond to it. 

Given this information, it seemed reasonable to try to intercept the keyboard events sent to Notepad by creating a hook function which intentionally didn't call the next function in the hook chain. After persuing the msdn docs page about [using hooks](https://docs.microsoft.com/en-us/windows/win32/winmsg/using-hooks), I figured out that I was going to need to install a WH_KEYBOARD hook into Notepad's Edit control.  

The docs also point out that if you want to install a hook in a process other than your own, what you're really doing is a form of dll injection. You need to place the hook function in a dll, and use SetWindowsHookEx() to load that dll's code into the target application. 

So with all that in mind, I put on my robe and wizard hat and got to work. 

## Writing a Simple Hook Payload

I started off by just trying to prevent Notepad from receiving keyboard input at all. All I needed to do for this was to hook the WH_KEYBOARD and then _not_ call the next hook in the hook chain, which seemed like an easy place to start. To write a hook function for WH_KEYBOARD, all you need to do is make sure to match the function signature of [KeyboardProc()](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/legacy/ms644984(v=vs.85)). Given that I needed this function to do basically nothing, this was pretty easy:  

{% highlight c %}
#define WIN32_LEAN_AND_MEAN 
#include <windows.h>
#include "inject_payload_disablekeyinput.h"

LRESULT CALLBACK KeyboardProc(int code, WPARAM wParam, LPARAM lParam)
{
  return 1;
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD ul_reason_for_call, LPVOID lpvReserved)
{
  return true;
}
{% endhighlight %}


## Installing A Hook In Notepad.exe
The code for installing a windows hook is very straightforward (and shown below).

{% highlight c %}
bool installRemoteHook(DWORD threadId, const char* hookDLL)
{
	HMODULE hookLib = LoadLibrary(hookDLL);
	if (hookLib == NULL) return false;
	
	HOOKPROC hookFunc = (HOOKPROC)GetProcAddress(hookLib, "KeyboardProc");
	if (hookFunc == NULL) return false;
	
	SetWindowsHookEx(WH_KEYBOARD, hookFunc, hookLib, threadId);
	return true;
}
{% endhighlight %}

The threadId function argument is used to install the hook only for Notepad's Edit control (otherwise it becomes a global hook). Getting the thread id is juat a matter of calling [GetWindowThreadProcessId()](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid) on the HWND for the Edit control. You can get the HWND with the GetWindowForProcessAndClassName() function from [my last post](/blog/2020/05/20/Rendering-With-Notepad.html). Here's that function again: 

{% highlight c %}
HWND GetWindowForProcessAndClassName(DWORD pid, const char* className)
{
  HWND curWnd = GetTopWindow(0); //0 arg means to get the window at the top of the Z order
  char classNameBuf[256];

  while (curWnd != NULL){
    DWORD curPid;
    DWORD dwThreadId = GetWindowThreadProcessId(curWnd, &curPid);

    if (curPid == pid){
      GetClassName(curWnd, classNameBuf, 256);
      if (strcmp(className, classNameBuf) == 0) return curWnd;

      HWND childWindow = FindWindowEx(curWnd, NULL, className, NULL);
      if (childWindow != NULL) return childWindow;
    }
    curWnd = GetNextWindow(curWnd, GW_HWNDNEXT);
  }
  return NULL;
}
{% endhighlight c %}

One thing to note about the installRemoteHook() function is that because it gets the function pointer for the callback with GetProcAddress(), the compiled name of the hook callback is important. This meant that I needed to make sure that to export that function using "extern C" to prevent the compiler from mangling the function name.  

{% highlight c %}
#pragma once
extern "C"
{
  __declspec(dllexport) LRESULT CALLBACK KeyboardProc(int code, WPARAM wParam, LPARAM lParam);
}
{% endhighlight %}

If you want to see what all of this looks like in pactice, the [github repo](https://github.com/khalladay/render-with-notepad) for this blog post has a proof of concept hooking app uses the hook payload described above to disable key input to an instance of Notepad.

## Redirecting Keyboard Input to a Different Process
Simply preventing Notepad from getting keyboard input was cool and all, but it was a far cry from being able to redirect that output to a game. What I wanted to be able to do was both prevent Notepad from getting keyboard input (so that the user couldn't type characters and mess up what I was rendering), _and_ redirect that key input to the process I was using to control my game logic. 

Redirecting the key input to a different process wasn't much more difficult than preventing key input. I just copy/pasted the code for disabling key input and made the following changes: 

* The Hooking app opens up a socket, and starts listening for messages before installing the hook
* In the payload, when the first keyboard message is intercepted, the payload creates a client socket and connects to the Injector app
* Then, whenever a keyboard message is seen by the hook callback, it sends that char code to the Injector app via this client socket

I'm not going to walk through how to set up windows sockets (but all the code for doing so is on the [github page](https://github.com/khalladay/render-with-notepad) for this project). Instead, I just want to share the hook payload that I used to make this all happen. 

{% highlight c %}
SOCKET sock = INVALID_SOCKET;

LRESULT CALLBACK KeyboardProc(int code, WPARAM wParam, LPARAM lParam)
{
  const int BUFLEN = 512;
  char sendBuf[BUFLEN];
  memset(sendBuf, '\0', BUFLEN);

  if (sock == INVALID_SOCKET){
    sock = CreateClientSocket("localhost", "1337");
  }

  int isKeyDown = (int)lParam >> 30;
  if (isKeyDown){
    _itoa_s<512>((int)wParam, sendBuf, 10);
    send(sock, sendBuf, (int)strlen(sendBuf), 0);
  }
  return 1;
}
{% endhighlight %}

Extracting the key state from the lparam was a little weird, but it seemed like the best way to get at that information. If you wanted to write a more robust input handling hook, you'd probably care about more of the data in that parameter than I did, but this was enough for getting WASD. 

Once this was working, it was a very small jump from there to a working real time game. 

## Snake, Finally!
So yeah, the fruit of all this labor isn't super exciting. I made Snake. It lends itself super well to ascii graphics (even if the fact that characters are taller than they are wide is a bit annoying), and I already had the gameplay logic written from a [couple posts ago](/blog/2019/12/04/Recreating-A-Dirty-Gamedev-Hack.html). 

There's not really much interesting to say about implementing Snake, and I've already talked through everything else, so I'm going to end things off with another gif of me playing snake in a hijacked Notepad.exe window. I hope you enjoyed the process of getting here as much as I did, because the end product is (as promised) super dumb. 

<div align="center">
<img src="/images/post_images/2020-05-20/snake.gif" />
<font size="2">It's a terrible quality gif... but you get the idea</font>
<br><br>
</div>
