Continuations:
--------------
-> In Example1 (Part1), // A and // B represent the first half of the program (aka the now), and // C marks the second half of the program (aka the later). The first half executes right away, and then there’s a “pause” of indeterminate length. At some future moment, if the Ajax call completes, then the program will pick up where it left off, and continue with the second half.
-> In other words, the callback function wraps or encapsulates the continuation of the program.
-> In Part2, “Do A, setup the timeout for 1,000 milliseconds, then do B, then after the timeout fires, do C.”

Nested/Chained Callbacks:
-------------------------
-> In Exampl2 (Part1), this kind of code is often called “callback hell,” and sometimes also referred to as the “pyramid of doom” (for its sideways-facing triangular shape due to the nested indentation). But “callback hell” actually has almost nothing to do with the nesting/indentation. It’s a far deeper problem than that. 
-> First, we’re waiting for the “click” event, then we’re waiting for the timer to fire, then we’re waiting for the Ajax response to come back, at which point it might do it all again.
-> At first glance, this code may seem to map its asynchrony naturally to sequential brain planning.
    First (now), we:
    ----------------
        listen( "..", function handler(..){
            // ..
        } );

    Then later, we:
    ---------------
        setTimeout( function request(..){
            // ..
        }, 500) ;

    Then still later, we:
    ---------------------
        ajax( "..", function response(..){
            // ..
        } );

    And finally (most later), we:
    -----------------------------
        if ( .. ) {
            // ..
        }
        else ..
-> But there’s several problems with reasoning about this code linearly in such a fashion. First, it’s an accident of the example that our steps are on subsequent lines (1, 2, 3, and 4…). In real async JS programs, there’s often a lot more noise cluttering things up, noise that we have to deftly maneuver past in our brains as we jump from one function to the next. 
-> In Part2, the operations will happen in this order:
    . doA()
    . doF()
    . doB()
    . doC()
    . doE()
    . doD()
-> What if doA(..) or doD(..) aren’t actually async, the way we obviously assumed them to be? Uh oh, now the order is different. If they’re both sync (and maybe only sometimes, depending on the conditions of the program at the time), the order is now A => B => C => D => E => F. So, Is nesting the problem? Is that what makes it so hard to trace the async flow? That’s part of it, certainly.
-> In Part4, This formulation of the code is not hardly as recognizable as having the nesting/indentation woes of its previous form, and yet it’s every bit as susceptible to “callback hell.” Why?
-> As we go to linearly (sequentially) reason about this code, we have to skip from one function, to the next, to the next, and bounce all around the code base to “see” the sequence flow. And remember, this is simplified code in sort of best-case fashion. We all know that real async JS program code bases are often fantastically more jumbled, which makes such reasoning orders of magnitude more difficult.
-> Another thing to notice: to get steps 2, 3, and 4 linked together so they happen in succession, the only affordance callbacks alone gives us is to hardcode step 2 into step 1, step 3 into step 2, step 4 into step 3, and so on. The hardcoding isn’t necessarily a bad thing, if it really is a fixed condition that step 2 should always lead to step 3.
-> But the hardcoding definitely makes the code a bit more brittle, as it doesn’t account for anything going wrong that might cause a deviation in the progression of steps. For example, if step 2 fails, step 3 never gets reached, nor does step 2 retry, or move to an alternate error handling flow, and so on.
-> All of these issues are things you can manually hardcode into each step, but that code is often very repetitive and not reusable in other steps or in other async flows in your program.
-> Even though our brains might plan out a series of tasks in a sequential type of way (this, then this, then this), the evented nature of our brain operation makes recovery/retry/forking of flow control almost effortless. If you’re out running errands, and you realize you left a shopping list at home, it doesn’t end the day because you didn’t plan that ahead of time. Your brain routes around this hiccup easily: you go home, get the list, then head right back out to the store.
-> But the brittle nature of manually hardcoded callbacks (even with hardcoded error handling) is often far less graceful. Once you end up specifying (aka pre-planning) all the various eventualities/paths, the code becomes so convoluted that it’s hard to ever maintain or update it.
-> That is what “callback hell” is all about! The nesting/indentation are basically a side show, a red herring. And as if all that’s not enough, we haven’t even touched what happens when two or more chains of these callback continuations are happening simultaneously, or when the third step branches out into “parallel” callbacks with gates or latches.

