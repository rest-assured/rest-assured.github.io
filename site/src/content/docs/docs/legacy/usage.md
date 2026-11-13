---
title: "Usage before 2.0"
description: "The usage guide for REST Assured 1.x."
sidebar:
  order: 9
---

**Note that the usage guide for newer versions of REST Assured is located at the [Usage](/docs/usage/) page.**

REST Assured is a Java DSL for simplifying testing of REST based services built on top of HTTP Builder. It supports POST, GET, PUT, DELETE, OPTIONS, PATCH and HEAD requests and can be used to validate and verify the response of these requests.

**Table of Contents**

## Static imports

In order to use REST assured effectively it's recommended to statically import methods from the following classes:

  * `com.jayway.restassured.RestAssured.*`
  * `com.jayway.restassured.matcher.RestAssuredMatchers.*`
  * `org.hamcrest.Matchers.*`

## Example 1 - JSON

Assume that the GET request (to http://localhost:8080/lotto) returns JSON as:

```
{
"lotto":{
 "lottoId":5,
 "winning-numbers":[2,45,34,23,7,5,3],
 "winners":[{
   "winnerId":23,
   "numbers":[2,45,34,23,3,5]
 },{
   "winnerId":54,
   "numbers":[52,3,12,11,18,22]
 }]
}
}
```

REST assured can then help you to easily make the GET request and verify the response. E.g. if you want to verify that lottoId is equal to 5 you can do like this:

```
expect().body("lotto.lottoId", equalTo(5)).when().get("/lotto");
```

or perhaps you want to check that the winnerId's are 23 and 54:

```
expect().body("lotto.winners.winnerId", hasItems(23, 54)).when().get("/lotto");
```

Note: `equalTo` and `hasItems` are Hamcrest matchers which you should statically import from `org.hamcrest.Matchers`.

### Returning floats and doubles as BigDecimal

You can configure Rest Assured and JsonPath to return BigDecimal's instead of float and double for Json Numbers. For example consider the following JSON document:

```
{

    "price":12.12 

}
```

By default  you validate that price is equal to 12.12 as a float like this:

```
expect().body("price", is(12.12f)).when().get("/price");
```

but if you like you can configure REST Assured to use a JsonConfig that returns all Json numbers as BigDecimal:

```
given().
        config(newConfig().jsonConfig(jsonConfig().numberReturnType(BIG_DECIMAL))).
expect().
        body("price", is(new BigDecimal(12.12)).
when().
        get("/price");  
```

## Example 2 - XML

XML can be verified in a similar way. Imagine that a POST request to `http://localhost:8080/greetXML` returns:

```
<greeting>
   <firstName>{params("firstName")}</firstName>
   <lastName>{params("lastName")}</lastName>
</greeting>
```

i.e. it sends back a greeting based on the firstName and lastName parameter sent in the request. You can easily perform and verify e.g. the firstName with REST assured:

```
given().
         parameters("firstName", "John", "lastName", "Doe").
expect().
         body("greeting.firstName", equalTo("John")).
when().
         post("/greetXML");
```

If you want to verify both firstName and lastName you may do like this:

```
with().
         parameters("firstName", "John", "lastName", "Doe").
expect().
         body("greeting.firstName", equalTo("John")).
         body("greeting.lastName", equalTo("Doe")).
when().
         post("/greetXML");
```

or a little shorter:

```
with().parameters("firstName", "John", "lastName", "Doe").expect().body("greeting.firstName", equalTo("John"), "greeting.lastName", equalTo("Doe")).when().post("/greetXML");
```

See [this](http://groovy.codehaus.org/Updating+XML+with+XmlSlurper) link for more info about the syntax.

### XML namespaces

To make body expectations take namespaces into account you need to declare the namespaces using the [com.jayway.restassured.config.XmlConfig](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/XmlConfig.html). For example let's say that a resource called `namespace-example` located at `http://localhost:8080` returns the following XML:

```
<foo xmlns:ns="http://localhost/">
  <bar>sudo </bar>
  <ns:bar>make me a sandwich!</ns:bar>
</foo>
```

You can then declare the `http://localhost/` uri and validate the response:

```
given().
        config(newConfig().xmlConfig(xmlConfig().declareNamespace("test", "http://localhost/"))).
expect().
         body("bar.text()", equalTo("sudo make me a sandwich!")).
         body(":bar.text()", equalTo("sudo ")).
         body("test:bar.text()", equalTo("make me a sandwich!")).
when().
         get("/namespace-example");
```

The syntax follows Groovy's XmlSlurper syntax.

### XPath

You can also verify XML responses using x-path. For example:

```
expect().body(hasXPath("/greeting/firstName", containsString("Jo"))).given().parameters("firstName", "John", "lastName", "Doe").when().post("/greetXML");
```

or

```
expect().body(hasXPath("/greeting/firstName[text()='John']")).with().parameters("firstName", "John", "lastName", "Doe").post("/greetXML");
```

To use namespaces in the XPath expression you need to enable them in the configuration, for example:

```
given().
        config(newConfig().xmlConfig(xmlConfig().with().namespaceAware(true))).
expect().
         body(hasXPath("/db:package-database", namespaceContext)).
when().
         get("/package-db-xml");
```

Where `namespaceContext` is an instance of [javax.xml.namespace.NamespaceContext](http://docs.oracle.com/javase/7/docs/api/javax/xml/namespace/NamespaceContext.html).

### Schema and DTD validation

XML response bodies can also be verified against an XML Schema (XSD) or DTD.

<p>
<b>XSD example:</b>
<pre><code>expect().body(matchesXsd(xsd)).when().get("/carRecords");<br>
</code></pre>
<b>DTD example:</b>
<pre><code> expect().body(matchesDtd(dtd)).when().get("/videos");<br>
</code></pre>

The matchesXsd and matchesDtd methods are Hamcrest matchers which you can import from <a href='http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/matcher/RestAssuredMatchers.html'>com.jayway.restassured.matcher.RestAssuredMatchers</a>.<br>

</p>

## Example 3 - Complex parsing and validation

This is where REST Assured really starts to shine! Refer to the blog post at the [Jayway team blog](http://blog.jayway.com/2011/10/09/simple-parsing-of-complex-json-and-xml-documents-in-java/) for examples and more info. Highly recommended reading!

## Additional Examples

Micha Kops has written a really good blog with several examples (including code examples that you can checkout). You can read it [here](http://www.hascode.com/2011/10/testing-restful-web-services-made-easy-using-the-rest-assured-framework/).

## Note on floats and doubles

Floating point numbers must be compared with a Java "float" primitive. For example, if we consider the following JSON object:

```
{

    "price":12.12 

}
```

the following test will fail, because we compare with a "double" instead of a "float":

```
expect().body("price", equalTo(12.12)).when().get("/price");
```

Instead, compare with a float with:

```
expect().body("price", equalTo(12.12f)).when().get("/price");
```

## Getting Response Data

You can also get the content of a response. E.g. let's say you want to return the body of a get request to "/lotto". You can get it a variety of different ways:

```
InputStream stream = get("/lotto").asInputStream(); // Don't forget to close this one when you're done
byte[] byteArray = get("/lotto").asByteArray();
String json = get("/lotto").asString();
```

## JSON (using `JsonPath`)

Once we have the response body we can then use the [JsonPath](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/path/json/JsonPath.html) to get data from the response body:

```
int lottoId = from(json).getInt("lotto.lottoId");
List<Integer> winnerIds = from(json).get("lotto.winners.winnerId");
```

Or a bit more efficiently:

```
JsonPath jsonPath = new JsonPath(json).setRoot("lotto");
int lottoId = jsonPath.getInt("lottoId");
List<Integer> winnerIds = jsonPath.get("winners.winnderId");
```

### `JsonPath` Configuration

You can configure object de-serializers etc for JsonPath by configuring it, for example:

```
JsonPath jsonPath = new JsonPath(SOME_JSON).using(new JsonPathConfig("UTF-8"));
```

It's also possible to configure JsonPath statically so that all instances of JsonPath will shared the same configuration:

```
JsonPath.config = new JsonPathConfig("UTF-8");
```

You can read more about JsonPath at [this blog](http://www.jayway.com/2013/04/12/whats-new-in-rest-assured-1-8/).

## XML (using `XmlPath`)

You also have the corresponding functionality for XML using  [XmlPath](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/path/xml/XmlPath.html):

```
String xml = post("/greetXML?firstName=John&lastName=Doe").andReturn().asString();
// Now use XmlPath to get the first and last name
String firstName = from(xml).get("greeting.firstName");
String lastName = from(xml).get("greeting.firstName");

// or a bit more efficiently:
XmlPath xmlPath = new XmlPath(xml).setRoot("greeting");
String firstName = xmlPath.get("firstName");
String lastName = xmlPath.get("lastName");
```

### `XmlPath` Configuration

You can configure object de-serializers and charset for XmlPath by configuring it, for example:

```
XmlPath xmlPath = new XmlPath(SOME_XML).using(new XmlPathConfig("UTF-8"));
```

It's also possible to configure XmlPath statically so that all instances of XmlPath will shared the same configuration:

```
XmlPath.config = new XmlPathConfig("UTF-8");
```

You can read more about XmlPath at [this blog](http://www.jayway.com/2013/04/12/whats-new-in-rest-assured-1-8/).

## Single path

If you only want to make a request and return a single path you can use a shortcut:

```
int lottoId = get("/lotto").path("lotto.lottoid");
```

REST Assured will automatically determine whether to use JsonPath or XmlPath based on the content-type of the response. If no content-type is defined then REST Assured will try to look at the [default parser](http://code.google.com/p/rest-assured/wiki/Usage#Default_parser) if defined. You can also manually decide which path instance to use, e.g.

```
String firstName = post("/greetXML?firstName=John&lastName=Doe").andReturn().xmlPath().getString("firstName");
```

Options are `xmlPath`, `jsonPath` and `htmlPath`.

## Headers, cookies, status etc

You can also get headers, cookies, status line and status code:

```
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

To get all values for a header you need to first get the [Headers](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Headers.html) object from the [Response](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Response.html) object. From the `Headers` instance you can get all values using the [Headers.getValues(<header name>)](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Headers.html#getValues(java.lang.String)) method which returns a `List` with all header values.

### Multi-value cookies

To get all values for a cookie you need to first get the [Cookies](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Cookies.html) object from the [Response](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Response.html) object. From the `Cookies` instance you can get all values using the [Cookies.getValues(<cookie name>)](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Cookies.html#getValues(java.lang.String)) method which returns a `List` with all cookie values.

## Detailed Cookies

If you need to get e.g. the comment, path or expiry date etc from a cookie you need get a [detailed cookie](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Cookie.html) from REST Assured. To do this you can use the [Response.getDetailedCookie(java.lang.String)](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Response.html#getDetailedCookie(java.lang.String)) method. The detailed cookie then contains all attributes from the cookie.

You can also get all detailed response [cookies](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Cookies.html) using the [Response.getDetailedCookies()](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Response.html#getDetailedCookies()) method.

## Specifying Request Data

Besides specifying request parameters you can also specify headers, cookies, body and content type.

## Parameters

Normally you specify parameters like this:

```
given().
       param("param1", "value1").
       param("param2", "value2").
when().
       get("/something");
```

REST Assured will automatically try to determine which parameter type (i.e. query or form parameter) based on the HTTP method. In case of GET query parameters will automatically be used and in case of POST form parameters will be used. In some cases it's however important to separate between form and query parameters in a PUT or POST. You can then do like this:

```
given().
       formParam("formParamName", "value1").
       queryParam("queryParamName", "value2").
when().
       post("/something");
```

Parameters can also be set directly on the url:

```
..when().get("/name?firstName=John&lastName=Doe");
```

For multi-part parameters please refer to the [Multi-part form data](http://code.google.com/p/rest-assured/wiki/Usage#Multi-part_form_data) section.

### Multi-value parameter

Multi-value parameters are parameters with more then one value per parameter name (i.e. a list of values per name). You can specify these either by using var-args:

```
given().param("myList", "value1", "value2"). .. 
```

or using a list:

```
List<String> values = new ArrayList<String>();
values.add("value1");
values.add("value2");

given().param("myList", values). .. 
```

### No-value parameter

You can also specify a query, request or form parameter without a value at all:

```
given().param("paramName"). ..
```

### Path parameters

You can also specify so called path parameters in your request, e.g.

```
post("/reserve/{hotelId}/{roomNumber}", "My Hotel", 23);
```

You can also use named path parameters:

```
given().
        pathParam("hotelId", "My Hotel").
        pathParam("roomNumber", 23).
expect().
         ..
when(). 
        post("/reserve/{hotelId}/{roomNumber}");
```

Path parameters makes it easier to read the request path as well as enabling the request path to easily be re-usable in many tests with different parameter values.

## Cookies

In its simplest form you specify cookies like this:

```
given().cookie("username", "John").then().expect().body(equalTo("username")).when().get("/cookie");
```

You can also specify a multi-value cookie like this:

```
given().cookie("cookieName", "value1", "value2"). ..
```

This will create _two_ cookies, `cookieName=value1` and `cookieName=value2`.

You can also specify a detailed cookie using:

```
Cookie someCookie = new Cookie.Builder("some_cookie", "some_value").setSecured(true).setComment("some comment").build();
given().cookie(someCookie).and().expect().body(equalTo("x")).when().get("/cookie");
```

or several detailed cookies at the same time:

```
Cookie cookie1 = Cookie.Builder("username", "John").setComment("comment 1").build();
Cookie cookie2 = Cookie.Builder("token", 1234).setComment("comment 2").build();
Cookies cookies = new Cookies(cookie1, cookie2);
given().cookies(cookies).then().expect().body(equalTo("username, token")).when().get("/cookie");
```

## Headers

```
given().header("MyHeader", "Something").and(). ..
given().headers("MyHeader", "Something", "MyOtherHeader", "SomethingElse").and(). ..
```

You can also specify a multi-value headers like this:

```
given().header("headerName", "value1", "value2"). ..
```

This will create _two_ headers, `headerName=value1` and `headerName=value2`.

## Content Type

```
given().contentType(ContentType.TEXT). ..
given().contentType("application/json"). ..
```

## Request Body

```
given().body("some body"). .. // Works for POST, PUT and DELETE requests
given().request().body("some body"). .. // More explicit (optional)
```

```
given().body(new byte[]{42}). .. // Works for POST, PUT and DELETE
given().request().body(new byte[]{42}). .. // More explicit (optional)
```

You can also serialize a Java object to JSON or XML. Click [here](http://code.google.com/p/rest-assured/wiki/Usage#Serialization) for details.

## Verifying Response Data

You can also verify status code, status line, cookies, headers, content type and body.

## Response Body

See Usage examples, e.g. [JSON](http://code.google.com/p/rest-assured/wiki/Usage?ts=1317978378&updated=Usage#Example_1_-_JSON) or [XML](http://code.google.com/p/rest-assured/wiki/Usage#Example_2_-_XML).

You can also map a response body to a Java Object, click [here](http://code.google.com/p/rest-assured/wiki/Usage#Deserialization) for details.

## Cookies

```
expect().cookie("cookieName", "cookieValue"). ..
expect().cookies("cookieName1", "cookieValue1", "cookieName2", "cookieValue2"). ..
expect().cookies("cookieName1", "cookieValue1", "cookieName2", containsString("Value2")). ..
```

## Status

```
expect().statusCode(200). ..
expect().statusLine("something"). ..
expect().statusLine(containsString("some")). ..
```

## Headers

```
expect().header("headerName", "headerValue"). ..
expect().headers("headerName1", "headerValue1", "headerName2", "headerValue2"). ..
expect().headers("headerName1", "headerValue1", "headerName2", containsString("Value2")). ..
```

## Content-Type

```
expect().contentType(ContentType.JSON). ..
```

## Full body/content matching

```
expect().body(equalTo("something")). ..
expect().content(equalTo("something")). .. // Same as above
```

## Authentication

REST assured also supports some authentication schemes, for example basic authentication:

```
given().auth().basic("username", "password").expect().statusCode(200).when().get("/secured/hello");
```

Other supported schemes are OAuth, digest, certificate, form and preemptive basic authentication.

## OAuth

In order to use the OAuth authentication you need to add the [Signpost](http://code.google.com/p/oauth-signpost/) framework to the classpath. In Maven you can simply add the following dependency:

```
<dependency>
            <groupId>oauth.signpost</groupId>
            <artifactId>signpost-commonshttp4</artifactId>
            <version>1.2.1.1</version>
</dependency>
```

If you're not using Maven [download](http://code.google.com/p/oauth-signpost/downloads/list) the jars ([signpost-core-1.2.1.1.jar](http://oauth-signpost.googlecode.com/files/signpost-core-1.2.1.1.jar), [signpost-commonshttp4-1.2.1.1.jar](http://oauth-signpost.googlecode.com/files/signpost-commonshttp4-1.2.1.1.jar)) manually and put them in your classpath.

## Multi-part form data

When sending larger amount of data to the server it's common to use the multipart form data technique. Rest Assured provide methods called `multiPart` that allows you to specify a file, byte-array, input stream or text to upload. In its simplest form you can upload a file like this:

```
given().
        multiPart(new File("/path/to/file")).
when().
        post("/upload");
```

It will assume a control name called "file". In HTML the control name is the attribute name of the input tag. To clarify let's look at the following HTML form:

```
<form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" size="40">
        <input type=submit value="Upload!">
</form>
```

The control name in this case is the name of the input tag with name "file". If you have a different control name then you need to specify it:

```
given().
        multiPart("controlName", new File("/path/to/file")).
when().
        post("/upload");
```

It's also possible to supply multiple "multi-parts" entities in the same request:

```
byte[] someData = ..
given().
        multiPart("controlName1", new File("/path/to/file")).
        multiPart("controlName2", "my_file_name.txt", someData).
        multiPart("controlName3", someJavaObject, "application/json").
when().
        post("/upload");
```

For additional info refer to [this](http://blog.jayway.com/2011/09/15/multipart-form-data-file-uploading-made-simple-with-rest-assured/) blog post.

## Object Mapping

REST Assured supports mapping Java objects to and from JSON and XML. For JSON you need to have either Jackson or Gson in the classpath and for XML you need JAXB.

## Serialization

Let's say we have the following Java object:

```
public class Message {
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

and you want to serialize this object to JSON and send it with the request. There are several ways to do this, e.g:

### Content-Type based Serialization

```
Message message = new Message();
message.setMessage("My messagee");
given().
       contentType("application/json").
       body(message).
when().
      post("/message");
```

In this example REST Assured will serialize the object to JSON since the request content-type is set to "application/json". It will first try to use Jackson if found in classpath and if not Gson will be used. If you change the content-type to "application/xml" REST Assured will serialize to XML using JAXB. If no content-type is defined REST Assured will try to serialize in the following order:

  1. Json using Jackson
  1. Json using Gson
  1. XML using JAXB

REST Assured also respects the charset of the content-type. E.g.

```
Message message = new Message();
message.setMessage("My messagee");
given().
       contentType("application/json; charset=UTF-16").
       body(message).
when().
      post("/message");
```

You can also serialize the `Message` instance as a form parameter:

```
Message message = new Message();
message.setMessage("My messagee");
given().
       contentType("application/json; charset=UTF-16").
       formParam("param1", message).
when().
      post("/message");
```

The message object will be serialized to JSON using Jackson (if present) or Gson (if present) with UTF-16 encoding.

### Using an Explicit Serializer

If you have multiple object mappers in the classpath at the same time or don't care about setting the content-type you can specify a serializer explicity. E.g.

```
Message message = new Message();
message.setMessage("My messagee");
given().
       body(message, ObjectMapperType.JAXB).
when().
      post("/message");
```

In this example the Message object will be serialized to XML using JAXB.

## Deserialization

Again let's say we have the following Java object:

```
public class Message {
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

and we want the response body to be deserialized into a Message object.

### Content-Type based Deserialization

Let's assume then that the server returns a JSON body like this:

```
{"message":"My message"}
```

To deserialize this to a Message object we simply to like this:

```
Message message = get("/message").as(Message.class);
```

For this to work the response content-type must be "application/json" (or something that contains "json"). If the server instead returned

```
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<message>
      <message>My message</message>
</message>
```

and a content-type of "application/xml" you wouldn't have to change the code at all:

```
Message message = get("/message").as(Message.class);
```

#### Custom Content-Type Deserialization

If the server returns a custom content-type, let's say "application/something", and you still want to use the object mapping in REST Assured there are a couple of different ways to go about. You can either use the [explicit](http://code.google.com/p/rest-assured/wiki/Usage#Using_an_Explicit_Deserializer) approach or register a parser for the custom content-type:

```
Message message = expect().parser("application/something", Parser.XML).when().get("/message").as(Message.class);
```

or

```
Message message = expect().defaultParser(Parser.XML).when().get("/message").as(Message.class);
```

You can also register a default or custom parser [statically](http://code.google.com/p/rest-assured/wiki/Usage#Default_values) or using [specifications](http://code.google.com/p/rest-assured/wiki/Usage#Specification_Re-use).

### Using an Explicit Deserializer

If you have multiple object mappers in the classpath at the same time  or don't care about the response content-type you can specify a deserializer explicitly. E.g.

```
Message message = get("/message").as(Message.class, ObjectMapperType.GSON);
```

## Configuration

You can configure the pre-defined object mappers by using a [ObjectMapperConfig](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/ObjectMapperConfig.html) and pass it to [detailed configuration](https://code.google.com/p/rest-assured/wiki/Usage#Detailed_configuration). For example to change GSON to use lower case with underscores as field naming policy you can do like this:

```
RestAssured.config = RestAssuredConfig.config().objectMapperConfig(objectMapperConfig().gsonObjectMapperFactory(
                new GsonObjectMapperFactory() {
                    public Gson create(Class cls, String charset) {
                        return new GsonBuilder().setFieldNamingPolicy(LOWER_CASE_WITH_UNDERSCORES).create();
                    }
                }
        ));
```

There are pre-defined object mapper factories for GSON, JAXB, Jackson and Faster Jackson.

## Custom

By default REST Assured will scan the classpath to find various object mappers. If you want to integrate an object mapper that is not supported by default or if you've rolled your own you can implement the
[com.jayway.restassured.mapper.ObjectMapper](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/mapper/ObjectMapper.html) interface. You tell REST Assured to use your object mapper either by passing it as a second parameter to the body:

```
given().body(myJavaObject, myObjectMapper).when().post("..")
```

or you can define it statically once and for all:

```
RestAssured.config = RestAssuredConfig.config().objectMapperConfig(new ObjectMapperConfig(myObjectMapper));
```

For an example see [here](https://github.com/jayway/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/com/jayway/restassured/itest/java/CustomObjectMappingITest.java).

## Custom parsers

REST Assured providers predefined parsers for e.g. HTML, XML and JSON. But you can parse other kinds of content by registering a predefined parser for unsupported content-types by using:

```
RestAssured.registerParser(<content-type>, <parser>);
```

E.g. to register that mime-type 'application/vnd.uoml+xml' should be parsed using the XML parser do:

```
RestAssured.registerParser("application/vnd.uoml+xml", Parser.XML);
```

You can also unregister a parser using:

```
RestAssured.unregisterParser("application/vnd.uoml+xml");
```

Parsers can also be specified per "request":

```
expect().parser("application/vnd.uoml+xml", Parser.XML).when().get(..);
```

and using a [response specification](http://code.google.com/p/rest-assured/wiki/Usage#Specification_Re-use).

## Default parser

Sometimes it's useful to specify a default parser, e.g. if the response doesn't contain a content-type at all:

```
RestAssured.defaultParser = Parser.JSON;
```

You can also specify a default parser for a single request:

```
expect.defaultParser(Parser.JSON).
```

or using a [response specification](http://code.google.com/p/rest-assured/wiki/Usage#Specification_Re-use).

## Default values

By default REST assured assumes host localhost and port 8080 when doing a request. If you want a different port you can do:

```
given().port(80). ..
```

or simply:

```
.. when().get("http://myhost.org:80/doSomething");
```

You can also change the default base URI, base path, port and authentication scheme for all subsequent requests:

```
RestAssured.baseURI = "http://myhost.org";
RestAssured.port = 80;
RestAssured.basePath = "/resource";
RestAssured.authentication = basic("username", "password");
RestAssured.rootPath = "x.y.z";
```

This means that a request like e.g. `get("/hello")` goes to: http://myhost.org:80/resource/hello with basic authentication credentials "username" and "password". See [rootPath](http://code.google.com/p/rest-assured/wiki/Usage#Root_path) for more info about setting the root paths. Other default values you can specify are:

```
RestAssured.filters(..); // List of default filters
RestAssured.requestContentType(..); // Specify the default request content type
RestAssured.responseContentType(..); // Specify the default response content type
RestAssured.requestSpecification = .. // Default request specification
RestAssured.responseSpecification = .. // Default response specification
RestAssured.urlEncodingEnabled = .. // Specify if Rest Assured should URL encoding the parameters
RestAssured.defaultParser = .. // Specify a default parser for response bodies if no registered parser can handle data of the response content-type
RestAssured.registerParser(..) // Specify a parser for the given content-type
RestAssured.unregisterParser(..) // Unregister a parser for the given content-type

```

You can reset to the standard baseURI (localhost), basePath (empty), standard port (8080), standard root path (""), default authentication scheme (none) and url encoding enabled (true) using:

```
RestAssured.reset();
```

## Specification Re-use

Instead of having to duplicate response expectations and/or request parameters for different tests you can re-use an entire specification. To do this you define a specification using either the [RequestSpecBuilder](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/builder/RequestSpecBuilder.html) or [ResponseSpecBuilder](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/builder/ResponseSpecBuilder.html).

E.g. let's say you want to make sure that the expected status code is 200 and that the size of the JSON array "x.y" has size 2 in several tests you can define a ResponseSpecBuilder like this:

```
ResponseSpecBuilder builder = new ResponseSpecBuilder();
builder.expectStatusCode(200);
builder.expectBody("x.y.size()", is(2));
ResponseSpecification responseSpec = builder.build();

// Now you can re-use the "responseSpec" in many different tests:
expect().
       spec(responseSpec).
       body("x.y.z", equalTo("something")).
when().
       get("/something");
```

In this example the data defined in "responseSpec" is merged with the additional body expectation and all expectations must be fulfilled in order for the test to pass.

You can do the same thing if you need to re-use request data in different tests. E.g.

```
RequestSpecBuilder builder = new RequestSpecBuilder();
builder.addParameter("parameter1", "parameterValue");
builder.addHeader("header1", "headerValue");
RequestSpecification requestSpec = builder.build();
  
given().
        spec(requestSpec).
        param("parameter2", "paramValue").
expect().
        body("x.y.z", equalTo("something")).
when().
        get("/something");
```

Here the request's data is merged with the data in the "requestSpec" so the request will contain two parameters ("parameter1" and "parameter2") and one header ("header1").

## Filters

A filter allows you to inspect and alter a request before it's actually committed and also inspect and [alter](/docs/legacy/usage/) the response before it's returned to the expectations. You can regard it as an "around advice" in AOP terms. Filters can be used to implement custom authentication schemes, session management, logging etc. To create a filter you need to implement the [com.jayway.restassured.filter.log.Filter](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/filter/Filter.html) interface. To use a filter you can do:

```
given().filter(new MyFilter()). ..
```

There are a couple of filters provided by REST Assured that are ready to use:

  1. `com.jayway.restassured.filter.log.RequestLoggingFilter`: A filter that'll print the request specification details.
  1. `com.jayway.restassured.filter.log.ResponseLoggingFilter`: A filter that'll print the response details if the response matches a given status code.
  1. `com.jayway.restassured.filter.log.ErrorLoggingFilter`: A filter that'll print the response body if an error occurred (status code is between 400 and 500).

## Response Builder

If you need to change the [Response](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/response/Response.html) from a filter you can use the [ResponseBuilder](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/builder/ResponseBuilder.html) to create a new Response based on the original response. For example if you want to change the body of the original response to something else you can do:

```
Response newResponse = new ResponseBuilder().clone(originalResponse).setBody("Something").build();
```

## Logging

In many cases it can be useful to print the response and/or request details in order to help you create the correct expectations and send the correct requests. To do help you do this you can use one of the predefined [filters](/docs/legacy/usage/#filters) supplied with REST Assured or you can use one of the shortcuts.

## Request Logging

Since version 1.5 REST Assured supports logging the _[request specification](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/specification/RequestSpecification.html)_ before it's sent to the server using the [RequestLoggingFilter](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/filter/log/RequestLoggingFilter.html). Note that the HTTP Builder and HTTP Client may add additional headers then what's printed in the log. The filter will _only_ log details specified in the request specification. I.e. you can NOT regard the details logged by the [RequestLoggingFilter](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/filter/log/RequestLoggingFilter.html) to be what's actually sent to the server. Also subsequent filters may alter the request _after_ the logging has taken place. If you need to log what's _actually_ sent on the wire refer to the [HTTP Client logging docs](http://hc.apache.org/httpcomponents-client-ga/logging.html) or use an external tool such [Wireshark](http://www.wireshark.org/). Examples:

```
given().log().all(). .. // Log all request specification details including parameters, headers and body
given().log().params(). .. // Log only the parameters of the request
given().log().body(). .. // Log only the request body
given().log().headers(). .. // Log only the request headers
given().log().cookies(). .. // Log only the request cookies
```

## Response Logging

If you want to print the response body regardless of the status code you can do:

```
expect().log().body() ..
```

This will print the response body regardless if an error occurred. If you're only interested in printing the response body if an error occur then you can use:

```
expect().log().ifError(). .. 
```

You can also log all details in the response including status line, headers and cookies:

```
expect().log().all(). .. 
```

as well as only status line, headers or cookies:

```
expect().log().statusLine(). .. // Only log the status line
expect().log().headers(). .. // Only log the response headers
expect().log().cookies(). .. // Only log the response cookies
```

You can also configure to log the response only if the status code matches some value:

```
expect().log().ifStatusCodeIsEqualTo(302). .. // Only log if the status code is equal to 302
expect().log().ifStatusCodeMatches(matcher). .. // Only log if the status code matches the supplied Hamcrest matcher
```

## Root path

To avoid duplicated paths in body expectations you can specify a root path. E.g. instead of writing:

```
expect().
         body("x.y.firstName", is(..)).
         body("x.y.lastName", is(..)).
         body("x.y.age", is(..)).
         body("x.y.gender", is(..)).
when().
         get("/something");
```

you can use a root path and do:

```
expect().
         rootPath("x.y"). // You can also use the "root" method
         body("firstName", is(..)).
         body("lastName", is(..)).
         body("age", is(..)).
         body("gender", is(..)).
when().
        get("/something");
```

You can also set a default root path using:

```
RestAssured.rootPath = "x.y";
```

In more advanced use cases it may also be useful to append additional root arguments to existing root arguments. To do this you can use the `appendRoot` method, for example:

```
expect().
         root("store.%s", withArgs("book")).
         body("category.size()", equalTo(4)).
         appendRoot("%s.%s", withArgs("author", "size()")).
         body(withNoArgs(), equalTo(4)).
 when().
         get("/jsonStore");
```

## Path arguments

Path arguments are useful in situations where you have e.g. pre-defined variables that constitutes the path. For example

```
String someSubPath = "else";
int index = 1;
expect().body("something.%s[%d]", withArgs(someSubPath, index), equalTo("some value")). ..
```

will expect that the body path "`something.else[0]`" is equal to "some value".

Another usage is if you have complex [root paths](http://code.google.com/p/rest-assured/wiki/Usage#Root_path) and don't wish to duplicate the path for small variations:

```
expect().
         root("filters.filterConfig[%d].filterConfigGroups.find { it.name == 'GroupName' }.includes").
         body(withArgs(0), hasItem("first")).
         body(withArgs(1), hasItem("second")).
         ..
```

The path arguments follows the standard [formatting syntax](http://download.oracle.com/javase/1,5.0/docs/api/java/util/Formatter.html#syntax) of Java.

Note that the `withArgs` method can be statically imported from the [com.jayway.restassured.RestAssured](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/RestAssured.html) class.

Sometimes it's also useful to validate a body without any additional arguments when all arguments have already been specified in the root path. This is where `withNoArgs` come into play. For example:

```
expect().
         root("store.%s", withArgs("book")).
         body("category.size()", equalTo(4)).
         appendRoot("%s.%s", withArgs("author", "size()")).
         body(withNoArgs(), equalTo(4)).
 when().
         get("/jsonStore");
```

## Session support

REST Assured provides a simplified way for managing sessions. You can define a session id value in the DSL:

```
given().sessionId("1234"). .. 
```

This is actually just a short-cut for:

```
given().cookie("JSESSIONID", "1234"). .. 
```

You can also specify a default `sessionId` that'll be supplied with all subsequent requests:

```
RestAssured.sessionId = "1234";
```

By default the session id name is `JSESSIONID` but you can change it using the [SessionConfig](/docs/legacy/usage/):

```
RestAssured.config = newConfig().sessionConfig(new SessionConfig().sessionIdName("phpsessionid"));
```

You can also specify a sessionId using the `RequestSpecBuilder` and reuse it in many tests:

```
RequestSpecBuilder spec = new RequestSpecBuilder().setSessionId("value1").build();
   
// Make the first request with session id equal to value1
given().spec(spec). .. 
// Make the second request with session id equal to value1
given().spec(spec). .. 
```

It's also possible to get the session id from the response object:

```
String sessionId = get("/something").sessionId();
```

## Session Filter

As of version 1.9.0 you can use a [session filter](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/filter/session/SessionFilter.html) to automatically capture and apply the session, for example:

```
SessionFilter sessionFilter = new SessionFilter();

given().
          auth().form("John", "Doe").
          filter(sessionFilter).
expect().
          statusCode(200).
when().
          get("/formAuth");

given().
          filter(sessionFilter). // Reuse the same session filter instance to automatically apply the session id from the previous response
expect().
          statusCode(200).
when().
          get("/x");
```

To get session id caught by the `SessionFilter` you can do like this:

```
String sessionId = sessionFilter.getSessionId();
```

## SSL

In most situations SSL should just work out of the box thanks to the excellent work of HTTP Builder and HTTP Client. There are how ever some cases where you'll run into trouble. You may for example run into a SSLPeerUnverifiedException if the server is using an invalid certificate. If this happens you should create a Java keystore file and use it with REST Assured. It's not too difficult, first follow the guide [here](http://groovy.codehaus.org/modules/http-builder/doc/ssl.html) and then use the keystore in Rest Assured like this:

```
given().keystore("/pathToJksInClassPath", <password>). .. 
```

or you can specify it for every request:

```
RestAssured.keystore("/pathToJksInClassPath", <password>);
```

You can also define a keystore in a re-usable [specification](http://code.google.com/p/rest-assured/wiki/Usage#Specification_Re-use).

You can find a working example [here](https://github.com/jayway/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/com/jayway/restassured/itest/java/SSLTest.java).

## URL Encoding

Usually you don't have to think about URL encoding since Rest Assured provides this automatically out of the box. In some cases though it may be useful to turn URL Encoding off. One reason may be that you already the have some parameters encoded before you supply them to Rest Assured. To prevent double URL encoding you need to tell Rest Assured to disable it's URL encoding. E.g.

```
String response = given().urlEncodingEnabled(false).get("https://jira.atlassian.com:443/rest/api/2.0.alpha1/search?jql=project%20=%20BAM%20AND%20issuetype%20=%20Bug").asString();
..
```

or

```
RestAssured.baseURI = "https://jira.atlassian.com";
RestAssured.port = 443;
RestAssured.urlEncodingEnabled = false;
final String query = "project%20=%20BAM%20AND%20issuetype%20=%20Bug";
String response = get("/rest/api/2.0.alpha1/search?jql={q}", query);
..
```

## Detailed configuration

Detailed configuration is provided by the [RestAssuredConfig](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/RestAssuredConfig.html) instance with which you can configure the parameters of [HTTP Client](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/HttpClientConfig.html) as well as [Redirect](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/RedirectConfig.html), [Log](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/LogConfig.html), [Encoder](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/EncoderConfig.html), [Decoder](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/DecoderConfig.html), [Session](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/SessionConfig.html), [ObjectMapper](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/ObjectMapperConfig.html) and [Connection](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/ConnectionConfig.html) settings. Examples:

For a specific request:

```
given().config(newConfig().redirect(redirectConfig().followRedirects(false))). ..
```

or using a RequestSpecBuilder:

```
RequestSpecification spec = new RequestSpecBuilder().setConfig(newConfig().redirect(redirectConfig().followRedirects(false))).build();
```

or for all requests:

```
RestAssured.config = config().redirect(redirectConfig().followRedirects(true).and().maxRedirects(0));
```

`config()` and `newConfig()` can be statically imported from `com.jayway.restassured.config.RestAssuredConfig`.

## Encoder Config

With the [EncoderConfig](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/EncoderConfig.html) you can specify the default content encoding charset (if it's not specified in the content-type header) and query parameter charset for all requests. If no content charset is specified then ISO-8859-1 is used and if no query parameter charset is specified then UTF-8 is used. Usage example:

```
RestAssured.config = newConfig().encoderConfig(encoderConfig().defaultContentCharset("US-ASCII"));
```

## Decoder Config

With the [DecoderConfig](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/config/DecoderConfig.html) you can set the default response content decoding charset for all responses. This is useful if you expect a different content charset than ISO-8859-1 (which is the default charset) and the response doesn't define the charset in the content-type header. Usage example:

```
RestAssured.config = newConfig().decoderConfig(decoderConfig().defaultContentCharset("UTF-8"));
```

You can also use the `DecoderConfig` to specify which content decoders to apply. When you do this the `Accept-Encoding` header will be added automatically to the request and the response body will be decoded automatically. By default GZIP and DEFLATE decoders are enabled. To for example to remove GZIP decoding but retain DEFLATE decoding you can do the following:

```
given().config(newConfig().decoderConfig(decoderConfig().contentDecoders(DEFLATE))). ..
```

## Session Config

With the session config you can configure the default session id name that's used by REST Assured. The default session id name is `JSESSIONID` and you only need to change it if the name in your application is different and you want to make use of REST Assured's [session support](/docs/legacy/usage/). Usage:

```
RestAssured.config = newConfig().sessionConfig(new SessionConfig().sessionIdName("phpsessionid"));
```

## Redirect DSL

Redirect configuration can also be specified using the DSL. E.g.

```
given().redirects().max(12).and().redirects().follow(true).when(). .. 
```

## Connection Config

Lets you configure connection settings for REST Assured. For example if you want to force-close the Apache HTTP Client connection after each response. You may want to do this if you make a lot of fast consecutive requests with small amount of data in the response. How ever if you're downloading large amount of (chunked) data you must not close connections after each response. By default connections are _not_ closed after each response.

```
RestAssured.config = newConfig().connectionConfig(connectionConfig().closeIdleConnectionsAfterEachResponse());
```

## `Json Config`

[JsonPathConfig](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/path/json/config/JsonPathConfig.html) allows you to configure the Json settings either when used by REST Assured or by [JsonPath](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/path/json/JsonPath.html). It let's you configure how JSON numbers should be treated.

```
RestAssured.config = newConfig().jsonConfig(jsonConfig().numberReturnType(NumberReturnType.BIG_DECIMAL))
```

## HTTP Client Config

Let's you configure properties for the HTTP Client instance that REST Assured will be using when executing requests. By default REST Assured creates a new instance of http client for each "given" statement. To configure reuse do the following:

```
RestAssured.config = newConfig().httpClient(httpClientConfig().reuseHttpClientInstance());
```

You can also supply a custom HTTP Client instance by using the `httpClientFactory` method, for example:

```
RestAssured.config = newConfig().httpClient(httpClientConfig().httpClientFactory(
         new HttpClientConfig.HttpClientFactory() {

            @Override
            public HttpClient createHttpClient() {
                return new SystemDefaultHttpClient();
            }
        }));
```

**Note that in version 1.9.0 you need to supply an instance of `AbstractHttpClient`.**

It's also possible to configure default parameters etc.

## More info

For more information refer to the [javadoc](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/index.html):

  * [RestAssured](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/RestAssured.html)
  * [Specification package](http://rest-assured.googlecode.com/svn/tags/1.9.0/apidocs/com/jayway/restassured/specification/package-summary.html)

You can also have a look at some code examples:

  * REST Assured [tests](https://github.com/jayway/rest-assured/tree/master/examples/rest-assured-itest-java/src/test/java/com/jayway/restassured/itest/java)
  * [JsonPathTest](https://github.com/jayway/rest-assured/blob/master/json-path/src/test/java/com/jayway/restassured/path/json/JsonPathTest.java)
  * [XmlPathTest](https://github.com/jayway/rest-assured/blob/master/xml-path/src/test/java/com/jayway/restassured/path/xml/XmlPathTest.java)
