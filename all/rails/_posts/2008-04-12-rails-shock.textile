---
layout: post
title: Rails Shock
---

h2. {{ page.title }}

p(publish_date). 12 Apr 2008

<p>I learned software development on the job.  The technology was all MS: ASP Classic and SQL Server.  I took a class on object oriented programming and along came .Net.  It was great.  I would attend training classes and it seemed nobody was interested in OO or elegance or writing short specific methods or Web Services.  They were interested in drag-and-drop.  I knew more .Net than my teachers.</p>

<p>I got a job somewhere else.  Business automation and reporting using ASP.Net.  Life was good.  Life quality at work slowly deteriorated over the years.  The code base got bigger, the staff remained the same, simple changes were a thing of the past: every change broke something else.  Then my eyes were opened to something called Unit Testing and Test Driven Development.  This stuff rocks! There was hope... NUnit would save us because we'd catch the bugs sooner. But how?  We can't test the button click event that sends the exec SQL to the database...  the TableAdapter classes are, for all intents and purposes, attached to the database.  We can't test that stuff... Here's how: you learn something called <a href="http://www.codeproject.com/KB/architecture/NHibernateBestPractices.aspx">MVP (Model View Presenter) and NHibernate.</a>  If I remember correctly if you want a web page to display something simple... let's say a blog post.  Here is what you do:</p>

<ul>
<li><p>You'll need to establish separate projects as discussed in Martin Fowler's best practice article (link above).  .Core, .Web, .Presenters, .Data, .Tests, and a few others.  I found that in practice I ended up creating .Core, .Core.PersistenceTests, .Core.Tests, .Data, .Facade, .Presenters, .WebServices, .WebServices.Tests, .Utils, and a ConsoleApp (for WebService integration tests).</p>

<pre><code>  Then you can start coding!
</code></pre></li>
<li><p>Write the tests for the Model (the Blog business object) while you develop the properties of the blog post (ID,Title,BodyText,DatePosted)</p></li>
<li>Write a data access interface as well as a data access interface factory</li>

<li>You'll need to write an implementation for each of those interfaces.  Lucky for us we can use generics so it's not a ton of code to write.</li>
<li>Don't forget to write your persistence tests - and be sure to wrap each test in a transaction (SetUp and TearDown) and roll it back because you don't want to change the state of the database.  I never found a good way to write rigorous persistence tests because of the database dependancy so basically they were just to make sure the fields were mapped.</li>
<li>Make your persistence tests pass by writing the NHibernate XML file that maps the relational database to your business object.</li>
<li>Now you can start writing your presenter class with the tests that go along with it.  </li>
<li>Once that is in place you can spend a lot of time wiring up the properties of your view to the presenter and actually build your UI.</li>
<li>Manually test your UI.</li>
</ul>

<p>This was the only hope for writing large code bases.  I learned this and felt like I had mastered it all.  I had found an established pattern for software creation and I just needed to follow it in order to have success.</p>

<h4>Along came Ruby...</h4>

<p>Ruby on Rails is a full stack web application framework which is said to be "A bunch of stuff that makes developers happy."  "Rails" is the web framework part and "Ruby" is the programming language.  To a .Net guy Ruby is like a magician of a language.  You can tell it to do things that you wouldn't even dream of considering to think about wondering about with regard to other languages.  I didn't learn software development by hacking perl or python or bash or ... any other *nix type technology.  When you only know one technology, only one technology exists.</p>

<p>In Ruby on Rails you don't really do any of the above.  When you learn this you don't know how it can be possible and you don't know what to do. You were standing on a solid balcony of software development and it slid out from under you - you have to cling to the bricks that are jutting out of the wall to keep from falling.  Everything I "needed" to know about writing software was now rendered unnecessary.  I'm starting over.</p>

<p>In Rails you don't think "I want the app to do X. I will write the code to do X."  Instead you need to start thinking something like this "I want the app to do X. What existing function or plugin already does this? I shall look for it."</p>

<p>It's a huge paradigm shift but as I realize these things I get better at finding solutions.  It is a very fun journey - and I have only just begun.</p>
