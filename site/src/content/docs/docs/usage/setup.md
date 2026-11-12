---
title: "Path engines and static imports"
description: "Pick a path engine and the static imports your tests need."
sidebar:
  order: 1
---

## Path engines

Since REST Assured 7.0.0, REST Assured doesn't include a path engine, and so no Groovy either. If your tests use paths, such as `body("lotto.lottoId", equalTo(5))`, `path(..)` or `extract().path(..)`, add GPath, the path syntax used throughout this page, or, for JSON, [JSONPath with Jayway](/docs/usage/setup/#jsonpath-with-jayway). It comes in two modules, `json-path-gpath` for JSON and `xml-path-gpath` for XML and HTML:

| You use | You need |
|---|---|
| A path on a JSON body: `body("a.b", ..)`, `path(..)`, `extract().path(..)`, `rootPath(..)` | `json-path-gpath` |
| A path on an XML or HTML body | `xml-path-gpath` |
| `jsonPath()` or [JsonPath](/docs/usage/response-data/#json-using-jsonpath) | `json-path-gpath` |
| `xmlPath()`, `htmlPath()` or [XmlPath](/docs/usage/response-data/#xml-using-xmlpath) | `xml-path-gpath` |
| Anything else, such as `statusCode(..)`, headers, cookies, `body(containsString(..))`, `hasXPath(..)`, [JSON Schema validation](/docs/usage/examples/#json-schema-validation) or deserialization with `as(..)` | Nothing |

The same goes for `RestAssuredMockMvc`, `RestAssuredWebTestClient` and the Kotlin and Scala extensions.

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>json-path-gpath</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>xml-path-gpath</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:json-path-gpath:%REST_ASSURED_VERSION%'
testImplementation 'io.rest-assured:xml-path-gpath:%REST_ASSURED_VERSION%'
```

Without a path engine, the first path fails with a message that names the dependency to add. `rest-assured-all` already contains both modules. Before 7.0.0, `rest-assured` includes them under their old names, `json-path` and `xml-path`, and `json-path-gpath` and `xml-path-gpath` resolve to those. See the [release notes](/release-notes/7-0/#upgrading-to-70) for how to upgrade, and [Which module do I need](/docs/modules/) for the other modules.

### JSONPath with Jayway

Since REST Assured 7.0.0, you can also write JSON paths in [JSONPath](https://www.rfc-editor.org/rfc/rfc9535) instead, evaluated by [Jayway JsonPath](https://github.com/json-path/JsonPath), with `json-path-jayway`. It's for JSON only and doesn't need Groovy:

Maven:

```xml
<dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>json-path-jayway</artifactId>
      <version>%REST_ASSURED_VERSION%</version>
      <scope>test</scope>
</dependency>
```

Gradle:

```groovy
testImplementation 'io.rest-assured:json-path-jayway:%REST_ASSURED_VERSION%'
```

```java
get("/lotto").then().body("$.lotto.winners[*].winnerId", hasItems(23, 54));
get("/store").then().body("$.store.book[?(@.price < 10)].title", hasItems("Sayings of the Century", "Moby Dick"));
```

The examples on the rest of this page are GPath. In JSONPath, a list needs `[*]`: GPath's `lotto.winners.winnerId` is `lotto.winners[*].winnerId`, and Jayway fails on the GPath form with a message that says so. Use filters such as `[?(@.price < 10)]` instead of GPath's closures. `jsonPath()` is GPath, so with Jayway use `JaywayPath.from(response.asString())`, which returns Jayway's `DocumentContext`.

With only `json-path-jayway` on the classpath, REST Assured uses it. With both `json-path-gpath` and `json-path-jayway`, it uses GPath and logs once that it does. Pick Jayway for all tests, a request or a specification with `JsonConfig.pathEngine(..)`:

```java
RestAssured.config = RestAssured.config().jsonConfig(jsonConfig().pathEngine(JsonPathEngine.JAYWAY));
given().config(config().jsonConfig(jsonConfig().pathEngine(JsonPathEngine.JAYWAY))). ..
new ResponseSpecBuilder().setConfig(config().jsonConfig(jsonConfig().pathEngine(JsonPathEngine.JAYWAY))). ..
```

Jayway logs through SLF4J. See the [release notes](/release-notes/7-0/#jsonpath-with-jayway) for the supported Jayway versions, the differences from GPath and OSGi.

## Static imports

In order to use REST assured effectively it's recommended to statically import methods from the following classes:

```java
io.restassured.RestAssured.*
io.restassured.matcher.RestAssuredMatchers.*
org.hamcrest.Matchers.*
```

If you want to use [Json Schema](http://json-schema.org/) validation you should also statically import these methods:

```java
io.restassured.module.jsv.JsonSchemaValidator.*
```

Refer to [Json Schema Validation](/docs/usage/examples/#json-schema-validation) section for more info.

If you're using Spring MVC you can use the [spring-mock-mvc](/docs/spring/mock-mvc/) module to unit test your Spring Controllers using the Rest Assured DSL. To do this statically import the methods from [RestAssuredMockMvc](http://static.javadoc.io/io.restassured/spring-mock-mvc/%REST_ASSURED_VERSION%/io/restassured/module/mockmvc/RestAssuredMockMvc.html) _instead_ of importing the methods from `io.restassured.RestAssured`:

```java
io.restassured.module.mockmvc.RestAssuredMockMvc.*
```
