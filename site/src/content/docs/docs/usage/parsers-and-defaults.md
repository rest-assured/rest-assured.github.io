---
title: "Parsers and defaults"
description: "Custom and default parsers, and default values for every request."
sidebar:
  order: 9
---

REST Assured providers predefined parsers for e.g. HTML, XML and JSON. But you can parse other kinds of content by registering a predefined parser for unsupported content-types by using:

```java
RestAssured.registerParser(<content-type>, <parser>);
```

E.g. to register that mime-type 'application/vnd.uoml+xml' should be parsed using the XML parser do:

```java
RestAssured.registerParser("application/vnd.uoml+xml", Parser.XML);
```

You can also unregister a parser using:

```java
RestAssured.unregisterParser("application/vnd.uoml+xml");
```

Parsers can also be specified per "request":

```java
get(..).then().using().parser("application/vnd.uoml+xml", Parser.XML). ..;
```

and using a [response specification](/docs/usage/specification-reuse/).

## Default parser

Sometimes it's useful to specify a default parser, e.g. if the response doesn't contain a content-type at all:

```java
RestAssured.defaultParser = Parser.JSON;
```

You can also specify a default parser for a single request:

```java
get("/x").then().using().defaultParser(Parser.JSON). ..
```

or using a [response specification](/docs/usage/specification-reuse/).

## Default values

By default REST assured assumes host localhost and port 8080 when doing a request. If you want a different port you can do:

```java
given().port(80). ..
```

or simply:

```java
..when().get("http://myhost.org:80/doSomething");
```

You can also change the default base URI, base path, port and authentication scheme for all subsequent requests:

```java
RestAssured.baseURI = "http://myhost.org";
RestAssured.port = 80;
RestAssured.basePath = "/resource";
RestAssured.authentication = basic("username", "password");
RestAssured.rootPath = "x.y.z";
```

This means that a request like e.g. `get("/hello")` goes to: http://myhost.org:80/resource/hello with basic authentication credentials "username" and "password". See [rootPath](http://code.google.com/p/rest-assured/wiki/Usage#Root_path) for more info about setting the root paths. Other default values you can specify are:

```java
RestAssured.filters(..); // List of default filters
RestAssured.requestSpecification = .. // Default request specification
RestAssured.responseSpecification = .. // Default response specification
RestAssured.urlEncodingEnabled = .. // Specify if Rest Assured should URL encoding the parameters
RestAssured.defaultParser = .. // Specify a default parser for response bodies if no registered parser can handle data of the response content-type
RestAssured.registerParser(..) // Specify a parser for the given content-type
RestAssured.unregisterParser(..) // Unregister a parser for the given content-type
```

You can reset to the standard baseURI (localhost), basePath (empty), standard port (8080), standard root path (""), default authentication scheme (none) and url encoding enabled (true) using:

```java
RestAssured.reset();
```

`reset()` also unbinds the [client](/docs/usage/parallel-tests/) that `RestAssured.useClient(..)` bound to the current thread. Since it resets the static settings for every thread, use `RestAssured.resetClient()` to only unbind the client in a parallel suite.

These static defaults are shared by all threads. When tests run in parallel, set them once before the tests start (for example in a `@BeforeAll` method) and don't change them while requests are being made. Put values that differ between tests in the request specification instead, for example `given().baseUri(..).port(..)` or `given(spec)`, or, if tests that run in parallel need different defaults, give each test a client of its own, as [Parallel tests](/docs/usage/parallel-tests/) shows. Sending one request specification from many threads at once is safe, since REST Assured 7.0.0 sends a copy of it each time, but don't change one specification from several threads at once. Make sure that filters added with `RestAssured.filters(..)` are thread safe.
