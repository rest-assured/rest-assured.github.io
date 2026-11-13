---
title: "Logging"
description: "Log requests and responses, always or when a check fails."
sidebar:
  order: 13
---

In many cases it can be useful to print the response and/or request details in order to help you create the correct expectations and send the correct requests. To do help you do this you can use one of the predefined [filters](/docs/usage/filters/) supplied with REST Assured or you can use one of the shortcuts.

## Request Logging

Since version 1.5 REST Assured supports logging the _[request specification](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/specification/RequestSpecification.html)_ before it's sent to the server using the [RequestLoggingFilter](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/log/RequestLoggingFilter.html). Note that the HTTP Builder and HTTP Client may add additional headers then what's printed in the log. The filter will _only_ log details specified in the request specification. I.e. you can NOT regard the details logged by the [RequestLoggingFilter](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/filter/log/RequestLoggingFilter.html) to be what's actually sent to the server. Also subsequent filters may alter the request _after_ the logging has taken place. If you need to log what's _actually_ sent on the wire refer to the [HTTP Client logging docs](http://hc.apache.org/httpcomponents-client-ga/logging.html) or use an external tool such [Wireshark](http://www.wireshark.org/). Examples:

```java
given().log().all(). .. // Log all request specification details including parameters, headers and body
given().log().params(). .. // Log only the parameters of the request
given().log().body(). .. // Log only the request body
given().log().headers(). .. // Log only the request headers
given().log().cookies(). .. // Log only the request cookies
given().log().method(). .. // Log only the request method
given().log().path(). .. // Log only the request path
```

## Response Logging

If you want to print the response body regardless of the status code you can do:

```java
get("/x").then().log().body() ..
```

This will print the response body regardless if an error occurred. If you're only interested in printing the response body if an error occur then you can use:

```java
get("/x").then().log().ifError(). .. 
```

You can also log all details in the response including status line, headers and cookies:

```java
get("/x").then().log().all(). .. 
```

as well as only status line, headers or cookies:

```java
get("/x").then().log().statusLine(). .. // Only log the status line
get("/x").then().log().headers(). .. // Only log the response headers
get("/x").then().log().cookies(). .. // Only log the response cookies
```

You can also configure to log the response only if the status code matches some value:

```java
get("/x").then().log().ifStatusCodeIsEqualTo(302). .. // Only log if the status code is equal to 302
get("/x").then().log().ifStatusCodeMatches(matcher). .. // Only log if the status code matches the supplied Hamcrest matcher
```

## Log if validation fails

Since REST Assured 2.3.1 you can log the request or response only if the validation fails. To log the request do:

```java
given().log().ifValidationFails(). ..
```

To log the response do:

```java
.. .then().log().ifValidationFails(). ..
```

It's also possible to enable this for both the request and the response at the same time using the [LogConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/LogConfig.html):

```java
given().config(RestAssured.config().logConfig(logConfig().enableLoggingOfRequestAndResponseIfValidationFails(HEADERS))). ..
```

This will log only the headers if validation fails.

There's also a shortcut for enabling logging of the request and response for all requests if validation fails:

```java
RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
```

As of version 4.5.0 you can also use the `onFailMessage` to specify a message that'll been shown when a test fails. For example:

```java
when().
      get().
then().
      onFailMessage("Some specific message").
      statusCode(200);
```

Now "Some specific message" will be shown in the error message. This is good if you want to e.g. distinguish more easily between tests if they fail.

## Blacklist Headers from Logging

As of REST Assured 4.2.0 it's possible to blacklist headers so that they are not shown in the request or response log. Instead the header value will be replaced with `[ BLACKLISTED ]`. You can enable this per header basis using the [LogConfig](https://www.javadoc.io/doc/io.rest-assured/rest-assured/latest/io/restassured/config/LogConfig.html):

```java
given().config(config().logConfig(logConfig().blacklistHeader("Accept"))). ..
```

The response log will the print:

    Request method:   GET
    Request URI:    http://localhost:8080/something
    Proxy:          <none>
    Request params: <none>
    Query params:   <none>
    Form params:    <none>
    Path params:    <none>
    Headers:        Accept=[ BLACKLISTED ]
    Cookies:        <none>
    Multiparts:     <none>
    Body:           <none>

The logging filter of `log()`, as in `given().log().headers()`, and of `RequestSpecBuilder.log(..)`, takes the blacklisted headers, the print stream, the URL encoding of the request URI and pretty printing from the config of the request when it logs. So a blacklist in `RestAssured.config`, in the config of a [client](/docs/usage/parallel-tests/#restassuredclient), or set with `given().config(..)` after `log()`, applies. Pretty printing that you give explicitly, as in `log().body(false)`, still wins. Before REST Assured 7.0.0, `log()` took these settings from the config as it was when `log()` was called.

The response log hides the blacklisted headers too, whichever way you log it: `then().log()`, `expect().log()`, `ResponseSpecBuilder.log(..)`, [logging if validation fails](/docs/usage/logging/#log-if-validation-fails), the response logs of form authentication and CSRF, and a `ResponseLoggingFilter` or `ErrorLoggingFilter` that you create without blacklisted headers. They take the blacklist from the config of the request when they log. Before REST Assured 7.0.0, only `then().log()` hid them in the response log. Blacklisted headers that you give to the constructor of a logging filter are matched ignoring case, like those of `blacklistHeader(..)`, so they're hidden also when the HTTP client gives the header names in lower case, as the JDK client does.

To hide `Authorization`, `Proxy-Authorization` and `Cookie`, use `logConfig().blacklistDefaultSensitiveHeaders()`.
