---
title: "Getting response data"
description: "Extract values, headers, cookies and status from a response."
sidebar:
  order: 3
---

You can also get the content of a response. E.g. let's say you want to return the body of a get request to "/lotto". You can get it a variety of different ways:

```java
InputStream stream = get("/lotto").asInputStream(); // Don't forget to close this one when you're done
byte[] byteArray = get("/lotto").asByteArray();
String json = get("/lotto").asString();
```

## Extracting values from the response after validation

You can extract values from the response or return the response instance itself after you've done validating the response by using the `extract` method. This is useful for example if you want to use values from the response in sequent requests. For example given that a resource called `title` returns the following JSON

```javascript
 {
     "title" : "My Title",
      "_links": {
              "self": { "href": "/title" },
              "next": { "href": "/title?page=2" }
           }
 }
```

and you want to validate that content type is equal to `JSON` and the title is equal to `My Title`
but you also want to extract the link to the `next` title to use that in a subsequent request. This is how:

```java
String nextTitleLink =
given().
        param("param_name", "param_value").
when().
        get("/title").
then().
        contentType(JSON).
        body("title", equalTo("My Title")).
extract().
        path("_links.next.href");

get(nextTitleLink). ..
```

You could also decide to instead return the entire response if you need to extract multiple values from the response:

```java
Response response = 
given().
        param("param_name", "param_value").
when().
        get("/title").
then().
        contentType(JSON).
        body("title", equalTo("My Title")).
extract().
        response(); 

String nextTitleLink = response.path("_links.next.href");
String headerValue = response.header("headerName");
```

## JSON (using JsonPath)

