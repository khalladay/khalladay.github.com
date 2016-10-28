---
layout: post
title: Making a Dissolve Effect with Surface Shaders
categories:
- blog
- tutorial
- bestof
tags:
- <span style="background-color:grey;"><font color="white">&nbsp;Unity&nbsp;</font></span>

---

<div style="background-color:#EEAAAA;">NOTE: This article is OLD! (From 2013!). Information in it may be out of date or outright useless, and I have no plans to update it. Beware!
</div>

<br>

I recently posted a shader pack which creates a cool "dissolve" (for lack of a better descriptor) effect, similar to the skin of Skyrim's dragons during their death animation. As requested by reddit, this post detail exactly what you need to know to write one of these shaders yourself, and hopefully, provide you with a good base with which to modify my shaders to your specific needs. I'm going to attempt to start from square one and not assume any shader experience on your part, but it will probably help if you have a general idea of how to build a basic shader before hand. 

Let's get started.

<h2>Getting Started</h2>

The obvious first step here is to open up Unity and create a new shader. Unity is going to assume that you would like to create a surface shader, and pre-populate a lot of boiler plate code. Thanks Unity! Now, delete all of it and give yourself a nice, clean slate to work with. 

Now that that's cleaned up, start your shader with the lines:

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		
	}
	SubShader
	{
		
	}
}
{% endhighlight %}

This is a bit of Unity specific structure; the "Properties" section will allow us to define which variables we want to expose in the inspector, while the "SubShader" section will hold the actual code used in our shader. 

Ok, now let's figure out exactly what we will need the user to define. Take another look at what the effect looks like: 

<div align="center">
	<img src="/images/post_images/2013-09-28/dissolve.png" /><br>
	<font size="2">
	Pretty snazzy, isn't it?
	</font>
</div>
<br>

First off, we're going to need the user to tell us what texture the put on the mesh for its normal undissolved state. The convention with Unity shaders is to call this texture &#95;MainTex. So let's add that to our properties.

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		_MainTex("Main Texture", 2D) = "white"{}
	}
	SubShader
	{
		
	}
}
{% endhighlight %}

The new line in properties shows how to define a regular texture for the inspector. We are going to call this variable &#95;MainTex in our code, so that goes first. The "Main Texture" string in the parentheses defines that we want the inspector to display as this variables name. The subsequent "2D" declares that this slot in the inspector will accept a 2D texture. The "values after the equals sign  "white"{} after the equals sign just sets the default value of this field to a generic white texture. 

Ok, so now that we've figured out how to declare a texture, what other textures will we need? For this shader, we're not going to use bump maps, so the only other texture we need is something to define the shape of the dissolve effect. Let's call that &#95;DissolveMap. 

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		_MainTex("Main Texture", 2D) = "white"{}
		_DissolveMap("Dissolve Shape", 2D) = "white"{}
	}
	SubShader
	{
		
	}
}
{% endhighlight %}

Ok, aside from our textures we also need 2 floats to control the progress of the effect and size of the edge lines. However, we want to be able to control the range of these floats, so that our users don't set them to values that are outside of what makes sense for our shader. One way of doing this is with the Range type. Any variables marked as type Range in the properties panel will display as a slider, that moves between the low and high values we define. 

Finally, I'm going to add a Color variable to allow us to define what colour the edges of the effect are. 

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		_MainTex("Main Texture", 2D) = "white"{}
		_DissolveMap("Dissolve Shape", 2D) = "white"{}
		
		_DissolveVal("Dissolve Value", Range(-0.2, 1.2)) = 1.2
		_LineWidth("Line Width", Range(0.0, 0.2)) = 0.1
		
		_LineColor("Line Color", Color) = (1.0, 1.0, 1.0, 1.0)
	}
	SubShader
	{
		
	}
}
{% endhighlight %}
 
One thing to note is that we want the range of the dissolve effect to be functionally between 0.0 and 1.0, but in order to account for the line width, we need to expand the range in both directions by the maximum size the lines can be, otherwise lines will show up when the mesh should have no dissolve applied, and when it should be completely transparent. 

Ok perfect, so now that that's taken care of, let's move on the actually writing a shader!

<h2>Setting Things Up</h2>

So now we move down to the SubShader tag. We're going to be writing a surface shader. Surface shaders are a unity specific type of shorthand that takes care of all the lighting specific shader code for you. It's perfect for our purposes. What this also decides for us is that our shader needs to be written in CG (as opposed to glsl or hlsl). 

