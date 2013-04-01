---
layout: post
title: "You have mail."
---

h2. {{ page.title }}

p(publish_date). 10 Nov 2009

p. Sometimes I'm greeted by this message in terminal:

<pre name="code">
Last login: Tue Nov 10 21:28:45 on ttys002
You have mail.
</pre>

p. One of my projects uses cron to schedule tasks and so some test data got into my crontab file. Ok, I go delete the tasks out of crontab and delete my messages.  This comes up so rarely that I forget how to delete the messages and I usually have trouble opening crontab on my first try since textmate is my default editor.

p. Set nano as my editor by issuing this command:

<pre name="code">
$ export EDITOR='nano'
$ crontab -e
</pre>

p. Then use Ctrl+K to quickly delete all the lines in the file, Ctrl+O to save the file, Ctrl+X to exit.

p. Now time to delete all the mail:
<notextile><pre name="code">
$ mail
Mail version 8.1 6/6/93.  Type ? for help.
"/var/mail/danhixon": 720 messages 720 new
>N  1 danhixon@yMac.local   Tue Nov 10 01:00  19/691   "Cron <danhi...
 N  2 danhixon@yMac.local   Tue Nov 10 01:00  19/691   "Cron <danhi...
 N  3 danhixon@yMac.local   Tue Nov 10 01:00  19/690   "Cron <danhi...
 	etc.
? 
</pre></notextile>

p. Type 'd *' return, then q, return. (Do not type x, that will exit without saving.)