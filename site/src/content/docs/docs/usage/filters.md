---
title: "Filters"
description: "Inspect and change requests and responses with filters."
sidebar:
  order: 12
---

A filter allows you to inspect and alter a request before it's actually committed and also inspect and [alter](/docs/usage/filters/#response-builder) the response before it's returned to the expectations. You can regard it as an "around advice" in AOP terms. Filters can be used to implement custom authentication schemes, session management, logging etc. To create a filter you need to implement the [io.restassured.filter.Filter](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/Filter.html) interface. To use a filter you can do:

```java
given().filter(new MyFilter()). ..
```

There are a couple of filters provided by REST Assured that are ready to use:

  1. `io.restassured.filter.log.RequestLoggingFilter`: A filter that'll print the request specification details.
  1. `io.restassured.filter.log.ResponseLoggingFilter`: A filter that'll print the response details if the response matches a given status code.
  1. `io.restassured.filter.log.ErrorLoggingFilter`: A filter that'll print the response body if an error occurred (status code is between 400 and 500).

A logging filter created without a pretty-print argument, such as `new ResponseLoggingFilter()` or `new RequestLoggingFilter(LogDetail.BODY, stream)`, pretty prints the body if the log config of the request has pretty printing enabled (`logConfig().enablePrettyPrinting(..)`, enabled by default) when it logs. That's the log config of `given().config(..)`, of the [client](/docs/usage/parallel-tests/#restassuredclient) of the request, or `RestAssured.config`. Before REST Assured 7.0.0, `ResponseLoggingFilter` and `ErrorLoggingFilter` took the setting of `RestAssured.config` when they were created, and `RequestLoggingFilter` always pretty printed.

## Ordered Filters

As of REST Assured 3.0.2 you can implement the [io.restassured.filter.OrderedFilter](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/OrderedFilter.html) interface if you need to control the filter ordering. Here you implement the `getOrder` method to return an integer representing the precedence of the filter. A lower value gives higher precedence. The highest precedence you can define is `Integer.MIN_VALUE` and the lowest precedence is `Integer.MAX_VALUE`. Filters not implementing [io.restassured.filter.OrderedFilter](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/OrderedFilter.html) will have a default precedence of `1000`. Click [here](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/OrderedFilterITest.java) for some examples.

## Response Builder

If you need to change the [Response](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/response/Response.html) from a filter you can use the [ResponseBuilder](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/builder/ResponseBuilder.html) to create a new Response based on the original response. For example if you want to change the body of the original response to something else you can do:

```java
Response newResponse = new ResponseBuilder().clone(originalResponse).setBody("Something").build();
```
