
var request = require("supertest");
var ponte = require("../");
var mqtt = require("mqtt");

describe("Ponte as a REST API", function() {

  var settings;
  var instance;

  beforeEach(function(done) {
    settings = ponteSettings();
    instance = ponte(settings, done);
  });

  afterEach(function(done) {
    instance.close(done);
  });

  it("should GET an unknown topic and return a 404", function(done) {
    request(instance.rest.http)
      .get("/topics/hello")
      .expect(404, done);
  });

  it("should PUT a topic and return a 204", function(done) {
    request(instance.rest.http)
      .put("/topics/hello")
      .send("hello world")
      .expect(204, done);
  });

  it("should PUT and GET a topic and its payload", function(done) {
    request(instance.rest.http)
      .put("/topics/hello")
      .set("content-type", "text/plain")
      .send("hello world")
      .expect(204, function() {
        request(instance.rest.http)
          .get("/topics/hello")
          .expect(200, "hello world", done);
      });
  });

  it("should publish a value to MQTT after PUT", function(done) {
    mqtt.createClient(settings.mqtt.port)

      .subscribe("hello", function() {
        request(instance.rest.http)
          .put("/topics/hello")
          .send("world")
          .end(function(err) {
            if (err) {
              done(err);
            }
          });
      })

      .on("message", function(topic, payload) {
        expect(topic).to.eql("hello");
        expect(payload).to.eql("world");
        done();
      });
  });
});
