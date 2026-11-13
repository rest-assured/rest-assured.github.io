---
title: "Object mapping"
description: "Serialize and deserialize Java objects with Jackson, Gson, JSON-B or JAXB."
sidebar:
  order: 8
---

REST Assured supports mapping Java objects to and from JSON and XML. For JSON you need to have either Jackson 3, Jackson 2, Gson, Johnzon or Yasson in the classpath and for XML you need Jakarta EE or JAXB.

## Jakarta EE

To use Jakarta EE for XML object mapping you need to include the following dependencies:

```xml
<dependency>
    <groupId>jakarta.xml.bind</groupId>
    <artifactId>jakarta.xml.bind-api</artifactId>
    <version>4.0.5</version>
</dependency>
<dependency>
    <groupId>org.glassfish.jaxb</groupId>
    <artifactId>jaxb-runtime</artifactId>
    <version>4.0.9</version>
</dependency>
```

Jakarta XML Binding 3.x works too.

## JAXB

JAXB can be used to serialize/deserialize XML with REST Assured. From version 4.5.0 it is not included by default, so if you're using a newer version of Java, such as Java 17, you need to add these two dependencies or use [Jakarta EE](/docs/usage/object-mapping/#jakarta-ee):

```xml
<dependency>
    <groupId>javax.xml.bind</groupId>
    <artifactId>jaxb-api</artifactId>
    <version>2.3.1</version>
</dependency>
<dependency>
    <groupId>com.sun.xml.bind</groupId>
    <artifactId>jaxb-impl</artifactId>
    <version>2.3.4</version>
</dependency>
```

## Serialization

Let's say we have the following Java object:

```java
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

```java
Message message = new Message();
message.setMessage("My messagee");
given().
       contentType("application/json").
       body(message).
when().
      post("/message");
```

In this example REST Assured will serialize the object to JSON since the request content-type is set to "application/json". It will first try to use Jackson if found in classpath and if not Gson will be used. If you change the content-type to "application/xml" REST Assured will serialize to XML using JAXB. If no content-type is defined REST Assured will try to serialize in the following order:

  1. JSON using Jackson 3 (databind)
  1. JSON using Jackson 2 (databind)
  1. JSON using Gson
  1. JSON using Johnzon
  1. JSON-B using Eclipse Yasson
  1. XML using Jakarta EE
  1. XML using JAXB

Since REST Assured 7.0.0, the [json-schema-validator](/docs/usage/examples/#json-schema-validation) module brings Jackson 3. So with that module on the classpath, REST Assured uses Jackson 3 for JSON, also when your project uses Jackson 2. That includes `response.jsonPath().getObject(..)`. To use Jackson 2 for all requests:

```java
RestAssured.config = RestAssuredConfig.config().objectMapperConfig(objectMapperConfig().defaultObjectMapperType(ObjectMapperType.JACKSON_2));
```

REST Assured also respects the charset of the content-type. E.g.

```java
Message message = new Message();
message.setMessage("My messagee");
given().
       contentType("application/json; charset=UTF-16").
       body(message).
when().
      post("/message");
```

You can also serialize the `Message` instance as a form parameter:

```java
Message message = new Message();
message.setMessage("My messagee");
given().
       contentType("application/json; charset=UTF-16").
       formParam("param1", message).
when().
      post("/message");
```

The message object will be serialized to JSON using Jackson 3 or Jackson 2 (if present) or Gson (if present) with UTF-16 encoding.

### Create JSON from a HashMap

You can also create a JSON document by supplying a Map to REST Assured.

```java
Map<String, Object>  jsonAsMap = new HashMap<>();
jsonAsMap.put("firstName", "John");
jsonAsMap.put("lastName", "Doe");

given().
        contentType(JSON).
        body(jsonAsMap).
when().
        post("/somewhere").
then().
        statusCode(200);
```

This will provide a JSON payload as:

```javascript
{ "firstName" : "John", "lastName" : "Doe" }
```

### Using an Explicit Serializer

If you have multiple object mappers in the classpath at the same time or don't care about setting the content-type you can specify a serializer explicity. E.g.

```java
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

```java
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

```javascript
{"message":"My message"}
```

To deserialize this to a Message object we simply to like this:

```java
Message message = get("/message").as(Message.class);
```

For this to work the response content-type must be "application/json" (or something that contains "json"). If the server instead returned

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<message>
      <message>My message</message>
</message>
```

and a content-type of "application/xml" you wouldn't have to change the code at all:

```java
Message message = get("/message").as(Message.class);
```

#### Custom Content-Type Deserialization

If the server returns a custom content-type, let's say "application/something", and you still want to use the object mapping in REST Assured there are a couple of different ways to go about. You can either use the [explicit](http://code.google.com/p/rest-assured/wiki/Usage#Using_an_Explicit_Deserializer) approach or register a parser for the custom content-type:

```java
Message message = expect().parser("application/something", Parser.XML).when().get("/message").as(Message.class);
```

or

```java
Message message = expect().defaultParser(Parser.XML).when().get("/message").as(Message.class);
```

You can also register a default or custom parser [statically](/docs/usage/parsers-and-defaults/#default-values) or using [specifications](/docs/usage/specification-reuse/).

### Using an Explicit Deserializer

If you have multiple object mappers in the classpath at the same time  or don't care about the response content-type you can specify a deserializer explicitly. E.g.

```java
Message message = get("/message").as(Message.class, ObjectMapperType.GSON);
```

## Configuration

You can configure the pre-defined object mappers by using a [ObjectMapperConfig](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/config/ObjectMapperConfig.html) and pass it to [detailed configuration](/docs/usage/configuration/). For example to change GSON to use lower case with underscores as field naming policy you can do like this:

```java
RestAssured.config = RestAssuredConfig.config().objectMapperConfig(objectMapperConfig().gsonObjectMapperFactory(
                new GsonObjectMapperFactory() {
                    public Gson create(Class cls, String charset) {
                        return new GsonBuilder().setFieldNamingPolicy(LOWER_CASE_WITH_UNDERSCORES).create();
                    }
                }
        ));
```

There are pre-defined object mapper factories for GSON, JAXB, Jakarta EE (JAXB), Jackson 2 and 3, Johnzon and Eclipse Yasson (JSON-B). Since REST Assured 6.3.0 the factory interfaces, such as `GsonObjectMapperFactory` above, are in the package `io.restassured.common.mapper.factory`. The ones in `io.restassured.path.json.mapper.factory` and `io.restassured.path.xml.mapper.factory` still work but are deprecated. The Jackson 1 factory is removed in REST Assured 7.0.0, together with Jackson 1 support.

## Custom

By default REST Assured will scan the classpath to find various object mappers. If you want to integrate an object mapper that is not supported by default or if you've rolled your own you can implement the
[io.restassured.mapper.ObjectMapper](http://static.javadoc.io/io.rest-assured/rest-assured/%REST_ASSURED_VERSION%/io/restassured/mapper/ObjectMapper.html) interface. You tell REST Assured to use your object mapper either by passing it as a second parameter to the body:

```java
given().body(myJavaObject, myObjectMapper).when().post("..")
```

or you can define it statically once and for all:

```java
RestAssured.config = RestAssuredConfig.config().objectMapperConfig(new ObjectMapperConfig(myObjectMapper));
```

For an example see [here](https://github.com/rest-assured/rest-assured/blob/master/examples/rest-assured-itest-java/src/test/java/io/restassured/itest/java/CustomObjectMappingITest.java).
