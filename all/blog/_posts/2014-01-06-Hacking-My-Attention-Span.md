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
* Open up Automator and create a new application. <br>
* In this application, drag the action "Run Applescript" from utilities into your Automator Task. <br>
* Paste the script below into the Run Applescript text area: 


<pre style="background-color:white; color:black">
on run argv
	set defaultTime to YOUR-DURATION
	
	try
		set myTime to item 1 of argv as number
	on error
		set myTime to defaultTime
	end try
	
	tell application "SelfControl" to activate
	
	tell application "System Events"
		tell process "SelfControl"
			tell slider of window "SelfControl" to set value to myTime
			click button "Start" of window "SelfControl"
		end tell
		
		tell window 1 of process "SecurityAgent"
			with timeout of 15 seconds
				repeat
					set tryAgain to false
					try
						set value of text field 2 of scroll area 1 of group 1 to PASSWORD
					on error
						delay 1
						set tryAgain to true
					end try
					if not tryAgain then exit repeat
				end repeat
				click button 2 of group 2
			end timeout
		end tell
	end tell
end run	
</pre>

Replace the YOUR-DURATION with a multiple of 15. This is how long SelfControl will run for. 

Replace PASSWORD with your user password (with a quotation mark on each side). It's probably terrible to script something to do this, but the previous method (using) [Usable-Keychain-Scripting](http://www.red-sweater.com/blog/446/usable-keychain-update) seems to be broken in Mavericks; the above is the only way I could get this to work. 

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
 