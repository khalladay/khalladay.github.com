---
layout: post
title: "Quitting Parallels for VirtualBox"
---

h2. {{ page.title }}

p(publish_date). 04 Nov 2009

p. I used to love parallels for running windows, now it seems slow and overpriced. I'd been using VirtualBox for linux instances and it's great. I upgraded to snow leopard for $29 and Parallels 3 is unsupported - they wanted $50 to upgrade to Parallels 4. That's not the kind of path I want to be on.  I decided to convert my windows instance to VirtualBox.

h3. Step 1: Convert Image

p. I followed these steps to use vmware to "convert hdd into something usable by virtualbox":http://benfrain.com/notepad/2009/03/osx-converting-parallels-or-vmware-to.html

h3. Step 2: Fail

p. I went to boot and it didn't work. Hung loading drivers - boot to safe mode hung after agp440.sys, disable agp440.sys and it hangs on mup.sys.

h3. Step 3: Disable Everything & Enable IO APIC

p. An important tenet to troubleshooting any problem you should be careful to change one thing at a time.  I am not a careful troubleshooter - I like to take shortcuts first then careful later. In VirtualBox I disabled the following: Audio, Network, Ports (USB) and under "System" I checked the "Enable IO APIC". I was then able to boot.

p. After installing Guest Add-Ons I started turning things back on one-at-a-time and now everything is back on and when I uncheck "Enable IO APIC" the VM doesn't boot, so perhaps that was the problem the whole time but I can't tell because I tried a shortcut.