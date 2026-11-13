---
title: "Specifying request data"
description: "Parameters, headers, cookies, content type and body of a request."
sidebar:
  order: 4
---

Besides specifying request parameters you can also specify headers, cookies, body and content type.

## Invoking HTTP resources

You typically perform a request by calling any of the "HTTP methods" in the [request specification](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/specification/RequestSpecification.html). For example:

```java
when().get("/x"). ..;
```

Where `get` is the HTTP request method.

You can use any HTTP verb with your request by making use of the [request](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/specification/RequestSpecification.html#request-java.lang.String-java.lang.String-) method.

```java
when().
       request("CONNECT", "/somewhere").
then().
       statusCode(200);
```

This will send a "connect" request to the server.

REST Assured 6.1.0 also supports the [HTTP QUERY method](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/). QUERY works like GET, but the query goes in the request body. That's useful when the query is too large or too structured for the URL:

```java
given().
        contentType(ContentType.JSON).
        body(Map.of("status", "active", "limit", 10)).
when().
        query("/accounts/search").
then().
        statusCode(200).
        body("size()", is(10));
```

`query(..)` takes the same arguments as `get(..)` and `post(..)`, including path parameters, and it is also available in the Spring MockMvc and WebTestClient modules. As with POST, REST Assured doesn't automatically follow a 301, 302, 307 or 308 redirect for a QUERY request. A 303 redirect is followed with a GET, as the specification describes.

## Parameters

Normally you specify parameters like this:

```java
given().
       param("param1", "value1").
       param("param2", "value2").
when().
       get("/something");
```

REST Assured will automatically try to determine which parameter type (i.e. query or form parameter) based on the HTTP method. In case of GET query parameters will automatically be used and in case of POST form parameters will be used. In some cases it's however important to separate between form and query parameters in a PUT or POST. You can then do like this:

```java
given().
       formParam("formParamName", "value1").
       queryParam("queryParamName", "value2").
when().
       post("/something");
```

Parameters can also be set directly on the url:

```java
..when().get("/name?firstName=John&lastName=Doe");
```

For multi-part parameters please refer to the [Multi-part form data](/docs/usage/multi-part/) section.

### Parameter values that aren't strings

REST Assured turns every parameter value into a string before it sends the request. Strings, numbers, booleans, enums, `UUID`s and similar simple types are sent using `toString()`. As of REST Assured 6.1.0, all `java.time` values are sent the same way, so you get ISO-8601 dates and times in the URL:

```java
given().
        pathParam("date", LocalDate.of(2024, 4, 10)).
        queryParam("since", Instant.parse("2024-04-10T10:15:30Z")).
when().
        get("/reports/{date}");
```

This sends `GET /reports/2024-04-10?since=2024-04-10T10%3A15%3A30Z`.

Any other object is serialized with the configured object mapper, such as Jackson, before it's sent. That lets you send a whole object as a JSON query parameter if your API expects one. If the object serializes to a plain JSON string, REST Assured drops the surrounding quotes. A typical case is a value object with a `@JsonValue` accessor:

```java
record UserId(UUID uuid) {
    @JsonValue
    public String toString() {
        return uuid.toString();
    }
}

given().
        pathParam("userId", new UserId(uuid)).
when().
        get("/users/{userId}");
```

This sends `/users/c2a5a7c4-587a-4f13-94f9-084ebfac5302`, not `/users/%22c2a5a7c4-...%22`. The same applies to header and cookie values. A `String` you pass yourself is always sent exactly as written, so a quoted ETag such as `header("If-None-Match", "\"abc\"")` keeps its quotes.

### Multi-value parameter

Multi-value parameters are parameters with more then one value per parameter name (i.e. a list of values per name). You can specify these either by using var-args:

```java
given().param("myList", "value1", "value2"). .. 
```

or using a list:

```java
List<String> values = new ArrayList<String>();
values.add("value1");
values.add("value2");

given().param("myList", values). .. 
```

### No-value parameter

You can also specify a query, request or form parameter without a value at all:

```java
given().param("paramName"). ..
```

### Path parameters

You can also specify so called path parameters in your request, e.g.

```java
post("/reserve/{hotelId}/{roomNumber}", "My Hotel", 23);
```

These kinds of path parameters are referred to "unnamed path parameters" in REST Assured since they are index based (`hotelId` will be equal to "My Hotel" since it's the first placeholder).

You can also use named path parameters:

```java
given().
        pathParam("hotelId", "My Hotel").
        pathParam("roomNumber", 23).
when(). 
        post("/reserve/{hotelId}/{roomNumber}").
then().
         ..
```

Path parameters makes it easier to read the request path as well as enabling the request path to easily be re-usable in many tests with different parameter values.

You can mix unnamed and named path parameters:

```java
given().
        pathParam("hotelId", "My Hotel").        
when(). 
        post("/reserve/{hotelId}/{roomNumber}", 23).
then().
         ..
```

Here `roomNumber` will be replaced with `23`.

Note that specifying too few or too many parameters will result in an error message. For advanced use cases you can add, change, remove (even redundant path parameters) from a [filter](/docs/usage/filters/).

## Cookies

In its simplest form you specify cookies like this:

```java
given().cookie("username", "John").when().get("/cookie").then().body(equalTo("username"));
```

You can also specify a multi-value cookie like this:

```java
given().cookie("cookieName", "value1", "value2"). ..
```

This will create _two_ cookies, `cookieName=value1` and `cookieName=value2`.

You can also specify a detailed cookie using:

```java
Cookie someCookie = new Cookie.Builder("some_cookie", "some_value").setSecured(true).setComment("some comment").build();
given().cookie(someCookie).when().get("/cookie").then().assertThat().body(equalTo("x"));
```

or several detailed cookies at the same time:

```java
Cookie cookie1 = Cookie.Builder("username", "John").setComment("comment 1").build();
Cookie cookie2 = Cookie.Builder("token", 1234).setComment("comment 2").build();
Cookies cookies = new Cookies(cookie1, cookie2);
given().cookies(cookies).when().get("/cookie").then().body(equalTo("username, token"));
```

## Headers

```java
given().header("MyHeader", "Something").and(). ..
given().headers("MyHeader", "Something", "MyOtherHeader", "SomethingElse").and(). ..
```

You can also specify a multi-value headers like this:

```java
given().header("headerName", "value1", "value2"). ..
```

This will create _two_ headers, `headerName: value1` and `headerName: value2`.

#### Header merging/overwriting

By default headers are merged. So for example if you do like this:

```java
given().header("x", "1").header("x", "2"). ..
```

The request will contain two headers, "x: 1" and "x: 2". You can change in this on a per header basis in the [HeaderConfig](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/HeaderConfig.html). For example:

```java
given().
        config(RestAssuredConfig.config().headerConfig(headerConfig().overwriteHeadersWithName("x"))).
        header("x", "1").
        header("x", "2").
when().
        get("/something").
...
```

This means that only one header, "x: 2", is sent to server.

## Content type

```java
given().contentType(ContentType.TEXT). ..
given().contentType("application/json"). ..
```

You can also instruct Rest Assured to don't include any (default) content-type at all:

```java
given().noContentType(). ..
```

With `noContentType()` no Content-Type header is sent, also for a binary body or when an expected response content type is set. A `String` body or form parameters are sent as text in the default content charset (see [Encoder Config](/docs/usage/configuration/#encoder-config)). Before REST Assured 6.2.0 a binary body got `Content-Type: */*`, and a `String` body failed unless an expected response content type was set.

## Request body

```java
given().body("some body"). .. // Works for POST, PUT and DELETE requests
given().request().body("some body"). .. // More explicit (optional)
```

```java
given().body(new byte[]{42}). .. // Works for POST, PUT and DELETE
given().request().body(new byte[]{42}). .. // More explicit (optional)
```

You can also serialize a Java object to JSON or XML. See [serialization](/docs/usage/object-mapping/#serialization) for details.
