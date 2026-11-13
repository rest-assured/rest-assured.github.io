---
title: "Specification re-use"
description: "Reuse request and response specifications across tests."
sidebar:
  order: 10
---

Instead of having to duplicate response expectations and/or request parameters for different tests you can re-use an entire specification. To do this you define a specification using either the [RequestSpecBuilder](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/builder/RequestSpecBuilder.html) or [ResponseSpecBuilder](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/builder/ResponseSpecBuilder.html).

E.g. let's say you want to make sure that the expected status code is 200 and that the size of the JSON array "x.y" has size 2 in several tests you can define a ResponseSpecBuilder like this:

```java
ResponseSpecBuilder builder = new ResponseSpecBuilder();
builder.expectStatusCode(200);
builder.expectBody("x.y.size()", is(2));
ResponseSpecification responseSpec = builder.build();

// Now you can re-use the "responseSpec" in many different tests:
when().
       get("/something").
then().
       spec(responseSpec).
       body("x.y.z", equalTo("something"));
```

In this example the data defined in "responseSpec" is merged with the additional body expectation and all expectations must be fulfilled in order for the test to pass.

You can do the same thing if you need to re-use request data in different tests. E.g.

```java
RequestSpecBuilder builder = new RequestSpecBuilder();
builder.addParam("parameter1", "parameterValue");
builder.addHeader("header1", "headerValue");
RequestSpecification requestSpec = builder.build();
  
given().
        spec(requestSpec).
        param("parameter2", "paramValue").
when().
        get("/something").
then().
        body("x.y.z", equalTo("something"));        
```

Here the request's data is merged with the data in the "requestSpec" so the request will contain two parameters ("parameter1" and "parameter2") and one header ("header1").

Merging only overwrites values that the merged specification sets itself. For example, `given().auth().oauth2("token").spec(requestSpec)` keeps the OAuth 2 token when `requestSpec` has no authentication. To remove the authentication with a specification, set it explicitly with `setAuth(new ExplicitNoAuthScheme())`. Before REST Assured 6.2.0 values such as the base URI, port and authentication were reset by a merge.

A header or cookie that the request already has with the same value isn't added again by a merge, and neither is the same multipart part or filter. So merging two specifications that both set the header `X: 1` sends it once. A header with the same name and another value is still added, and a header that the `HeaderConfig` [overwrites](/docs/usage/request-data/#header-mergingoverwriting), such as `Content-Type` or `Accept`, replaces the current one. Before REST Assured 7.0.0, equal headers and cookies were added again.

Merging a response specification only changes the expectations that it sets. For example, `expect().statusCode(200).spec(responseSpec)` still checks the status code when `responseSpec` expects none. Before REST Assured 7.0.0, merging cleared the status code, status line, content type, response time, root path, default parser and log detail that the merged specification didn't set. Body expectations defined without a root path take the root path in effect where they're merged, so with `then().rootPath("x").spec(responseSpec)`, the expectation `body("y.size()", ..)` of `responseSpec` checks `x.y.size()`.

## Specifications and the static settings

`RequestSpecBuilder` and `ResponseSpecBuilder` don't copy the static settings, such as `RestAssured.baseURI`, `port`, `config`, `filters(..)`, `requestSpecification`, `rootPath` or the registered parsers. A built specification holds only what you set on the builder. The static settings, or those of a [RestAssuredClient](/docs/usage/parallel-tests/#restassuredclient), are added when the specification is used, with `given(requestSpec)`, `given().spec(..)`, `expect().spec(..)` or `then().spec(..)`, as they are at that time, and what you set on the builder is applied on top. So the headers and cookies of `RestAssured.requestSpecification` are sent once with `given(requestSpec)`, and a change of `RestAssured.config` after the specification was built reaches the request. `SpecificationQuerier.query(requestSpec)` shows only what was set on the builder, for example the base URI `http://localhost` and no static headers or filters. Before REST Assured 7.0.0, the builders copied the static settings when they were created.

To keep a static setting in a specification, set it on the builder:

```java
RequestSpecification requestSpec = new RequestSpecBuilder().setConfig(RestAssured.config()).addParam("parameter1", "parameterValue").build();
ResponseSpecification responseSpec = new ResponseSpecBuilder().rootPath(RestAssured.rootPath).expectStatusCode(200).build();
```

Each config type that you configured in the config of a specification wins over that of `RestAssured.config`, or of the client, where the specification is used.

Some builder methods compute something right away, with the config of the builder: `setBody(..)` serializes the body (ObjectMapperConfig and EncoderConfig), `setSessionId(..)` takes the name of the session id cookie (SessionConfig), `addParam(..)`, `addQueryParam(..)` and `addFormParam(..)` take the update strategy (ParamConfig), `addMultiPart(..)` takes the default control name and file name (MultiPartConfig), and `addHeader(..)` takes which headers overwrite each other (HeaderConfig). The config of the builder is the default one unless you call `setConfig(..)`, and these aren't redone when the specification is used. If you changed one of these settings in `RestAssured.config`, call `setConfig(RestAssured.config())` before those methods:

```java
RestAssured.config = RestAssured.config().sessionConfig(sessionConfig().sessionIdName("phpsessionid"));

RequestSpecification requestSpec = new RequestSpecBuilder().setConfig(RestAssured.config()).setSessionId("1234").build(); // phpsessionid=1234
RequestSpecification other = new RequestSpecBuilder().setSessionId("1234").build(); // JSESSIONID=1234
```

`log(..)` on a builder is different: its logging filter takes its settings from the config of the request when it logs, see [Blacklist Headers from Logging](/docs/usage/logging/#blacklist-headers-from-logging).

A specification created by `RequestSpecBuilder.build()` or `ResponseSpecBuilder.build()` can't send a request by itself. Use `given(requestSpec)`, `given().spec(requestSpec)` or `given(requestSpec, responseSpec)` instead.

`given(requestSpec, responseSpec)` is the same as `given().spec(requestSpec).expect().spec(responseSpec)`: it merges both specifications into the static settings, or those of the client bound with `RestAssured.useClient(..)`, as they are when `given(..)` is called. So `RestAssured.responseSpecification` applies too. Before REST Assured 7.0.0, `given(requestSpec, responseSpec)` sent the specifications as they were built and ignored `RestAssured.responseSpecification`.

## Querying RequestSpecification

Sometimes it's useful to be able to query/extract values form a RequestSpecification. For this reason you can use the `io.restassured.specification.SpecificationQuerier`. For example:

```java
RequestSpecification spec = ...
QueryableRequestSpecification queryable = SpecificationQuerier.query(spec);
String headerValue = queryable.getHeaders().getValue("header");
String param = queryable.getFormParams().get("someparam");
```