The first things we need to do with our shader are tell Unity to expect CG code, and what variables we want our code to access from outside of the shader itself. 

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		_MainTex("Main Texture", 2D) = "white"{}
		_DissolveMap("Dissolve Shape", 2D) = "white"{}
		
		_DissolveVal("Dissolve Value", Range(-0.2, 1.2)) = 1.2
		_LineWidth("Line Width", Range(0.0, 0.2)) = 0.1
		
		_LineColor("Line Color", Color) = (1.0, 1.0, 1.0, 1.0)
	}
	SubShader
	{
		CGPROGRAM
		#pragma surface surf Lambert
		
		sampler2D _MainTex;
		sampler2D _DissolveMap;
		
		float4 _LineColor;
		float _DissolveVal;
		float _LineWidth;
		
		ENDCG
	}
}
{% endhighlight %}

Most of this is hopefully self explanatory, but the one line that may not be is the #pragma... line. This is a surface shader specific pragma that tells unity that we want our model to be lit according to the Lamber lighting model (diffuse lighting). Behind the scenes, Unity will add the code necessary for this lighting model to our shader when it compiles. 

The other lines added are just declarations of the data we're getting from the inspector, so that our shader knows to use this data. It's important that the variable names used here are exactly the same as the ones we used in the Properties section. The datatypes here are just the CG equivalents of the types we defined above (there's no such thing as a Color type in CG, so colours are representing as a 4 element vector).

Now, let's add the rest of the structural code we need in order for our shader to start taking shape. 

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		_MainTex("Main Texture", 2D) = "white"{}
		_DissolveMap("Dissolve Shape", 2D) = "white"{}
		
		_DissolveVal("Dissolve Value", Range(-0.2, 1.2)) = 1.2
		_LineWidth("Line Width", Range(0.0, 0.2)) = 0.1
		
		_LineColor("Line Color", Color) = (1.0, 1.0, 1.0, 1.0)
	}
	SubShader
	{
		CGPROGRAM
		#pragma surface surf Lambert
		
		sampler2D _MainTex;
		sampler2D _DissolveMap;
		
		float4 _LineColor;
		float _DissolveVal;
		float _LineWidth;
		
		struct Input 
		{
     			half2 uv_MainTex;
     			half2 uv_DissolveMap;
    		};

		void surf (Input IN, inout SurfaceOutput o) 
		{
			o.Albedo = float4(1.0, 1.0, 1.0, 1.0);
		}
		ENDCG
	}
}
{% endhighlight %}

The Input struct defines what information we need to access about each vertex in the model being shaded. In this case, all we need are uv co-ordinates for each of the textures that we're using. Defining these variables as "uv&#95;" and then a texture name will automatically pull the correct uv's for that texture. 

The surface shader system will handle dealing with the position and normal variables as it needs to, but we don't need to worry about that. 

The surf function that I defined is just a boiler plate surface function. It takes the input we defined, and modifies a SurfaceOutput struct for Unity. This SurfaceOutput data will control what the fragment actually gets shaded as. 

The o.Albedo line shows how to set the colour of a fragment. In this case, all we're doing is assigning each fragment the color white. We're going to modify this now. The next example will show how to set a fragment to the colour it should be to display &#95;MainTex properly.

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		_MainTex("Main Texture", 2D) = "white"{}
		_DissolveMap("Dissolve Shape", 2D) = "white"{}
		
		_DissolveVal("Dissolve Value", Range(-0.2, 1.2)) = 1.2
		_LineWidth("Line Width", Range(0.0, 0.2)) = 0.1
		
		_LineColor("Line Color", Color) = (1.0, 1.0, 1.0, 1.0)
	}
	SubShader
	{
		CGPROGRAM
		#pragma surface surf Lambert
		
		sampler2D _MainTex;
		sampler2D _DissolveMap;
		
		float4 _LineColor;
		float _DissolveVal;
		float _LineWidth;
		
		struct Input 
		{
     			half2 uv_MainTex;
     			half2 uv_DissolveMap;
    		};

		void surf (Input IN, inout SurfaceOutput o) 
		{
			o.Albedo = tex2D(_MainTex, IN.uv_MainTex).rgb;
			
			half4 dissolve = tex2D(_DissolveMap, IN.uv_DissolveMap);
			
			half4 clear = half4(0.0);
		}
		ENDCG
	}
}
{% endhighlight %}

If you've worked at all with shaders before this should make sense, we're looking for what colour is at the position in the texture defined by the uv for this position on the mesh. o.Albedo doesn't set the alpha of our fragment, so we use .rgb to trim the alpha from this function. 

I've gone ahead and defined a clear variable (this is a 4 element vector with r g b and a set to 0.0) and grabbed the color of this position in the dissolve map texture as well. 

Now we need to get to the good stuff, how to decide whether a given fragment should be shaded with the main texture, the line color, or the clear color. 

<h2>The Good Stuff</h2>

We're going to decide how to shade each fragment based on the red channel of the dissolve map. If the red value of that texture is above the value of &#95;DissolveVal, we are going to shade that fragment with the line colour. If it is above the value of &#95;DissolveVal + &#95;LineWidth, the fragment will be transparent. 