Once we have the response body we can then use the [JsonPath](https://static.javadoc.io/io.rest-assured/json-path-gpath/%REST_ASSURED_VERSION%/io/restassured/path/json/JsonPath.html) to get data from the response body:

```java
int lottoId = from(json).getInt("lotto.lottoId");
List<Integer> winnerIds = from(json).get("lotto.winners.winnerId");
```

Or a bit more efficiently:

```java
JsonPath jsonPath = new JsonPath(json).setRootPath("lotto");
int lottoId = jsonPath.getInt("lottoId");
List<Integer> winnerIds = jsonPath.get("winners.winnderId");
```

Note that you can use `JsonPath` standalone without depending on REST Assured, see [getting started guide](/docs/getting-started/) for more info on this.

### JsonPath configuration

You can configure object de-serializers etc for JsonPath by configuring it, for example:

```java
JsonPath jsonPath = new JsonPath(SOME_JSON).using(new JsonPathConfig("UTF-8"));
```

It's also possible to configure JsonPath statically so that all instances of JsonPath will shared the same configuration:

```java
JsonPath.config = new JsonPathConfig("UTF-8");
```

`JsonPath.config` is a standalone setting for the `JsonPath` instances you create, shared by all threads. It's never a setting of a request: the `jsonPath()` of a response, and the body expectations, use the config of the request, and a [RestAssuredClient](/docs/usage/parallel-tests/#restassuredclient) doesn't change `JsonPath.config`. To use another config for one `JsonPath`, use `using(..)` as above.

`getObject(..)` deserializes with the first of Jackson 3, Jackson 2, Gson, Johnzon and JSON-B (Yasson) on the classpath, like [object mapping](/docs/usage/object-mapping/), unless the config picks one. Before REST Assured 7.0.0, it tried Jackson 2 before Jackson 3. To pick Jackson 2:

```java
JsonPath.config = new JsonPathConfig().defaultParserType(JsonParserType.JACKSON_2);
```

The `jsonPath()` of a response deserializes with the object mapper type of the `ObjectMapperConfig` of the request, set with `defaultObjectMapperType(..)`, so `response.jsonPath().getObject(..)` and `response.as(..)` use the same mapper. `JAXB` and `JAKARTA_EE` only map XML, so with them `jsonPath()` picks from the classpath.

You can read more about JsonPath at [this blog](http://www.jayway.com/2013/04/12/whats-new-in-rest-assured-1-8/).

Note that the JsonPath implementation uses <a href='http://groovy-lang.org/processing-xml.html#_gpath'>Groovy's GPath</a> syntax and is not to be confused with Jayway's <a href='https://github.com/jayway/JsonPath'>JsonPath</a> implementation.

## XML (using XmlPath)

You also have the corresponding functionality for XML using  [XmlPath](https://static.javadoc.io/io.rest-assured/xml-path-gpath/%REST_ASSURED_VERSION%/io/restassured/path/xml/XmlPath.html):

```java
String xml = post("/greetXML?firstName=John&lastName=Doe").andReturn().asString();
// Now use XmlPath to get the first and last name
String firstName = from(xml).get("greeting.firstName");
String lastName = from(xml).get("greeting.firstName");

// or a bit more efficiently:
XmlPath xmlPath = new XmlPath(xml).setRootPath("greeting");
String firstName = xmlPath.get("firstName");
String lastName = xmlPath.get("lastName");
```

Note that you can use `XmlPath` standalone without depending on REST Assured, see [getting started guide](/docs/getting-started/) for more info on this.

### XmlPath configuration

You can configure object de-serializers and charset for XmlPath by configuring it, for example:

```java
XmlPath xmlPath = new XmlPath(SOME_XML).using(new XmlPathConfig("UTF-8"));
```

It's also possible to configure XmlPath statically so that all instances of XmlPath will shared the same configuration:

```java
XmlPath.config = new XmlPathConfig("UTF-8");
```

Like `JsonPath.config`, `XmlPath.config` is a standalone setting, shared by all threads and never a setting of a request or a [RestAssuredClient](/docs/usage/parallel-tests/#restassuredclient). To use another config for one `XmlPath`, use `using(..)`.

You can read more about XmlPath at [this blog](http://www.jayway.com/2013/04/12/whats-new-in-rest-assured-1-8/).

### Parsing HTML with XmlPath

By configuring XmlPath with [compatibility mode](https://static.javadoc.io/io.rest-assured/xml-path-gpath/%REST_ASSURED_VERSION%/io/restassured/path/xml/XmlPath.CompatibilityMode.html) `HTML` you can also use the XmlPath syntax (Gpath) to parse HTML pages. For example if you want to extract the title of this HTML document:

```html
<html>
<head>
    <title>my title</title>
  </head>
  <body>
    <p>paragraph 1</p>
     <br>
    <p>paragraph 2</p>
  </body>
</html>
```

you can configure XmlPath like this:

```java
String html = ...
XmlPath xmlPath = new XmlPath(CompatibilityMode.HTML, html);
```

and then extract the title like this:

```java
xmlPath.getString("html.head.title"); // will return "mytitle"
```

In this example we've statically imported: `io.restassured.path.xml.XmlPath.CompatibilityMode.HTML`;

## Single path

If you only want to make a request and return a single path you can use a shortcut:

```java
int lottoId = get("/lotto").path("lotto.lottoid");
```

REST Assured will automatically determine whether to use JsonPath or XmlPath based on the content-type of the response. If no content-type is defined then REST Assured will try to look at the [default parser](/docs/usage/parsers-and-defaults/#default-parser) if defined. You can also manually decide which path instance to use, e.g.

```java
String firstName = post("/greetXML?firstName=John&lastName=Doe").andReturn().xmlPath().getString("firstName");
```

Options are `xmlPath`, `jsonPath` and `htmlPath`.

Since REST Assured 6.2.0 the shortcut also works for HTML responses, for example `get("/page.html").path("html.head.title")`. Before, `path(..)` on an HTML response returned the `XmlPath` itself. Use `htmlPath()` to get an `XmlPath` for an HTML response.

## Headers, cookies, status etc

You can also get headers, cookies, status line and status code:

```java
Response response = get("/lotto");

// Get all headers
Headers allHeaders = response.getHeaders();
// Get a single header value:
String headerName = response.getHeader("headerName");

// Get all cookies as simple name-value pairs
Map<String, String> allCookies = response.getCookies();
// Get a single cookie value:
String cookieValue = response.getCookie("cookieName");

// Get status line
String statusLine = response.getStatusLine();
// Get status code
int statusCode = response.getStatusCode();
```

## Multi-value headers and cookies

A header and a cookie can contain several values for the same name.

### Multi-value headers

To get all values for a header you need to first get the [Headers](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/http/Headers.html) object from the [Response](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/response/Response.html) object. From the `Headers` instance you can get all values using the [Headers.getValues(<header name>)](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/http/Headers.html#getValues(java.lang.String)) method which returns a `List` with all header values.

### Multi-value cookies

To get all values for a cookie you need to first get the [Cookies](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/http/Cookies.html) object from the [Response](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/response/Response.html) object. From the `Cookies` instance you can get all values using the [Cookies.getValues(<cookie name>)](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/http/Cookies.html#getValues(java.lang.String)) method which returns a `List` with all cookie values.

## Detailed cookies

If you need to get e.g. the comment, path or expiry date etc from a cookie you need get a [detailed cookie](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/http/Cookie.html) from REST Assured. To do this you can use the [Response.getDetailedCookie(java.lang.String)](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/response/ResponseOptions.html#getDetailedCookie-java.lang.String-) method. The detailed cookie then contains all attributes from the cookie.

You can also get all detailed response [cookies](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/http/Cookies.html) using the [Response.getDetailedCookies()](https://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/response/ResponseOptions.html#getDetailedCookies--) method.

## Printing the response

When you're writing a test against an API you don't know well, you mostly want to see what comes back. `prettyPeek()` prints the status line, the headers and the pretty-printed body, and then hands you the response so the test carries on as if nothing happened:

```java
String name = get("/users/1").
        prettyPeek().
        then().statusCode(200).
        extract().path("name");
```

prints

```
HTTP/1.1 200 OK
content-length: 94
content-type: application/json
date: Fri, 13 Nov 2026 13:34:32 GMT

{
    "userId": "my-id",
    "playerId": "my-id",
    "href": "http://localhost:8080/users/my-id",
    "name": "Jane"
}
```

There are a few of these:

| Method | Prints | Gives back |
|---|---|---|
| `peek()` | status line, headers and body as it came | the response |
| `prettyPeek()` | status line, headers and pretty-printed body | the response |
| `print()` | the body as it came | the body as a `String` |
| `prettyPrint()` | the pretty-printed body | the pretty-printed body as a `String` |
| `asPrettyString()` | nothing | the pretty-printed body as a `String` |

They're meant for while you work on a test. Once it's done, take them out, or use [`log().ifValidationFails()`](/docs/usage/logging/#log-if-validation-fails) so you only see the response when the test fails.
