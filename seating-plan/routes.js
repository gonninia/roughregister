var http = require("http"),
    util = require("util"),
    fs = require("fs"),
    express = require("express"),
    formidable = require("formidable"),
    _ = require("underscore"),
    jade = require("jade");

var seating = require("./pdf/seating"),
    parseFields = require("./helpers").parseFields;

var log = function () {};

module.exports = function (app, mountPath) {
    var mountPathPublic = mountPath + "/public";

    app.get("/", function (req, res) {
        //res.send("hello");
        res.send(jade.compile(fs.readFileSync(__dirname + "/views/index.jade"))({
            mountPath: mountPath,
            mountPathPublic: mountPathPublic
        }));
    });

    app.post("/", function (req, res) {
        var form;
        res.header("Content-Type", "text/html");
        form = new formidable.IncomingForm();
        log("form post called");
        form.parse(req, function (err, fields, files) {
            log("form parsed");
            if (files.seatids.size === 0) {
                res.end(JSON.stringify({
                    error: "SeatIDs input file is empty."
                }));
            }
            parseFields(log, fields, function (errors, seatingPlan, settings) {
                var e;
                if (!errors) {
                    seating.generate(
                        log,
                        files.seatids.path,
                        __dirname + "/public/archive",
                        seatingPlan,
                        settings,
                        function (err, filenames) {
                            if (err) {
                                res.end(JSON.stringify({
                                    error: err.message
                                }));
                            } else {
                                res.end(JSON.stringify(filenames));
                            }
                        },
                        mountPathPublic
                    );
                } else {
                    log(errors);
                    res.end(JSON.stringify({
                        error: _.pluck(errors, "message").join("\n\t")
                    }));
                }
            });
        });
    });
};