---
layout: post
title: Taming The Ogre Part 2 Unbreaking the Xcode templates in Xcode 4.5
---

The Xcode templates that come with Ogre 1.81 are rather frustrating to get working, especially if you don’t know what the cryptic error messages that it spits out at you mean. So I’m here today to walk you step by step through getting a basic Ogre project up and running.

All of this is taken from my experiences trying to get Ogre to work on my machine. Given that the templates bundled with Ogre were written by people much more knowledgeable than me, it wouldn’t surprise me if some of these issues aren’t universal problems. Hopefully my experiences are helpful, even if you only hit one of the numerous issues I described here.


###What you will need:###

* A built version of Ogre 1.81 (see my previous post for how to build this)
* The Ogre Xcode templates installed (found in Ogre’s SDK/OSX folder)

Note: This tutorial was written based on my experience working with Xcode 4.5, and OS X Lion. YMMV if you’re following along with a different configuration.

###Starting the Project###

Let’s start at ground zero. Open Xcode and do the following:

Start a new project, and select the “Mac OS X Application” template in the Ogre category.
After naming your project, fill in the path to your Ogre SDK with the appropriate value.
Welcome to linker hell. 

For some reason, xcode has the annoying tendency to omit the leading / in the include paths in the OGRE template (regardless of whether you remembered to include on in the path to your SDK). So the first thing that has to be done to make this project build-able is to navigate to your build settings, and modify all the file paths located in the Framework Search Paths, Header Search Paths, and Library Search paths so that they begin with a /

Next, move to the “Build Phases” tab and expand the “Link Binary With Libraries” section. You should see Ogre.framework, OpenGL.framework, and QuartzCode.framework appearing in red. I think this is a problem with the template itself, but in any case, it’s easily fixed. For the second two, simply hit the + button and find them in the list of Apple frameworks, andthen delete the red list entries.

Ogre.framework can be found in the lib/debug folder in your build directory, so add that to your project as well.

Now hit build. If everything is identical to my set up, you should get a build error saying that OgreCamera.h can’t be found. Theres a good reason for this: the include paths are missing a few directories. Rather than describe how to fix this, I’ve attached a screenshot of what my include paths end up looking like when I’m through fixing them. “1.81″ is the folder which stores my built Ogre3D library, and “ogre_src_v1-8-1″ is the root folder of the ogre sdk.

![Include Paths](/images/post_images/taming-the-ogre2/include_paths.png)

This may not be the most optimal way to set up your include paths (I’m really, really hoping it isn’t, it’s pretty messy), but I’ve ran into strange issues marking things recursive, and so far, this set up has worked for me. Let me know if there’s a better way of doing things in the comments, and I’ll update this tutorial.

Next move to the Library Search paths, and ensure that both paths are pointing to the correct location of the files they need. One should be pointing to the location of your ogre lib, and the other to the lib folder of your dependencies. If you hit build and see an error like this:

![Error Message](/images/post_images/taming-the-ogre2/lOIS_error.png)

it means that this step has not been done correctly.

###Restrict your architectures!###

Next ensure that your project is set to build only for the 64 bit architecture. As I mentioned in the last post, currently my set up is only configured to build for 64 bit machines, because I was running into a boat load of configuration errors trying to build for i386 as well. Since I’m nowhere near releasing something with OGRE just yet, I’ve decided to put off figuring out i386 config issues until I absolutely have to.

###Catching a wild Ditto!###

If you hit build now, you should end up with 1 error, the cryptically named “shell script invocation error,” which looks something like this:

![Ditto Error](/images/post_images/taming-the-ogre2/ditto_error.png)


It’s a shame that this isn’t more descriptive, because it took me a long time to understand exactly what was going on, but fixing it is dead simple once you know what the error means.

Ogre’s build process involves copying files from your Media paths to the content folder of the built application. This is done at the end of your build process by a shell script, and the script used to copy these files is called ditto. All this error is saying, is that a path supplied to the ditto command is wrong.

To fix this, go back to your project settings, and get to your “Build Phases” tab. Expand the “Run Script” item (should be at the bottom of your build phases list”), and you should immediately see the ditto commands.

The offender is the last line,

ditto $PROJECT_DIR/$PROJECT_NAME/*.cfg “$BUILT_PRODUCTS_DIR/Tutorial.app/Contents/Resources/”

(Note: Tutorial.app will be replaced by whatever you called the project on your machine)

There’s a problem with the location of quotation marks here, which is causing the source path to be misinterpreted. Simply move the punctuation around to solve:

ditto “$PROJECT_DIR/$PROJECT_NAME/”*.cfg “$BUILT_PRODUCTS_DIR/OgreTest2.app/Contents/Resources/”

Hit build now, you should (finally) have a successful compile.

###Not there yet.###

Unfortunately, we’re not done. Because now we get to sort through runtime errors. In your output, or your Ogre log file, you should see a message along the lines of

OGRE EXCEPTION(7:InternalErrorException): Could not load dynamic library ./RenderSystem_GL.

This is because we haven’t configured OGRE to know where our Plugins are yet. The quickest way to fix this is to open up the file plugins.cfg, and replace

PluginFolder=./

with

PluginFolder= (path to build/lib/release)

 

Now, hit build/run one more time, and you should be greeted with this screen:

![Config Screen](/images/post_images/taming-the-ogre2/config_screen.png)


Hit ok again to finally view the sum of all of our hard work:


![Config Screen](/images/post_images/taming-the-ogre2/ogrehead.png)


Finally, it’s all working! If you run into any problems not addressed here, grab me on twitter and we can work through it. I’d love to dig into this build process more through troubleshooting problems I haven’t hit yet. Additionally, if anyone has a better way of getting all of this done / setting up an Ogre project in Xcode, I’d love to hear about it, because I’m really hoping theres a less messy way of getting it all set up / configuring it for 1386. Regardless, thanks for reading!