Inversion of Control:
---------------------
-> In Example3 (Part1), // A and // B happen now, under the direct control of the main JS program. But // C gets deferred to happen later, and under the control of another party – in this case, the ajax(..) function. In a basic sense, that sort of hand-off of control doesn’t regularly cause lots of problems for programs.
-> We call this “inversion of control,” when you take part of your program and give over control of its execution to another third party. There’s an unspoken “contract” that exists between your code and the third-party utility – a set of things you expect to be maintained.

    Hypothesis:
    -----------
    -> Imagine you’re a developer tasked with building out an ecommerce checkout system for a site that sells expensive TVs. You already have all the various pages of the checkout system built out just fine. On the last page, when the user clicks “confirm” to buy the TV, you need to call a third-party function (provided say by some analytics tracking company) so that the sale can be tracked.
    -> You notice that they’ve provided what looks like an async tracking utility, probably for the sake of performance best practices, which means you need to pass in a callback function. In this continuation that you pass in, you will have the final code that charges the customer’s credit card and displays the thank you page. This code might look like:
        analytics.trackPurchase( purchaseData, function(){
            chargeCreditCard();
            displayThankyouPage();
        } );
    -> Easy enough, right? You write the code, test it, everything works, and you deploy to production. Everyone’s happy! Six months go by and no issues. 
    -> Suddenly one morning, you find out that a high-profile customer has had his credit card charged five times for the same TV. After digging through some logs, you come to the conclusion that the only explanation is that the analytics utility somehow, for some reason, called your callback five times instead of once. Nothing in their documentation mentions anything about this.
    -> Apparently, the developers at the analytics company had been working on some experimental code that, under certain conditions, would retry the provided callback once per second, for five seconds, before failing with a timeout. They had never intended to push that into production, but somehow they did. 
    -> After some tinkering, you implement some simple ad hoc code like the following, which the team seems happy with:
        var tracked = false;
        analytics.trackPurchase( purchaseData, function(){
            if (!tracked) { // creating a latch to handle if there happen to be multiple concurrent invocations of our callback.
                tracked = true;
                chargeCreditCard();
                displayThankyouPage();
            }
        } );
    -> But then one of your QA engineers asks, “what happens if they never call the callback?” Oops. Neither of you had thought about that. You begin to chase down the rabbit hole, and think of all the possible things that could go wrong with them calling your callback. You’re probably slowly starting to realize that you’re going to have to invent an awful lot of ad hoc logic in each and every single callback that’s passed to a utility you’re not positive you can trust.
    -> Now you realize a bit more completely just how hellish “callback hell” is.

    Not Just Others’ Code:
    ----------------------
    -> Can you even really trust utilities that you do theoretically control (in your own code base)? most of us agree that at least to some extent we should build our own internal functions with some defensive checks on the input parameters, to reduce/prevent unexpected issues. Refer Part2.
    -> However you go about it, these sorts of checks/normalizations are fairly common on function inputs, even with code we theoretically entirely trust. In a crude sort of way, it’s like the programming equivalent of the geopolitical principle of “Trust But Verify.”
    -> So, doesn’t it stand to reason that we should do the same thing about composition of async function callbacks, not just with truly external code but even with code we know is generally “under our own control”? Of course we should.
    -> But callbacks don’t really offer anything to assist us. We have to construct all that machinery ourselves, and it often ends up being a lot of boilerplate/overhead that we repeat for every single async callback.
    -> The most troublesome problem with callbacks is inversion of control leading to a complete breakdown along all those trust lines.
    -> If you have code that uses callbacks, especially but not exclusively with third-party utilities, and you’re not already applying some sort of mitigation logic for all these inversion of control trust issues, your code has bugs in it right now even though they may not have bitten you yet. Latent bugs are still bugs.
    -> Hell indeed.

Trying to Save Callbacks:
-------------------------
-> There are several variations of callback design that have attempted to address some (not all!) of the trust issues we’ve just looked at. It’s a valiant, but doomed, effort to save the callback pattern from imploding on itself.
-> Regarding more graceful error handling, some API designs provide for split callbacks (one for the success notification, one for the error notification). Refer Example4 (Part1).
-> Another common callback pattern is called “error-first style” (sometimes called “Node style,” as it’s also the convention used across nearly all Node.js APIs), where the first argument of a single callback is reserved for an error object (if any). If success, this argument will be empty/falsy (and any subsequent arguments will be the success data), but if an error result is being signaled, the first argument is set/truthy (and usually nothing else is passed). Refer Part2.
-> In both of these cases, several things should be observed. First, it has not really resolved the majority of trust issues like it may appear. There’s nothing about either callback that prevents or filters unwanted repeated invocations. Moreover, things are worse now, because you may get both success and error signals, or neither, and you still have to code around either of those conditions.
-> Also, don’t miss the fact that while it’s a standard pattern you can employ, it’s definitely more verbose and boilerplate-ish without much reuse, so you’re going to get weary of typing all that out for every single callback in your application.
-> What about the trust issue of never being called? If this is a concern (and it probably should be!), you likely will need to set up a timeout that cancels the event. You could make a utility (proof-of-concept only shown) to help you with that. Refer Part3.
-> Another trust issue is being called “too early.” In application-specific terms, this may actually involve being called before some critical task is complete. But more generally, the problem is evident in utilities that can either invoke the callback you provide now (synchronously), or later (asynchronously).
-> This nondeterminism around the sync-or-async behavior is almost always going to lead to very difficult to track down bugs. In some circles, the fictional insanity-inducing monster named Zalgo is used to describe the sync/async nightmares. “Don’t release Zalgo!” is a common cry, and it leads to very sound advice: always invoke callbacks asynchronously, even if that’s “right away” on the next turn of the event loop, so that all callbacks are predictably async.
Note: For more information on Zalgo, see Isaac Z. Schlueter’s “Designing APIs for Asynchrony” (http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony).
-> In Part4, Will this code print 0 (sync callback invocation) or 1 (async callback invocation)? Depends… on the conditions. You can see just how quickly the unpredictability of Zalgo can threaten any JS program. So the silly-sounding “never release Zalgo” is actually incredibly common and solid advice. Always be asyncing.
-> What if you don’t know whether the API in question will always execute async? You could invent a utility like this asyncify(..) proof-of-concept. Refer Part5.
-> Whether the Ajax request is in the cache and resolves to try to call the callback right away, or must be fetched over the wire and thus complete later asynchronously, this code will always output 1 instead of 0 – result(..) cannot help but be invoked asynchronously, which means the a++ has a chance to run before result(..) does.
-> Yay, another trust issued “solved”! But it’s inefficient, and yet again more bloated boilerplate to weigh your project down. That’s just the story, over and over again, with callbacks. They can do pretty much anything you want, but you have to be willing to work hard to get it, and oftentimes this effort is much more than you can or should spend on such code reasoning.