---
layout: post
title: Don't Pay $50 for Coloured Shadows.
---

See the title? At the time of writing this, there is a package on the asset store that colours shadows in Unity. It costs $50. Don't pay that, colouring shadows isn't that hard.

I'm going to save you $50. Let's learn how to colour some shadows, shall we?

<div align="center">
	 	
<img src="/images/post_images/2014-05-16/purple_shadows.png" />
<br>
<font size="2">I added water to make this seem more impressive.</font>
<br>

</div>

<br>
<h2>Time to Get Fabulous</h2>

To make this simple, we're going to be writing a surface shader today. It's important to note that the shader we're writing will set the colour of the shadows being received by the object being shaded, not the colour of the shadows cast by that object onto others. If you want the ground to show coloured shadows, the ground needs to have a shadow colouring shader. In the image above, both the sphere and the ground have the shader applied.

Let's add coloured shadows to the default diffuse shader that comes with unity. First off, we'll need the source for that. You can grab the source for all the built in shaders in Unity from their [downloads page](http://unity3d.com/unity/download/archive). 

The default diffuse shader is in a file called Normal-Diffuse.shader. So let's open it up, and copy the contents into a new shader in Unity: 

<pre><code>Shader "Colored Diffuse" {
Properties {
	&#95;Color ("Main Color", Color) = (1,1,1,1)
	&#95;MainTex ("Base (RGB)", 2D) = "white" {}
}
SubShader {
	Tags { "RenderType"="Opaque" }
	LOD 200

CGPROGRAM
#pragma surface surf Lambert

sampler2D &#95;MainTex;
fixed4 &#95;Color;

struct Input {
	float2 uv&#95;MainTex;
};

void surf (Input IN, inout SurfaceOutput o) {
	fixed4 c = tex2D(&#95;MainTex, IN.uv&#95;MainTex) * &#95;Color;
	o.Albedo = c.rgb;
	o.Alpha = c.a;
}
ENDCG
}

Fallback "VertexLit"
}
</code></pre>

If you throw this on a material it should, unsurprisingly, look exactly like the "Diffuse" shader that comes with Unity. Now it's time to have some fun. We're going to need to write our own lighting function to get the shadows the colour we want them. Right now the shader is using the built in "Lambert" function, and ideally, our lighting should look exactly like it, just more fabulous. The easiest way to do this is to just grab the source for the Lambert function and modify that directly. 

That built in shaders folder you downloaded also has the source code for the lighting functions (inside the file Lighting.cginc). If you open it up, and ctrl+f for "Lambert" you'll find what we're looking for. Let's paste that into our shader as well:

<pre><code>CGPROGRAM
#pragma surface surf CSLambert
sampler2D &#95;MainTex;

struct Input {
	float2 uv&#95;MainTex;
};

half4 LightingCSLambert (SurfaceOutput s, half3 lightDir, half atten) {

	fixed diff = max (0, dot (s.Normal, lightDir));

	fixed4 c;
	c.rgb = s.Albedo * &#95;LightColor0.rgb * (diff * atten * 2);
	c.a = s.Alpha;
	return c;
	}

void surf (Input IN, inout SurfaceOutput o) {
	half4 c = tex2D (&#95;MainTex, IN.uv&#95;MainTex);
	o.Albedo = c.rgb;
	o.Alpha = c.a;
}

ENDCG    
</code></pre>

You'll notice I changed the name of the lighting function (and the #pragma line which specifies which function to use). This is just to avoid confusion with the original Lambert function. 


The lighting function is responsible for outputting the final colour of the object, which includes the colour of the shadowed area. The atten term you see above is the shadow multiplier. The higher the atten value, the brighter the surface, a low value points to the fragment being in shadow. The lower the atten value, the darker the shadows. 

Since we know that any atten value less than 1.0 means that the fragment is in shadow, subtracting atten from 1.0 will give us the strength that the shadow colour needs to be. Lighter shadows (a higher atten) will naturally have a lighter shadow colour.

<pre><code>half4 LightingCSLambert (SurfaceOutput s, half3 lightDir, half atten) 
{

	fixed diff = max (0, dot (s.Normal, lightDir));

	fixed4 c;
	c.rgb = s.Albedo * &#95;LightColor0.rgb * (diff * atten * 2);
	
	//shadow colorization
	c.rgb += &#95;ShadowColor.xyz * (1.0-atten);
	
	c.a = s.Alpha;
	return c;
}  
</code></pre>


Make sure that you also add the &#95;ShadowColor color property to the shader, and as a uniform inside your CG Program. Then throw this shader onto one of your objects, and watch the magic happen. 

You may have noticed that the above change doesn't account for diffuse shadows, that is, unlit sides of a diffuse material. You end up with a really weird looking dissonance between the object's dark areas, and the areas that are receiving shadows.

<div align="center">
	 	
<img src="/images/post_images/2014-05-16/no_diffuse.png" />
<br>
<font size="2">Notice the difference between the areas being self shadowed, and the areas that are unlit.</font>

<br>

</div>

<br>
This happens because although the atten value tell us if we're being shadowed by another object, it doesn't account for a fragment being dark as a result of it's own lighting function. In the case of a diffuse material, this is when it is pointing away from all relevant light sources. 

What we need is to have our shadow colouring take into account both the atten value and the lighting. We can do that like so: 


<pre><code>half4 LightingCSLambert (SurfaceOutput s, half3 lightDir, half atten) 
{
	fixed diff = max (0, dot (s.Normal, lightDir));

	fixed4 c;
	c.rgb = s.Albedo * &#95;LightColor0.rgb * (diff * atten * 2);
	
	//shadow colorization
	c.rgb += &#95;ShadowColor.xyz * max(0.0,(1.0-(diff*atten*2))) * &#95;DiffuseVal;
	c.a = s.Alpha;
	return c;
}
</code></pre>

Put it all together and you should end up with the most fabulous shadow colours you've ever seen!

Extending this to other shaders is very similar to what we did here, simply grab the source for the shader you want to modify from the built in shader source, and modify the lighting function to add shadow colour based on that specific lighting function's equation. 

If you have any questions about this (or spot a mistake in what's here), send me a send me a message [on twitter](http://twitter.com/khalladay). I won't write shaders for you, but I'm happy to point you in the right direction for your specific use case. Happy shading!
