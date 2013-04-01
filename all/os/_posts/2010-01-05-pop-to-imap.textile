---
layout: post
title: "Convert any POP mailbox to IMAP"
---

h2. {{ page.title }}

p(publish_date). 05 Jan 2010

p. I have multiple computers and an iPhone.  I use Apple Mail and I want all my email to be synchronized.  I don't want to read the same message twice.  My primary account is a gmail account but I have a few other accounts at spokt.com.  The secret to this simple hack is to use wrap your pop mailbox with a gmail account and enable IMAP.

h3. Step 1: Create a Gmail proxy account.

p. Invite your POP account to gmail (or open a new account from scratch)  If you address is bill@lambier.com you could set up bill_lambier@gmail.com.  We'll call this the gmail proxy account.

h3. Step 2: Configure Gmail Ready

* Log into gmail account and do the following under "Settings":
* Forwarding and POP/IMAP - click "Enable IMAP" and "Save Changes"
* Change to the "Accounts and Import" tab then "Add POP3 email account"
* Enter your POP3 account info

h3. Step 3: Setup Account in Mail

* In Mail open preferences (Cmd+,).
* Click Accounts
* Click the + in the lower-left corner
* Enter your gmail address (bill_lambier@gmail.com) and password

You can repeat step 3 on all your devices and you mail will be synchronized.  Plus you can log into the gmail web interface which is good too.  Simple hack, simple pleasures.

h3. Update: Sending Mail isn't quite as simple.

p. I tried configuring gmail to send email as though it were coming from the POP account.  It works from the gmail web interface but Mail sends from the gmail address.  To work around this I had to configure my gmail proxy account to send mail through the smtp:

  * Preferences -> Accounts -> Select gmail proxy account.
  * Outgoing Mail Server (SMTP): Click Edit SMTP Server List
  * Click + to add a new account.  Enter your SMTP information
  * choose it for this account.

p. Unfortunately these messages won't be stored at gmail... still looking for a way around this.  Probably overlooking something.