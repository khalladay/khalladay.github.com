---
layout: post
title: Automating SelfControl in OS X Mavericks 
---

I'm an internet junkie, but I can change, if I have to, I guess. 

Like everyone else, I have goals and laundry that need attention in the new year and in order for that to happen, I need to curb my internet habit. Since I apparently lack a lot of it on my own, I've been using the excellent site blocking app: [SelfControl](http://selfcontrolapp.com/).

<div align="center">
	
<img src="/images/post&#95;images/2014-01-06/sc_logo.jpg" /><br>

</div>

<br>
The only issue I have with SelfControl is that I need to start it manually, and it's too easy to get into the trap of "just a few minutes" before deciding to start it each morning. What I need is to schedule it to have already started in the mornings before I wake up, and only unlock for an hour or so before bed. 

Luckily, there is a way (that is less involved than forking the project and adding scheduling myself)! So if any of you are in the same boat, check out the following steps:

* Download [SelfControl](http://selfcontrolapp.com/)<br>
* Download [Usable-Keychain-Scripting](http://www.red-sweater.com/blog/446/usable-keychain-update) - this is an app that makes it easy to write applescript that needs authenticate with the keychain<br>
* Open up Keychain Access, and go to File->New Password<br>
* Create a new password named "SelfControl", with any account name you want, and a password.<br>
* Open up Automator and create a new calendar alarm. <br>
* In this calendar alarm, drag the action "Run Applescript" from utilities into your Automator Task. <br>
* Paste the script from [here](http://hints.macworld.com/article.php?story=20100801214648362) into your Run Applescript task. The page with the code has instructions on how to set a duration to your liking. Make sure to use a multiple of 15.<br>
* Save your workflow (workflows are saved in ~/Library/Workflows)<br>
* Create a repeating task in Calendar, and set its color to "Automator"<br>

<div align="center">
	
<img src="/images/post&#95;images/2014-01-06/calendar.png" /><br>

</div>

* Create an alarm for this calendar task, set its type to custom->open file.<br>
* Select the workflow file you created earlier. <br>

Now, whenever the calendar plays the alarm for that event, your self control script will run! 

There's just one more problem though, I want the script to run before I wake up in the morning, which means that my laptop will be asleep, so I need it to wake up before the calendar task. 

<div align="center">
	
<img src="/images/post&#95;images/2014-01-06/schedule.png" /><br>

</div>

* Open System Preferences and select "Energy Saver"
* Click "Schedule" and check "Start on Wake"
* Enter a wake up time before your calendar event and have it recur each day that your self control script will run. 


And that's all there is to it! 


Have any other tricks for staying on task and away from reddit? Send me a message [on Twitter.](http://twitter.com/khalladay) 
 