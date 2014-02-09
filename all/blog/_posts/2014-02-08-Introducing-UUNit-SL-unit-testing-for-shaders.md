---
layout: post
title: Unit Testing Shaders with UUnit-SL
---

tldr? Check out UUnit-SL [on github](https://github.com/khalladay/uunit-sl). 

A lot of my posts end up being about things that I've figured out and want to make easier for the next person who googles how to do. This is not one of those times, in fact I'm pretty sure that what I'm about to show off is either completely unhelpful or actually a bad idea, but I think it's an interesting experiment nonetheless. 

A major concern I have with unit tests is that there doesn't seem to be an accepted way to test shaders. A common argument against this is that shaders are usually small enough to not need tests. I disagree, especially when it comes to implementing complex math within a shader. Also, if shaders can't be tested properly, that means a good portion of the work I do can't be tested, which is a shame. 

So I've decided to try my hand at building a way to test shaders. I'm still on the fence about this whole thing, but if you're interested, all the details are here!

<h2>Introducing My Frankenstein: UUnit-SL</h2>

[UUnit](http://wiki.unity3d.com/index.php?title=UUnit) is a common recommendation given on the forums as a place to start when trying to add testing to Unity projects. It doesn't have a lot of bells and whistles, but so far it seems to get the job done pretty well. So for this experiment, I've decided to extend UUnit to work with shaders. 

To test a shader with UUnit-SL, your test case must derive from the new class UUnitShaderTestCase. If you check out the code you'll notice a few new methods being defined. The first two are:

<pre><code>
protected virtual void SLSceneSetup()
{
	_oldSceneName = EditorApplication.currentScene;
	EditorApplication.NewScene();

	cameraOutput = new RenderTexture(512,512,0,RenderTextureFormat.ARGB32);

	Camera.main.transform.position = new Vector3(0.0f, 0.0f, -10.0f);
	Camera.main.transform.LookAt(Vector3.zero);
	Camera.main.fieldOfView = 10;
	Camera.main.targetTexture = cameraOutput;
	testCamera = Camera.main.gameObject;
	Camera.main.enabled = false;

	testLight = new GameObject();
	testLight.name = "TestLight";
	testLight.AddComponent&lt;Light&rt;();
	testLight.GetComponent&lt;Light>&rt;.type = LightType.Directional;
	testLight.transform.position = new Vector3(5.0f, 10.0f, -10.0f);
	testLight.transform.LookAt(Vector3.zero);

	testQuad = GameObject.CreatePrimitive(PrimitiveType.Quad);
	testQuad.name = "TestQuad";
	testQuad.transform.position = Vector3.zero;
}
	
protected void SLSceneTearDown()
{
	RenderTexture.active = null;
	GameObject.DestroyImmediate(testCamera);
	GameObject.DestroyImmediate(testLight);
	GameObject.DestroyImmediate(testQuad);
	EditorApplication.OpenScene(_oldSceneName);
}
</code>
</pre>

As you may have gathered, these methods create and tear down a simple scene with a single quad in front of the camera. This quad will eventually hold a material using the shader to be tested. The camera then renders its view to texture and gets the colour of the center pixels in this texture. This output can then be tested against the expected output of the shader given these inputs. 

This isn't useful for testing things like incorrect inputs, or zfighting issues, but it is useful for ensuring that your math is producing the output you expect, which is something. A simple test case using UUnit-SL looks like this: 

<pre><code>
public class TestCaseBlue : UUnitShaderTestCase 
{
protected override void SetUp ()
{
	LoadShader("Assets/UUnit-SL/UUnit-SL-SelfTest/UUSLTestBlue.shader");
}

[UUnitTest]
public void TestDiffuse()
{
	UUnitAssert.True(shaderOutput == Color.blue, 
					"Test Blue Output is Blue");
}

protected override void TearDown ()
{
}
}
</code></pre>

If you've used UUnit before, you'll recognize this. The only real difference is the call to LoadShader, which specifies the file path of the shader you want to test. All of the elements in the scene are also exposed as protected variables, so if you want to change their location or settings (a different light type for instance) you can do it inside of SetUp as well. The camera will render to texture after SetUp is called. 

As shown above, the colour of the shader otuput is stored in a variable called shaderOutput. At the moment, the tests only store a single pixel of data, although I'm sure that I will find a reason to add other options here pretty quickly if any of this actually proves useful; I've yet to decide whether this is actually worth the time to do at all, or if this approach will be too limited for more complex cases. 

In any case, UUnit-SL can be grabbed [from github](https://github.com/khalladay/uunit-sl). 

Think this is a terrible idea? Think it's the best thing since sliced bread? Send me a message send me a message [on twitter](http://twitter.com/khalladay). 