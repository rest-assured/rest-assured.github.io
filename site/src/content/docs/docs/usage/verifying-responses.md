---
title: "Verifying response data"
description: "Check the body, status, headers, cookies and response time."
sidebar:
  order: 5
---

You can also verify status code, status line, cookies, headers, content type and body.

## Response Body

See Usage examples, e.g. [JSON](/docs/usage/examples/#example-1---json) or [XML](/docs/usage/examples/#example-2---xml).

You can also map a response body to a Java Object, click [here](/docs/usage/object-mapping/#deserialization) for details.

## Cookies

```java
get("/x").then().assertThat().cookie("cookieName", "cookieValue"). ..
get("/x").then().assertThat().cookies("cookieName1", "cookieValue1", "cookieName2", "cookieValue2"). ..
get("/x").then().assertThat().cookies("cookieName1", "cookieValue1", "cookieName2", containsString("Value2")). ..
```

To check only that a cookie is there, whatever its value, leave out the value:

```java
get("/x").then().assertThat().cookie("session"). ..
```

### Cookie attributes

A cookie is more than a name and a value. A session cookie should usually be `Secure` and `HttpOnly`, and maybe have a `SameSite` setting and an expiry. Those attributes are easy to break without anyone noticing, so they're worth a test. Use `detailedCookie()` and list what you expect:

```java
get("/login").then().assertThat().cookie("session", detailedCookie().
        value("abc123").
        path("/").
        secured(true).
        httpOnly(true).
        sameSite("Lax").
        maxAge(3600));
```

You only list the attributes you care about. Each one also takes a Hamcrest matcher, for example `value(not(emptyString()))` when the value is random or `expiryDate(greaterThan(new Date()))`. The other attributes are `domain`, `comment` and `version`. `detailedCookie()` is statically imported from `io.restassured.matcher.RestAssuredMatchers`.

If an attribute doesn't match, the failure message ends with the one that was off, such as `property 'secured' was <true>`.

To read the attributes instead of checking them, see [Detailed Cookies](/docs/usage/response-data/#detailed-cookies).

## Status

```java
get("/x").then().assertThat().statusCode(200). ..
get("/x").then().assertThat().statusLine("something"). ..
get("/x").then().assertThat().statusLine(containsString("some")). ..
```

## Headers

```java
get("/x").then().assertThat().header("headerName", "headerValue"). ..
get("/x").then().assertThat().headers("headerName1", "headerValue1", "headerName2", "headerValue2"). ..
get("/x").then().assertThat().headers("headerName1", "headerValue1", "headerName2", containsString("Value2")). ..
```

It's also possible to use a mapping function when validating headers. For example let's say you want to validate that the `Content-Length` header is less than 1000. You can then use a mapping function to first convert the header value to an int and then use an `Integer` before validating it with a Hamcrest matcher:

```java
get("/something").then().assertThat().header("Content-Length", Integer::parseInt, lessThan(1000));
```

## Content-Type

```java
get("/x").then().assertThat().contentType(ContentType.JSON). ..
```

## Full body/content matching

```java
get("/x").then().assertThat().body(equalTo("something")). ..
```

## Use the response to verify other parts of the response

You can use data from the response to verify another part of the response. For example consider the following JSON document returned from service x:

```javascript
{ "userId" : "some-id", "href" : "http://localhost:8080/some-id" }
```

You may notice that the "href" attribute ends with the value of the "userId" attribute. If we want to verify this we can implement a `io.restassured.matcher.ResponseAwareMatcher` and use it like this:

```java
get("/x").then().body("href", new ResponseAwareMatcher<Response>() {
                                  public Matcher<?> matcher(Response response) {
                                          return equalTo("http://localhost:8080/" + response.path("userId"));
                                  }
                       });
```

If you're using Java 8 you can use a lambda expression instead:

```java
get("/x").then().body("href", response -> equalTo("http://localhost:8080/" + response.path("userId"));
```

There are some predefined matchers that you can use defined in the `io.restassured.matcher.RestAssuredMatchers` (or `io.restassured.module.mockmvc.matcher.RestAssuredMockMvcMatchers` if using the spring-mock-mvc module). For example:

```java
get("/x").then().body("href", endsWithPath("userId"));
```

There are a few of these, and they all take a path to another value in the same response:

| Matcher | Passes when the value |
|---|---|
| `equalToPath("playerId")` | is equal to the value at `playerId` |
| `startsWithPath("baseUri")` | starts with the value at `baseUri` |
| `endsWithPath("userId")` | ends with the value at `userId` |
| `containsPath("userId")` | contains the value at `userId` |

So for a response like `{ "userId" : "my-id", "playerId" : "my-id" }`, you check that the two ids are the same without writing the id in your test:

```java
get("/x").then().body("userId", equalToPath("playerId"));
```

`ResponseAwareMatchers` can also be composed, either with another `ResponseAwareMatcher` or with a Hamcrest Matcher. For example:

```java
get("/x").then().body("href", and(startsWith("http:/localhost:8080/"), endsWithPath("userId")));
```

There's an `or` too, for when either one is fine:

```java
get("/x").then().body("owner", or(equalTo("admin"), equalToPath("userId")));
```

The `and` and `or` methods are statically imported from `io.restassured.matcher.ResponseAwareMatcherComposer`.

You can use a `ResponseAwareMatcher` for headers too. For example, to check that the `Location` header of a newly created resource ends with the id in the response body:

```java
post("/users").then().header("Location", response -> endsWith("/users/" + response.path("id")));
```

As of REST Assured 6.1.0 the same works in a reusable response specification:

```java
ResponseSpecification created = new ResponseSpecBuilder().
        expectStatusCode(201).
        expectHeader("Location", response -> endsWith("/users/" + response.path("id"))).
        build();

post("/users").then().spec(created);
```

## Measuring Response Time

As of version 2.8.0 REST Assured has support measuring response time. For example:

```java
long timeInMs = get("/lotto").time()
```

or using a specific time unit:

```java
long timeInSeconds = get("/lotto").timeIn(SECONDS);
```

where `SECONDS` is just a standard `TimeUnit`. You can also validate it using the validation DSL:

```java
when().
      get("/lotto").
then().
      time(lessThan(2000L)); // Milliseconds
```

or

```java
when().
      get("/lotto").
then().
      time(lessThan(2L), SECONDS);
```

Please note that response time measurement should be performed when the JVM is hot! (i.e. running a response time measurement when only running a single test will yield erroneous results). Also note that you can only vaguely regard these measurments to correlate with the server request processing time (since the response time will include the HTTP round trip and REST Assured processing time among other things).
