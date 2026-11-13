---
title: "Filters"
description: "Inspect and change requests and responses with filters."
sidebar:
  order: 12
---

A filter allows you to inspect and alter a request before it's actually committed and also inspect and [alter](/docs/usage/filters/#response-builder) the response before it's returned to the expectations. You can regard it as an "around advice" in AOP terms. Filters can be used to implement custom authentication schemes, session management, logging etc. To create a filter you need to implement the [io.restassured.filter.Filter](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/Filter.html) interface. To use a filter you can do:

```java
given().filter(new MyFilter()). ..
```

There are a couple of filters provided by REST Assured that are ready to use:

  1. `io.restassured.filter.log.RequestLoggingFilter`: A filter that'll print the request specification details.
  1. `io.restassured.filter.log.ResponseLoggingFilter`: A filter that'll print the response details if the response matches a given status code.
  1. `io.restassured.filter.log.ErrorLoggingFilter`: A filter that'll print the response body if an error occurred (status code is between 400 and 500).

A logging filter created without a pretty-print argument, such as `new ResponseLoggingFilter()` or `new RequestLoggingFilter(LogDetail.BODY, stream)`, pretty prints the body if the log config of the request has pretty printing enabled (`logConfig().enablePrettyPrinting(..)`, enabled by default) when it logs. That's the log config of `given().config(..)`, of the [client](/docs/usage/parallel-tests/#restassuredclient) of the request, or `RestAssured.config`. Before REST Assured 7.0.0, `ResponseLoggingFilter` and `ErrorLoggingFilter` took the setting of `RestAssured.config` when they were created, and `RequestLoggingFilter` always pretty printed.

## Custom filters

A filter gets the request before it's sent, passes it on with `ctx.next(..)`, and gets the response back. Here's one that adds a trace id to every request and prints what happened, which is handy when you're hunting a flaky test in the server logs:

```java
Filter traceId = (requestSpec, responseSpec, ctx) -> {
    String id = UUID.randomUUID().toString();
    requestSpec.header("X-Trace-Id", id);

    Response response = ctx.next(requestSpec, responseSpec); // sends the request

    System.out.println(id + ": " + requestSpec.getMethod() + " " + requestSpec.getURI() + " -> " + response.statusCode());
    return response;
};

given().filter(traceId). ..
```

Anything you change on `requestSpec` before `ctx.next(..)` goes into the request. Whatever you return is what your `then()` checks, so to change the response, return a new one built with the [Response Builder](/docs/usage/filters/#response-builder).

## Global filters

To use a filter in every test, add it once, for example in a `@BeforeAll` method:

```java
RestAssured.filters(traceId);
```

`RestAssured.replaceFiltersWith(..)` swaps out the ones you added before, and `RestAssured.reset()` removes them along with the rest of the static settings.

## Removing filters

Sometimes one request shouldn't go through the filters you set up for everything, for example a test that checks what happens without your authentication filter. Remove them for that request:

```java
given().noFilters(). ..                                // no filters at all
given().noFiltersOfType(RequestLoggingFilter.class). .. // all filters except the request logging
```

This only affects that request. The other tests still get the filters.

## Ordered filters

You can implement the [io.restassured.filter.OrderedFilter](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/OrderedFilter.html) interface if you need to control the filter ordering. Here you implement the `getOrder` method to return an integer representing the precedence of the filter. A lower value gives higher precedence. The highest precedence you can define is `Integer.MIN_VALUE` and the lowest precedence is `Integer.MAX_VALUE`. Filters not implementing [io.restassured.filter.OrderedFilter](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/OrderedFilter.html) will have a default precedence of `1000`. See [OrderedFilterITest](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/OrderedFilterITest.java) for examples.

## Response builder

If you need to change the [Response](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/response/Response.html) from a filter you can use the [ResponseBuilder](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/builder/ResponseBuilder.html) to create a new Response based on the original response. For example if you want to change the body of the original response to something else you can do:

```java
Response newResponse = new ResponseBuilder().clone(originalResponse).setBody("Something").build();
```
