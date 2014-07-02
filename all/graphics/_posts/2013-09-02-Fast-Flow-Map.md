---
layout: graphics
title: Fast Flow Map
snippet: A no frills flow map shader for river effects in mobile unity games

---

My Fast Flow Map shader was born out of a need for an extremely fast river effect for a mobile game. Since it's designed to be as fast as possible, there are no lighting calculations, no colour multiplications, no bells or whistles. 

<h4>Here's how it works: </h4>

The system is a shader and a script. The script needs a reference to the water material set in the inspector, and it will control all the texture scrolling needed for the effect to work. Moving this out of the shader saves us a bunch of frame time, and gives you an easy way to extend the system if you have a need to sync multiple materials to the same offsets. 

The shader takes three textures as input. The ground texture, the water texture, and the flow map. Examples are provided in the repo.

The flow map controls what sections of the material have water vs ground (or a mix of both), and what direction the texture coords on that spot are scrolling. The red channel of a pixel controls the x movement there, the green channel controls y movement, and the blue channel controls the blend between the water and ground texture. For movement channels, #77 is neutral, allowing movement in either direction by going above or below that value. 

A web demo of this project is available [here](/demos/fastflowmap/flowmap_demo.html)

The demo uses the same flow map as the Flow plugin on the asset store. I promise the system is mine, but since I designed the system to mimic the look of Flow's basic mobile shader, if you don't believe me, I'd say I did my job :D (check the repo to be convinced). If you're looking for a much more full featured version of this effect, definitely go check out Flow. 

This project is open source! Check out the repo [here](https://github.com/khalladay/FastFlowMap) 

![Screen 1](/images/project_screens/flowmap_screen.png)
![Screen 2](/images/post_images/2013-09-02/flow_map.png)

Pull requests are very welcome if you want to add or fix up something before I get to it :D