In a regular script, this would usually be done with an if/else statement, but unfortunately shaders don't do if/else flows that well. You'll get the correct value, but the shader will end up executing the code for every possible outcome before choosing the correct value. It's much faster (and more shader-y) to use lerp for this. Lerp will mix two values together based on a third float value (if this value is 0, we end up with 100% of value A, if this is 1, we get 100% of value B). Hopefully this sounds like an if statement to you as well. 

We're going to define an integer that will serve as our conditional. The first choice we need to make is whether or not we are transparent. As stated before, we are only transparent if the red value of dissolve is greater than DissolveValue + LineWidth. 

{% highlight c++ %}
void surf (Input IN, inout SurfaceOutput o) 
{
	o.Albedo = tex2D(_MainTex, IN.uv_MainTex).rgb;
	
	half4 dissolve = tex2D(_DissolveMap, IN.uv_DissolveMap);
	
	half4 clear = half4(0.0);
	
	int isClear = int(dissolve.r - (_DissolveVal + _LineWidth) + 0.99);
	int isAtLeastLine = int(dissolve.r - (_DissolveVal) + 0.99);
}
{% endhighlight %}

The two ints do what their name implies. isClear resolve to 0 if dissolve.r isn't greater than &#95;DissolvVal + &#95;LineWidth and isAtLeastLine will be 0 if we should use the regular texture instead of using the line color or transparency.

Once we have those two values, the rest is pretty straight forward. 

{% highlight c++ %}
void surf (Input IN, inout SurfaceOutput o) 
{
	o.Albedo = tex2D(_MainTex, IN.uv_MainTex).rgb;
	
	half4 dissolve = tex2D(_DissolveMap, IN.uv_DissolveMap);
	
	half4 clear = half4(0.0);
	
	int isClear = int(dissolve.r - (_DissolveVal + _LineWidth) + 0.99);
	int isAtLeastLine = int(dissolve.r - (_DissolveVal) + 0.99);
	
	half4 altCol = lerp(_LineColor, clear, isClear);
	
	o.Albedo = lerp(o.Albedo, altCol, isAtLeastLine);
}

{% endhighlight %}

In case it isn't clear, the 2 lines we just added choose whether or not the alt color is clear or the line color, and then choose whether or not we should use the main texture, or the alt color. 

We're almost done! If you switch over to Unity now you might notice that nothing is really going transparent, it's just going black. This is because we haven't yet told Unity that this will be a transparent shader. Because of the order things are rendered, you need to explicitly tell Unity when a shader will draw transparent fragments. Luckily this is a pretty simple addition to the top of the shader. 

{% highlight c++ %}Shader "MyDissolveShader"
{
	Properties
	{
		_MainTex("Main Texture", 2D) = "white"{}
		_DissolveMap("Dissolve Shape", 2D) = "white"{}
		
		_DissolveVal("Dissolve Value", Range(-0.2, 1.2)) = 1.2
		_LineWidth("Line Width", Range(0.0, 0.2)) = 0.1
		
		_LineColor("Line Color", Color) = (1.0, 1.0, 1.0, 1.0)
	}
	SubShader
	{
		Tags{ "Queue" = "Transparent"}
		Blend SrcAlpha OneMinusSrcAlpha
		
		CGPROGRAM
		#pragma surface surf Lambert
		
		sampler2D _MainTex;
		sampler2D _DissolveMap;
		
		float4 _LineColor;
		float _DissolveVal;
		float _LineWidth;
		
		struct Input 
		{
     			half2 uv_MainTex;
     			half2 uv_DissolveMap;
    		};

		void surf (Input IN, inout SurfaceOutput o) 
		{
			o.Albedo = tex2D(_MainTex, IN.uv_MainTex).rgb;

			half4 dissolve = tex2D(_DissolveMap, IN.uv_DissolveMap);

			half4 clear = half4(0.0);

		int isClear = int(dissolve.r - (_DissolveVal + _LineWidth) + 0.99);
		int isAtLeastLine = int(dissolve.r - (_DissolveVal) + 0.99);

			half4 altCol = lerp(_LineColor, clear, isClear);

			o.Albedo = lerp(o.Albedo, altCol, isAtLeastLine);
			
			o.Alpha = lerp(1.0, 0.0, isClear);
			
		}
		ENDCG
	}
}
{% endhighlight %}

It takes 3 lines to make the shader transparent. The Tags.. line tells Unity to render objects using this shader when it renders transparent geometry and the Blend line defines how our transparency behaves. The one above tells our shader to use alpha blending (as opposed to being additive, or multiplicative transparency). Finally the o.Alpha... line defines the transparency of the fragment being shaded. 
	
Put all together, you have the Dissolve Diffuse shader from my Dissolve Shader pack! Hopefully this tutorial was helpful. Shoot any feedback you have to me [on Twitter](http://twitter.com/khalladay). Happy shading!
