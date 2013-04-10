---
layout: post
title: 1GAM January Lessons Learned
---

Do you hear that? It’s the sound of a thousands of programmers crunching to finish their game before the end of the month. Uncharacteristically, I’ve already submitted my game for the month, a simple 2 button game which requires players to guide a ball down a randomly generated track (if you’re interested, and on Mac, get it here: http://dl.dropbox.com/u/6128167/HaikuRacer.zip ), but I expect that next month I’ll be joining the legion of code jockeys trying to squeeze in one last bug fix before the month is over.

At first glance, the game I submitted is rather unimpressive, especially compared to what I do at work all day, or even compared to many of my projects from college, so I won’t spend too much time talking about it specifically. This month wasn’t about creating a masterpiece, it was about exercising code muscles that I haven’t used for almost a year (that is, not for a mobile device or using Unity), so in lieu of a more traditional post mortem, I’m going to take this post to talk about some of the most important lessons that I learned from 1GAM January.

 

* *Be comfortable with drastically reducing scope (because estimating is hard)*

My biggest lesson learned this month is that estimating (time spent to do something) is hard. The month started with me and Johannes (kickass musician and audio designer that I worked with this month, johannesg.com) sketching what at the time seemed like very reasonable ideas. Unfortunately, life got in the way for both of us, and we very quickly found ourselves needing to reduce the scope of our game in order to get something done. As it turns out, what sounded like reasonable goals ended up being rather lofty ambitions for my first month back in the pure C++ saddle. It was lucky that we were both busier than we thought we would be, I would have felt terrible being the only person axing features.

* *Working with someone else is the best thing you can do for yourself.*

I don’t think I would have actually finished something at all this month had I been working alone. Life was hectic and it would have been very easy to say screw it this month and try again in February. Having a teammate (or a whole team) makes you accountable, which is fantastic. Even more, working with someone outside of your niche forces you to learn new things to adapt to their skills. I had never worked with an audio designer before, and wasn’t expecting to have to write an easy to modify audio system that didn’t require recompiling. I had to learn a lot more about OpenAL than I was planning this month, and do a whole lot more XML parsing than I would have ever guessed. Considering my end goal for this year is to be proficient enough at working outside of Unity to undertake my next “big” game, this was a god send in that it forced me to work on things I would have found an excuse to half ass this month, and I’m  looking forward to figuring out 3D audio with OpenAL for our February game.

* *“Hacking” is for sick people*

This was another eye opening lesson for me this month. When you have a very limited amount of time that you can work on a project, every second that you spend hunting for a bug caused by sloppy coding, in undocumented code, is time that you’re not putting towards the next feature. I don’t think I’ll ever neglect documentation and good coding practice to the same degree as I did this month (reasoning of course, that I didn’t have time to worry those sorts of things). Bug fixing bad code easily cost myself double the amount of time it would have taken to write cleaner code to begin with. Lesson learned, just because it’s a hobby project doesn’t mean you shouldn’t approach it professionally (at least when it comes to code quality standards)

 

I guess in summation: this month was a blast, sorry the game runs so poorly (I’m still trying to figure out game dev for non mobile architectures), and I hope that if any of you reading this are about to submit that your final few hours of bug fixing goes well! Any coding lessons that you want to share? tweet them to me @Khalladay!