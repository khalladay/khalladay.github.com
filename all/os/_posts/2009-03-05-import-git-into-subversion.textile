---
layout: post
title: "Import Git Repository into Subversion"
---

h2. {{ page.title }}

p(publish_date). 05 Mar 2009

p. This is probably supremely easy to do but all my searches on google yield results on how to import a subversion into a git repository and I need the other way around so I came up with the following.

p. Start by creating the folder in subversion into which you wish to import.  In the directory with the git repository do this:
<pre class="terminal">~/Sites/slices(master) $ cd ..
~/Sites $ git svn clone https://svn/slices/trunk clone_slices
~/Sites $ cd clone_slices
~/Sites/clone_slices $ git pull ../slices
~/Sites/clone_slices $ git svn dcommit
<notextile># rename the folder if you want:</notextile>
~/Sites/clone_slices $ cd ..
~/Sites/clone_slices $ rm -rf slices
~/Sites/clone_slices $ mv clone_slices slices
</pre>