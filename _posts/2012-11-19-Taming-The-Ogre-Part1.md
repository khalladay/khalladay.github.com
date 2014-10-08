---
layout: post
title: Building Ogre 1.81 on Lion
categories:
- blog
- tutorial
---
I’ve recently decided that I need to go open source for my hobby projects, namely because I’ve reached a point where Unity Free is becoming too restrictive for my tastes, yet I’m still too poor to buy Unity Pro (one day I’ll make a game that pays for more than a night at a bar, but that day hasn’t happened yet).

After spending a long week trying to make JMonkey suit my needs (namely: an asset pipeline that doesn’t make me want to shoot myself), I abandoned it and meekly returned to the engine of my third year at Humber: Ogre3D. I had only worked with the precompiled windows binaries until now, but how hard could building it from source (because if I’m going open source, I may as well embrace the whole deal) on my mac be?

Three days of pulling my hair out later, I finally have not only Ogre 1.81 built on my mac, but I also have the Xcode 4 template project compiling, and because theres absolutely no reason that ANYONE should have to spend three days trying to weed through outdated tutorials, I’m posting the whole process here in exhaustive detail, with the hopes that it helps at least one other poor soul trying to do this.

This post will ONLY cover building the engine itself. The next article will cover how to get the Xcode 4 templates to work (they’re broken in some weird spots in Xcode 4.5).

###Ingredients###

*  OGRE 1.8.1 Source for Linux/OSX 
* Mac OS X Ogre Dependencies – (this tutorial assumes you’re grabbing the precompiled ones, just to limit the number of things that can go wrong)
* CG Framework
* CMake 2.8.10.1
* This tutorial assumes you’re using Xcode 4.5, although I don’t know if that makes a difference for what we’re doing.

###Setting up the source directory###

* Extract the Ogre src zip file into wherever you want your Ogre SDK to be installed to. I just put it in my Macintosh HD directory so that it was easy to find, but I think the more correct place to put it is in ~/Library/Developer/SDKs
* Extract  the precompiled dependencies into the top level folder in the ogre sdk directoy (in my case /ogre_src_v1-8-1/)
* Create a directory in your root folder called “boost”
* Drag the folder called boost out of Dependencies/include into the boost folder you just made
* Create a folder called lib in the boost folder (ie/ /ogre_src_v1-8-1/boost/lib)
* drag the boost libraries at Dependencies/lib into this folder.

###Cooking With CMake###

* Start CMake’s GUI tool
* Hit the Browse Source button on the top right, and select the ogre sdk folder that you’ve been working with<
* Copy and paste this directory into the "Where to build the binaries" field as well. Add the name of your build folder to the end of this path. For me, this was /ogre_src_v1-8-1/1.81, but the name of folder isn't important, it's just important that this build folder IS NOT your root sdk folder. That way, if something goes wrong, you can start the build process over again without having to do all the previous steps.
* Hit "Configure" and make sure that "Xcode" and "Use default native compilers" is selected. Then click done
* You should see a bunch of options highlighted in red. That's fine. Ensure that OGRE_BUILD_CG is selected, and then press configure again. NOTE: the Cmake console will show a number of warnings in red. IGNORE THESE.
* Once that’s done, click “Generate” and exit CMake

###Building Ogre###

* Navigate to your build directory now, and open the Xcode project you just generated.
* Delete i386 from your project’s valid architectures (otherwise boost complains. Long term, I think only building for 64 bit is going to cause some problems, but in the interest of getting things running quickly, I ignored these worries for now)
* Set your project to build for “My Mac 64-bit,” and your Architectures to “64-bit-intel”
* Hit build, watch the magic happen.
* If you want to, once the build is complete, change your build to release mode and build again to get Ogre built in release.

###Verifying the Build###

* You should now have 2 folders in your build directories bin folder. (Release and Debug), inside each folder should be a copy of SampleBrowser.app. To ensure everything is working, run one of these programs and go through each sample.
* Hopefully all the samples should be in working order. Congratulations, you now have a built copy of Ogre sitting on your computer!

If you run into any problems, message me on twitter and I’ll do my best to figure out what’s going on with your build. I’m definitely not an expert, or even demonstrably good at using Ogre, but I’d like to think that all the troubleshooting I’ve done this week makes me a decent resource when it comes to just building the engine on mac. Good luck!

