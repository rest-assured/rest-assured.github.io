---
title: "Sessions"
description: "Keep a session across requests."
sidebar:
  order: 15
---

REST Assured provides a simplified way for managing sessions. You can define a session id value in the DSL:

```java
given().sessionId("1234"). .. 
```

This is actually just a short-cut for:

```java
given().cookie("JSESSIONID", "1234"). .. 
```

You can also specify a default `sessionId` that'll be supplied with all subsequent requests:

```java
RestAssured.sessionId = "1234";
```

The session id is applied by `RestAssured.config()`, not stored in the `RestAssured.config` field. If you pass the static config yourself and want the session id sent, use `given().config(RestAssured.config())` and not `given().config(RestAssured.config)`.

By default the session id name is `JSESSIONID` but you can change it using the [SessionConfig](/docs/usage/configuration/#session-config):

```java
RestAssured.config = RestAssured.config().sessionConfig(new SessionConfig().sessionIdName("phpsessionid"));
```

You can also specify a sessionId using the `RequestSpecBuilder` and reuse it in many tests:

```java
RequestSpecBuilder spec = new RequestSpecBuilder().setSessionId("value1").build();
   
// Make the first request with session id equal to value1
given().spec(spec). .. 
// Make the second request with session id equal to value1
given().spec(spec). .. 
```

The session id name of `setSessionId(..)` comes from the config of the builder, not from `RestAssured.config`. If you changed it there, call `setConfig(RestAssured.config())` before `setSessionId(..)`, see [Specifications and the static settings](/docs/usage/specification-reuse/#specifications-and-the-static-settings).

It's also possible to get the session id from the response object:

```java
String sessionId = get("/something").sessionId();
```

## Session Filter

As of version 2.0.0 you can use a [session filter](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/session/SessionFilter.html) to automatically capture and apply the session, for example:

```java
SessionFilter sessionFilter = new SessionFilter();

given().
          auth().form("John", "Doe").
          filter(sessionFilter).
when().
          get("/formAuth").
then().
          statusCode(200);


given().
          filter(sessionFilter). // Reuse the same session filter instance to automatically apply the session id from the previous response
when().
          get("/x").
then().
          statusCode(200);
```

To get session id caught by the `SessionFilter` you can do like this:

```java
String sessionId = sessionFilter.getSessionId();
```
