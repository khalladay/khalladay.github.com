---
layout: post
title: "SCP Secure Copy"
---

h2. {{ page.title }}

p(publish_date). 13 May 2008

<p>So, I'm late to the Linux party.  Today I learned how to use ‘scp’ to securely copy files between servers. Very late to the party.  From my macbook pro I type this command:</p>

<pre name="code" class="terminal">
 scp dhixon@communicatopia.com:backups/ctopia.sql ctopia.sql
</pre>

<p>Scp establishes an ssh connection with communicatopia.com and grabs the communicatopia.sql file from the backups folder in my home directory and copies it to the current working directory on my apple.   It is terribly easy.  For my next trick I want to configure a cron job to run a ruby script to mysqldump every night then upload it to my S3 account.</p>
