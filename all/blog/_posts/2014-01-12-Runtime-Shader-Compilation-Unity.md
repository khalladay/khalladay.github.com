---
layout: post
title: Creating GLSL Shaders at Runtime in Unity3D 
---

The feeling of solving a problem that seems potentially impossible is awesome. My latest project is no exception.

The concept involves users being able to write shaders while the program is running, and compiling them at runtime onto objects in the scene. Normally this wouldn't be an unreasonable task, however this project is being built in Unity, which complicates things immensely. 

I had seen an example of shaderlab code being passed to the Material constructor at runtime before, but I hadn't ever seen anyone play around with any other shader language in the same way. It turns out that's because you can't. The [Material constructor](http://docs.unity3d.com/Documentation/ScriptReference/Material-ctor.html) that I was hoping to use only accepts Shaderlab; Unity doesn't support runtime compilation of GLSL, Cg, or HLSL, end of story. 

Except that isn't the whole story. If it was, this would be a very short post. It turns out that with some elbow grease, you can actually get other languages (or at least GLSL) to compile. The rest of this post is going to show you how. 

<div align="center">
	
<img src="/images/post&#95;images/2014-01-20/shadercompilation.png" /><br>
<font size="2">Type the fragment shader into the box, hit the button, watch the magic happen</font>

</div>

<br>

<h3>Setting Up Your Project</h3>

