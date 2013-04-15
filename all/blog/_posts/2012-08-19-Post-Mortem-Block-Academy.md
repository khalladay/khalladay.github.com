---
layout: post
title: Post Mortem - Block Academy
---

n their final year in Humber College’s Game Programming course, students are tasked with creation of a “Capstone Project,” almost like a journeyman’s piece, which serves to demonstrate the skills that they have developed over the course of the program, and to hopefully get them noticed by industry professionals. Block Academy was my capstone project, and it launched last week.

###What Went Right:###

*  The Frame Rate.

Getting a game up to 24+ fps sounds like a basic thing; it was anything but for Block Academy. An empty scene with Unity and Vuforia (the engine and framework used to build the game) running clipped along at 28 fps, meaning I had ~4 frames to cram the rest of the game logic into (although this isn’t exact, because it’s hard to know what amount of the empty scene’s fps was camera limited, and what was cpu limited). It took a LOT of work to get the game optimized enough to run smoothly. The end result is hard to argue with though, even on the iPhone 4, the game is fluid, and the augmented reality is as responsive as you can get on a mobile device.

* The Puzzle Design.

Block Academy was the first game I worked on that didn’t procedurally generate the levels, and was one of the first times I had to design levels for a game. It was nerve wracking. My biggest fear throughout development was that the levels would be too easy, and that people would accuse the game of lacking content. Thankfully, the few people who tested the game before launch assuaged my fears of that. If anything, I needed to have a much gentler difficulty curve.

###What Went Wrong###

* The Tutorial (or lack thereof)

I struggled a lot with trying to create a decent tutorial for Block Academy, and in the end opted to go with a simple series of text/image dialog boxes presented to the user. I’m not entirely happy with it, but I wanted to avoid forcing new users to go through an overly long or boring tutorial before they got to really play. This was a bit of a cop out on my part, and for my next project I’m going to have to experiment with different ways to get an interactive tutorial to feel fun and not like a boring prelude to fun. Expect a few posts in the future about this, as it’s something not a lot of games get right and I don’t expect to find many easy answers.

* My Marketing Strategy

Put simply: I built it, didn’t tell anyone about it, and no one came. As said above, I’m REALLY bad at marketing. Although I’m sure the 20 odd people who bought Block Academy are having a great time, I’d really like to grab a wider audience for my next project. I think my biggest problem in marketing the game was that the first time anyone heard about the game was when I was asking them to buy it. Marketing is something I’m really going to have to work, because building games that no one plays is really disheartening

* The Marker Card

Expecting users to download a marker card to play the game was a mistake. AR Defender, one of the games that inspired me to build Block Academy in the first place, got around this by allowing users to draw their own marker card, and included instructions to do so. While I’m not sure if this approach would work for the technology used for Block Academy, something needed to be different. Expecting users to put in more work than simply downloading the app in order to enjoy the game’s content isn’t something I should have expected mobile gamers to flock to, and the sales suffered for it.

###Conclusion###

Ultimately, Block Academy accomplished everything I needed it to (a great job offer, and a diploma), but fell short when it came to raw sales. It was a great learning experience, but working on something for so long and having so little to show for it at the end of the day isn’t an experience i’m keen on having again. You can be sure that my next project (whenever I decide what it’s going to be) isn’t going to repeat any of these mistakes, and hopefully will be better for it.