/*
    # Instructions

    1. This exercise calls for you to write some async flow-control code. To start off with, you'll use callbacks only.

    2. Expected behavior:
        - Request all 3 files at the same time (in "parallel").
        - Render them ASAP (don't just blindly wait for all to finish loading)
        - BUT, render them in proper (obvious) order: "file1", "file2", "file3".
        - After all 3 are done, output "Complete!".
*/

function fakeAjax(url, cb) {
    var fake_responses = {
        "file1": "The first file",
        "file2": "The middle file",
        "file3": "The last file",
    }

    var randomDelay = (Math.round(Math.random() * 1E4) % 1000) + 1000;

    console.log("Requesting: " + url);

    setTimeout(function () {
        cb(fake_responses[url]);
    }, randomDelay);
}

function output(text) {
    console.log(text);
}

// ===================================

function getFile(url) {
    fakeAjax(url, function result(text) {
        requestReceived(url, text);
    });
}

function requestReceived(url, text) {
    var files = ["file1", "file2", "file3"];

    if (!responses[url]) {
        responses[url] = text;
    }

    for (let i = 0; i < files.length; i++) {
        if (files[i] in responses) {
            if (responses[files[i]] != true) {
                output(responses[files[i]]);
                responses[files[i]] = true;
            }
        } else {
            return;
        }
    }

    output("Complete!");
}

var responses = {};

// request all files at once in "parallel"
getFile("file1");
getFile("file2");
getFile("file3");