There are at least a few people who have tried to make this work before. A quick google search for "runtime shader compilation unity" will bring you to [this Unity forum post](http://forum.unity3d.com/threads/87085-Runtime-shader-compilation). If you scroll down you'll find a post from a user named Sirithang, who is the real unsung hero of this post. 

Their post talks about a tool called CgBatch, which is included with Unity, and according to [this SIGGRAPH presentation](http://www.realtimerendering.com/downloads/MobileCrossPlatformChallenges_siggraph.pdf), is either the entire shader compilation pipeline for Unity, or is at least one step in it. The siggraph link only describes it as a tool to generate HLSL, but in practice it seems to fully translate shaders into a format accepted by that material constructor from above. Since CgBatch isn't meant for public use, there isn't anything in the way of documentation to know for sure. 

Ok, so we know we need to use CgBatch, but where do we get it. On Mac, you can find it inside of Unity.app (right click and select "Show Package Contents"), inside the Tools folder. On Windows, you're looking for CgBatch.exe, located in Unity/Editor/Data/Tools. Thanks to [@izaleu](https://twitter.com/izaleu) for this :D ). Create a folder inside your project's StreamingAssets directory and paste CgBatch into it (it must be inside subdirectory of StreamingAssets).

CgBatch also relies on Cg.framework, which you can find in the Unity.app/Contents/Frameworks folder. If you try to run CgBatch however, you'll notice that it actually relies on Cg.framework being located in  "../Frameworks/Cg.framework", so copy and paste the entire folder into your project's StreamingAssets folder.

Finally, you will need to provide a path to the CGInclude files as part of using CgBatch, and since we don't want our users to have to have Unity installed to use our program, you will also need to copy the CGIncludes folder to your StreamingAssets directory.

**Aside:** If you've never used the StreamingAssets folder before, it is simply a folder that you place in your project's assets folder, name "StreamingAssets," everything in this folder will be included exactly as is in your built project's Application.streamingAssetsPath.

<h3>Deciphering CgBatch</h3>

So how do you use CgBatch. If you've attempted to run it from the command line you've probably seen the following message:
<br>

<div align = "center">
	
	<i>E -1: Failed to launch CgBatch (incorrect parameters). Usage: CgBatch input path includepath output [-xbox360] [-ps3]</i>
	
</div>

<br>
So CgBatch needs at least 4 parameters. Based on the forum post linked previously, these arguments are as follows:

* **input** : The path to your uncompiled shader file
* **path** : The path to the directory that contains your shader
* **includepath** : The path to the CGInclude files for Unity
* **output** : Where to put the output shader file. 

If you run this with the appropriate parameters, you should be able to get output that can be accepted by the Material shader string constructor, which is great! So now we need to be able to do this inside a running program. 

<h3>Introducing System.Diagnostics</h3>

Thankfully, Mono has us covered (even on Mac!). The Process class (inside System.Diagnostics) is specifically designed to run command line applications, and can be configured to execute programs in bash as well as the windows command line. 

The way to do this is to create a new Process object, and use that object's StartInfo property to specify exactly what command and arguments you wish to execute, and then call Process.Start();

In practice, this looks like the following: 

<pre><code>
	
using System.Diagnostics;
	
Process process = new Process();
process.StartInfo.FileName = "bash";
process.StartInfo.Arguments = "-c '" + [Command] [arg1] [arg2] ... +"'";
process.StartInfo.RedirectStandardOutput = true;
process.StartInfo.UseShellExecute = false;

process.Start();

</code></pre>

(the above is mac specific, I don't have a windows machine to work try this stuff out on right now)

As shown above, the name of the command that you need to execute is actually bash, and not CgBatch. In order to execute a command from batch, you need to pass that as an argument to bash using the -c flag, and enclosing the command and all its arguments inside single quotes. 

Setting RedirectStandardOutput to true allows us to read the output of the command into the Unity console (really handy for debugging), but in order for that to work, UseShellExecute needs to be set to false, which means that we will not be using the operating system shell to launch the program (in this case bash), we will launch bash directly.

<h3>Actually Making This Work</h3>

Now we have our tools set up, we now how to execute CgBatch, it's time to put it all together. 

For the proof of concept, I only wanted users to write fragment shaders, so I needed to provide a vertex shader for them:

<pre><code>
	
string prefix = "Shader \"Temp\"{\nProperties{\n}\nSubShader {" +
	"\nTags { \"Queue\" = \"Geometry\" }\nPass {\nGLSLPROGRAM\n#ifdef VERTEX\n" +
	"void main(){\n" +
	"gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\n" +
	"}\n" +
	"#endif\n" +
	"#ifdef FRAGMENT\n" +
	"uniform float _time;\n";
			
</code></pre>

The above example is for writing a glsl shader at runtime. I haven't yet been able to get Cg compiling using the method presented in this post, but I'm sure it can be done with the right arguments to CgBatch.

You'll notice I'm also including a uniform for Time. This is because I have yet to figure out how to get Unity's specific constants to be recognized in the User written shader, and Time is useful enough that I'm passing it in myself (just call the Shader.SetGlobalFloat argument in Update to do the same).

Next up, we need to write the code that will come after the user's fragment shader to finish off the shader file:

<pre><code>
	
string suffix = "\n#endif\nENDGLSL}}}";
	
</code></pre>

As the variable names suggest, the user's fragment shader will be positioned in between these two strings when building our input file. 

Get the user input however you see fit (I as the picture earlier showed, I'm using Unity.GUI for now), and then assemble the full file string with prefix+USERINPUT+suffix. 

Once you've assembled the full shader string, you need to write it to a file, since CgBatch expects the input parameter to be a file path. Since we don't want this file to persist between runs, I'm writing the input file to Application.temporaryCachePath. 

<pre><code>
	
byte[] byteShader = System.Text.Encoding.UTF8.GetBytes(prefix+shader+suffix);

var tempShader = File.Create(Application.temporaryCachePath+"/tempshader.shader");
tempShader.Write(byteShader,0,(prefix+suffix+shader).Length);
tempShader.Close();
	
</code></pre>

Finally, we need to read in the output and actually build a material out of it. All together, the shader compilation process looks like the following: 

<pre><code>
	
byte[] byteShader = System.Text.Encoding.UTF8.GetBytes(prefix+shader+suffix);

var tempShader = File.Create(Application.temporaryCachePath+"/tempshader.shader");
tempShader.Write(byteShader,0,(prefix+suffix+shader).Length);
tempShader.Close();

Process compileProcess = new Process();
compileProcess.StartInfo.FileName = "bash";

compileProcess.StartInfo.Arguments = "-c '"
	+Application.streamingAssetsPath
	+"/Tools/CGBatch "
	+Application.temporaryCachePath
	+"/tempshader.shader ../CGIncludes/ ../CGIncludes/"
	+Application.temporaryCachePath
	+"/testOutput.shader'";
	
compileProcess.StartInfo.RedirectStandardOutput = true;
compileProcess.StartInfo.UseShellExecute = false;

compileProcess.Start();
var output = compileProcess.StandardOutput.ReadToEnd();
compileProcess.WaitForExit();

string compiled = File.ReadAllText(Application.temporaryCachePath
		+"/testOutput.shader");
									
Material m = new Material(compiled);
cube.renderer.material = m;

UnityEngine.Debug.Log(output);
	
</code></pre>

The above has only been tested on mac. On Windows, you will need to replace "bash" with "cmd" and the arguments with whatever is appropriate for your system. I unfortunately don't have a Windows machine to test it out (again, send me a message [on twitter](http://twitter.com/khalladay) and I'll update this).

But, provided you're on Mac, or have figured out the Windows changes, you should now be able to compile GLSL at runtime! You laugh in the face of Unity not supporting this feature!

You may also notice that your build product is 50MB larger than you expect. This is because we're including all of Cg.framework with our project so that CgBatch can use it during compilation. I expect that this extra file size is one of a number of reasons that Unity has opted to leave this feature out by default.

That's all for now! Hopefully this wall of text has opened up a whole world of experimental gameplay to you! I'd love to hear about any improvements to the above, any further knowledge about CgBatch, and especially any other tricks like this that allow weird stuff to be done in my favourite engine, so as I've said twice already, [TWITTER!](http://twitter.com/khalladay)
