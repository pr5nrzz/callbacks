/* Example1
// Part1
// A
ajax("..", function () {
    // C
});
// B

// Part2
// A
setTimeout(function () {
    // C
}, 1000);
// B
*/

/* Example2
// Part1
listen("click", function handler(evt) {
    setTimeout(function request() {
        ajax("http://some.url.1", function response(text) {
            if (text == "hello") {
                handler();
            }
            else if (text == "world") {
                request();
            }
        });
    }, 500);
});

// Part2
doA(function () {
    doB();

    doC(function () {
        doD();
    })

    doE();
});

doF();

// Part3
listen("click", handler);

function handler() {
    setTimeout(request, 500);
}

function request() {
    ajax("http://some.url.1", response);
}

function response(text) {
    if (text == "hello") {
        handler();
    }
    else if (text == "world") {
        request();
    }
}
*/

/* Example3
// Part1
// A
ajax("..", function () {
    // C
});
// B

// Part2
// Overly trusting of input:
function addNumbers(x, y) {
    // + is overloaded with coercion to also be
    // string concatenation, so this operation
    // isn't strictly safe depending on what's
    // passed in.
    return x + y;
}

addNumbers(21, 21);	// 42
addNumbers(21, "21"); // "2121"

// Defensive against untrusted input:
function addNumbers(x, y) {
    // ensure numerical input
    if (typeof x != "number" || typeof y != "number") {
        throw Error("Bad parameters");
    }

    // if we get here, + will safely do numeric addition
    return x + y;
}

addNumbers(21, 21);	// 42
addNumbers(21, "21");	// Error: "Bad parameters"

// Or perhaps still safe but friendlier:
function addNumbers(x, y) {
    // ensure numerical input
    x = Number(x);
    y = Number(y);

    // + will safely do numeric addition
    return x + y;
}

addNumbers(21, 21);	// 42
addNumbers(21, "21");	// 42
*/

/* Example4 */
// Part1
function success(data) {
    console.log(data);
}

function failure(err) {
    console.error(err);
}

ajax("http://some.url.1", success, failure);
// In APIs of this design, often the failure() error handler is optional, and if not provided it will be assumed you want the errors swallowed.
// Note: This split-callback design is what the ES6 Promise API uses.

// Part2
function response(err, data) {
    // error?
    if (err) {
        console.error(err);
    }
    // otherwise, assume success
    else {
        console.log(data);
    }
}

ajax("http://some.url.1", response);

// Part3
function timeoutify(fn, delay) {
    var intv = setTimeout(function () {
        intv = null;
        fn(new Error("Timeout!"));
    }, delay);

    return function () {
        // timeout hasn't happened yet?
        if (intv) {
            clearTimeout(intv);
            fn.apply(this, [null].concat([].slice.call(arguments)));
        }
    };
}

// use it:
// using "error-first style" callback design
function foo(err, data) {
    if (err) {
        console.error(err);
    }
    else {
        console.log(data);
    }
}

ajax("http://some.url.1", timeoutify(foo, 500));

// Part4
function result(data) {
    console.log(a);
}

var a = 0;

ajax("..pre-cached-url..", result);
a++;

// Part5
function asyncify(fn) {
    var orig_fn = fn,
        intv = setTimeout(function () {
            intv = null;
            if (fn) fn();
        }, 0);

    fn = null;

    return function () {
        // firing too quickly, before `intv` timer has fired to
        // indicate async turn has passed?
        if (intv) {
            fn = orig_fn.bind.apply(
                orig_fn,
                // add the wrapper's `this` to the `bind(..)`
                // call parameters, as well as currying any
                // passed in parameters
                [this].concat([].slice.call(arguments))
            );
        }
        // already async
        else {
            // invoke original function
            orig_fn.apply(this, arguments);
        }
    };
}

// use it:
function result(data) {
    console.log(a);
}

var a = 0;

ajax("..pre-cached-url..", asyncify(result));
a++;